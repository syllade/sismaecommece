import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Token storage keys
const TOKEN_KEY = 'sisma_admin_token';
const REFRESH_TOKEN_KEY = 'sisma_admin_refresh_token';
const USER_KEY = 'sisma_admin_user';

// User roles
export type UserRole = 'admin' | 'super_admin' | 'supplier' | 'driver' | 'client';

// User interface
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  supplier_id?: number;
  delivery_person_id?: number;
}

// Auth response
export interface AuthResponse {
  success: boolean;
  token?: string;
  refresh_token?: string;
  user?: User;
  message?: string;
}

// API Error
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token getter/setter
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// User getters/setters
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};
export const setUser = (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user));

// Request interceptor - add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          if (response.data.token) {
            setToken(response.data.token);
            if (response.data.refresh_token) {
              localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
            }
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout
          logout();
          redirectToLogin();
        }
      } else {
        // No refresh token, logout
        logout();
        redirectToLogin();
      }
    }

    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'Acces refuse';
      return Promise.reject(new Error(message));
    }
    
    return Promise.reject(error);
  }
);

// Auth functions
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    
    if (response.data.success && response.data.token) {
      setToken(response.data.token);
      if (response.data.user) {
        setUser(response.data.user);
      }
    }
    
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: 'Erreur de connexion' };
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore logout errors
  }
  removeToken();
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: 'Erreur d\'inscription' };
  }
};

export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: 'Erreur' };
  }
};

export const resetPassword = async (data: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/reset-password', data);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: 'Erreur' };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get<{ data: User }>('/auth/me');
    if (response.data.data) {
      setUser(response.data.data);
      return response.data.data;
    }
    return null;
  } catch (error) {
    return getUser();
  }
};

// Role check helpers
export const hasRole = (roles: UserRole | UserRole[]): boolean => {
  const user = getUser();
  if (!user) return false;
  
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
};

export const isAdmin = () => hasRole(['admin', 'super_admin']);
export const isSupplier = () => hasRole('supplier');
export const isDriver = () => hasRole('driver');
export const isClient = () => hasRole('client');

// Redirect helpers based on role
export const getRedirectPath = (): string => {
  const user = getUser();
  if (!user) return '/login';
  
  switch (user.role) {
    case 'super_admin':
    case 'admin':
      return '/admin/dashboard';
    case 'supplier':
      return '/supplier/dashboard';
    case 'driver':
      return '/driver/dashboard';
    case 'client':
      return '/';
    default:
      return '/login';
  }
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Check if maintenance mode
export const checkMaintenanceMode = async (): Promise<{ enabled: boolean; message: string }> => {
  try {
    const response = await api.get<{ data: { maintenance_mode: boolean; maintenance_message: string } }>('/landing');
    return {
      enabled: response.data.data.maintenance_mode,
      message: response.data.data.maintenance_message,
    };
  } catch (error) {
    return { enabled: false, message: '' };
  }
};

export default api;
