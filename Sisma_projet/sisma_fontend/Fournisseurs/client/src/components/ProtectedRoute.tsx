import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  roles?: string[];
  fallback?: React.ReactNode;
};

export default function ProtectedRoute({ children, roles, fallback }: Props) {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [loading, user, location, setLocation]);

  if (loading) return <div>Chargement...</div>;
  if (!user) return null;
  if (roles && roles.length > 0 && !roles.includes(user.role || "")) return fallback ?? <div>Acces refuse</div>;

  return <>{children}</>;
}
