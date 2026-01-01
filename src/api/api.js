// src/services/seuipservice.js

// Coloque o IP da máquina onde o backend (FastAPI) está rodando.
// exemplo: '192.255.255.255:8000'
const IP = 'seu_ip:8000'; 
export const API_BASE_URL = `http://${IP}`;

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
