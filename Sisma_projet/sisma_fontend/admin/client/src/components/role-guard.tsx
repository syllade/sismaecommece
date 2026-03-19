import type { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";

type AdminRole = "admin" | "super_admin";

export function RoleGuard({
  roles,
  children,
  fallback = null,
}: {
  roles: AdminRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <>{fallback}</>;
  if (!roles.includes(user.role as AdminRole)) return <>{fallback}</>;
  return <>{children}</>;
}

