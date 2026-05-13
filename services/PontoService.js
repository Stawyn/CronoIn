// src/services/PontoService.js
import { JORNADA_API_URL } from '../api/api'; // ATUALIZADO

/**
 * Busca a lista de todas as jornadas de trabalho.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de pontos.
 */
export const listarPontos = async () => {
  try {
    const response = await fetch(`${JORNADA_API_URL}/listar`); // ATUALIZADO
    if (!response.ok) {
      throw new Error('Erro na resposta da rede.');
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao listar pontos:", error);
    throw error;
  }
};

/**
 * Deleta uma jornada de trabalho pelo seu ID.
 * @param {number} id - O ID do ponto a ser deletado.
 * @returns {Promise<Object>} Uma promessa que resolve para a mensagem de sucesso.
 */
export const deletarPonto = async (id) => {
  console.log(`[PontoService] A função deletarPonto foi chamada com o ID: ${id}`);
  
  try {
    const url = `${JORNADA_API_URL}/deletar/${id}`; // ATUALIZADO
    console.log(`[PontoService] Enviando requisição DELETE para: ${url}`);

    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.detail || 'Erro ao deletar ponto.');
    }
    return await response.json();
  } catch (error) {
    console.error("Erro dentro de deletarPonto:", error);
    throw error;
  }
};

/**
 * Cadastra uma nova jornada de trabalho.
 * @param {Object} dadosPonto - Os dados do ponto a ser cadastrado.
 * @returns {Promise<Object>} Uma promessa que resolve para a mensagem de sucesso.
 */
export const cadastrarPonto = async (dadosPonto) => {
  try {
    const response = await fetch(`${JORNADA_API_URL}/cadastrar`, { // ATUALIZADO
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosPonto),
    });
    if (!response.ok) {
      let detail = 'Erro ao cadastrar ponto.';
      try {
        const text = await response.text();
        detail = text ? (JSON.parse(text).detail || text) : detail;
      } catch {}
      throw new Error(detail);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao cadastrar ponto:", error);
    throw error;
  }
};

/**
 * Edita uma jornada de trabalho existente.
 * @param {number} id - O ID do ponto a ser editado.
 * @param {Object} dadosPonto - Os novos dados do ponto.
 * @returns {Promise<Object>} Uma promessa que resolve para a mensagem de sucesso.
 */
export const editarPonto = async (id, dadosPonto) => {
  try {
    const response = await fetch(`${JORNADA_API_URL}/editar/${id}`, { // ATUALIZADO
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosPonto),
    });
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.detail || 'Erro ao editar ponto.');
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao editar ponto:", error);
    throw error;
  }
};
