// src/services/seuipservice.js

// Coloque o IP da máquina onde o backend (FastAPI) está rodando.
// exemplo: '192.255.255.255:8000'
const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const ENV_API_BASE_URL =
  typeof process !== 'undefined' && process.env
    ? process.env.EXPO_PUBLIC_API_URL
    : undefined;

export const API_BASE_URL = (ENV_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

if (
  API_BASE_URL.includes('.ngrok-free.app') &&
  typeof globalThis !== 'undefined' &&
  globalThis.fetch &&
  !globalThis.__cronoinNgrokFetchPatched
) {
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;

    if (url?.includes('.ngrok-free.app')) {
      const headers = new Headers(init.headers || input?.headers || {});
      headers.set('ngrok-skip-browser-warning', 'true');
      return originalFetch(input, { ...init, headers });
    }

    return originalFetch(input, init);
  };
  globalThis.__cronoinNgrokFetchPatched = true;
}

// URLs completas para cada recurso da API
export const JORNADA_API_URL = `${API_BASE_URL}/jornada`;
export const PONTO_API_URL = `${API_BASE_URL}/ponto`;
export const USUARIO_API_URL = `${API_BASE_URL}/usuario`;
export const AUTH_API_URL = `${API_BASE_URL}/auth`;

let currentUserId = 1;

export const setUserId = (id) => {
  currentUserId = id;
};

export const getUserId = () => currentUserId;

// Mantendo compatibilidade se algo importar diretamente (mas ideal é usar getUserId)
export const CURRENT_USER_ID = currentUserId; 
