from Backend.main import app, prefixo_usuario, get_db_connection, Depends, HTTPException
import sqlite3

SYSTEM_OPTIONS = {
    "empresas": [],
    "departamentos": [
        "Tecnologia da Informação",
        "Recursos Humanos",
        "Financeiro",
        "Comercial",
        "Marketing",
        "Operações"
    ],
    "cargos": [
        "Analista de Sistemas Pleno",
        "Desenvolvedor Backend",
        "Gerente de TI",
        "Analista de RH",
        "Assistente Administrativo",
        "Vendedor",
        "Coordenador de Marketing"
    ],
    "perfis": [
        {"nome": "Colaborador", "descricao": "Apenas registra ponto e visualiza próprios dados"},
        {"nome": "Gestor", "descricao": "Registra ponto + visualiza equipe + aprova ajustes"},
        {"nome": "RH", "descricao": "Gestão completa de colaboradores e relatórios"},
        {"nome": "Administrador", "descricao": "Acesso total ao sistema"},
        {"nome": "Auditor", "descricao": "Somente leitura para auditorias"}
    ],
    "cercas": [
        {"id": 1, "nome": "Escritório Central SP", "endereco": "Av. Paulista, 1000 - São Paulo/SP", "raio": "200m"},
        {"id": 2, "nome": "Obra Centro", "endereco": "Rua da Consolação, 500 - São Paulo/SP", "raio": "500m"},
        {"id": 3, "nome": "Cliente Banco XYZ", "endereco": "Av. Faria Lima, 3000 - São Paulo/SP", "raio": "100m"}
    ]
}


@app.get(prefixo_usuario + "/opcoes-cadastro", tags=["Usuários"])
def obter_opcoes_cadastro(con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()
        cur.execute(
            """
            SELECT cad_id, cad_ponto_nome, cad_ponto_tipo, cad_ponto_inicio, cad_ponto_fim
            FROM CADASTRO_PONTOS
            ORDER BY cad_ponto_nome ASC
            """
        )
        jornadas = [
            {
                "cad_id": row[0],
                "nome": row[1],
                "tipo": row[2],
                "inicio": row[3],
                "fim": row[4]
            }
            for row in cur.fetchall()
        ]

        cur.execute("SELECT usu_id, usu_nome, usu_permissao FROM USUARIOS WHERE usu_ativo = 1 ORDER BY usu_nome")
        gestores = [
            {
                "usu_id": row[0],
                "nome": row[1],
                "permissao": row[2]
            }
            for row in cur.fetchall()
        ]

        return {
            **SYSTEM_OPTIONS,
            "jornadas": jornadas,
            "gestores": gestores
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar opções de cadastro: {exc}")