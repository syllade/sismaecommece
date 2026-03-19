/**
 * Service d'authentification pour les clients
 * Endpoints: /api/auth/*
 */

import { apiGet, apiPost, setAuthToken, setStoredUser, clearSession } from '@/lib/api';

// =====================================================
// TYPES
// =====================================================

export interface ClientUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: ClientUser;
  expires_in?: number;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponse {
  message: string;
  user?: ClientUser;
  requires_verification?: boolean;
}

// =====================================================
// FONCTIONS DE SERVICE
// =====================================================

/**
 * Inscription d'un nouveau client
 */
export async function register(data: RegisterData): Promise<RegisterResponse> {
  return apiPost('/api/auth/register', data);
}

/**
 * Connexion d'un client
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiPost<LoginResponse>('/api/auth/login', credentials);
  
  // Stocker le token et l'utilisateur
  setAuthToken(response.token);
  setStoredUser(response.user);
  
  return response;
}

/**
 * Obtenir l'utilisateur actuellement connecté
 */
export async function getCurrentUser(): Promise<ClientUser> {
  return apiGet('/api/auth/me');
}

/**
 * Déconnexion
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/api/auth/logout');
  } finally {
    clearSession();
  }
}

/**
 * Rafraîchissement du token
 */
export async function refreshToken(): Promise<{ token: string; expires_in: number }> {
  return apiPost('/api/auth/refresh');
}

/**
 * Activation de compte
 */
export async function activateAccount(token: string, password: string): Promise<{ message: string }> {
  return apiPost('/api/auth/activate', { token, password });
}

// =====================================================
// EXPORT PAR DÉFAUT
// =====================================================

const authService = {
  register,
  login,
  getCurrentUser,
  logout,
  refreshToken,
  activateAccount,
};

export default authService;
