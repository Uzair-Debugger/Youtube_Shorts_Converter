'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, tokenStorage, isTokenExpired, authApi, decodeJwtPayload } from '../lib/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken && !isTokenExpired(accessToken);

  const tryRefreshToken = useCallback(async (rt: string): Promise<boolean> => {
    try {
      const data = await authApi.refresh(rt);
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      tokenStorage.setAccessTokenCookie(data.accessToken);
      const decoded = decodeJwtPayload(data.accessToken);
      if (decoded) {
        setUser({ id: decoded.id, email: decoded.email, name: '' });
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
      }
      return !!decoded;
    } catch {
      tokenStorage.clearTokens();
      tokenStorage.clearAccessTokenCookie();
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedAccess = tokenStorage.getAccessToken();
      const storedRefresh = tokenStorage.getRefreshToken();

      if (storedAccess && !isTokenExpired(storedAccess)) {
        const decoded = decodeJwtPayload(storedAccess);
        if (decoded) {
          setUser({ id: decoded.id, email: decoded.email, name: '' });
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
        }
        setIsLoading(false);
        return;
      }

      if (storedRefresh) {
        const refreshed = await tryRefreshToken(storedRefresh);
        if (refreshed) {
          setIsLoading(false);
          return;
        }
      }

      tokenStorage.clearTokens();
      tokenStorage.clearAccessTokenCookie();
      setIsLoading(false);
    };

    initAuth();
  }, [tryRefreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      tokenStorage.setAccessTokenCookie(data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      await authApi.register(name, email, password);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    const rt = tokenStorage.getRefreshToken();
    if (rt) {
      try {
        await authApi.logout(rt);
      } catch {
        // Ignore logout API errors, proceed with client-side cleanup
      }
    }
    tokenStorage.clearTokens();
    tokenStorage.clearAccessTokenCookie();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, isLoading, isAuthenticated, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
