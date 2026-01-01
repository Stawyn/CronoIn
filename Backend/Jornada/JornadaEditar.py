from Backend.main import app, CadastroPonto, prefixo_cadastro, HTTPException, get_db_connection, Depends
from Backend.Jornada.JornadaCadastro import _persistir_calendario, _persistir_config_semanal, _format_time_value
import sqlite3

@app.put(prefixo_cadastro + "/editar/{cad_id}", tags=["Jornadas"])
def editar_jornada(cad_id: int, ponto: CadastroPonto, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Atualiza os dados de uma jornada de trabalho existente. """
    try:
        cur = con.cursor()
        cur.execute("SELECT usu_id FROM CADASTRO_PONTOS WHERE cad_id = ?", (cad_id,))
        jornada_existente = cur.fetchone()

        if not jornada_existente:
            raise HTTPException(status_code=404, detail=f"Jornada com ID {cad_id} não encontrada.")

        tolerancia_entrada = ponto.cad_ponto_tolerancia_min or 0
        tolerancia_saida = ponto.cad_ponto_tolerancia_saida_min or 0
        tempo_pausa = ponto.cad_ponto_tempo_pausa_min or 0
        inicio_almoco = _format_time_value(ponto.cad_ponto_inicio_almoco)
        fechamento_dia = _format_time_value(ponto.cad_ponto_fechamento_dia)

        cur.execute("""
            UPDATE CADASTRO_PONTOS SET
                cad_ponto_nome = ?,
                cad_ponto_codigo = ?,
                cad_ponto_descricao = ?,
                cad_ponto_tipo = ?,
                cad_ponto_carga_diaria = ?,
                cad_ponto_carga_semanal = ?,
                cad_ponto_dias_trabalho = ?,
                cad_ponto_inicio = ?, 
                cad_ponto_fim = ?,
                cad_ponto_pausa = ?, 
                cad_ponto_tempo_pausa_min = ?,
                cad_ponto_inicio_almoco = ?, 
                cad_ponto_tolerancia_min = ?,
                cad_ponto_tolerancia_saida_min = ?,
                cad_ponto_fechamento_dia = ?,
                cad_ponto_falta_parcial_auto = ?,
                cad_ponto_dias_semana = ?,
                cad_ponto_facial_required = ?,
                cad_ponto_gps_enabled = ?,
                cad_ponto_gps_center_lat = ?,
                cad_ponto_gps_center_lng = ?,
                cad_ponto_gps_radius_m = ?
            WHERE cad_id = ?
        """,
        (
            ponto.cad_ponto_nome,
            ponto.cad_ponto_codigo,
            ponto.cad_ponto_descricao,
            ponto.cad_ponto_tipo,
            ponto.cad_ponto_carga_diaria,
            ponto.cad_ponto_carga_semanal,
            ponto.cad_ponto_dias_trabalho,
            ponto.cad_ponto_inicio.strftime('%H:%M:%S'),
            ponto.cad_ponto_fim.strftime('%H:%M:%S'),
            ponto.cad_ponto_pausa,
            tempo_pausa,
            inicio_almoco,
            tolerancia_entrada,
            tolerancia_saida,
            fechamento_dia,
            ponto.cad_ponto_falta_parcial_auto,
            ponto.cad_ponto_dias_semana,
            1 if ponto.cad_ponto_facial_required else 0,
            1 if ponto.cad_ponto_gps_enabled else 0,
            ponto.cad_ponto_gps_center_lat,
            ponto.cad_ponto_gps_center_lng,
            ponto.cad_ponto_gps_radius_m,
            cad_id
        ))

        cur.execute("DELETE FROM JORNADA_CALENDARIO WHERE cad_id = ?", (cad_id,))
        _persistir_config_semanal(cur, cad_id, ponto.config_semanal or {})
        _persistir_calendario(cur, cad_id, ponto.calendario_aplicacao or [])
        con.commit()
        return {"mensagem": f"Jornada com ID {cad_id} atualizada com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro detalhado ao editar jornada: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao editar jornada: {e}")