from Backend.main import (
    app,
    CadastroUsuario,
    prefixo_usuario,
    HTTPException,
    pwd_context,
    get_db_connection,
    Depends
)
from Backend.utils.media import save_base64_image
from datetime import datetime
import sqlite3


def inserir_usuario_basico(usuario: CadastroUsuario, con: sqlite3.Connection) -> int:
    senha_str = usuario.usu_senha
    if len(senha_str.encode('utf-8')) > 72:
        senha_para_hash = senha_str.encode('utf-8')[:72].decode('utf-8', 'ignore')
    else:
        senha_para_hash = senha_str

    senha_hash = pwd_context.hash(senha_para_hash)
    cur = con.cursor()
    foto_url = None

    if getattr(usuario, 'usu_foto_base64', None):
        try:
            foto_url = save_base64_image(usuario.usu_foto_base64, prefix=usuario.usu_nome)
        except ValueError:
            raise HTTPException(status_code=400, detail="Imagem facial inválida. Envie um base64 válido.")

    cur.execute("""
        INSERT INTO USUARIOS (
            usu_nome, usu_email, usu_cpf, usu_telefone, usu_departamento,
            usu_permissao, usu_senha_hash, usu_data_criacao, usu_foto_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        usuario.usu_nome,
        usuario.usu_email,
        usuario.usu_cpf.replace('.', '').replace('-', ''),
        usuario.usu_telefone,
        usuario.usu_departamento,
        usuario.usu_permissao,
        senha_hash,
        datetime.now(),
        foto_url
    ))
    return cur.lastrowid


@app.post(prefixo_usuario + "/cadastrar", status_code=201, tags=["Usuários"])
def cadastrar_usuario(usuario: CadastroUsuario, con: sqlite3.Connection = Depends(get_db_connection)):    
    try:
        usu_id = inserir_usuario_basico(usuario, con)
        con.commit()
        return {"mensagem": "Usuário cadastrado com sucesso!", "usu_id": usu_id}
    except sqlite3.IntegrityError as e:
        if "USUARIOS.usu_email" in str(e):
            raise HTTPException(status_code=409, detail="O e-mail informado já está em uso.")
        if "USUARIOS.usu_cpf" in str(e):
            raise HTTPException(status_code=409, detail="O CPF informado já está em uso.")
        raise HTTPException(status_code=400, detail=f"Erro de integridade nos dados: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao cadastrar usuário: {e}")