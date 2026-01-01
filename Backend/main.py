# Configuração do path para permitir imports absolutos
import sys
import os
# Adiciona o diretório pai ao path para permitir imports absolutos quando executado de dentro de Backend
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_backend_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Literal, Dict, Any
import json
import sqlite3
import uvicorn
from datetime import time, date, datetime
from passlib.context import CryptContext
from Backend.utils.media import MEDIA_ROOT

# --------------------------------------------------------------------
# 0. CONFIGURAÇÃO DE SENHA
# --------------------------------------------------------------------
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


# --------------------------------------------------------------------
# 1. MODELOS (PYDANTIC / SCHEMAS)
# --------------------------------------------------------------------
# Modelo para a Jornada
class CalendarioAplicacaoDia(BaseModel):
    data: date
    tipo: Literal['work', 'off', 'holiday'] = 'work'


class DiaSemanaConfig(BaseModel):
    enabled: bool = False
    type: Literal['Normal', 'Folga', 'DSR', 'Feriado'] = 'Normal'
    entry1: Optional[time] = None
    exit1: Optional[time] = None
    entry2: Optional[time] = None
    exit2: Optional[time] = None

    @field_validator('entry1', 'exit1', 'entry2', 'exit2', mode='before')
    def _blank_time_to_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
        return value


