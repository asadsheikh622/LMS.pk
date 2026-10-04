import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserSession } from '../types.ts';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string, requestedPortal?: 'STUDENT' | 'TEACHER' | 'ADMIN') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUserSession: (user: UserSession, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'lms_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session from token on mount
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (
    identifier: string,
    password: string,
    requestedPortal?: 'STUDENT' | 'TEACHER' | 'ADMIN'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, requestedPortal }),
      });

      let data: any = {};
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        }
      } catch (parseErr) {
        console.warn('Failed to parse auth response:', parseErr);
      }

      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed. Please check credentials.' };
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const setUserSession = (newUser: UserSession, newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
