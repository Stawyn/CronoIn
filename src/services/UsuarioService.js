// src/services/UsuarioService.js
import { USUARIO_API_URL } from '../api/api';

const formatApiError = (detail) => {
  if (!detail) return 'Não foi possível concluir o cadastro completo.';
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => entry?.msg || entry?.detail || entry?.message || JSON.stringify(entry))
      .join('\n');
  }
  if (typeof detail === 'object') {
    return detail?.detail || detail?.msg || detail?.message || JSON.stringify(detail);
  }
  return detail;
};

/**
 * Busca a lista de todos os usuários cadastrados na API.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de usuários.
 */
export const listarUsuarios = async () => {
  try {
    const response = await fetch(`${USUARIO_API_URL}/listar`);
    if (!response.ok) {
      throw new Error('Erro na resposta da rede ao buscar usuários.');
    }
    return await response.json();
  } catch (error) {
    console.error("Erro em listarUsuarios:", error);
    throw error;
  }
};

/**
 * Busca os detalhes de um usuário específico pelo seu ID.
 * @param {number} id - O ID do usuário a ser buscado.
 * @returns {Promise<Object>} Uma promessa que resolve para os dados do usuário.
 */
export const buscarUsuarioPorId = async (id) => {
    try {
      const response = await fetch(`${USUARIO_API_URL}/${id}`);
      if (!response.ok) {
          if (response.status === 404) {
              throw new Error('Usuário não encontrado.');
          }
        throw new Error('Erro ao buscar detalhes do usuário.');
      }
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarUsuarioPorId:", error);
      throw error;
    }
  };

/**
 * Cadastra um novo usuário no sistema.
 * @param {Object} dadosUsuario - Os dados do usuário a serem cadastrados.
 * @returns {Promise<Object>} Uma promessa que resolve para a mensagem de sucesso da API.
 */
export const cadastrarUsuario = async (dadosUsuario) => {
  try {
    const response = await fetch(`${USUARIO_API_URL}/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosUsuario),
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.detail || 'Não foi possível concluir o cadastro.');
    }
    return await response.json();
  } catch (error) {
    console.error("Erro em cadastrarUsuario:", error);
    throw error;
  }
};

/**
 * Edita um usuário existente no sistema com todos os campos do fluxo completo.
 * @param {number} id - O ID do usuário a ser editado.
 * @param {Object} payload - Os novos dados do usuário.
 * @returns {Promise<Object>} Uma promessa que resolve para a mensagem de sucesso da API.
 */
export const editarUsuario = async (id, payload) => {
  try {
    const response = await fetch(`${USUARIO_API_URL}/editar-completo/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(formatApiError(erro.detail));
    }
    return await response.json();
  } catch (error) {
    console.error("Erro em editarUsuario:", error);
    throw error;
  }
};

/**
 * Deleta um usuário do sistema.
 * @param {number} id - O ID do usuário a ser deletado.
 * @returns {Promise<Object>} Uma promessa que resolve para a mensagem de sucesso da API.
 */
export const deletarUsuario = async (id) => {
  try {
    const response = await fetch(`${USUARIO_API_URL}/deletar/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.detail || 'Não foi possível deletar o usuário.');
    }
    return await response.json();
  } catch (error) {
    console.error("Erro em deletarUsuario:", error);
    throw error;
  }
};

export const listarOpcoesCadastro = async () => {
  try {
    const response = await fetch(`${USUARIO_API_URL}/opcoes-cadastro`);
    if (!response.ok) {
      throw new Error('Não foi possível carregar as opções do formulário.');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro em listarOpcoesCadastro:', error);
    throw error;
  }
};

export const cadastrarUsuarioCompleto = async (payload) => {
  try {
    const response = await fetch(`${USUARIO_API_URL}/cadastro-completo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(formatApiError(erro.detail));
    }
    return await response.json();
  } catch (error) {
    console.error('Erro em cadastrarUsuarioCompleto:', error);
    throw error;
  }
};
