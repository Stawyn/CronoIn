from Backend.main import app, prefixo_usuario, cur, con, HTTPException

# --------------------------------------------------------------------
# DELETAR USUÁRIO
# --------------------------------------------------------------------
# --- COMO USAR ---
# METODO: DELETE
# URL: http://127.0.0.1:8000/usuario/deletar/1
#      (Onde "1" é o ID do usuário que você quer deletar)
#
# OBJETIVO: Remove um usuário do banco de dados.
#
# CORPO DA REQUISIÇÃO: Nenhum
#
# RESPOSTA DE SUCESSO (JSON):
# {
#   "mensagem": "Usuário com ID 1 deletado com sucesso!"
# }
# --------------------------------------------------------------------
@app.delete(prefixo_usuario + "/deletar/{usu_id}", tags=["Usuários"])
def deletar_usuario(usu_id: int):
    try:
        # Verifica se o usuário existe antes de deletar
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")

        # Executa a deleção
        cur.execute("DELETE FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        con.commit()

        # Verifica se alguma linha foi afetada para confirmar a deleção
        if cur.rowcount == 0:
            # Esta é uma segurança extra, embora a verificação inicial já devesse ter pego isso
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado para deleção.")

        return {"mensagem": f"Usuário com ID {usu_id} deletado com sucesso!"}
    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Erro interno ao deletar usuário: {e}")
        raise e