import { AUTH_API_URL } from '../api/api';

export const login = async (email, senha) => {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usu_email: email, usu_senha: senha })
  });
  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Falha no login');
  }
  return response.json();
};
