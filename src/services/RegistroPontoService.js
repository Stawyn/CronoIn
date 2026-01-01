// src/services/RegistroPontoService.js
import { PONTO_API_URL, getUserId } from '../api/api';

const withCacheBuster = (url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Date.now()}`;
};

/**
 * Envia uma marcação de ponto individual para a API.
 * @param {string} tipoPonto - O tipo de ponto (ex: 'Entrada', 'Início Intervalo').
 * @param {number} cadId - Identificador da jornada vigente para validação no backend.
 * @returns {Promise<Object>} A resposta da API.
 */
export const marcarPontoIndividual = async (tipoPonto, cadId, extras = {}) => {
    try {
        const response = await fetch(`${PONTO_API_URL}/marcar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: tipoPonto, usu_id: getUserId(), cad_id: cadId, metadata: extras }),
        });
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao marcar ponto.');
        }
        return await response.json();
    } catch (error) {
        console.error("Erro no serviço ao marcar ponto:", error);
        throw error;
    }
};

/**
 * Busca o registro de pontos do dia atual na API.
 * @returns {Promise<Object|null>} O objeto com os registros do dia ou null se não houver.
 */
export const buscarRegistroDeHoje = async () => {
    try {
        const response = await fetch(withCacheBuster(`${PONTO_API_URL}/hoje`), {
            headers: { 'Cache-Control': 'no-cache' },
        });
        
        if (response.status === 404 || response.status === 204) {
            return null;
        }
        if (!response.ok) {
            throw new Error('Erro na resposta da rede ao buscar registro de hoje.');
        }
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error("Erro no serviço ao buscar registro de hoje:", error);
        throw error;
    }
};

export const listarRegistrosPonto = async () => {
    try {
        const response = await fetch(withCacheBuster(`${PONTO_API_URL}/listar`), {
            headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao listar registros de ponto.');
        }
        const registros = await response.json();
        return Array.isArray(registros) ? registros : [];
    } catch (error) {
        console.error('Erro ao listar registros de ponto:', error);
        throw error;
    }
};

export const obterHorarioServidor = async (timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(withCacheBuster(`${PONTO_API_URL}/servertime`), {
            headers: { 'Cache-Control': 'no-cache' },
            signal: controller.signal,
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`(${response.status}) ${body || 'Resposta inválida ao sincronizar com o servidor.'}`);
        }
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Timeout ao obter horário do servidor. Verifique se a API está acessível.');
            throw new Error('Tempo limite excedido tentando sincronizar com o servidor.');
        }
        console.error('Erro ao obter horário do servidor:', error);
        throw error;
    } finally {
        clearTimeout(timeout);
    }
};

export const pularPonto = async (tipoPonto, cadId, motivo = '', extras = {}) => {
    try {
        const response = await fetch(`${PONTO_API_URL}/skip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: tipoPonto, usu_id: getUserId(), cad_id: cadId, motivo, metadata: extras }),
        });
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao pular ponto.');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao pular ponto:', error);
        throw error;
    }
};

export const verificarFacial = async (capturaBase64, minimoMatch = 70, usuId = null) => {
    const idParaVerificar = usuId || getUserId();
    try {
        const response = await fetch(`${PONTO_API_URL}/facial/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usu_id: idParaVerificar,
                captura_base64: capturaBase64,
                minimo_match: minimoMatch,
            }),
        });
        if (!response.ok) {
            const erro = await response.json().catch(() => ({}));
            throw new Error(erro.detail || 'Falha ao verificar reconhecimento facial.');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro no serviço de verificação facial:', error);
        throw error;
    }
};
