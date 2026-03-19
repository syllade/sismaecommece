import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DeliveryUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  zone?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: DeliveryUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<DeliveryUser>) => Promise<{ error: Error | null }>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ error: Error | null }>;
  token: string | null;
}

const AUTH_TOKEN_KEY = "sisma_delivery_token";
const AUTH_USER_KEY = "sisma_delivery_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DeliveryUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const extractData = <T,>(payload: any): T => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T;
    }
    return payload as T;
  };

  // API Base URL - à configurer selon l'environnement
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await fetch(`${API_BASE_URL}/v1/driver/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              Accept: "application/json",
            },
          });

          if (response.ok) {
            const payload = await response.json();
            const userData = extractData<DeliveryUser>(payload);
            setUser(userData);
            setToken(storedToken);
          } else {
            // Token expired or invalid
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

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/driver/login`, {
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

      // Store token and user
      const dataPayload = data.data || data;
      const newToken = dataPayload.token || data.token || data.access_token;
      const driverData = dataPayload.driver || data.user || dataPayload.user || dataPayload;
      if (!newToken) {
        return { error: new Error("Token manquant dans la reponse serveur") };
      }
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(driverData));
      
      setToken(newToken);
      setUser(driverData);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/v1/driver/logout`, {
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

  const updateProfile = async (data: Partial<DeliveryUser>) => {
    if (!token) {
      return { error: new Error("Non authentifié") };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/driver/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      const updatedUser = await response.json();
      const nextUser = extractData<DeliveryUser>(updatedUser);
      setUser(nextUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (!token) {
      return { error: new Error("Non authentifié") };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/v1/driver/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Erreur lors du changement de mot de passe");
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateProfile, changePassword, token }}>
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

// Helper pour les appels API avec token
export async function driverApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
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
    // Token expired or invalid
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "/login";
    throw new Error("Session expirée");
  }

  if (response.status === 403) {
    throw new Error("Acces refuse");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erreur serveur" }));
    throw new Error(error.message || `Erreur API (${response.status})`);
  }

  const payload = await response.json().catch(() => ({}));
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}
