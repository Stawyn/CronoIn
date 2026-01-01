from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import uvicorn

def marcar_ponto ():
    return "Ponto marcado com sucesso!"

DB_FILE = "ponto.db"

app = FastAPI(title="API de Ponto - Vários Funcionários")

# -------- Rotas --------
@app.get("/ponto", response_model=Ponto)
def create_or_update_ponto(ponto: Ponto):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    c = conn.cursor()
    c.execute("""
    INSERT INTO ponto (funcionario_id, ponto_data, ponto_entrada, ponto_saida_almoco,
                       ponto_volta_almoco, ponto_saida, ponto_observacoes, ponto_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(funcionario_id, ponto_data) DO UPDATE SET
        ponto_entrada=excluded.ponto_entrada,
        ponto_saida_almoco=excluded.ponto_saida_almoco,
        ponto_volta_almoco=excluded.ponto_volta_almoco,
        ponto_saida=excluded.ponto_saida,
        ponto_observacoes=excluded.ponto_observacoes,
        ponto_status=excluded.ponto_status
    """, (
        ponto.funcionario_id, ponto.ponto_data, ponto.ponto_entrada,
        ponto.ponto_saida_almoco, ponto.ponto_volta_almoco, ponto.ponto_saida,
        ponto.ponto_observacoes, ponto.ponto_status
    ))
    conn.commit()
    conn.close()
    return ponto


@app.get("/ponto/{funcionario_id}/{ponto_data}", response_model=Ponto)
def get_ponto(funcionario_id: str, ponto_data: str):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    c = conn.cursor()
    c.execute("SELECT * FROM ponto WHERE funcionario_id=? AND ponto_data=?",
              (funcionario_id, ponto_data))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Ponto não encontrado")
    return row


@app.get("/pontos/{funcionario_id}", response_model=List[Ponto])
def list_pontos_funcionario(funcionario_id: str):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    c = conn.cursor()
    c.execute("SELECT * FROM ponto WHERE funcionario_id=? ORDER BY ponto_data DESC", (funcionario_id,))
    rows = c.fetchall()
    conn.close()
    return rows


@app.get("/pontos", response_model=List[Ponto])
def list_all_pontos():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    c = conn.cursor()
    c.execute("SELECT * FROM ponto ORDER BY funcionario_id, ponto_data DESC")
    rows = c.fetchall()
    conn.close()
    return rows
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)