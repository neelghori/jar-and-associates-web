'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken, getStoredUser, setStoredUser, setToken } from './api';
import { getHomePath } from './roles';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (stored) {
      setUser(stored);
      api.me()
        .then((res) => {
          setUser(res.user as User);
          setStoredUser(res.user);
        })
        .catch(() => {
          clearToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    setToken(res.token);
    setStoredUser(res.user);
    setUser(res.user as User);
    router.push(getHomePath(res.user as User));
  }

  function logout() {
    clearToken();
    setUser(null);
    router.push('/login');
  }

  async function refreshUser() {
    const res = await api.me();
    setUser(res.user as User);
    setStoredUser(res.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
