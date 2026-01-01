import React, { createContext, useContext, useState, useMemo } from 'react';
import { login as loginService } from '../services/LoginService';
import { setUserId } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);

  const login = async (email, senha) => {
    const data = await loginService(email, senha);
    setToken(data.token);
    setUsuario({ 
      id: data.usu_id, 
      nome: data.usu_nome, 
      email, 
      permissao: data.usu_permissao 
    });
    setUserId(data.usu_id);
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setUserId(null);
  };

  const value = useMemo(() => ({ token, usuario, login, logout, isAuthenticated: !!token }), [token, usuario]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
