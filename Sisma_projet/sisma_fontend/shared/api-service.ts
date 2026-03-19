/**
 * Unified API Service for SISMA E-commerce Platform
 * This service provides a centralized way to make API calls with:
 * - Automatic token management
 * - Role-based routing
 * - Error handling
 * - Lightweight fetch-based clients
 */

export type UserRole = "admin" | "supplier" | "delivery" | "client";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface ApiRequestConfig {
  params?: Record<string, unknown>;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface ApiClientResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

interface ApiRequestOptions extends ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, "")
    : "") ||
  "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 30000;

const TOKEN_KEYS: Record<UserRole, string> = {
  admin: "sisma_admin_token",
  supplier: "sisma_supplier_token",
  delivery: "sisma_delivery_token",
  client: "sisma_client_token",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPaginatedPayload(value: unknown): value is PaginatedResponse<unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.data) &&
    typeof value.current_page === "number" &&
    typeof value.last_page === "number" &&
    typeof value.per_page === "number" &&
    typeof value.total === "number"
  );
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (isPaginatedPayload(payload)) {
    return payload as T;
  }

  if (isRecord(payload) && "data" in payload) {
    const hasWrapperMetadata =
      "success" in payload || "message" in payload || "errors" in payload;

    if (hasWrapperMetadata && payload.data !== undefined) {
      return payload.data as T;
    }
  }

  return payload as T;
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function buildAbsoluteUrl(url: string, params?: Record<string, unknown>): string {
  const query = buildQueryString(params);

  if (url.startsWith("http")) {
    return `${url}${query}`;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${normalizedPath}${query}`;
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function createAbortSignal(signal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

function handleUnauthorized(role?: UserRole): void {
  clearToken(role);
  setCurrentUser(null);

  if (typeof window === "undefined") {
    return;
  }

  const loginRoutes: Record<UserRole, string> = {
    admin: "/login",
    supplier: "/fournisseur/login",
    delivery: "/livreur/login",
    client: "/login",
  };

  const currentRole = role || getCurrentUser()?.role;
  if (currentRole) {
    window.location.href = loginRoutes[currentRole];
  }
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (isRecord(payload)) {
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (isRecord(payload.errors)) {
      for (const fieldErrors of Object.values(payload.errors)) {
        if (Array.isArray(fieldErrors)) {
          const first = fieldErrors.find(
            (item): item is string => typeof item === "string" && item.trim().length > 0
          );
          if (first) {
            return first;
          }
        } else if (typeof fieldErrors === "string" && fieldErrors.trim()) {
          return fieldErrors;
        }
      }
    }
  }

  return fallback;
}

export function getToken(role?: UserRole): string {
  if (typeof window === "undefined") return "";

  const key = role ? TOKEN_KEYS[role] : "sisma_token";
  return window.localStorage.getItem(key) || "";
}

export function setToken(token: string, role?: UserRole): void {
  if (typeof window === "undefined") return;

  const key = role ? TOKEN_KEYS[role] : "sisma_token";
  window.localStorage.setItem(key, token);
}

export function clearToken(role?: UserRole): void {
  if (typeof window === "undefined") return;

  if (role) {
    window.localStorage.removeItem(TOKEN_KEYS[role]);
    return;
  }

  Object.values(TOKEN_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const userStr = window.localStorage.getItem("sisma_user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;

  if (user) {
    window.localStorage.setItem("sisma_user", JSON.stringify(user));
  } else {
    window.localStorage.removeItem("sisma_user");
  }
}

class ApiClient {
  constructor(private readonly role?: UserRole) {}

  private async request<T>(url: string, options: ApiRequestOptions = {}): Promise<ApiClientResponse<T>> {
    const { method = "GET", params, headers, body, signal } = options;
    const requestUrl = buildAbsoluteUrl(url, params);
    const finalHeaders = new Headers(headers);
    finalHeaders.set("Accept", "application/json");

    const token = getToken(this.role);
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }

    let requestBody: BodyInit | undefined;
    if (body instanceof FormData) {
      requestBody = body;
    } else if (body !== undefined) {
      finalHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    } else if (!finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }

    const { signal: requestSignal, cleanup } = createAbortSignal(signal);

    try {
      const response = await fetch(requestUrl, {
        method,
        headers: finalHeaders,
        body: requestBody,
        signal: requestSignal,
      });

      const payload = await parseResponseBody(response);

      if (response.status === 401) {
        handleUnauthorized(this.role);
      }

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(payload, response.statusText || "Une erreur est survenue")
        );
      }

      return {
        data: unwrapApiPayload<T>(payload),
        status: response.status,
        headers: headersToObject(response.headers),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("La requete a expire");
        }

        throw error;
      }

      throw new Error("Une erreur est survenue");
    } finally {
      cleanup();
    }
  }

  get<T>(url: string, config?: ApiRequestConfig): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { method: "GET", ...config });
  }

  post<T>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { method: "POST", body: data, ...config });
  }

  put<T>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { method: "PUT", body: data, ...config });
  }

  patch<T>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { method: "PATCH", body: data, ...config });
  }

  delete<T>(url: string, config?: ApiRequestConfig): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { method: "DELETE", ...config });
  }
}

function createApiClient(role?: UserRole): ApiClient {
  return new ApiClient(role);
}

export const adminApi = createApiClient("admin");
export const supplierApi = createApiClient("supplier");
export const deliveryApi = createApiClient("delivery");
export const clientApi = createApiClient("client");
export const api = createApiClient();

export async function apiGet<T = unknown>(
  url: string,
  config?: ApiRequestConfig,
  role?: UserRole
): Promise<T> {
  const client = role ? createApiClient(role) : api;
  const response = await client.get<T>(url, config);
  return response.data;
}

export async function apiPost<T = unknown>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
  role?: UserRole
): Promise<T> {
  const client = role ? createApiClient(role) : api;
  const response = await client.post<T>(url, data, config);
  return response.data;
}

export async function apiPut<T = unknown>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
  role?: UserRole
): Promise<T> {
  const client = role ? createApiClient(role) : api;
  const response = await client.put<T>(url, data, config);
  return response.data;
}

export async function apiPatch<T = unknown>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
  role?: UserRole
): Promise<T> {
  const client = role ? createApiClient(role) : api;
  const response = await client.patch<T>(url, data, config);
  return response.data;
}

export async function apiDelete<T = unknown>(
  url: string,
  config?: ApiRequestConfig,
  role?: UserRole
): Promise<T> {
  const client = role ? createApiClient(role) : api;
  const response = await client.delete<T>(url, config);
  return response.data;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  expires_in?: number;
}

export const authApi = {
  adminLogin: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await adminApi.post<LoginResponse>("/api/auth/login", credentials);
    if (response.data.token) {
      setToken(response.data.token, "admin");
      setCurrentUser(response.data.user);
    }
    return response.data;
  },

  supplierLogin: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await supplierApi.post<LoginResponse>("/api/auth/login", credentials);
    if (response.data.token) {
      setToken(response.data.token, "supplier");
      setCurrentUser(response.data.user);
    }
    return response.data;
  },

  deliveryLogin: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await deliveryApi.post<LoginResponse>("/api/v1/driver/login", credentials);
    if (response.data.token) {
      setToken(response.data.token, "delivery");
      setCurrentUser(response.data.user);
    }
    return response.data;
  },

  clientLogin: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await clientApi.post<LoginResponse>("/api/auth/login", credentials);
    if (response.data.token) {
      setToken(response.data.token, "client");
      setCurrentUser(response.data.user);
    }
    return response.data;
  },

  me: async (role?: UserRole): Promise<AuthUser> => {
    const client = role ? createApiClient(role) : api;
    const response = await client.get<AuthUser>("/api/auth/me");
    return response.data;
  },

  logout: async (role?: UserRole): Promise<void> => {
    try {
      const client = role ? createApiClient(role) : api;
      await client.post<void>("/api/auth/logout");
    } finally {
      clearToken(role);
      setCurrentUser(null);
    }
  },

  refresh: async (role?: UserRole): Promise<{ token: string }> => {
    const client = role ? createApiClient(role) : api;
    const response = await client.post<{ token: string }>("/api/auth/refresh");
    if (response.data.token) {
      setToken(response.data.token, role);
    }
    return response.data;
  },
};

export function hasRole(user: AuthUser | null, roles: UserRole | UserRole[]): boolean {
  if (!user) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role as UserRole);
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, "admin");
}

export function isSupplier(user: AuthUser | null): boolean {
  return hasRole(user, "supplier");
}

export function isDelivery(user: AuthUser | null): boolean {
  return hasRole(user, "delivery");
}

export function isClient(user: AuthUser | null): boolean {
  return hasRole(user, "client");
}

export interface RouteConfig {
  path: string;
  roles: UserRole[];
  redirectTo?: string;
}

export function canAccessRoute(user: AuthUser | null, routeConfig: RouteConfig): boolean {
  if (!user) return false;
  return routeConfig.roles.includes(user.role as UserRole);
}

export function getDefaultRouteForRole(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    admin: "/admin/dashboard",
    supplier: "/fournisseur/dashboard",
    delivery: "/livreur/deliveries",
    client: "/client/orders",
  };
  return routes[role] || "/login";
}
