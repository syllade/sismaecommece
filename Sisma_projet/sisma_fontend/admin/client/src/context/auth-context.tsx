import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  apiRequest,
  clearAdminSession,
  getStoredAdminUser,
  setAuthToken,
  setStoredAdminUser,
} from "@/lib/apiConfig";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(role: unknown): string {
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase().replace(/\s+/g, "_");
}

function isAdminRole(role: unknown): role is "admin" | "super_admin" {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "super_admin";
}

function normalizeUser(input: unknown): AuthUser | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const role = normalizeRole(raw.role);
  if (!isAdminRole(role)) return null;

  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? raw.username ?? ""),
    email: String(raw.email ?? raw.username ?? ""),
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAdminUser<AuthUser>());
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const userPayload = await apiRequest<AuthUser>("/api/auth/me");
      const normalized = normalizeUser(userPayload);
      if (!normalized) {
        clearAdminSession();
        setUser(null);
        setLocation("/login");
        return;
      }
      setStoredAdminUser(normalized);
      setUser(normalized);
    } catch {
      clearAdminSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const onSessionExpired = () => {
      setUser(null);
      setLocation("/login");
    };
    window.addEventListener("sisma:admin:auth-expired", onSessionExpired as EventListener);
    return () => {
      window.removeEventListener("sisma:admin:auth-expired", onSessionExpired as EventListener);
    };
  }, [setLocation]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const payload = await apiRequest<{ user?: unknown; token?: string; redirect_path?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, username: email, password }),
      });

      const normalizedUser = normalizeUser(payload.user);
      if (!normalizedUser) {
        clearAdminSession();
        throw new Error("Acces reserve au role admin.");
      }

      if (payload.token) {
        setAuthToken(payload.token);
      } else {
        throw new Error("Token de session manquant.");
      }

      setStoredAdminUser(normalizedUser);
      setUser(normalizedUser);
      const redirectPath =
        normalizedUser.role === "super_admin"
          ? "/super-admin/dashboard"
          : "/admin/dashboard";
      setLocation(payload.redirect_path && payload.redirect_path.includes("super-admin") ? payload.redirect_path : redirectPath);
    } catch (error) {
      clearAdminSession();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  const logout = useCallback(async () => {
    try {
      await apiRequest<{ message: string }>("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore API logout error and clear local session state anyway.
    } finally {
      clearAdminSession();
      setUser(null);
      setLocation("/login");
    }
  }, [setLocation]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshSession }),
    [user, loading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
