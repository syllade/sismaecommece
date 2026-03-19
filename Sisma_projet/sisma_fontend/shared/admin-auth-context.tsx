/**
 * Admin Authentication Context
 * Provides authentication state and methods for the admin panel
 * Integrates with Laravel backend via API
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { 
  AuthUser, 
  UserRole,
  getToken, 
  setToken, 
  clearToken,
  authApi,
  LoginCredentials,
  LoginResponse
} from './api-service';

// ============================================
// Types
// ============================================

type AuthContextValue = {
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

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Refresh session from backend
  const refreshSession = useCallback(async () => {
    const token = getToken('admin');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userData = await authApi.me('admin');
      setUser(userData);
    } catch (error) {
      console.error('Session refresh failed:', error);
      clearToken('admin');
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
      const response: LoginResponse = await authApi.adminLogin(credentials);
      
      setUser(response.user);
      
      // Redirect to admin dashboard after successful login
      setLocation('/admin/dashboard');
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
      await authApi.logout('admin');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      clearToken('admin');
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
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
    hasPermission,
  }), [user, loading, login, logout, refreshSession, hasPermission]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// ============================================
// HOC for protected components
// ============================================

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, hasPermission } = useAuth();

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sisma-red border-t-transparent mx-auto"></div>
            <p className="mt-4 text-sm text-slate-500">Chargement...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-500">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      );
    }

    if (allowedRoles && !hasPermission(allowedRoles)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-500">Vous n'avez pas l'autorisation d'accéder à cette page.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
