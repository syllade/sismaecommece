/**
 * Supplier Authentication Context
 * Provides authentication state and methods for the supplier panel
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

type SupplierAuthContextValue = {
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

const SupplierAuthContext = createContext<SupplierAuthContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function SupplierAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Refresh session from backend
  const refreshSession = useCallback(async () => {
    const token = getToken('supplier');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userData = await authApi.me('supplier');
      setUser(userData);
    } catch (error) {
      console.error('Session refresh failed:', error);
      clearToken('supplier');
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
      const response: LoginResponse = await authApi.supplierLogin(credentials);
      
      setUser(response.user);
      
      // Redirect to supplier dashboard after successful login
      setLocation('/fournisseur/dashboard');
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
      await authApi.logout('supplier');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      clearToken('supplier');
      setUser(null);
      setLocation('/fournisseur/login');
    }
  }, [setLocation]);

  // Check permissions
  const hasPermission = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role as UserRole);
  }, [user]);

  // Computed values
  const value = useMemo<SupplierAuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
    hasPermission,
  }), [user, loading, login, logout, refreshSession, hasPermission]);

  return (
    <SupplierAuthContext.Provider value={value}>
      {children}
    </SupplierAuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useSupplierAuth(): SupplierAuthContextValue {
  const context = useContext(SupplierAuthContext);
  if (!context) {
    throw new Error('useSupplierAuth must be used within a SupplierAuthProvider');
  }
  return context;
}

export default SupplierAuthContext; 