class CadastroPonto(BaseModel):
    usu_id: Optional[int] = None  # Jornada pode ser criada sem vínculo imediato
    cad_ponto_nome: str
    cad_ponto_codigo: Optional[str] = None
    cad_ponto_descricao: Optional[str] = None
    cad_ponto_tipo: Optional[str] = None
    cad_ponto_carga_diaria: Optional[str] = None
    cad_ponto_carga_semanal: Optional[str] = None
    cad_ponto_dias_trabalho: Optional[str] = None
    cad_ponto_inicio: time
    cad_ponto_fim: time
    cad_ponto_pausa: bool = False
    cad_ponto_tempo_pausa_min: Optional[int] = 0
    cad_ponto_inicio_almoco: Optional[time] = None
    cad_ponto_tolerancia_min: Optional[int] = 0  # tolerância de entrada
    cad_ponto_tolerancia_saida_min: Optional[int] = 0
    cad_ponto_fechamento_dia: Optional[time] = None
    cad_ponto_falta_parcial_auto: Optional[bool] = False
    cad_ponto_dias_semana: str
    calendario_aplicacao: Optional[List[CalendarioAplicacaoDia]] = None
    config_semanal: Optional[Dict[int, DiaSemanaConfig]] = None
    cad_ponto_gps_enabled: bool = False
    cad_ponto_gps_center_lat: Optional[float] = None
    cad_ponto_gps_center_lng: Optional[float] = None
    cad_ponto_gps_radius_m: Optional[int] = None
    cad_ponto_facial_required: bool = False

    @field_validator(
        'cad_ponto_codigo',
        'cad_ponto_descricao',
        'cad_ponto_tipo',
        'cad_ponto_carga_diaria',
        'cad_ponto_carga_semanal',
        'cad_ponto_dias_trabalho',
        mode='before'
    )
    def _empty_string_to_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator('cad_ponto_inicio_almoco', 'cad_ponto_fechamento_dia', mode='before')
    def _normalize_optional_time(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
        return value

    @field_validator('config_semanal', mode='before')
    def _normalize_config_keys(cls, value):
        if isinstance(value, dict):
            normalized = {}
            for key, item in value.items():
                try:
                    normalized[int(key)] = item
                except (TypeError, ValueError):
                    continue
            return normalized
        return value


# Modelo para o Cadastro de Usuário
class CadastroUsuario(BaseModel):
    usu_nome: str
    usu_email: EmailStr
    usu_cpf: str
    usu_telefone: str
    usu_departamento: str
    usu_permissao: str  # Ex: "Admin", "Funcionario"
    usu_senha: str
    usu_foto_base64: Optional[str] = None


class UsuarioFormularioExtras(BaseModel):
    dados_pessoais: Optional[Dict[str, Any]] = None
    dados_trabalhistas: Optional[Dict[str, Any]] = None
    config_ponto: Optional[Dict[str, Any]] = None
    biometria_acesso: Optional[Dict[str, Any]] = None
    documentos: Optional[List[Dict[str, Any]]] = None


class JornadaSelecao(BaseModel):
    modo: Literal['existente', 'nova']
    cad_id: Optional[int] = None
    nova_jornada: Optional[Dict[str, Any]] = None


class CadastroUsuarioCompleto(BaseModel):
    usuario: CadastroUsuario
    jornada: Optional[JornadaSelecao] = None
    preferencias: Optional[Dict[str, Any]] = None
    extras: Optional[UsuarioFormularioExtras] = None


# Modelo para a Edição de Usuário
class EditarUsuario(BaseModel):
    usu_nome: str
    usu_email: EmailStr
    usu_telefone: str
    usu_departamento: str
    usu_permissao: str
    usu_ativo: bool
    usu_foto_base64: Optional[str] = None
    nova_senha: Optional[str] = None  # Senha é opcional na edição


class EditarUsuarioCompleto(BaseModel):
    usuario: EditarUsuario
    jornada: Optional[JornadaSelecao] = None
    preferencias: Optional[Dict[str, Any]] = None
    extras: Optional[UsuarioFormularioExtras] = None


# --------------------------------------------------------------------
# 2. CONFIGURAÇÃO DO FASTAPI
# --------------------------------------------------------------------
app = FastAPI(
    title="API CronoIn",
    description="API para gerenciamento de pontos e jornadas de trabalho",
    version="1.0.0",
    docs_url="/docs",  # Documentação Swagger UI em /docs
    redoc_url="/redoc",  # Documentação ReDoc em /redoc
    openapi_url="/openapi.json"  # Schema OpenAPI em /openapi.json
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restrinja a origens específicas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "pontos.db"

os.makedirs(MEDIA_ROOT, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")


# --------------------------------------------------------------------
# 3. GERENCIADOR DE CONEXÃO COM O BANCO DE DADOS
# --------------------------------------------------------------------
def get_db_connection():
    con = sqlite3.connect(DATABASE, check_same_thread=False)
    con.row_factory = sqlite3.Row  # Retorna resultados como dicionários
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
    finally:
        con.close()


# --------------------------------------------------------------------
# 4. CRIAÇÃO DAS TABELAS
# --------------------------------------------------------------------
def criar_tabelas():
    con = sqlite3.connect(DATABASE)
    cur = con.cursor()

    # IMPORTANTE: Criar USUARIOS primeiro, pois outras tabelas têm foreign keys para ela
    # Tabela para Usuários
    cur.execute("""
    CREATE TABLE IF NOT EXISTS USUARIOS (
        usu_id INTEGER PRIMARY KEY AUTOINCREMENT,
        usu_nome TEXT NOT NULL,
        usu_email TEXT NOT NULL UNIQUE,
        usu_cpf TEXT NOT NULL UNIQUE,
        usu_telefone TEXT,
        usu_departamento TEXT,
        usu_permissao TEXT,
        usu_senha_hash TEXT NOT NULL,
        usu_foto_url TEXT,
        usu_data_criacao DATETIME NOT NULL,
        usu_ativo BOOLEAN DEFAULT TRUE,
        usu_jornada_padrao_id INTEGER
    )
    """)

    # Tabela para Cadastro de Jornadas (vinculada ao usuário)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS CADASTRO_PONTOS (
        cad_id INTEGER PRIMARY KEY AUTOINCREMENT,
        usu_id INTEGER,
        cad_ponto_nome TEXT NOT NULL,
        cad_ponto_codigo TEXT,
        cad_ponto_descricao TEXT,
        cad_ponto_tipo TEXT,
        cad_ponto_carga_diaria TEXT,
        cad_ponto_carga_semanal TEXT,
        cad_ponto_dias_trabalho TEXT,
        cad_ponto_inicio TIME NOT NULL,
        cad_ponto_fim TIME NOT NULL,
        cad_ponto_pausa BOOLEAN DEFAULT FALSE,
        cad_ponto_inicio_almoco TIME,
        cad_ponto_tempo_pausa_min INT,
        cad_ponto_tolerancia_min INT,
        cad_ponto_tolerancia_saida_min INT,
        cad_ponto_fechamento_dia TIME,
        cad_ponto_falta_parcial_auto BOOLEAN DEFAULT FALSE,
        cad_ponto_dias_semana TEXT,
        cad_ponto_gps_enabled BOOLEAN DEFAULT 0,
        cad_ponto_gps_center_lat REAL,
        cad_ponto_gps_center_lng REAL,
        cad_ponto_gps_radius_m INTEGER,
        cad_ponto_facial_required BOOLEAN DEFAULT 0,
        cad_info_data_criacao DATETIME NOT NULL,
        FOREIGN KEY (usu_id) REFERENCES USUARIOS(usu_id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS JORNADA_CALENDARIO (
        cal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cad_id INTEGER NOT NULL,
        data DATE NOT NULL,
        tipo TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'work',
        UNIQUE (cad_id, data),
        FOREIGN KEY (cad_id) REFERENCES CADASTRO_PONTOS(cad_id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS JORNADA_SEMANAL (
        js_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cad_id INTEGER NOT NULL,
        dia_semana INTEGER NOT NULL,
        habilitado BOOLEAN NOT NULL,
        tipo TEXT NOT NULL,
        entrada1 TIME,
        saida1 TIME,
        entrada2 TIME,
        saida2 TIME,
        UNIQUE (cad_id, dia_semana),
        FOREIGN KEY (cad_id) REFERENCES CADASTRO_PONTOS(cad_id) ON DELETE CASCADE
    )
    """)

    # Tabela para Registro Diário dos Pontos
    cur.execute("""
    CREATE TABLE IF NOT EXISTS REGISTRO_PONTOS (
        ponto_id INTEGER PRIMARY KEY AUTOINCREMENT,
        usu_id INTEGER NOT NULL,
        cad_id INTEGER,
        ponto_data DATE NOT NULL,
        ponto_entrada DATETIME,
        ponto_saida_almoco DATETIME,
        ponto_volta_almoco DATETIME,
        ponto_saida DATETIME,
        ponto_entrada_status TEXT DEFAULT 'PENDENTE',
        ponto_saida_almoco_status TEXT DEFAULT 'PENDENTE',
        ponto_volta_almoco_status TEXT DEFAULT 'PENDENTE',
        ponto_saida_status TEXT DEFAULT 'PENDENTE',
        facial_status TEXT,
        facial_match_score REAL,
        facial_evidence_url TEXT,
        gps_status TEXT,
        gps_distance_m REAL,
        gps_coords TEXT,
        gps_evidence_url TEXT,
        ponto_observacao TEXT,
        ponto_status TEXT,
        FOREIGN KEY (usu_id) REFERENCES USUARIOS(usu_id),
        FOREIGN KEY (cad_id) REFERENCES CADASTRO_PONTOS(cad_id),
        CONSTRAINT uq_ponto_usuario_data UNIQUE (usu_id, ponto_data)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS USUARIO_JORNADA (
        uj_id INTEGER PRIMARY KEY AUTOINCREMENT,
        usu_id INTEGER NOT NULL,
        cad_id INTEGER NOT NULL,
        uj_data_inicio DATE NOT NULL,
        uj_data_fim DATE,
        uj_ativo BOOLEAN DEFAULT 1,
        FOREIGN KEY (usu_id) REFERENCES USUARIOS(usu_id) ON DELETE CASCADE,
        FOREIGN KEY (cad_id) REFERENCES CADASTRO_PONTOS(cad_id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS USUARIO_EXTRAS (
        usu_id INTEGER PRIMARY KEY,
        dados_pessoais TEXT,
        dados_trabalhistas TEXT,
        config_ponto TEXT,
        biometria_acesso TEXT,
        documentos TEXT,
        preferencias TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (usu_id) REFERENCES USUARIOS(usu_id) ON DELETE CASCADE
    )
    """)

    con.commit()
    con.close()


# --------------------------------------------------------------------
# 4.0. UTILITÁRIOS DE MIGRAÇÃO
# --------------------------------------------------------------------
def _recriar_tabela_cadastro_pontos(cur: sqlite3.Cursor):
    """Reconstrói a tabela CADASTRO_PONTOS aplicando novo esquema (usuário opcional + flag facial)."""
    cur.execute("PRAGMA foreign_keys = OFF")
    cur.execute("ALTER TABLE CADASTRO_PONTOS RENAME TO CADASTRO_PONTOS_OLD")
    cur.execute(
        """
        CREATE TABLE CADASTRO_PONTOS (
            cad_id INTEGER PRIMARY KEY AUTOINCREMENT,
            usu_id INTEGER,
            cad_ponto_nome TEXT NOT NULL,
            cad_ponto_codigo TEXT,
            cad_ponto_descricao TEXT,
            cad_ponto_tipo TEXT,
            cad_ponto_carga_diaria TEXT,
            cad_ponto_carga_semanal TEXT,
            cad_ponto_dias_trabalho TEXT,
            cad_ponto_inicio TIME NOT NULL,
            cad_ponto_fim TIME NOT NULL,
            cad_ponto_pausa BOOLEAN DEFAULT FALSE,
            cad_ponto_inicio_almoco TIME,
            cad_ponto_tempo_pausa_min INT,
            cad_ponto_tolerancia_min INT,
            cad_ponto_tolerancia_saida_min INT,
            cad_ponto_fechamento_dia TIME,
            cad_ponto_falta_parcial_auto BOOLEAN DEFAULT FALSE,
            cad_ponto_dias_semana TEXT,
            cad_ponto_gps_enabled BOOLEAN DEFAULT 0,
            cad_ponto_gps_center_lat REAL,
            cad_ponto_gps_center_lng REAL,
            cad_ponto_gps_radius_m INTEGER,
            cad_ponto_facial_required BOOLEAN DEFAULT 0,
            cad_info_data_criacao DATETIME NOT NULL,
            FOREIGN KEY (usu_id) REFERENCES USUARIOS(usu_id)
        )
        """
    )

    colunas_insert = [
        "cad_id",
        "usu_id",
        "cad_ponto_nome",
        "cad_ponto_codigo",
        "cad_ponto_descricao",
        "cad_ponto_tipo",
        "cad_ponto_carga_diaria",
        "cad_ponto_carga_semanal",
        "cad_ponto_dias_trabalho",
        "cad_ponto_inicio",
        "cad_ponto_fim",
        "cad_ponto_pausa",
        "cad_ponto_inicio_almoco",
        "cad_ponto_tempo_pausa_min",
        "cad_ponto_tolerancia_min",
        "cad_ponto_tolerancia_saida_min",
        "cad_ponto_fechamento_dia",
        "cad_ponto_falta_parcial_auto",
        "cad_ponto_dias_semana",
        "cad_ponto_gps_enabled",
        "cad_ponto_gps_center_lat",
        "cad_ponto_gps_center_lng",
        "cad_ponto_gps_radius_m",
        "cad_info_data_criacao",
    ]

    cur.execute(
        f"""
        INSERT INTO CADASTRO_PONTOS ({', '.join(colunas_insert)}, cad_ponto_facial_required)
        SELECT {', '.join(colunas_insert)}, 0 as cad_ponto_facial_required
        FROM CADASTRO_PONTOS_OLD
        """
    )

    cur.execute("DROP TABLE CADASTRO_PONTOS_OLD")
    cur.execute("PRAGMA foreign_keys = ON")


def _reconstruir_fk_dependentes(cur: sqlite3.Cursor):
    """Garante que tabelas dependentes referenciem CADASTRO_PONTOS após migração."""
    tabelas_dependentes = [
        "USUARIO_JORNADA",
        "JORNADA_SEMANAL",
        "JORNADA_CALENDARIO",
        "REGISTRO_PONTOS"
    ]

    for tabela in tabelas_dependentes:
        cur.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
            (tabela,)
        )
        resultado = cur.fetchone()
        if not resultado or not resultado[0]:
            continue

        ddl_original = resultado[0]
        if "CADASTRO_PONTOS_OLD" not in ddl_original:
            continue

        ddl_corrigido = ddl_original.replace("CADASTRO_PONTOS_OLD", "CADASTRO_PONTOS")
        tabela_backup = f"{tabela}_OLD_FK"

        cur.execute("PRAGMA foreign_keys = OFF")
        cur.execute(f"ALTER TABLE {tabela} RENAME TO {tabela_backup}")
        cur.execute(ddl_corrigido)

        cur.execute(f"PRAGMA table_info({tabela_backup})")
        colunas = [col[1] for col in cur.fetchall()]
        if colunas:
            colunas_csv = ", ".join(colunas)
            cur.execute(
                f"INSERT INTO {tabela} ({colunas_csv}) SELECT {colunas_csv} FROM {tabela_backup}"
            )

        cur.execute(f"DROP TABLE {tabela_backup}")
        cur.execute("PRAGMA foreign_keys = ON")


# --------------------------------------------------------------------
# 4.1. MIGRAÇÃO PARA ADICIONAR RELACIONAMENTOS
# --------------------------------------------------------------------
def migrar_tabelas():
    """Adiciona colunas de relacionamento nas tabelas existentes se não existirem."""
    con = sqlite3.connect(DATABASE)
    cur = con.cursor()
    
    try:
        # Ajustes na tabela de usuários
        cur.execute("PRAGMA table_info(USUARIOS)")
        colunas_usuarios = [coluna[1] for coluna in cur.fetchall()]
        if 'usu_foto_url' not in colunas_usuarios:
            cur.execute("ALTER TABLE USUARIOS ADD COLUMN usu_foto_url TEXT")
        if 'usu_jornada_padrao_id' not in colunas_usuarios:
            cur.execute("ALTER TABLE USUARIOS ADD COLUMN usu_jornada_padrao_id INTEGER")

        # Verifica se a coluna usu_id existe em REGISTRO_PONTOS
        cur.execute("PRAGMA table_info(REGISTRO_PONTOS)")
        colunas_registro = [coluna[1] for coluna in cur.fetchall()]
        
        if 'usu_id' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN usu_id INTEGER")
            # Se houver registros sem usuário, definir um usuário padrão ou deletar
            cur.execute("SELECT usu_id FROM USUARIOS LIMIT 1")
            usuario_padrao = cur.fetchone()
            if usuario_padrao:
                cur.execute("UPDATE REGISTRO_PONTOS SET usu_id = ? WHERE usu_id IS NULL", (usuario_padrao[0],))
        
        if 'cad_id' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN cad_id INTEGER")

        status_columns = [
            'ponto_entrada_status',
            'ponto_saida_almoco_status',
            'ponto_volta_almoco_status',
            'ponto_saida_status'
        ]

        for coluna_status in status_columns:
            if coluna_status not in colunas_registro:
                cur.execute(f"ALTER TABLE REGISTRO_PONTOS ADD COLUMN {coluna_status} TEXT DEFAULT 'PENDENTE'")
                cur.execute(f"UPDATE REGISTRO_PONTOS SET {coluna_status} = 'PENDENTE' WHERE {coluna_status} IS NULL")

        if 'facial_status' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN facial_status TEXT")
        if 'facial_match_score' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN facial_match_score REAL")
        if 'facial_evidence_url' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN facial_evidence_url TEXT")
        if 'gps_status' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN gps_status TEXT")
        if 'gps_distance_m' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN gps_distance_m REAL")
        if 'gps_coords' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN gps_coords TEXT")
        if 'gps_evidence_url' not in colunas_registro:
            cur.execute("ALTER TABLE REGISTRO_PONTOS ADD COLUMN gps_evidence_url TEXT")
        
        # Verifica se a coluna usu_id existe em CADASTRO_PONTOS
        cur.execute("PRAGMA table_info(CADASTRO_PONTOS)")
        colunas_jornada_info = cur.fetchall()
        colunas_jornada = [coluna[1] for coluna in colunas_jornada_info]

        precisa_recriar_cadastro = False
        usu_id_info = next((col for col in colunas_jornada_info if col[1] == 'usu_id'), None)
        if usu_id_info and usu_id_info[3] == 1:
            precisa_recriar_cadastro = True
        if 'cad_ponto_facial_required' not in colunas_jornada:
            precisa_recriar_cadastro = True

        if precisa_recriar_cadastro:
            _recriar_tabela_cadastro_pontos(cur)
            cur.execute("PRAGMA table_info(CADASTRO_PONTOS)")
            colunas_jornada_info = cur.fetchall()
            colunas_jornada = [coluna[1] for coluna in colunas_jornada_info]

        _reconstruir_fk_dependentes(cur)
        
        if 'usu_id' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN usu_id INTEGER")
            cur.execute("SELECT usu_id FROM USUARIOS LIMIT 1")
            usuario_padrao = cur.fetchone()
            if usuario_padrao:
                cur.execute("UPDATE CADASTRO_PONTOS SET usu_id = ? WHERE usu_id IS NULL", (usuario_padrao[0],))

        if 'cad_ponto_facial_required' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_facial_required BOOLEAN DEFAULT 0")

        if 'cad_ponto_tolerancia_saida_min' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_tolerancia_saida_min INT")
            cur.execute("UPDATE CADASTRO_PONTOS SET cad_ponto_tolerancia_saida_min = 0 WHERE cad_ponto_tolerancia_saida_min IS NULL")

        if 'cad_ponto_fechamento_dia' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_fechamento_dia TIME")

        if 'cad_ponto_falta_parcial_auto' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_falta_parcial_auto BOOLEAN DEFAULT FALSE")
            cur.execute("UPDATE CADASTRO_PONTOS SET cad_ponto_falta_parcial_auto = 0 WHERE cad_ponto_falta_parcial_auto IS NULL")

        if 'cad_ponto_codigo' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_codigo TEXT")

        if 'cad_ponto_descricao' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_descricao TEXT")

        if 'cad_ponto_tipo' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_tipo TEXT")

        if 'cad_ponto_carga_diaria' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_carga_diaria TEXT")

        if 'cad_ponto_carga_semanal' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_carga_semanal TEXT")

        if 'cad_ponto_dias_trabalho' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_dias_trabalho TEXT")

        if 'cad_ponto_gps_enabled' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_gps_enabled BOOLEAN DEFAULT 0")
        if 'cad_ponto_gps_center_lat' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_gps_center_lat REAL")
        if 'cad_ponto_gps_center_lng' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_gps_center_lng REAL")
        if 'cad_ponto_gps_radius_m' not in colunas_jornada:
            cur.execute("ALTER TABLE CADASTRO_PONTOS ADD COLUMN cad_ponto_gps_radius_m INTEGER")

        # Tabela de associação usuário-jornada
        cur.execute("""
        CREATE TABLE IF NOT EXISTS USUARIO_JORNADA (
            uj_id INTEGER PRIMARY KEY AUTOINCREMENT,
            usu_id INTEGER NOT NULL,
            cad_id INTEGER NOT NULL,
            uj_data_inicio DATE NOT NULL,
            uj_data_fim DATE,
            uj_ativo BOOLEAN DEFAULT 1,
            FOREIGN KEY (usu_id) REFERENCES USUARIOS(usu_id) ON DELETE CASCADE,
            FOREIGN KEY (cad_id) REFERENCES CADASTRO_PONTOS(cad_id) ON DELETE CASCADE
        )
        """)

        # Tabela para extras do formulário do usuário
        cur.execute("""
        CREATE TABLE IF NOT EXISTS USUARIO_EXTRAS (
            usu_id INTEGER PRIMARY KEY,
            dados_pessoais TEXT,
            dados_trabalhistas TEXT,
            config_ponto TEXT,
            biometria_acesso TEXT,
            documentos TEXT,
            preferencias TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (usu_id) REFERENCES USUARIOS(usu_id) ON DELETE CASCADE
        )
        """)

        # Garante existência da tabela de calendário
        cur.execute("""
        CREATE TABLE IF NOT EXISTS JORNADA_CALENDARIO (
            cal_id INTEGER PRIMARY KEY AUTOINCREMENT,
            cad_id INTEGER NOT NULL,
            data DATE NOT NULL,
            tipo TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'work',
            UNIQUE (cad_id, data),
            FOREIGN KEY (cad_id) REFERENCES CADASTRO_PONTOS(cad_id) ON DELETE CASCADE
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS JORNADA_SEMANAL (
            js_id INTEGER PRIMARY KEY AUTOINCREMENT,
            cad_id INTEGER NOT NULL,
            dia_semana INTEGER NOT NULL,
            habilitado BOOLEAN NOT NULL,
            tipo TEXT NOT NULL,
            entrada1 TIME,
            saida1 TIME,
            entrada2 TIME,
            saida2 TIME,
            UNIQUE (cad_id, dia_semana),
            FOREIGN KEY (cad_id) REFERENCES CADASTRO_PONTOS(cad_id) ON DELETE CASCADE
        )
        """)

        # Ajusta tabela de calendário existente que ainda não tem a coluna "tipo"
        cur.execute("PRAGMA table_info(JORNADA_CALENDARIO)")
        colunas_calendario = [coluna[1] for coluna in cur.fetchall()]
        if "tipo" not in colunas_calendario:
            cur.execute("ALTER TABLE JORNADA_CALENDARIO ADD COLUMN tipo TEXT DEFAULT 'work'")
            cur.execute("UPDATE JORNADA_CALENDARIO SET tipo = COALESCE(tipo, 'work')")

        if "status" not in colunas_calendario:
            cur.execute("ALTER TABLE JORNADA_CALENDARIO ADD COLUMN status TEXT DEFAULT 'work'")
            cur.execute("UPDATE JORNADA_CALENDARIO SET status = COALESCE(status, tipo, 'work')")
        
        con.commit()
    except Exception as e:
        print(f"Erro na migração: {e}")
        con.rollback()
    finally:
        con.close()


# --------------------------------------------------------------------
# 5. PREFIXOS DE ROTAS
# --------------------------------------------------------------------
prefixo_cadastro = "/jornada"
prefixo_registro = "/ponto"
prefixo_usuario = "/usuario"

# --------------------------------------------------------------------
# 6. IMPORTAÇÃO DAS ROTAS
# --------------------------------------------------------------------
# Agora que o path está configurado, podemos importar de forma absoluta
from Backend.Ponto.PontoMarcar import *
from Backend.Ponto.PontoListar import *
from Backend.Ponto.PontoEditar import *
from Backend.Ponto.PontoDeletar import *

from Backend.Jornada.JornadaCadastro import *
from Backend.Jornada.JornadaListar import *
from Backend.Jornada.JornadaDeletar import *
from Backend.Jornada.JornadaEditar import *

from Backend.Usuario.UsuarioCadastro import *
from Backend.Usuario.UsuarioOpcoes import *
from Backend.Usuario.UsuarioListar import *
from Backend.Usuario.UsuarioEditar import *
from Backend.Usuario.UsuarioDeletar import *
from Backend.Usuario.UsuarioJornada import *
from Backend.Usuario.UsuarioFluxoCompleto import *

# Auth
from Backend.Auth import *

# --------------------------------------------------------------------
# 8. ROTA PARA PAINEL DE TESTES (TIPO POSTMAN)
# --------------------------------------------------------------------
from fastapi.responses import HTMLResponse
from Backend.api_tester_route import get_tester_html

@app.get("/doc/tester", response_class=HTMLResponse, tags=["Documentação"], include_in_schema=True)
def api_tester():
    """Painel interativo para testar as APIs (tipo Postman) - Carrega rotas automaticamente do OpenAPI"""
    return HTMLResponse(content=get_tester_html())

# --------------------------------------------------------------------
# 7. INICIALIZAÇÃO
# --------------------------------------------------------------------
# Inicializa as tabelas quando o módulo é importado
criar_tabelas()
migrar_tabelas()

# --------------------------------------------------------------------
# 7.1. SEED DE USUÁRIO ADMIN PADRÃO
# --------------------------------------------------------------------
def seed_usuario_admin():
    con = sqlite3.connect(DATABASE)
    try:
        cur = con.cursor()
        # Admin
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_email = ?", ("admin@cronoin.com",))
        existente = cur.fetchone()
        senha_hash_admin = pwd_context.hash("123456")
        if not existente:
            cur.execute(
                """
                INSERT INTO USUARIOS (
                    usu_nome, usu_email, usu_cpf, usu_telefone, usu_departamento,
                    usu_permissao, usu_senha_hash, usu_data_criacao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    "admin",
                    "admin@cronoin.com",
                    "00000000000",
                    "",
                    "Administrativo",
                    "Admin",
                    senha_hash_admin,
                    datetime.now()
                )
            )
        else:
            cur.execute("UPDATE USUARIOS SET usu_senha_hash = ? WHERE usu_email = ?", (senha_hash_admin, "admin@cronoin.com"))
        
        # User Comum
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_email = ?", ("user@cronoin.com",))
        existente_user = cur.fetchone()
        senha_hash_user = pwd_context.hash("123456")
        if not existente_user:
            cur.execute(
                """
                INSERT INTO USUARIOS (
                    usu_nome, usu_email, usu_cpf, usu_telefone, usu_departamento,
                    usu_permissao, usu_senha_hash, usu_data_criacao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    "user",
                    "user@cronoin.com",
                    "11111111111",
                    "",
                    "Operacional",
                    "Funcionario",
                    senha_hash_user,
                    datetime.now()
                )
            )
        else:
            cur.execute("UPDATE USUARIOS SET usu_senha_hash = ? WHERE usu_email = ?", (senha_hash_user, "user@cronoin.com"))
            
        con.commit()
    except Exception as e:
        print(f"Seed admin/user falhou: {e}")
    finally:
        con.close()


def seed_jornada_padrao():
    """Garante que exista ao menos uma jornada padrão para seleção no cadastro de usuários."""
    con = sqlite3.connect(DATABASE)
    try:
        cur = con.cursor()
        cur.execute("SELECT COUNT(*) FROM CADASTRO_PONTOS")
        quantidade = cur.fetchone()[0]
        if quantidade:
            return

        cur.execute(
            """
            INSERT INTO CADASTRO_PONTOS (
                usu_id,
                cad_ponto_nome,
                cad_ponto_codigo,
                cad_ponto_descricao,
                cad_ponto_tipo,
                cad_ponto_carga_diaria,
                cad_ponto_carga_semanal,
                cad_ponto_dias_trabalho,
                cad_ponto_inicio,
                cad_ponto_fim,
                cad_ponto_pausa,
                cad_ponto_tempo_pausa_min,
                cad_ponto_inicio_almoco,
                cad_ponto_tolerancia_min,
                cad_ponto_tolerancia_saida_min,
                cad_ponto_fechamento_dia,
                cad_ponto_falta_parcial_auto,
                cad_ponto_dias_semana,
                cad_ponto_gps_enabled,
                cad_ponto_gps_center_lat,
                cad_ponto_gps_center_lng,
                cad_ponto_gps_radius_m,
                cad_ponto_facial_required,
                cad_info_data_criacao
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                None,
                "Jornada Administrativa 44h",
                "ADM-44H",
                "Jornada padrão de segunda a sexta das 08h às 17h48",
                "Semanal Fixa",
                "08:48",
                "44:00",
                "Seg à Sex",
                "08:00:00",
                "17:48:00",
                1,
                60,
                "12:00:00",
                5,
                5,
                "23:59:00",
                0,
                "1,2,3,4,5",
                0,
                None,
                None,
                None,
                0,
                datetime.now()
            )
        )

        cad_id = cur.lastrowid
        registros = []
        for dia in range(7):
            if 1 <= dia <= 5:
                registros.append((cad_id, dia, 1, 'Normal', '08:00:00', '12:00:00', '13:00:00', '17:48:00'))
            else:
                tipo = 'DSR' if dia == 0 else 'Folga'
                registros.append((cad_id, dia, 0, tipo, None, None, None, None))

        cur.executemany(
            """
            INSERT INTO JORNADA_SEMANAL (
                cad_id, dia_semana, habilitado, tipo, entrada1, saida1, entrada2, saida2
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            registros
        )

        con.commit()
    except Exception as exc:
        print(f"Seed jornada padrão falhou: {exc}")
        con.rollback()
    finally:
        con.close()

seed_usuario_admin()
seed_jornada_padrao()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
