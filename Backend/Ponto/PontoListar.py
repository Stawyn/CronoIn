from Backend.main import app, prefixo_registro, HTTPException, get_db_connection, Depends
from datetime import date, datetime, timezone
from typing import Optional
import sqlite3


@app.get(prefixo_registro + "/servertime", status_code=200, tags=["Registros de Ponto"])
def obter_horario_servidor():
    agora = datetime.now(timezone.utc)
    return {
        "server_time": agora.isoformat(),
        "timestamp": agora.timestamp(),
    }


@app.get(prefixo_registro + "/hoje", tags=["Registros de Ponto"])
def buscar_registro_de_hoje(usu_id: Optional[int] = None, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Busca o registro de ponto do dia atual. Se usu_id for fornecido, retorna apenas para esse usuário. """
    hoje = date.today()
    try:
        cur = con.cursor()
        if usu_id:
            cur.execute("""
                SELECT 
                    r.*,
                    u.usu_nome,
                    u.usu_email,
                    j.cad_ponto_nome as jornada_nome
                FROM REGISTRO_PONTOS r
                LEFT JOIN USUARIOS u ON r.usu_id = u.usu_id
                LEFT JOIN CADASTRO_PONTOS j ON r.cad_id = j.cad_id
                WHERE r.ponto_data = ? AND r.usu_id = ?
            """, (hoje.strftime('%Y-%m-%d'), usu_id))
        else:
            cur.execute("""
                SELECT 
                    r.*,
                    u.usu_nome,
                    u.usu_email,
                    j.cad_ponto_nome as jornada_nome
                FROM REGISTRO_PONTOS r
                LEFT JOIN USUARIOS u ON r.usu_id = u.usu_id
                LEFT JOIN CADASTRO_PONTOS j ON r.cad_id = j.cad_id
                WHERE r.ponto_data = ?
            """, (hoje.strftime('%Y-%m-%d'),))
        registro = cur.fetchone()

        if not registro:
            return None  # Retorna JSON null se não houver registro, como o frontend espera

        return dict(registro)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao buscar registro de hoje: {e}")


@app.get(prefixo_registro + "/listar", tags=["Registros de Ponto"])
def listar_registros_ponto(usu_id: Optional[int] = None, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Lista todos os registros de ponto, ordenados pela data mais recente. Se usu_id for fornecido, filtra por usuário. """
    try:
        cur = con.cursor()
        if usu_id:
            cur.execute("""
                SELECT 
                    r.*,
                    u.usu_nome,
                    u.usu_email,
                    j.cad_ponto_nome as jornada_nome
                FROM REGISTRO_PONTOS r
                LEFT JOIN USUARIOS u ON r.usu_id = u.usu_id
                LEFT JOIN CADASTRO_PONTOS j ON r.cad_id = j.cad_id
                WHERE r.usu_id = ?
                ORDER BY r.ponto_data DESC
            """, (usu_id,))
        else:
            cur.execute("""
                SELECT 
                    r.*,
                    u.usu_nome,
                    u.usu_email,
                    j.cad_ponto_nome as jornada_nome
                FROM REGISTRO_PONTOS r
                LEFT JOIN USUARIOS u ON r.usu_id = u.usu_id
                LEFT JOIN CADASTRO_PONTOS j ON r.cad_id = j.cad_id
                ORDER BY r.ponto_data DESC
            """)
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao listar registros: {e}")


@app.get(prefixo_registro + "/{ponto_id}", tags=["Registros de Ponto"])
def buscar_registro_por_id(ponto_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Retorna os detalhes de um registro de ponto específico. """
    try:
        cur = con.cursor()
        cur.execute("""
            SELECT 
                r.*,
                u.usu_nome,
                u.usu_email,
                j.cad_ponto_nome as jornada_nome
            FROM REGISTRO_PONTOS r
            LEFT JOIN USUARIOS u ON r.usu_id = u.usu_id
            LEFT JOIN CADASTRO_PONTOS j ON r.cad_id = j.cad_id
            WHERE r.ponto_id = ?
        """, (ponto_id,))
        registro = cur.fetchone()

        if not registro:
            raise HTTPException(status_code=404, detail=f"Registro de ponto com ID {ponto_id} não encontrado.")

        return dict(registro)
    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Erro interno ao buscar registro de ponto: {e}")
        raise e


@app.get(prefixo_registro + "/data/{ponto_data}", tags=["Registros de Ponto"])
def buscar_registro_por_data(ponto_data: date, usu_id: Optional[int] = None, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Retorna o registro de ponto de um dia específico. Se usu_id for fornecido, filtra por usuário. """
    try:
        cur = con.cursor()
        if usu_id:
            cur.execute("""
                SELECT 
                    r.*,
                    u.usu_nome,
                    u.usu_email,
                    j.cad_ponto_nome as jornada_nome
                FROM REGISTRO_PONTOS r
                LEFT JOIN USUARIOS u ON r.usu_id = u.usu_id
                LEFT JOIN CADASTRO_PONTOS j ON r.cad_id = j.cad_id
                WHERE r.ponto_data = ? AND r.usu_id = ?
            """, (ponto_data.strftime('%Y-%m-%d'), usu_id))
        else:
            cur.execute("""
                SELECT 
                    r.*,
                    u.usu_nome,
                    u.usu_email,
                    j.cad_ponto_nome as jornada_nome
                FROM REGISTRO_PONTOS r
                LEFT JOIN USUARIOS u ON r.usu_id = u.usu_id
                LEFT JOIN CADASTRO_PONTOS j ON r.cad_id = j.cad_id
                WHERE r.ponto_data = ?
            """, (ponto_data.strftime('%Y-%m-%d'),))
        registro = cur.fetchone()

        if not registro:
            raise HTTPException(status_code=404, detail=f"Não há registro de ponto para a data {ponto_data}.")

        return dict(registro)
    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Erro interno ao buscar registro por data: {e}")
        raise e