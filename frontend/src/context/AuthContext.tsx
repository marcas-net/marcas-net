import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/authService';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  bio?: string | null;
  headline?: string | null;
  skills?: string[];
  country?: string | null;
  avatarUrl?: string | null;
  organizationId?: string | null;
  organization?: { id: string; name: string; type: string } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string, dateOfBirth?: string, country?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (email: string, password: string, name: string, role?: string, dateOfBirth?: string, country?: string) => {
    const res = await authService.register({ email, password, name, role, dateOfBirth: dateOfBirth!, country });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const fresh: User = res.data.user;
      localStorage.setItem('user', JSON.stringify(fresh));
      setUser(fresh);
    } catch {
      // If refresh fails, keep existing user state
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};