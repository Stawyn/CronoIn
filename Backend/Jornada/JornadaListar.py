from Backend.main import app, prefixo_cadastro, HTTPException, get_db_connection, Depends
from datetime import date, time
from typing import Optional, List, Dict, Any
import sqlite3


def _carregar_calendario(cur: sqlite3.Cursor, cad_id: int) -> List[Dict[str, Any]]:
    cur.execute("PRAGMA table_info(JORNADA_CALENDARIO)")
    colunas = [row[1] for row in cur.fetchall()]
    possui_status = 'status' in colunas

    if possui_status:
        cur.execute("SELECT data, tipo, status FROM JORNADA_CALENDARIO WHERE cad_id = ? ORDER BY data", (cad_id,))
    else:
        cur.execute("SELECT data, tipo FROM JORNADA_CALENDARIO WHERE cad_id = ? ORDER BY data", (cad_id,))
    rows = cur.fetchall()
    if isinstance(rows, list) and rows and not isinstance(rows[0], sqlite3.Row):
        return [
            {
                "data": str(row[0]),
                "tipo": row[1],
                **({"status": row[2]} if possui_status else {})
            }
            for row in rows
        ]
    return [
        {
            "data": str(row["data"]),
            "tipo": row["tipo"],
            **({"status": row["status"]} if possui_status else {})
        }
        for row in rows
    ]


def _format_time_hhmm(value: Any) -> str:
    if value in (None, ''):
        return ''
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return ''
        try:
            parsed = time.fromisoformat(raw if len(raw) > 5 else f"{raw}:00")
            return parsed.strftime('%H:%M')
        except ValueError:
            return raw
    if isinstance(value, time):
        return value.strftime('%H:%M')
    return str(value)


def _carregar_config_semanal(cur: sqlite3.Cursor, cad_id: int) -> Dict[str, Any]:
    cur.execute(
        """
        SELECT dia_semana, habilitado, tipo, entrada1, saida1, entrada2, saida2
        FROM JORNADA_SEMANAL
        WHERE cad_id = ?
        ORDER BY dia_semana
        """,
        (cad_id,)
    )
    rows = cur.fetchall()
    resultado: Dict[str, Any] = {}
    for row in rows:
        if isinstance(row, sqlite3.Row):
            dia = row["dia_semana"]
            habilitado = bool(row["habilitado"])
            tipo = row["tipo"]
            entrada1 = row["entrada1"]
            saida1 = row["saida1"]
            entrada2 = row["entrada2"]
            saida2 = row["saida2"]
        else:
            dia, habilitado, tipo, entrada1, saida1, entrada2, saida2 = row
            habilitado = bool(habilitado)

        resultado[str(dia)] = {
            "enabled": habilitado,
            "type": tipo,
            "entry1": _format_time_hhmm(entrada1),
            "exit1": _format_time_hhmm(saida1),
            "entry2": _format_time_hhmm(entrada2),
            "exit2": _format_time_hhmm(saida2)
        }
    return resultado


def _normalizar_jornada(row: sqlite3.Row) -> Dict[str, Any]:
    jornada = dict(row)
    for campo in ("cad_ponto_pausa", "cad_ponto_falta_parcial_auto", "cad_ponto_facial_required", "cad_ponto_gps_enabled"):
        if campo in jornada and jornada[campo] is not None:
            jornada[campo] = bool(jornada[campo])
    return jornada

