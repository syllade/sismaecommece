import { apiGet, apiPost } from "@/api/http";

export type AuthRole = "admin" | "super_admin" | "supplier" | "delivery" | "client";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole | string;
  is_active?: boolean;
  redirect_path?: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  token_type: "Bearer" | string;
  redirect_path?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<LoginResponse>("/api/auth/login", { email, username: email, password }),

  logout: () => apiPost<{ message: string }>("/api/auth/logout"),

  me: () => apiGet<AuthUser>("/api/auth/me"),

  refreshToken: () => apiPost<{ token: string; token_type: string }>("/api/auth/refresh"),

  forgotPassword: (email: string) =>
    apiPost<{ success?: boolean; message: string }>("/api/auth/forgot-password", { email }),

  resetPassword: (payload: { token: string; email: string; password: string; password_confirmation: string }) =>
    apiPost<{ success?: boolean; message: string }>("/api/auth/reset-password", payload),
};

