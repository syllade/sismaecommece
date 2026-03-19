import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearSignupPrefill, getSignupPrefill, saveCustomerProfile } from "@/lib/customerProfile";
import { markMemberLogin, saveMemberProfile } from "@/lib/client-account";

interface ClientUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

interface AuthContextType {
  user: ClientUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (data: RegisterPayload) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  token: string | null;
}

const AUTH_TOKEN_KEY = "sisma_client_token";
const AUTH_USER_KEY = "sisma_client_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toClientUserFallback(profile?: {
  name?: string;
  email?: string | null;
  phone?: string;
} | null): Partial<ClientUser> | undefined {
  if (!profile) return undefined;
  return {
    name: profile.name,
    email: profile.email ?? undefined,
    phone: profile.phone,
  };
}

function persistMemberSession(user: Partial<ClientUser> | null | undefined, fallback?: Partial<ClientUser>) {
  if (!user) return;

  const profile = {
    userId: typeof user.id === "number" ? user.id : undefined,
    name: user.name || fallback?.name || "",
    email: user.email || fallback?.email || null,
    phone: user.phone || fallback?.phone || "",
  };

  if (!profile.name && !profile.email && !profile.phone) return;

  if (profile.phone) {
    saveCustomerProfile({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
    });
  }

  saveMemberProfile(profile);
  if (typeof user.id === "number") {
    markMemberLogin(profile);
  }
  clearSignupPrefill();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              Accept: "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
            persistMemberSession(userData, toClientUserFallback(getSignupPrefill()));
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
          }
        } catch (error) {
          console.error("Error restoring session:", error);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, [API_BASE_URL]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || "Échec de la connexion");
        return { error };
      }

      const newToken = data.token || data.access_token;
      const nextUser = data.user;
      const fallback = toClientUserFallback(getSignupPrefill());

      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));

      setToken(newToken);
      setUser(nextUser);
      persistMemberSession(nextUser, fallback);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const error = new Error(responseData.message || "Échec de l'inscription");
        return { error };
      }

      const newToken = responseData.token || responseData.access_token;
      const nextUser = responseData.user;
      const fallback = {
        name: data.name,
        email: data.email,
        phone: data.phone,
      };

      if (newToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, newToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
        setToken(newToken);
        setUser(nextUser);
      }

      persistMemberSession(nextUser ?? fallback, fallback);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export async function clientApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "/login";
    throw new Error("Session expirée");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erreur serveur" }));
    throw new Error(error.message || `Erreur API (${response.status})`);
  }

  return response.json();
}
