from Backend.main import app, prefixo_usuario, HTTPException, get_db_connection, Depends
import sqlite3


@app.delete(prefixo_usuario + "/deletar/{usu_id}", tags=["Usuários"])
def deletar_usuario(usu_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()

        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")

        cur.execute("DELETE FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        con.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado para deleção.")

        return {"mensagem": f"Usuário com ID {usu_id} deletado com sucesso!"}
    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Erro interno ao deletar usuário: {e}")
        raise e