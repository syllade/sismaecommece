/**
 * Role-Based Protected Route Component
 * This component ensures that only users with the correct role can access specific routes.
 * It also handles automatic redirection based on user role.
 */

import { useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { 
  AuthUser, 
  UserRole, 
  getCurrentUser, 
  getDefaultRouteForRole,
  hasRole 
} from './api-service';

export interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  loadingComponent?: ReactNode;
}

export function RoleProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = '/login',
  loadingComponent,
}: RoleProtectedRouteProps) {
  const [location, setLocation] = useLocation();
  const user = getCurrentUser();

  useEffect(() => {
    // No user - redirect to login
    if (!user) {
      setLocation(fallbackPath);
      return;
    }

    // Check if user has the required role
    if (!hasRole(user, allowedRoles)) {
      // User is authenticated but doesn't have the required role
      // Redirect to their default dashboard
      const defaultRoute = getDefaultRouteForRole(user.role as UserRole);
      setLocation(defaultRoute);
    }
  }, [user, allowedRoles, fallbackPath, setLocation]);

  // Show loading while checking
  if (!user) {
    return loadingComponent || (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sisma-red border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // User doesn't have required role - show access denied or redirect
  if (!hasRole(user, allowedRoles)) {
    return loadingComponent || (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-outfit text-2xl font-bold text-slate-900">Accès refusé</h1>
          <p className="mt-2 text-sm text-slate-500">
            Vous n'avez pas l'autorisation d'accéder à cette page.
          </p>
          <button
            onClick={() => setLocation(getDefaultRouteForRole(user.role as UserRole))}
            className="mt-6 inline-flex rounded-lg bg-sisma-red px-4 py-2 text-sm font-medium text-white hover:bg-sisma-red/90"
          >
            Retour à mon tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================
// Role-specific route guards
// ============================================

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      {children}
    </RoleProtectedRoute>
  );
}

export function SupplierRoute({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['supplier']}>
      {children}
    </RoleProtectedRoute>
  );
}

export function DeliveryRoute({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['delivery']}>
      {children}
    </RoleProtectedRoute>
  );
}

export function ClientRoute({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['client']}>
      {children}
    </RoleProtectedRoute>
  );
}

export function AdminOrSupplierRoute({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'supplier']}>
      {children}
    </RoleProtectedRoute>
  );
}

export function AnyAuthenticatedRoute({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'supplier', 'delivery', 'client']}>
      {children}
    </RoleProtectedRoute>
  );
}

// ============================================
// Navigation Helper
// ============================================

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    supplier: '/fournisseur/dashboard',
    delivery: '/livreur/deliveries',
    client: '/client/orders',
  };
  return paths[role] || '/login';
}

export function getLoginPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin: '/login',
    supplier: '/fournisseur/login',
    delivery: '/livreur/login',
    client: '/login',
  };
  return paths[role] || '/login';
}
