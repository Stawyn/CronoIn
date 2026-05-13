import json
from datetime import date, datetime
from typing import Optional

import sqlite3

from Backend.main import app, prefixo_registro, HTTPException, BaseModel, get_db_connection, Depends
from Backend.utils.media import (
    save_base64_image,
    compare_with_saved_image,
    generate_face_signature,
    compare_face_signatures,
    CAPTURES_SUBDIR,
)

FACE_ERROR_MESSAGES = {
    "EMPTY_DATA": "Imagem facial ausente.",
    "INVALID_IMAGE": "Imagem facial inválida. Garanta que o arquivo foi capturado corretamente.",
    "FACE_NOT_FOUND": "Não detectamos um rosto claro na imagem enviada. Ajuste iluminação e enquadramento e tente novamente.",
}


def _face_error_message(code: str) -> str:
    return FACE_ERROR_MESSAGES.get(code, "Não foi possível processar a biometria facial enviada.")

class MarcarPontoRequest(BaseModel):
    tipo: str
    usu_id: int
    cad_id: Optional[int] = None
    metadata: Optional[dict] = None

mapeamento_tipo_coluna = {
    "Entrada": "ponto_entrada",
    "Inicio Intervalo": "ponto_saida_almoco",
    "Início Intervalo": "ponto_saida_almoco",
    "Fim Intervalo": "ponto_volta_almoco",
    "Saida": "ponto_saida",
    "Saída": "ponto_saida",
}

mapeamento_tipo_status = {
    "Entrada": "ponto_entrada_status",
    "Inicio Intervalo": "ponto_saida_almoco_status",
    "Início Intervalo": "ponto_saida_almoco_status",
    "Fim Intervalo": "ponto_volta_almoco_status",
    "Saida": "ponto_saida_status",
    "Saída": "ponto_saida_status",
}


def _aplicar_metadata(cur: sqlite3.Cursor, usu_id: int, data_str: str, metadata: Optional[dict]):
    if not metadata:
        return
    updates = []
    params = []

    facial = metadata.get('facial') if isinstance(metadata, dict) else None
    if facial:
        updates.extend(["facial_status = ?", "facial_match_score = ?", "facial_evidence_url = ?"])
        params.extend([
            facial.get('status'),
            facial.get('matchScore'),
            facial.get('evidenceUrl')
        ])

    gps = metadata.get('gps') if isinstance(metadata, dict) else None
    if gps:
        updates.extend(["gps_status = ?", "gps_distance_m = ?", "gps_coords = ?", "gps_evidence_url = ?"])
        params.extend([
            gps.get('status'),
            gps.get('distance'),
            gps.get('coordsLabel') or gps.get('coords'),
            gps.get('evidenceUrl')
        ])

    if updates:
        query = f"UPDATE REGISTRO_PONTOS SET {', '.join(updates)} WHERE usu_id = ? AND ponto_data = ?"
        cur.execute(query, (*params, usu_id, data_str))

    observacao_extra = []
    device = metadata.get('device') if isinstance(metadata, dict) else None
    if device:
        observacao_extra.append(f"Device: {device}")
    client_time = metadata.get('deviceTime') if isinstance(metadata, dict) else None
    if client_time:
        observacao_extra.append(f"DeviceTime: {client_time}")

    if observacao_extra:
        cur.execute(
            "UPDATE REGISTRO_PONTOS SET ponto_observacao = TRIM(COALESCE(ponto_observacao, '') || ?) WHERE usu_id = ? AND ponto_data = ?",
            ("\n" + " | ".join(observacao_extra), usu_id, data_str)
        )


