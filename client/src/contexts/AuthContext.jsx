import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hoh_token');
    if (token) {
      authApi.me()
        .then(u => setUser(u))
        .catch(() => {
          localStorage.removeItem('hoh_token');
          localStorage.removeItem('hoh_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('hoh_token', token);
    localStorage.setItem('hoh_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('hoh_token');
    localStorage.removeItem('hoh_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isStaff: user?.role === 'admin' || user?.role === 'staff', isModel: user?.role === 'model' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
