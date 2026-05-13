from Backend.main import app, prefixo_usuario, HTTPException, BaseModel, get_db_connection, Depends
from datetime import date
from typing import Optional
import sqlite3

class AssociarJornadaRequest(BaseModel):
    usu_id: int
    cad_id: int
    uj_data_inicio: date
    uj_data_fim: Optional[date] = None
    uj_ativo: bool = True

class DesativarJornadaRequest(BaseModel):
    usu_id: int
    cad_id: int

@app.post(prefixo_usuario + "/jornada/associar", status_code=201, tags=["Usuários"])
def associar_jornada_usuario(associacao: AssociarJornadaRequest, con: sqlite3.Connection = Depends(get_db_connection)):
    """Associa uma jornada a um usuário."""
    try:
        cur = con.cursor()
        
        # Verifica se o usuário existe
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (associacao.usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {associacao.usu_id} não encontrado.")
        
        # Verifica se a jornada existe
        cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ?", (associacao.cad_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Jornada com ID {associacao.cad_id} não encontrada.")
        
        # Se está ativando uma nova jornada, desativa as outras jornadas ativas do usuário
        if associacao.uj_ativo:
            cur.execute("""
                UPDATE USUARIO_JORNADA 
                SET uj_ativo = 0 
                WHERE usu_id = ? AND uj_ativo = 1
            """, (associacao.usu_id,))
        
        # Insere a nova associação
        cur.execute("""
            INSERT INTO USUARIO_JORNADA (usu_id, cad_id, uj_data_inicio, uj_data_fim, uj_ativo)
            VALUES (?, ?, ?, ?, ?)
        """, (
            associacao.usu_id,
            associacao.cad_id,
            associacao.uj_data_inicio,
            associacao.uj_data_fim,
            associacao.uj_ativo
        ))
        
        con.commit()
        return {"mensagem": f"Jornada {associacao.cad_id} associada ao usuário {associacao.usu_id} com sucesso!"}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Erro de banco de dados: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao associar jornada: {e}")

@app.get(prefixo_usuario + "/{usu_id}/jornadas", tags=["Usuários"])
def listar_jornadas_usuario(usu_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    """Lista todas as jornadas associadas a um usuário."""
    try:
        cur = con.cursor()
        
        # Verifica se o usuário existe
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")
        
        cur.execute("""
            SELECT 
                uj.*,
                j.cad_ponto_nome,
                j.cad_ponto_inicio,
                j.cad_ponto_fim,
                u.usu_nome
            FROM USUARIO_JORNADA uj
            LEFT JOIN CADASTRO_PONTOS j ON uj.cad_id = j.cad_id
            LEFT JOIN USUARIOS u ON uj.usu_id = u.usu_id
            WHERE uj.usu_id = ?
            ORDER BY uj.uj_data_inicio DESC
        """, (usu_id,))
        
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao listar jornadas do usuário: {e}")

@app.get(prefixo_usuario + "/jornada/{cad_id}/usuarios", tags=["Usuários"])
def listar_usuarios_jornada(cad_id: int, con: sqlite3.Connection = Depends(get_db_connection)):
    """Lista todos os usuários associados a uma jornada."""
    try:
        cur = con.cursor()
        
        # Verifica se a jornada existe
        cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ?", (cad_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Jornada com ID {cad_id} não encontrada.")
        
        cur.execute("""
            SELECT 
                uj.*,
                j.cad_ponto_nome,
                u.usu_nome,
                u.usu_email
            FROM USUARIO_JORNADA uj
            LEFT JOIN CADASTRO_PONTOS j ON uj.cad_id = j.cad_id
            LEFT JOIN USUARIOS u ON uj.usu_id = u.usu_id
            WHERE uj.cad_id = ?
            ORDER BY uj.uj_data_inicio DESC
        """, (cad_id,))
        
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao listar usuários da jornada: {e}")

@app.put(prefixo_usuario + "/jornada/desativar", status_code=200, tags=["Usuários"])
def desativar_jornada_usuario(desativar: DesativarJornadaRequest, con: sqlite3.Connection = Depends(get_db_connection)):
    """Desativa a associação de uma jornada com um usuário."""
    try:
        cur = con.cursor()
        
        cur.execute("""
            UPDATE USUARIO_JORNADA 
            SET uj_ativo = 0 
            WHERE usu_id = ? AND cad_id = ?
        """, (desativar.usu_id, desativar.cad_id))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Associação não encontrada.")
        
        con.commit()
        return {"mensagem": "Jornada desativada para o usuário com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao desativar jornada: {e}")

