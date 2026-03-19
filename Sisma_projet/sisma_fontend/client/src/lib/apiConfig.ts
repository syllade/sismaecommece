// Configuration de l'API backend Laravel pour le client
const rawApiBase = import.meta.env.VITE_API_BASE_URL 
  || (import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, "") : "")
  || "http://localhost:8000";
export const API_BASE_URL = rawApiBase.replace(/\/+$/, "");

const CLIENT_TOKEN_KEY = 'sisma_client_token';

// Fonction pour construire l'URL complète
export function buildApiUrl(path: string): string {
  // Si le chemin commence déjà par http, retourner tel quel
  if (path.startsWith('http')) {
    return path;
  }
  
  // Si le chemin commence par /api, utiliser directement
  if (path.startsWith('/api')) {
    return `${API_BASE_URL}${path}`;
  }
  
  // Sinon, ajouter le préfixe /api
  return `${API_BASE_URL}/api${path.startsWith('/') ? path : '/' + path}`;
}

// Fonction pour obtenir les headers
export function getApiHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(CLIENT_TOKEN_KEY) : '';
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Gestion du token
export function getClientToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CLIENT_TOKEN_KEY) || '';
}

export function setClientToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLIENT_TOKEN_KEY, token);
}

export function clearClientToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CLIENT_TOKEN_KEY);
}
