import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { verifyToken } from '../utils/tokenUtils';

interface AuthUser {
  userId: number;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const payload = verifyToken(storedToken);
      if (payload) {
        setToken(storedToken);
        setUser({ userId: payload.userId, email: payload.email });
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (newToken: string) => {
    const payload = verifyToken(newToken);
    if (payload) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ userId: payload.userId, email: payload.email });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
