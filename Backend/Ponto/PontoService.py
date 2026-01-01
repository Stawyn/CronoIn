from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Backend de Pontos")

class Ponto(BaseModel):
    nomePonto: str
    horaInicio: str
    horaFim: str
    horaPausa: str
    tempoPausa: int
    tolerancia: int
    diasSemana: List[str]
    usuariosSelecionados: List[int]

# Lista de pontos
pontos_cadastrados: List[Ponto] = []

# POST: cadastrar ponto
@app.post("/pontos/")
async def cadastrar_ponto(ponto: Ponto):
    pontos_cadastrados.append(ponto)
    return {"message": "Ponto cadastrado com sucesso!", "total": len(pontos_cadastrados)}

# GET: listar todos os pontos
@app.get("/pontos/")
async def listar_pontos():
    return pontos_cadastrados

# PUT: atualizar ponto existente pelo índice
@app.put("/pontos/{index}")
async def atualizar_ponto(index: int, ponto: Ponto):
    if 0 <= index < len(pontos_cadastrados):
        pontos_cadastrados[index] = ponto
        return {"message": "Ponto atualizado com sucesso!"}
    else:
        raise HTTPException(status_code=404, detail="Ponto não encontrado")

# DELETE: remover ponto pelo índice
@app.delete("/pontos/{index}")
async def deletar_ponto(index: int):
    if 0 <= index < len(pontos_cadastrados):
        pontos_cadastrados.pop(index)
        return {"message": "Ponto excluído com sucesso!", "total": len(pontos_cadastrados)}
    else:
        raise HTTPException(status_code=404, detail="Ponto não encontrado")
