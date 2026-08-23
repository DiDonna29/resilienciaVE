'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/store/auth.store';
import authService from '@/core/services/auth.service';
import { LoginCredentials, RegisterData } from '@/core/models/user.interface';

export function useAuth() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);
      setAuth(response.user, response.tokens);
      return response;
    },
    [setAuth],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await authService.register(data);
      setAuth(response.user, response.tokens);
      return response;
    },
    [setAuth],
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      const response = await authService.googleLogin(credential);
      setAuth(response.user, response.tokens);
      return response;
    },
    [setAuth],
  );


  const logout = useCallback(() => {
    authService.logout();
    clearAuth();
    router.push('/');
  }, [clearAuth, router]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      updateUser(freshUser);
      return freshUser;
    } catch {
      logout();
    }
  }, [updateUser, logout]);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      callback();
    },
    [isAuthenticated, router],
  );

  return {
    user,
    tokens,
    isAuthenticated,
    login,
    register,
    googleLogin,
    logout,
    refreshUser,
    requireAuth,
  };
}
