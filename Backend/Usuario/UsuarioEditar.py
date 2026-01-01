from Backend.main import (
    app,
    EditarUsuario,
    prefixo_usuario,
    HTTPException,
    pwd_context,
    get_db_connection,
    Depends
)
from Backend.utils.media import save_base64_image
import sqlite3

@app.put(prefixo_usuario + "/editar/{usu_id}", tags=["Usuários"])
def editar_usuario(usu_id: int, usuario: EditarUsuario, con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()

        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")

        query = """
            UPDATE USUARIOS SET
                usu_nome = ?, usu_email = ?, usu_telefone = ?,
                usu_departamento = ?, usu_permissao = ?, usu_ativo = ?
        """
        params = [
            usuario.usu_nome, usuario.usu_email, usuario.usu_telefone,
            usuario.usu_departamento, usuario.usu_permissao, usuario.usu_ativo
        ]

        if usuario.nova_senha:
            # --- CORREÇÃO ADICIONADA AQUI ---
            # Lógica para truncar senha longa (limite de 72 bytes do bcrypt)
            senha_str = usuario.nova_senha
            if len(senha_str.encode('utf-8')) > 72:
                senha_para_hash = senha_str.encode('utf-8')[:72].decode('utf-8', 'ignore')
            else:
                senha_para_hash = senha_str

            senha_hash = pwd_context.hash(senha_para_hash)
            query += ", usu_senha_hash = ?"
            params.append(senha_hash)

        if usuario.usu_foto_base64:
            try:
                foto_url = save_base64_image(usuario.usu_foto_base64, prefix=usuario.usu_nome)
            except ValueError:
                raise HTTPException(status_code=400, detail="Imagem facial inválida. Envie um base64 válido.")
            query += ", usu_foto_url = ?"
            params.append(foto_url)

        query += " WHERE usu_id = ?"
        params.append(usu_id)

        cur.execute(query, tuple(params))
        con.commit()

        return {"mensagem": f"Usuário com ID {usu_id} atualizado com sucesso!"}
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed" in str(e):
             raise HTTPException(status_code=409, detail="O email ou CPF informado já está em uso por outro usuário.")
        raise HTTPException(status_code=500, detail=f"Erro interno ao editar usuário: {e}")
    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Erro interno ao editar usuário: {e}")
        raise e