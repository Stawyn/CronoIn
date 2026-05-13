from Backend.main import app, CadastroPonto, prefixo_registro, HTTPException, get_db_connection, Depends
import sqlite3

# ATENÇÃO: Este endpoint está editando uma JORNADA (/jornada), não um REGISTRO de ponto.
@app.put(prefixo_registro + "/editar/{cad_id}", tags=["Jornadas"])
def editar_jornada_ponto(cad_id: int, ponto: CadastroPonto, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Atualiza os dados de uma jornada de trabalho existente. """
    try:
        cur = con.cursor()
        cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ?", (cad_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Jornada com ID {cad_id} não encontrada.")

        cur.execute("""
            UPDATE CADASTRO_PONTOS SET
                cad_ponto_nome = ?, cad_ponto_inicio = ?, cad_ponto_fim = ?,
                cad_ponto_pausa = ?, cad_ponto_tempo_pausa_min = ?,
                cad_ponto_inicio_almoco = ?, cad_ponto_tolerancia_min = ?, 
                cad_ponto_dias_semana = ?
            WHERE cad_id = ?
        """, (
            ponto.cad_ponto_nome, ponto.cad_ponto_inicio, ponto.cad_ponto_fim,
            ponto.cad_ponto_pausa, ponto.cad_ponto_tempo_pausa_min,
            ponto.cad_ponto_inicio_almoco, ponto.cad_ponto_tolerancia_min,
            ponto.cad_ponto_dias_semana, cad_id
        ))
        con.commit()
        return {"mensagem": f"Jornada com ID {cad_id} atualizada com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao editar jornada: {e}")
