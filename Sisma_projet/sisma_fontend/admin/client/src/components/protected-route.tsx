import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";

type AdminRole = "admin" | "super_admin";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: AdminRole[];
}) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
      return;
    }

    if (!loading && user && roles && roles.length > 0 && !roles.includes(user.role as AdminRole)) {
      const fallback = user.role === "super_admin" ? "/super-admin/dashboard" : "/admin/dashboard";
      setLocation(fallback);
      return;
    }

    if (!loading && user) {
      if (user.role === "super_admin" && location.startsWith("/admin")) {
        setLocation("/super-admin/dashboard");
        return;
      }
      if (user.role === "admin" && location.startsWith("/super-admin")) {
        setLocation("/admin/dashboard");
      }
    }
  }, [loading, user, setLocation, location, roles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Verification de session...</p>
      </div>
    );
  }

  if (!user) return null;

  if (roles && roles.length > 0 && !roles.includes(user.role as AdminRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-red-600">Acces refuse.</p>
      </div>
    );
  }

  return <>{children}</>;
}
