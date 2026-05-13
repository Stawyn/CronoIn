from datetime import date, datetime
import json
import sqlite3
from typing import Any

from Backend.main import (
    app,
    prefixo_usuario,
    HTTPException,
    get_db_connection,
    Depends,
    CadastroUsuarioCompleto,
    EditarUsuarioCompleto,
    pwd_context
)
from Backend.Usuario.UsuarioCadastro import inserir_usuario_basico
from Backend.utils.media import save_base64_image, generate_face_signature

FACE_ERROR_MESSAGES = {
    "EMPTY_DATA": "Imagem facial ausente.",
    "INVALID_IMAGE": "Imagem facial inválida.",
    "FACE_NOT_FOUND": "Nenhum rosto foi detectado na imagem enviada."
}


def _face_error_message(exc: ValueError) -> str:
    return FACE_ERROR_MESSAGES.get(str(exc), "Não foi possível processar a biometria facial.")


@app.post(prefixo_usuario + "/cadastro-completo", status_code=201, tags=["Usuários"])
def cadastrar_usuario_completo(payload: CadastroUsuarioCompleto, con: sqlite3.Connection = Depends(get_db_connection)):
    cur = con.cursor()
    try:
        face_signature = None
        if payload.usuario.usu_foto_base64:
            try:
                face_signature = generate_face_signature(payload.usuario.usu_foto_base64)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=_face_error_message(exc)) from exc

        usu_id = inserir_usuario_basico(payload.usuario, con)
        cad_id = None

        if payload.jornada:
            if payload.jornada.modo != 'existente':
                raise HTTPException(status_code=400, detail="Selecione uma jornada existente ao cadastrar o usuário.")
            if not payload.jornada.cad_id:
                raise HTTPException(status_code=400, detail="Informe o ID da jornada existente.")
            cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ?", (payload.jornada.cad_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Jornada selecionada não encontrada.")
            cad_id = payload.jornada.cad_id
            cur.execute(
                """
                INSERT INTO USUARIO_JORNADA (usu_id, cad_id, uj_data_inicio, uj_ativo)
                VALUES (?, ?, ?, 1)
                """,
                (usu_id, cad_id, date.today())
            )
            cur.execute("UPDATE USUARIOS SET usu_jornada_padrao_id = ? WHERE usu_id = ?", (cad_id, usu_id))

        if payload.extras or payload.preferencias or face_signature:
            extras_payload = payload.extras
            dados_pessoais = extras_payload.dados_pessoais if extras_payload and extras_payload.dados_pessoais else None
            dados_trabalhistas = extras_payload.dados_trabalhistas if extras_payload and extras_payload.dados_trabalhistas else None
            config_ponto = extras_payload.config_ponto if extras_payload and extras_payload.config_ponto else None
            biometria_acesso = extras_payload.biometria_acesso if extras_payload and extras_payload.biometria_acesso else None
            documentos = extras_payload.documentos if extras_payload and extras_payload.documentos else None

            if face_signature:
                biometria_acesso = {**(biometria_acesso or {}), **face_signature}

            preferencias = payload.preferencias if payload.preferencias else None

            cur.execute(
                """
                INSERT OR REPLACE INTO USUARIO_EXTRAS (
                    usu_id, dados_pessoais, dados_trabalhistas, config_ponto,
                    biometria_acesso, documentos, preferencias, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    usu_id,
                    json.dumps(dados_pessoais) if dados_pessoais else None,
                    json.dumps(dados_trabalhistas) if dados_trabalhistas else None,
                    json.dumps(config_ponto) if config_ponto else None,
                    json.dumps(biometria_acesso) if biometria_acesso else None,
                    json.dumps(documentos) if documentos else None,
                    json.dumps(preferencias) if preferencias else None,
                    datetime.now(),
                    datetime.now()
                )
            )

        con.commit()
        return {
            "mensagem": "Usuário e configurações cadastrados com sucesso!",
            "usu_id": usu_id,
            "cad_id": cad_id
        }
    except HTTPException:
        con.rollback()
        raise
    except sqlite3.IntegrityError as exc:
        con.rollback()
        raise HTTPException(status_code=400, detail=f"Erro de integridade: {exc}")
    except Exception as exc:
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao cadastrar fluxo completo: {exc}")


@app.put(prefixo_usuario + "/editar-completo/{usu_id}", tags=["Usuários"])
def editar_usuario_completo(usu_id: int, payload: EditarUsuarioCompleto, con: sqlite3.Connection = Depends(get_db_connection)):
    cur = con.cursor()
    try:
        cur.execute("SELECT usu_id FROM USUARIOS WHERE usu_id = ?", (usu_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Usuário com ID {usu_id} não encontrado.")

        face_signature = None
        campos = [
            "usu_nome = ?",
            "usu_email = ?",
            "usu_telefone = ?",
            "usu_departamento = ?",
            "usu_permissao = ?",
            "usu_ativo = ?"
        ]
        valores: list[Any] = [
            payload.usuario.usu_nome,
            payload.usuario.usu_email,
            payload.usuario.usu_telefone,
            payload.usuario.usu_departamento,
            payload.usuario.usu_permissao,
            1 if payload.usuario.usu_ativo else 0
        ]

        if payload.usuario.nova_senha:
            senha = payload.usuario.nova_senha
            senha_bytes = senha.encode('utf-8')
            if len(senha_bytes) > 72:
                senha = senha_bytes[:72].decode('utf-8', 'ignore')
            senha_hash = pwd_context.hash(senha)
            campos.append("usu_senha_hash = ?")
            valores.append(senha_hash)

        if payload.usuario.usu_foto_base64:
            try:
                face_signature = generate_face_signature(payload.usuario.usu_foto_base64)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=_face_error_message(exc)) from exc
            try:
                foto_url = save_base64_image(payload.usuario.usu_foto_base64, prefix=payload.usuario.usu_nome)
            except ValueError:
                raise HTTPException(status_code=400, detail="Imagem facial inválida. Envie um base64 válido.")
            campos.append("usu_foto_url = ?")
            valores.append(foto_url)

        cur.execute(f"UPDATE USUARIOS SET {', '.join(campos)} WHERE usu_id = ?", (*valores, usu_id))

        if payload.jornada:
            if payload.jornada.modo != 'existente':
                raise HTTPException(status_code=400, detail="Selecione uma jornada existente para o usuário.")
            if not payload.jornada.cad_id:
                raise HTTPException(status_code=400, detail="Informe o ID da jornada existente.")
            cur.execute("SELECT cad_id FROM CADASTRO_PONTOS WHERE cad_id = ?", (payload.jornada.cad_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Jornada selecionada não encontrada.")
            cur.execute("UPDATE USUARIO_JORNADA SET uj_ativo = 0 WHERE usu_id = ?", (usu_id,))
            cur.execute(
                """
                INSERT INTO USUARIO_JORNADA (usu_id, cad_id, uj_data_inicio, uj_ativo)
                VALUES (?, ?, ?, 1)
                """,
                (usu_id, payload.jornada.cad_id, date.today())
            )
            cur.execute("UPDATE USUARIOS SET usu_jornada_padrao_id = ? WHERE usu_id = ?", (payload.jornada.cad_id, usu_id))

        extras_payload = payload.extras
        preferencias_payload = payload.preferencias
        if extras_payload or preferencias_payload or face_signature:
            now = datetime.now()
            cur.execute(
                """
                SELECT dados_pessoais, dados_trabalhistas, config_ponto,
                       biometria_acesso, documentos, preferencias, created_at
                FROM USUARIO_EXTRAS
                WHERE usu_id = ?
                """,
                (usu_id,)
            )
            existente = cur.fetchone()

            def _parse(blob):
                if blob is None:
                    return None
                try:
                    return json.loads(blob)
                except json.JSONDecodeError:
                    return None

            created_at = existente["created_at"] if existente and existente["created_at"] else now
            dados_pessoais_exist = _parse(existente["dados_pessoais"]) if existente else None
            dados_trabalhistas_exist = _parse(existente["dados_trabalhistas"]) if existente else None
            config_ponto_exist = _parse(existente["config_ponto"]) if existente else None
            biometria_exist = _parse(existente["biometria_acesso"]) if existente else None
            documentos_exist = _parse(existente["documentos"]) if existente else None
            preferencias_exist = _parse(existente["preferencias"]) if existente else None

            def _pick(new_value, existing_value):
                if new_value is not None:
                    return new_value
                return existing_value

            dados_pessoais = _pick(extras_payload.dados_pessoais if extras_payload else None, dados_pessoais_exist)
            dados_trabalhistas = _pick(extras_payload.dados_trabalhistas if extras_payload else None, dados_trabalhistas_exist)
            config_ponto = _pick(extras_payload.config_ponto if extras_payload else None, config_ponto_exist)
            biometria_acesso = _pick(extras_payload.biometria_acesso if extras_payload else None, biometria_exist)
            documentos = _pick(extras_payload.documentos if extras_payload else None, documentos_exist)
            preferencias = _pick(preferencias_payload, preferencias_exist)

            if face_signature:
                biometria_acesso = {**(biometria_acesso or {}), **face_signature}

            def _dump(data: Any):
                return json.dumps(data) if data is not None else None

            cur.execute(
                """
                INSERT INTO USUARIO_EXTRAS (
                    usu_id, dados_pessoais, dados_trabalhistas, config_ponto,
                    biometria_acesso, documentos, preferencias, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(usu_id) DO UPDATE SET
                    dados_pessoais = excluded.dados_pessoais,
                    dados_trabalhistas = excluded.dados_trabalhistas,
                    config_ponto = excluded.config_ponto,
                    biometria_acesso = excluded.biometria_acesso,
                    documentos = excluded.documentos,
                    preferencias = excluded.preferencias,
                    updated_at = excluded.updated_at
                """,
                (
                    usu_id,
                    _dump(dados_pessoais),
                    _dump(dados_trabalhistas),
                    _dump(config_ponto),
                    _dump(biometria_acesso),
                    _dump(documentos),
                    _dump(preferencias),
                    created_at,
                    now
                )
            )

        con.commit()
        return {"mensagem": "Usuário atualizado com sucesso!", "usu_id": usu_id}
    except HTTPException:
        con.rollback()
        raise
    except sqlite3.IntegrityError as exc:
        con.rollback()
        raise HTTPException(status_code=400, detail=f"Erro de integridade: {exc}")
    except Exception as exc:
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao editar fluxo completo: {exc}")