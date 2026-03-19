import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const SUPPLIER_TOKEN_KEY = "sisma_supplier_token";
const LEGACY_SUPPLIER_TOKEN_KEY = "fashop_supplier_token";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

function getSupplierToken(): string | null {
  const token = localStorage.getItem(SUPPLIER_TOKEN_KEY);
  if (token) return token;
  const legacy = localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(SUPPLIER_TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_SUPPLIER_TOKEN_KEY);
    return legacy;
  }
  return null;
}

api.interceptors.request.use((config) => {
  const token = getSupplierToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      window.dispatchEvent(new CustomEvent("app:unauthorized", { detail: { status } }));
    }
    if (status === 403) {
      window.dispatchEvent(new CustomEvent("app:forbidden", { detail: { status } }));
    }
    return Promise.reject(error);
  }
);

export default api;
