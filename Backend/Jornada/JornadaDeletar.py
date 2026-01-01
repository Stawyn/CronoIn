from Backend.main import app, prefixo_cadastro, HTTPException, get_db_connection, Depends
import sqlite3


@app.delete(prefixo_cadastro + "/deletar/{cad_id}", tags=["Jornadas"])
def deletar_jornada(cad_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Remove uma jornada de trabalho do banco de dados. """
    try:
        cur = con.cursor()
        cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ?", (cad_id,))
        jornada = cur.fetchone()

        if not jornada:
            raise HTTPException(status_code=404, detail=f"Jornada com ID {cad_id} não encontrada.")

        cur.execute("UPDATE USUARIOS SET usu_jornada_padrao_id = NULL WHERE usu_jornada_padrao_id = ?", (cad_id,))
        cur.execute("UPDATE REGISTRO_PONTOS SET cad_id = NULL WHERE cad_id = ?", (cad_id,))
        cur.execute("DELETE FROM CADASTRO_PONTOS WHERE cad_id = ?", (cad_id,))
        con.commit()

        return {"mensagem": f"Jornada com ID {cad_id} deletada com sucesso!"}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao deletar jornada: {e}")
    except Exception as e:
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao deletar jornada: {e}")