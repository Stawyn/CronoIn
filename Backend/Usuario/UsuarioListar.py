from Backend.main import app, prefixo_usuario, HTTPException, get_db_connection, Depends
import sqlite3
import json

@app.get(prefixo_usuario + "/listar", tags=["Usuários"])
def listar_usuarios(con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()
        cur.execute("SELECT usu_id, usu_nome, usu_email, usu_departamento, usu_foto_url FROM USUARIOS ORDER BY usu_nome")
        rows = cur.fetchall()
        # Converte as linhas (sqlite3.Row) em dicionários
        usuarios = [dict(row) for row in rows]
        return usuarios
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao listar usuários: {e}")

@app.get(prefixo_usuario + "/{usu_id}", tags=["Usuários"])
def buscar_usuario(usu_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()
        cur.execute("SELECT * FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")

        usuario = dict(row)

        cur.execute(
            """
            SELECT dados_pessoais, dados_trabalhistas, config_ponto, biometria_acesso,
                   documentos, preferencias
            FROM USUARIO_EXTRAS
            WHERE usu_id = ?
            """,
            (usu_id,)
        )
        extras_row = cur.fetchone()

        if extras_row:
            def _parse_blob(value: str | None):
                if not value:
                    return None
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return None

            usuario["extras"] = {
                "dados_pessoais": _parse_blob(extras_row["dados_pessoais"]),
                "dados_trabalhistas": _parse_blob(extras_row["dados_trabalhistas"]),
                "config_ponto": _parse_blob(extras_row["config_ponto"]),
                "biometria_acesso": _parse_blob(extras_row["biometria_acesso"]),
                "documentos": _parse_blob(extras_row["documentos"]),
            }
            usuario["preferencias"] = _parse_blob(extras_row["preferencias"])
        else:
            usuario["extras"] = None
            usuario["preferencias"] = None

        return usuario
    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Erro interno ao buscar usuário: {e}")
        raise e