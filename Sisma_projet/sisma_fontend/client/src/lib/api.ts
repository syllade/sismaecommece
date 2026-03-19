/**
 * Configuration centrale de l'API pour l'application Client (Boutique)
 * @version 1.0.0
 */

import { buildApiUrl } from "./apiConfig";

const REQUEST_TIMEOUT_MS = 30000;
const AUTH_TOKEN_KEY = "sisma_client_token";
const AUTH_USER_KEY = "sisma_client_user";

export type ApiErrorBag = Record<string, string[]>;

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

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: ApiErrorBag;
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPaginatedPayload(value: unknown): value is PaginatedData<unknown> {
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

function normalizeErrorBag(value: unknown): ApiErrorBag | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const bag: ApiErrorBag = {};

  Object.entries(value).forEach(([field, messages]) => {
    if (Array.isArray(messages)) {
      const normalizedMessages = messages.filter(
        (message): message is string => typeof message === "string"
      );

      if (normalizedMessages.length > 0) {
        bag[field] = normalizedMessages;
      }
    } else if (typeof messages === "string") {
      bag[field] = [messages];
    }
  });

  return Object.keys(bag).length > 0 ? bag : undefined;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  const errors = normalizeErrorBag(payload.errors);
  if (!errors) {
    return fallback;
  }

  const firstErrorGroup = Object.values(errors)[0];
  return firstErrorGroup?.[0] ?? fallback;
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

function createAbortSignal(signal?: AbortSignal): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (!signal) {
    return {
      signal: controller.signal,
      cleanup: () => window.clearTimeout(timeoutId),
    };
  }

  if (signal.aborted) {
    controller.abort();
  } else {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timeoutId),
  };
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_USER_KEY);
}

export function clearSession(): void {
  clearAuthToken();
  clearStoredUser();
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request<T>(url: string, config: ApiRequestConfig = {}): Promise<T> {
  const { method = "GET", params, data, headers, signal } = config;
  const query = params ? buildQueryString(params) : "";
  const requestUrl = buildApiUrl(`${url}${query}`);
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");

  const token = getAuthToken();
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (data instanceof FormData) {
    body = data;
  } else if (data !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    body = JSON.stringify(data);
  } else if (!finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const { signal: requestSignal, cleanup } = createAbortSignal(signal);

  try {
    const response = await fetch(requestUrl, {
      method,
      headers: finalHeaders,
      body,
      signal: requestSignal,
    });

    const payload = await parseResponseBody(response);

    if (response.status === 401) {
      clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sisma:client:auth-expired"));
      }
    }

    if (!response.ok) {
      const errors = isRecord(payload) ? normalizeErrorBag(payload.errors) : undefined;
      throw new ApiHttpError(
        extractErrorMessage(payload, response.statusText || "Une erreur est survenue"),
        response.status,
        errors
      );
    }

    return unwrapApiPayload<T>(payload);
  } catch (error) {
    if (error instanceof ApiHttpError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiHttpError("La requete a expire", 408);
    }

    const message = error instanceof Error ? error.message : "Une erreur reseau est survenue";
    throw new ApiHttpError(message, 0);
  } finally {
    cleanup();
  }
}

export const api = {
  request,
  get: <T>(url: string, params?: Record<string, unknown>) =>
    request<T>(url, { method: "GET", params }),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: "POST", data }),
  put: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: "PUT", data }),
  patch: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: "PATCH", data }),
  delete: <T>(url: string) =>
    request<T>(url, { method: "DELETE" }),
};

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return api.get<T>(url, params);
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  return api.post<T>(url, data);
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  return api.put<T>(url, data);
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return api.patch<T>(url, data);
}

export async function apiDelete<T>(url: string): Promise<T> {
  return api.delete<T>(url);
}

export default api;