@app.get(prefixo_cadastro + "/hoje", tags=["Jornadas"])
def buscar_jornada_de_hoje(usu_id: Optional[int] = None, con: sqlite3.Connection = Depends(get_db_connection)):
    """
    Busca no banco de dados a jornada de trabalho aplicável para o dia de hoje.
    Se usu_id for fornecido, retorna apenas jornadas desse usuário.
    O dia da semana é calculado (Domingo=0, Segunda=1, ..., Sábado=6).
    """
    try:
        dia_da_semana = date.today().weekday()  # Segunda(0) a Domingo(6)
        dia_da_semana_str = str((dia_da_semana + 1) % 7)  # Converte para Dom(0)..Sáb(6)

        cur = con.cursor()
        parametro_like = f"%{dia_da_semana_str}%"
        
        if usu_id:
            # Verifica se o usuário existe
            cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (usu_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")

            # tenta jornada cadastrada diretamente como propriedade do cadastro (cad.usu_id)
            query = (
                "SELECT c.*, u.usu_nome, u.usu_email "
                "FROM CADASTRO_PONTOS c "
                "LEFT JOIN USUARIOS u ON c.usu_id = u.usu_id "
                "WHERE c.usu_id = ? AND c.cad_ponto_dias_semana LIKE ?"
            )
            cur.execute(query, (usu_id, parametro_like))
            jornada = cur.fetchone()

            # Se não encontrou jornada vinculada diretamente ao campo cad.usu_id,
            # procurar por associações ativas na tabela USUARIO_JORNADA.
            if not jornada:
                query2 = (
                    "SELECT c.*, u.usu_nome, u.usu_email "
                    "FROM USUARIO_JORNADA uj "
                    "INNER JOIN CADASTRO_PONTOS c ON uj.cad_id = c.cad_id "
                    "LEFT JOIN USUARIOS u ON c.usu_id = u.usu_id "
                    "WHERE uj.usu_id = ? "
                    "  AND uj.uj_ativo = 1 "
                    "  AND (uj.uj_data_inicio <= DATE('now')) "
                    "  AND (uj.uj_data_fim IS NULL OR uj.uj_data_fim >= DATE('now')) "
                    "  AND c.cad_ponto_dias_semana LIKE ? "
                    "ORDER BY uj.uj_data_inicio DESC LIMIT 1"
                )
                cur.execute(query2, (usu_id, parametro_like))
                jornada = cur.fetchone()
        else:
            query = """
                SELECT 
                    c.*,
                    u.usu_nome,
                    u.usu_email
                FROM CADASTRO_PONTOS c
                LEFT JOIN USUARIOS u ON c.usu_id = u.usu_id
                WHERE c.cad_ponto_dias_semana LIKE ?
            """
            cur.execute(query, (parametro_like,))
            jornada = cur.fetchone()
        
        # 'jornada' já foi preenchida nas ramificações acima (ou permanece None)

        if not jornada:
            return None

        jornada_dict = _normalizar_jornada(jornada)
        jornada_dict["calendario_aplicacao"] = _carregar_calendario(cur, jornada_dict["cad_id"])
        jornada_dict["config_semanal"] = _carregar_config_semanal(cur, jornada_dict["cad_id"])
        return jornada_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao buscar a jornada de hoje: {e}")

@app.get(prefixo_cadastro + "/listar", tags=["Jornadas"])
def listar_jornadas(usu_id: Optional[int] = None, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Retorna uma lista com todas as jornadas de trabalho cadastradas. Se usu_id for fornecido, filtra por usuário. """
    try:
        cur = con.cursor()
        
        if usu_id:
            # Verifica se o usuário existe
            cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (usu_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")
            
            cur.execute("""
                SELECT
                    c.cad_id,
                    c.usu_id,
                    c.cad_ponto_nome,
                    c.cad_ponto_codigo,
                    c.cad_ponto_descricao,
                    c.cad_ponto_tipo,
                    c.cad_ponto_carga_diaria,
                    c.cad_ponto_carga_semanal,
                    c.cad_ponto_dias_trabalho,
                    strftime('%H:%M', c.cad_ponto_inicio) AS cad_ponto_inicio,
                    strftime('%H:%M', c.cad_ponto_fim) AS cad_ponto_fim,
                    c.cad_ponto_pausa,
                    strftime('%H:%M', c.cad_ponto_inicio_almoco) AS cad_ponto_inicio_almoco,
                    c.cad_ponto_tempo_pausa_min,
                    c.cad_ponto_tolerancia_min,
                    c.cad_ponto_tolerancia_saida_min,
                    strftime('%H:%M', c.cad_ponto_fechamento_dia) AS cad_ponto_fechamento_dia,
                    c.cad_ponto_falta_parcial_auto,
                    c.cad_ponto_dias_semana,
                    c.cad_ponto_gps_enabled,
                    c.cad_ponto_gps_center_lat,
                    c.cad_ponto_gps_center_lng,
                    c.cad_ponto_gps_radius_m,
                    c.cad_ponto_facial_required,
                    c.cad_info_data_criacao,
                    u.usu_nome,
                    u.usu_email
                FROM CADASTRO_PONTOS c
                LEFT JOIN USUARIOS u ON c.usu_id = u.usu_id
                WHERE c.usu_id = ?
                ORDER BY c.cad_info_data_criacao DESC
            """, (usu_id,))
        else:
            cur.execute("""
                SELECT
                    c.cad_id,
                    c.usu_id,
                    c.cad_ponto_nome,
                    c.cad_ponto_codigo,
                    c.cad_ponto_descricao,
                    c.cad_ponto_tipo,
                    c.cad_ponto_carga_diaria,
                    c.cad_ponto_carga_semanal,
                    c.cad_ponto_dias_trabalho,
                    strftime('%H:%M', c.cad_ponto_inicio) AS cad_ponto_inicio,
                    strftime('%H:%M', c.cad_ponto_fim) AS cad_ponto_fim,
                    c.cad_ponto_pausa,
                    strftime('%H:%M', c.cad_ponto_inicio_almoco) AS cad_ponto_inicio_almoco,
                    c.cad_ponto_tempo_pausa_min,
                    c.cad_ponto_tolerancia_min,
                    c.cad_ponto_tolerancia_saida_min,
                    strftime('%H:%M', c.cad_ponto_fechamento_dia) AS cad_ponto_fechamento_dia,
                    c.cad_ponto_falta_parcial_auto,
                    c.cad_ponto_dias_semana,
                    c.cad_ponto_gps_enabled,
                    c.cad_ponto_gps_center_lat,
                    c.cad_ponto_gps_center_lng,
                    c.cad_ponto_gps_radius_m,
                    c.cad_ponto_facial_required,
                    c.cad_info_data_criacao,
                    u.usu_nome,
                    u.usu_email
                FROM CADASTRO_PONTOS c
                LEFT JOIN USUARIOS u ON c.usu_id = u.usu_id
                ORDER BY c.cad_info_data_criacao DESC
            """)
        
        rows = cur.fetchall()

        columns = [col[0] for col in cur.description]
        result = []
        for row in rows:
            registro = dict(zip(columns, row))
            for campo in ("cad_ponto_pausa", "cad_ponto_falta_parcial_auto", "cad_ponto_facial_required", "cad_ponto_gps_enabled"):
                if campo in registro and registro[campo] is not None:
                    registro[campo] = bool(registro[campo])
            registro["calendario_aplicacao"] = _carregar_calendario(cur, registro["cad_id"])
            registro["config_semanal"] = _carregar_config_semanal(cur, registro["cad_id"])
            result.append(registro)

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao listar jornadas: {e}")

@app.get(prefixo_cadastro + "/{cad_id}", tags=["Jornadas"])
def buscar_jornada_por_id(cad_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Retorna os detalhes de uma jornada de trabalho específica. """
    try:
        cur = con.cursor()
        cur.execute("""
            SELECT 
                c.*,
                u.usu_nome,
                u.usu_email
            FROM CADASTRO_PONTOS c
            LEFT JOIN USUARIOS u ON c.usu_id = u.usu_id
            WHERE c.cad_id = ?
        """, (cad_id,))
        jornada = cur.fetchone()

        if not jornada:
            raise HTTPException(status_code=404, detail=f"Jornada com ID {cad_id} não encontrada.")

        jornada_dict = _normalizar_jornada(jornada)
        jornada_dict["calendario_aplicacao"] = _carregar_calendario(cur, cad_id)
        jornada_dict["config_semanal"] = _carregar_config_semanal(cur, cad_id)

        return jornada_dict
    except Exception as e:
        if not isinstance(e, HTTPException):
             raise HTTPException(status_code=500, detail=f"Erro interno ao buscar jornada: {e}")
        raise e

@app.get(prefixo_cadastro + "/data/{data_criacao}", tags=["Jornadas"])
def buscar_jornadas_por_data(data_criacao: date, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Retorna todas as jornadas de trabalho criadas em um dia específico. """
    try:
        cur = con.cursor()
        cur.execute("SELECT * FROM CADASTRO_PONTOS WHERE DATE(cad_info_data_criacao) = ?", (data_criacao.strftime('%Y-%m-%d'),))
        rows = cur.fetchall()

        if not rows:
            # É melhor retornar uma lista vazia do que um 404 neste caso
            return []

        resultado = []
        for row in rows:
            jornada = _normalizar_jornada(row)
            jornada["calendario_aplicacao"] = _carregar_calendario(cur, jornada["cad_id"])
            jornada["config_semanal"] = _carregar_config_semanal(cur, jornada["cad_id"])
            resultado.append(jornada)

        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao buscar jornadas por data: {e}")