import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/services/api";
import { useLocation } from "wouter";

type User = { id?: number; email?: string; name?: string; role?: string } | null;

type AuthContextValue = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AUTH_TOKEN_KEY = "sisma_supplier_token";
const AUTH_USER_KEY = "sisma_supplier_user";
const LEGACY_TOKEN_KEY = "fashop_supplier_token";
const LEGACY_USER_KEY = "fashop_supplier_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function roleRedirect(role?: string) {
  return "/dashboard";
}

function normalizeRole(role: unknown): string {
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase().replace(/\s+/g, "_");
}

function isSupplierRole(role: unknown): boolean {
  return normalizeRole(role) === "supplier";
}

function extractPayload(data: any) {
  return data?.data ?? data;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    const current = localStorage.getItem(AUTH_TOKEN_KEY);
    if (current) return current;
    const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      localStorage.setItem(AUTH_TOKEN_KEY, legacy);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacy;
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!!token);
  const [, setLocation] = useLocation();

  const clearSession = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handler = () => {
      clearSession();
      setLocation("/login");
    };
    const forbiddenHandler = () => {
      window.alert("Acces refuse.");
    };
    window.addEventListener("app:unauthorized", handler as EventListener);
    window.addEventListener("app:forbidden", forbiddenHandler as EventListener);
    return () => {
      window.removeEventListener("app:unauthorized", handler as EventListener);
      window.removeEventListener("app:forbidden", forbiddenHandler as EventListener);
    };
  }, [setLocation]);

  useEffect(() => {
    const restore = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await api.get("/auth/me");
        const payload = extractPayload(resp.data);
        if (!isSupplierRole(payload?.role)) {
          clearSession();
          setLocation("/login");
          return;
        }
        setUser(payload);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
        setLoading(false);
      } catch {
        clearSession();
        setLoading(false);
      }
    };
    void restore();
  }, [token, setLocation]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const resp = await api.post("/auth/login", { email, username: email, password });
    const payload = extractPayload(resp.data);
    const newToken = payload?.token || payload?.access_token || payload?.data?.token || null;
    const newUser = payload?.user || payload?.data?.user || payload;
    if (!newToken) throw new Error("Token absent from server response");
    if (!isSupplierRole(newUser?.role)) {
      clearSession();
      setLoading(false);
      throw new Error("Acces reserve aux fournisseurs.");
    }
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    const target =
      typeof payload?.redirect_path === "string" && payload.redirect_path.length > 0
        ? payload.redirect_path
        : roleRedirect(newUser.role);
    setLocation(target);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    clearSession();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
