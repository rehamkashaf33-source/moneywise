import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { api, baseURL, setToken } from '../api/client';
import { money as formatMoney } from '../utils/format';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

let restorePromise = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const start = useCallback((data) => { setToken(data.accessToken); setUser(data.user); }, []);

  
  useEffect(() => {
    restorePromise = restorePromise || axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
    restorePromise
      .then(({ data }) => start(data))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setTimeout(() => { restorePromise = null; }, 0); 
      });
  }, [start]);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    login: async (body) => start((await api.post('/auth/login', body)).data),
    register: async (body) => start((await api.post('/auth/register', body)).data),
    logout: async () => {
      try { await api.post('/auth/logout'); } finally { setToken(null); setUser(null); }
    },
    money: (n) => formatMoney(n, user?.currency),
  }), [user, loading, start]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}