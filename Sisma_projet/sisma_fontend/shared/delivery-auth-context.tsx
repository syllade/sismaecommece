/**
 * Delivery Person Authentication Context
 * Provides authentication state and methods for the delivery person app
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

type DeliveryAuthContextValue = {
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

const DeliveryAuthContext = createContext<DeliveryAuthContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function DeliveryAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Refresh session from backend
  const refreshSession = useCallback(async () => {
    const token = getToken('delivery');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userData = await authApi.me('delivery');
      setUser(userData);
    } catch (error) {
      console.error('Session refresh failed:', error);
      clearToken('delivery');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  // Login function - uses driver-specific login endpoint
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const credentials: LoginCredentials = { email, password };
      const response: LoginResponse = await authApi.deliveryLogin(credentials);
      
      setUser(response.user);
      
      // Redirect to delivery dashboard after successful login
      setLocation('/livreur/deliveries');
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
      await authApi.logout('delivery');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      clearToken('delivery');
      setUser(null);
      setLocation('/livreur/login');
    }
  }, [setLocation]);

  // Check permissions
  const hasPermission = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role as UserRole);
  }, [user]);

  // Computed values
  const value = useMemo<DeliveryAuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
    hasPermission,
  }), [user, loading, login, logout, refreshSession, hasPermission]);

  return (
    <DeliveryAuthContext.Provider value={value}>
      {children}
    </DeliveryAuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useDeliveryAuth(): DeliveryAuthContextValue {
  const context = useContext(DeliveryAuthContext);
  if (!context) {
    throw new Error('useDeliveryAuth must be used within a DeliveryAuthProvider');
  }
  return context;
}

export default DeliveryAuthContext;
