from Backend.main import app, HTTPException, get_db_connection, Depends, BaseModel, EmailStr, pwd_context
import sqlite3

class LoginRequest(BaseModel):
    usu_email: str
    usu_senha: str

@app.post('/auth/login')
def auth_login(req: LoginRequest, con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()
        # Tenta buscar por email ou por nome (para facilitar testes)
        cur.execute('SELECT usu_id, usu_nome, usu_senha_hash, usu_permissao FROM USUARIOS WHERE usu_email = ? OR usu_nome = ?', (req.usu_email, req.usu_email))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail='Credenciais inválidas')
        usu_id, usu_nome, usu_senha_hash, usu_permissao = row
        if not pwd_context.verify(req.usu_senha, usu_senha_hash):
            raise HTTPException(status_code=401, detail='Credenciais inválidas')
        token = f'token-{usu_id}'
        return {'token': token, 'usu_id': usu_id, 'usu_nome': usu_nome, 'usu_permissao': usu_permissao}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Erro interno no login: {e}')
