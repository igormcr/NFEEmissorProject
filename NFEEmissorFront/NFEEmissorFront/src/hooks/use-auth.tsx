import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getCurrentUser, login, register, type AuthUser } from '@/lib/auth-api';
import { authStorage } from '@/lib/auth-storage';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authStorage.getToken().then(async (token) => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        setUser(await getCurrentUser());
      } catch {
        await authStorage.clear();
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    signIn: async (email, password) => {
      const result = await login(email, password);
      await authStorage.setToken(result.token);
      setUser(result.user);
    },
    signUp: async (name, email, password) => {
      const result = await register(name, email, password);
      await authStorage.setToken(result.token);
      setUser(result.user);
    },
    signOut: async () => {
      await authStorage.clear();
      setUser(null);
    },
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
