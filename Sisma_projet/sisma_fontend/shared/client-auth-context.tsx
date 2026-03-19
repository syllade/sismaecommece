/**
 * Client Authentication Context
 * Provides authentication state and methods for the client app
 * Integrates with Laravel backend via API
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { 
  AuthUser, 
  UserRole,
  getToken, 
  clearToken,
  authApi,
  LoginCredentials,
  LoginResponse
} from './api-service';

// ============================================
// Types
// ============================================

type ClientAuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (roles: UserRole | UserRole[]) => boolean;
};

// ============================================
// Context
// ============================================

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Refresh session from backend
  const refreshSession = useCallback(async () => {
    const token = getToken('client');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userData = await authApi.me('client');
      setUser(userData);
    } catch (error) {
      console.error('Session refresh failed:', error);
      clearToken('client');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const credentials: LoginCredentials = { email, password };
      const response: LoginResponse = await authApi.clientLogin(credentials);
      
      setUser(response.user);
      
      // Redirect to client dashboard after successful login
      setLocation('/client/orders');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de la connexion';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authApi.logout('client');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      clearToken('client');
      setUser(null);
      setLocation('/login');
    }
  }, [setLocation]);

  // Check permissions
  const hasPermission = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role as UserRole);
  }, [user]);

  // Computed values
  const value = useMemo<ClientAuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
    hasPermission,
  }), [user, loading, login, logout, refreshSession, hasPermission]);

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useClientAuth(): ClientAuthContextValue {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}

export default ClientAuthContext;
