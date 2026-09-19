import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('esebelink_user');
    const token = localStorage.getItem('esebelink_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persistSession(userData, token) {
    localStorage.setItem('esebelink_token', token);
    localStorage.setItem('esebelink_user', JSON.stringify(userData));
    setUser(userData);
  }

  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    persistSession(data.user, data.token);
    return data.user;
  }

  async function register(payload) {
    const { data } = await authApi.register(payload);
    persistSession(data.user, data.token);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('esebelink_token');
    localStorage.removeItem('esebelink_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
