from Backend.main import app, prefixo_registro, HTTPException, get_db_connection, Depends
import sqlite3


# ATENÇÃO: Este endpoint está deletando uma Registro (/Registro), não um REGISTRO de ponto.
@app.delete(prefixo_registro + "/deletar/{cad_id}", tags=[""])
def deletar_registro_ponto(cad_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Remove uma Registro de trabalho do banco de dados. """
    try:
        cur = con.cursor()
        cur.execute("SELECT ponto_id FROM REGISTRO_PONTOS WHERE ponto_id = ?", (cad_id,))

        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Registro com ID {cad_id} não encontrada.")

        cur.execute("DELETE FROM REGISTRO_PONTOS WHERE ponto_id = ?", (cad_id,))
        con.commit()

        return {"mensagem": f"Registro com ID {cad_id} deletada com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao deletar Registro: {e}")