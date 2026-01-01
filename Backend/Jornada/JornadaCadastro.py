from Backend.main import app, CadastroPonto, prefixo_cadastro, HTTPException, get_db_connection, Depends
from datetime import datetime, date, time
from typing import Any, Dict, Iterable, Tuple
import sqlite3

VALID_CALENDAR_TYPES = {'work', 'off', 'holiday'}
VALID_DAY_TYPES = {'Normal', 'Folga', 'DSR', 'Feriado'}


def _get_value(source: Any, key: str, default: Any = None) -> Any:
    if hasattr(source, key):
        return getattr(source, key)
    if isinstance(source, dict):
        return source.get(key, default)
    return default


def _format_time_value(value: Any) -> str | None:
    if value in (None, ''):
        return None
    if isinstance(value, time):
        return value.strftime('%H:%M:%S')
    value_str = str(value).strip()
    if not value_str:
        return None
    if len(value_str) == 5:
        value_str = f"{value_str}:00"
    try:
        parsed = time.fromisoformat(value_str)
        return parsed.strftime('%H:%M:%S')
    except ValueError:
        return None


def _iter_config(config: Any) -> Iterable[Tuple[int, Any]]:
    if isinstance(config, dict):
        for key, value in config.items():
            try:
                yield int(key), value
            except (TypeError, ValueError):
                continue
    elif isinstance(config, (list, tuple)):
        for idx, value in enumerate(config):
            yield idx, value


def _persistir_config_semanal(cursor: sqlite3.Cursor, cad_id: int, config_semanal: Dict[int, Any]):
    cursor.execute("DELETE FROM JORNADA_SEMANAL WHERE cad_id = ?", (cad_id,))
    registros = []
    for dia_semana, info in _iter_config(config_semanal):
        enabled = bool(_get_value(info, 'enabled', False))
        tipo = _get_value(info, 'type') or _get_value(info, 'tipo') or ('Normal' if enabled else 'Folga')
        if tipo not in VALID_DAY_TYPES:
            tipo = 'Normal' if enabled else 'Folga'

        entrada1 = _format_time_value(_get_value(info, 'entry1'))
        saida1 = _format_time_value(_get_value(info, 'exit1'))
        entrada2 = _format_time_value(_get_value(info, 'entry2'))
        saida2 = _format_time_value(_get_value(info, 'exit2'))

        registros.append((
            cad_id,
            dia_semana,
            1 if enabled else 0,
            tipo,
            entrada1,
            saida1,
            entrada2,
            saida2
        ))

    if registros:
        cursor.executemany(
            """
            INSERT OR REPLACE INTO JORNADA_SEMANAL (
                cad_id, dia_semana, habilitado, tipo, entrada1, saida1, entrada2, saida2
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            registros
        )


def _persistir_calendario(cursor: sqlite3.Cursor, cad_id: int, calendario):
    if not calendario:
        return

    cursor.execute("PRAGMA table_info(JORNADA_CALENDARIO)")
    colunas = [row[1] for row in cursor.fetchall()]
    possui_status = 'status' in colunas

    valores = []
    for entrada in calendario:
        if hasattr(entrada, 'dict'):
            data_val = entrada.data
            tipo = entrada.tipo
        else:
            data_val = entrada.get('data') if isinstance(entrada, dict) else None
            tipo = entrada.get('tipo') if isinstance(entrada, dict) else None

        if not tipo or tipo not in VALID_CALENDAR_TYPES or not data_val:
            continue

        if isinstance(data_val, date):
            data_str = data_val.strftime('%Y-%m-%d')
        else:
            data_str = str(data_val)

        if possui_status:
            status = getattr(entrada, 'status', None)
            if status is None and isinstance(entrada, dict):
                status = entrada.get('status')
            if not status:
                status = tipo
            valores.append((cad_id, data_str, tipo, status))
        else:
            valores.append((cad_id, data_str, tipo))

    if not valores:
        return

    if possui_status:
        cursor.executemany(
            """
            INSERT OR REPLACE INTO JORNADA_CALENDARIO (cad_id, data, tipo, status)
            VALUES (?, ?, ?, ?)
            """,
            valores
        )
    else:
        cursor.executemany(
            """
            INSERT OR REPLACE INTO JORNADA_CALENDARIO (cad_id, data, tipo)
            VALUES (?, ?, ?)
            """,
            valores
        )


def criar_jornada_registro(ponto: CadastroPonto, con: sqlite3.Connection) -> int:
    cur = con.cursor()

    if ponto.usu_id is not None:
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (ponto.usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {ponto.usu_id} não encontrado.")

    tolerancia_entrada = ponto.cad_ponto_tolerancia_min or 0
    tolerancia_saida = ponto.cad_ponto_tolerancia_saida_min or 0
    tempo_pausa = ponto.cad_ponto_tempo_pausa_min or 0
    inicio_almoco = _format_time_value(ponto.cad_ponto_inicio_almoco)
    fechamento_dia = _format_time_value(ponto.cad_ponto_fechamento_dia)

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
            ponto.usu_id,
            ponto.cad_ponto_nome,
            ponto.cad_ponto_codigo,
            ponto.cad_ponto_descricao,
            ponto.cad_ponto_tipo,
            ponto.cad_ponto_carga_diaria,
            ponto.cad_ponto_carga_semanal,
            ponto.cad_ponto_dias_trabalho,
            ponto.cad_ponto_inicio.strftime('%H:%M:%S'),
            ponto.cad_ponto_fim.strftime('%H:%M:%S'),
            ponto.cad_ponto_pausa,
            tempo_pausa,
            inicio_almoco,
            tolerancia_entrada,
            tolerancia_saida,
            fechamento_dia,
            ponto.cad_ponto_falta_parcial_auto,
            ponto.cad_ponto_dias_semana,
            1 if ponto.cad_ponto_gps_enabled else 0,
            ponto.cad_ponto_gps_center_lat,
            ponto.cad_ponto_gps_center_lng,
            ponto.cad_ponto_gps_radius_m,
            1 if ponto.cad_ponto_facial_required else 0,
            datetime.now()
        )
    )

    cad_id = cur.lastrowid
    _persistir_config_semanal(cur, cad_id, ponto.config_semanal or {})
    _persistir_calendario(cur, cad_id, ponto.calendario_aplicacao or [])
    return cad_id


@app.post(prefixo_cadastro + "/cadastrar", status_code=201, tags=["Jornadas"])
def cadastrar_jornada(ponto: CadastroPonto, con: sqlite3.Connection = Depends(get_db_connection)):
    """Cadastra uma nova jornada de trabalho."""
    try:
        cad_id = criar_jornada_registro(ponto, con)
        con.commit()
        return {
            "mensagem": "Jornada de trabalho cadastrada com sucesso!",
            "cad_id": cad_id
        }
    except HTTPException:
        con.rollback()
        raise
    except sqlite3.IntegrityError as exc:
        con.rollback()
        raise HTTPException(status_code=400, detail=f"Erro de integridade: {exc}")
    except Exception as exc:
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao cadastrar jornada: {exc}")


@app.get(prefixo_cadastro + "/usuarios", tags=["Jornadas"])
def listar_usuarios(con: sqlite3.Connection = Depends(get_db_connection)):
    """Lista todos os usuários disponíveis para vinculação a uma jornada."""
    try:
        cur = con.cursor()
        cur.execute("SELECT usu_id, usu_nome FROM USUARIOS")
        usuarios = cur.fetchall()
        return [{"usu_id": usuario[0], "usu_nome": usuario[1]} for usuario in usuarios]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários: {exc}")