@app.post(prefixo_registro + "/marcar", status_code=200, tags=["Registros de Ponto"])
def marcar_ponto_individual(marca: MarcarPontoRequest, con: sqlite3.Connection = Depends(get_db_connection)):
    """ Registra uma marcação de ponto para o dia atual. """
    try:
        cur = con.cursor()
        hoje_str = date.today().strftime('%Y-%m-%d')
        agora = datetime.now()

        # Verifica se o usuário existe
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (marca.usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {marca.usu_id} não encontrado.")

        # Se cad_id foi fornecido, verifica se a jornada existe e pertence ao usuário
        if marca.cad_id:
            cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ? AND usu_id = ?", (marca.cad_id, marca.usu_id))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail=f"Jornada com ID {marca.cad_id} não encontrada ou não pertence ao usuário {marca.usu_id}.")
        else:
            # Se não forneceu cad_id, busca a jornada mais recente do usuário
            cur.execute("""
                SELECT cad_id FROM CADASTRO_PONTOS 
                WHERE usu_id = ? 
                ORDER BY cad_info_data_criacao DESC LIMIT 1
            """, (marca.usu_id,))
            jornada_usuario = cur.fetchone()
            if jornada_usuario:
                marca.cad_id = jornada_usuario[0]
            else:
                raise HTTPException(status_code=404, detail=f"Usuário {marca.usu_id} não possui nenhuma jornada cadastrada. Cadastre uma jornada primeiro.")

        if marca.tipo not in mapeamento_tipo_coluna:
            raise HTTPException(status_code=400, detail=f"Tipo de marcação inválido: '{marca.tipo}'")

        coluna_a_atualizar = mapeamento_tipo_coluna[marca.tipo]
        coluna_status = mapeamento_tipo_status[marca.tipo]

        # Busca o registro do usuário para o dia de hoje
        cur.execute("SELECT ponto_id FROM REGISTRO_PONTOS WHERE usu_id = ? AND ponto_data = ?", (marca.usu_id, hoje_str))
        registro_hoje = cur.fetchone()

        if registro_hoje:
            query = f"UPDATE REGISTRO_PONTOS SET {coluna_a_atualizar} = ?, {coluna_status} = ? WHERE usu_id = ? AND ponto_data = ?"
            cur.execute(query, (agora, 'MARCADO', marca.usu_id, hoje_str))
        else:
            status = 'Incompleto'
            query = f"INSERT INTO REGISTRO_PONTOS (usu_id, cad_id, ponto_data, {coluna_a_atualizar}, {coluna_status}, ponto_status) VALUES (?, ?, ?, ?, ?, ?)"
            cur.execute(query, (marca.usu_id, marca.cad_id, hoje_str, agora, 'MARCADO', status))

        _aplicar_metadata(cur, marca.usu_id, hoje_str, marca.metadata)

        # Atualiza status para 'Completo' quando todas as marcações necessárias existirem
        cur.execute("SELECT cad_ponto_pausa, cad_ponto_tempo_pausa_min FROM CADASTRO_PONTOS WHERE cad_id = ?", (marca.cad_id,))
        jornada_cfg = cur.fetchone()
        if jornada_cfg:
            pausa_habilitada = bool(jornada_cfg[0]) and (jornada_cfg[1] or 0) > 0
            cur.execute(
                """
                SELECT ponto_entrada, ponto_saida_almoco, ponto_volta_almoco, ponto_saida
                FROM REGISTRO_PONTOS WHERE usu_id = ? AND ponto_data = ?
                """,
                (marca.usu_id, hoje_str)
            )
            r = cur.fetchone()
            if r:
                entrada_ok = r[0] is not None
                saida_ok = r[3] is not None
                if pausa_habilitada:
                    pausa_ok = (r[1] is not None) and (r[2] is not None)
                    completo = entrada_ok and pausa_ok and saida_ok
                else:
                    completo = entrada_ok and saida_ok
                if completo:
                    cur.execute(
                        "UPDATE REGISTRO_PONTOS SET ponto_status = ? WHERE usu_id = ? AND ponto_data = ?",
                        ('Completo', marca.usu_id, hoje_str)
                    )

        con.commit()
        return {"mensagem": f"Ponto de '{marca.tipo}' registrado com sucesso para o usuário {marca.usu_id}!"}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Erro de banco de dados: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao marcar ponto: {e}")



class PularPontoRequest(MarcarPontoRequest):
    motivo: Optional[str] = None


@app.post(prefixo_registro + "/skip", status_code=200, tags=["Registros de Ponto"])
def pular_ponto(marca: PularPontoRequest, con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()
        hoje_str = date.today().strftime('%Y-%m-%d')

        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (marca.usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {marca.usu_id} não encontrado.")

        if marca.cad_id:
            cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ? AND usu_id = ?", (marca.cad_id, marca.usu_id))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail=f"Jornada com ID {marca.cad_id} não encontrada ou não pertence ao usuário {marca.usu_id}.")
        else:
            cur.execute("""
                SELECT cad_id FROM CADASTRO_PONTOS 
                WHERE usu_id = ? 
                ORDER BY cad_info_data_criacao DESC LIMIT 1
            """, (marca.usu_id,))
            jornada_usuario = cur.fetchone()
            if jornada_usuario:
                marca.cad_id = jornada_usuario[0]
            else:
                raise HTTPException(status_code=404, detail=f"Usuário {marca.usu_id} não possui nenhuma jornada cadastrada. Cadastre uma jornada primeiro.")

        if marca.tipo not in mapeamento_tipo_coluna:
            raise HTTPException(status_code=400, detail=f"Tipo de marcação inválido: '{marca.tipo}'")

        coluna_a_atualizar = mapeamento_tipo_coluna[marca.tipo]
        coluna_status = mapeamento_tipo_status[marca.tipo]

        cur.execute("SELECT ponto_id, {coluna}, {coluna_status} FROM REGISTRO_PONTOS WHERE usu_id = ? AND ponto_data = ?".format(
            coluna=coluna_a_atualizar,
            coluna_status=coluna_status
        ), (marca.usu_id, hoje_str))
        registro = cur.fetchone()

        if registro and registro[1] is not None:
            raise HTTPException(status_code=400, detail=f"O ponto '{marca.tipo}' já foi marcado e não pode ser pulado.")

        if registro:
            cur.execute(
                f"UPDATE REGISTRO_PONTOS SET {coluna_status} = ? WHERE usu_id = ? AND ponto_data = ?",
                ('PULADO', marca.usu_id, hoje_str)
            )
        else:
            status = 'Incompleto'
            cur.execute(
                f"INSERT INTO REGISTRO_PONTOS (usu_id, cad_id, ponto_data, {coluna_status}, ponto_status) VALUES (?, ?, ?, ?, ?)",
                (marca.usu_id, marca.cad_id, hoje_str, 'PULADO', status)
            )

        _aplicar_metadata(cur, marca.usu_id, hoje_str, marca.metadata)

        if marca.motivo:
            cur.execute(
                "UPDATE REGISTRO_PONTOS SET ponto_observacao = COALESCE(ponto_observacao, '') || ? WHERE usu_id = ? AND ponto_data = ?",
                (f"\n[{marca.tipo}] Ponto pulado. Motivo: {marca.motivo}", marca.usu_id, hoje_str)
            )

        con.commit()
        return {"mensagem": f"Ponto de '{marca.tipo}' marcado como pulado para o usuário {marca.usu_id}."}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Erro de banco de dados: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao pular ponto: {e}")


class FacialVerifyRequest(BaseModel):
    usu_id: int
    captura_base64: str
    minimo_match: Optional[float] = 70.0


@app.post(prefixo_registro + "/facial/verify", tags=["Registros de Ponto"])
def verificar_facial(payload: FacialVerifyRequest, con: sqlite3.Connection = Depends(get_db_connection)):
    try:
        cur = con.cursor()
        cur.execute(
            """
            SELECT u.usu_foto_url, e.biometria_acesso
            FROM USUARIOS u
            LEFT JOIN USUARIO_EXTRAS e ON e.usu_id = u.usu_id
            WHERE u.usu_id = ?
            """,
            (payload.usu_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuário não encontrado para verificação facial.")

        foto_url = row[0]
        biometria_raw = row[1]
        biometria = None
        if biometria_raw:
            try:
                biometria = json.loads(biometria_raw)
            except json.JSONDecodeError:
                biometria = None

        assinatura_captura = None
        assinatura_erro = None
        try:
            assinatura_captura = generate_face_signature(payload.captura_base64)
        except ValueError as exc:
            assinatura_erro = str(exc)
            if assinatura_erro != "FACE_NOT_FOUND":
                raise HTTPException(status_code=400, detail=_face_error_message(assinatura_erro)) from exc

        captura_encoding = assinatura_captura.get('face_encoding') if assinatura_captura else None
        captura_hash = assinatura_captura.get('face_hash') if assinatura_captura else None
        faces_detected = assinatura_captura.get('faces_detected') if assinatura_captura else 0

        similarity = 0.0
        strategy = None
        detail_message = None
        minimo_match = payload.minimo_match or 70.0

        if biometria and isinstance(biometria, dict) and biometria.get('face_encoding') and captura_encoding is not None:
            similarity = compare_face_signatures(biometria.get('face_encoding'), captura_encoding)
            strategy = 'hash-encoding'
            detail_message = 'Assinatura biométrica comparada com sucesso.'
        elif biometria and isinstance(biometria, dict) and biometria.get('face_hash') and captura_hash is not None:
            similarity = 100.0 if biometria.get('face_hash') == captura_hash else 0.0
            strategy = 'hash'
            detail_message = 'Hash facial comparado com sucesso.'
        elif foto_url:
            similarity = compare_with_saved_image(payload.captura_base64, foto_url)
            strategy = 'image'
            if assinatura_erro == "FACE_NOT_FOUND":
                detail_message = "Não foi possível extrair assinatura biométrica da captura. Utilizamos a foto cadastrada como referência."
            else:
                detail_message = 'Comparação realizada usando a foto cadastrada do usuário.'
        else:
            if assinatura_erro == "FACE_NOT_FOUND":
                raise HTTPException(status_code=422, detail=_face_error_message(assinatura_erro))
            raise HTTPException(status_code=404, detail="Usuário não possui biometria cadastrada para verificação.")

        evid_subdir = f"{CAPTURES_SUBDIR}/{payload.usu_id}"
        try:
            evidence_url = save_base64_image(payload.captura_base64, prefix=f"facial_{payload.usu_id}", subdir=evid_subdir)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=_face_error_message(str(exc))) from exc

        aprovado = similarity >= minimo_match
        return {
            "approved": aprovado,
            "matchScore": similarity,
            "threshold": minimo_match,
            "evidenceUrl": evidence_url,
            "strategy": strategy or 'image',
            "message": detail_message,
            "facesDetected": faces_detected,
            "fallbackReason": assinatura_erro if assinatura_erro else None,
        }
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=_face_error_message(str(exc)))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Foto de referência não encontrada no servidor.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao verificar reconhecimento facial: {exc}")


