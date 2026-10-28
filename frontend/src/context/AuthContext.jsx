import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('safesense_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('safesense_token');
      localStorage.removeItem('safesense_user');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    setError(null);
    const data = await authAPI.login(email, password);
    localStorage.setItem('safesense_token', data.token);
    localStorage.setItem('safesense_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function signup(name, email, password) {
    setError(null);
    const data = await authAPI.signup(name, email, password);
    localStorage.setItem('safesense_token', data.token);
    localStorage.setItem('safesense_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('safesense_token');
    localStorage.removeItem('safesense_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
