import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_BASE_URL, clearAdminSession, getAuthToken, setAuthToken } from "@/lib/apiConfig";

type ErrorBag = Record<string, string[]>;

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: ErrorBag;
};

export class ApiClientError extends Error {
  status: number;
  errors?: ErrorBag;

  constructor(message: string, status: number, errors?: ErrorBag) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Refresh token function
const refreshToken = async (): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {}, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  
  if (response.data && response.data.token) {
    setAuthToken(response.data.token);
    return response.data.token;
  }
  throw new Error('Failed to refresh token');
};

http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  if (record.errors && typeof record.errors === "object") {
    for (const value of Object.values(record.errors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }
  return fallback;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status ?? 0;
    const payload = error.response?.data as Record<string, unknown> | undefined;

    // Handle 401 Unauthorized - try to refresh token
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return http(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processQueue(null, newToken);
        
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearAdminSession();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("sisma:admin:auth-expired"));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      clearAdminSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sisma:admin:auth-expired"));
      }
    }

    const message = extractMessage(payload, `Erreur API (${status || "network"})`);
    const errors = payload?.errors as ErrorBag | undefined;
    return Promise.reject(new ApiClientError(message, status, errors));
  }
);

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    // Check for API error response with success: false
    const record = payload as Record<string, unknown>;
    if ("success" in record && record.success === false) {
      const message = record.message as string || "Une erreur est survenue";
      const error = new Error(message) as Error & { status?: number; payload?: unknown };
      error.status = 400;
      error.payload = payload;
      throw error;
    }
    // Extract data from successful envelope
    if ("data" in record) {
      const data = (payload as ApiEnvelope<T>).data;
      if (data !== undefined) return data;
    }
  }
  return payload as T;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.get(url, config);
  return unwrap<T>(response.data);
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.post(url, body, config);
  return unwrap<T>(response.data);
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.put(url, body, config);
  return unwrap<T>(response.data);
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.patch(url, body, config);
  return unwrap<T>(response.data);
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.delete(url, config);
  return unwrap<T>(response.data);
}

export async function apiGetBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
  const response = await http.get(url, { ...config, responseType: "blob" });
  return response.data as Blob;
}

