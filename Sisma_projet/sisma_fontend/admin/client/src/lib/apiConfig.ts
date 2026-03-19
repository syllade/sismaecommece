const rawApiBase =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, "") : "") ||
  "http://localhost:8000";
export const API_BASE_URL = rawApiBase.replace(/\/+$/, "");
const AUTH_TOKEN_KEY = "sisma_admin_token";
const AUTH_USER_KEY = "sisma_admin_user";

type ApiErrorBag = Record<string, string[]>;

export class ApiHttpError extends Error {
  status: number;
  errors?: ApiErrorBag;

  constructor(message: string, status: number, errors?: ApiErrorBag) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.errors = errors;
  }
}

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredAdminUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredAdminUser(user: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAdminUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export function clearAdminSession() {
  clearAuthToken();
  clearStoredAdminUser();
}

export function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function extractErrors(payload: unknown): ApiErrorBag | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const errors = (payload as { errors?: unknown }).errors;
  if (!errors || typeof errors !== "object") return undefined;
  return errors as ApiErrorBag;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (!payload || typeof payload !== "object") return fallback;

  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;

  const errors = extractErrors(payload);
  if (errors) {
    for (const fieldErrors of Object.values(errors)) {
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        const first = fieldErrors.find((item) => typeof item === "string" && item.trim());
        if (typeof first === "string") return first;
      }
    }
  }

  return fallback;
}

function emitAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("sisma:admin:auth-expired"));
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const hasFormDataBody = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init.body && !hasFormDataBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  };

  const response = await fetch(buildApiUrl(path), { ...init, headers });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const errors = extractErrors(payload);
    const message = extractErrorMessage(payload, `Erreur API (${response.status})`);
    if (response.status === 401) {
      clearAdminSession();
      emitAuthExpired();
    }
    throw new ApiHttpError(message, response.status, errors);
  }

  return payload as T;
}
