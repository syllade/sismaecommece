import { useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

const API_BASE = '/api/v1/driver';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: object;
}

export function useDriverApi() {
  const { logout } = useAuth();

  const apiRequest = useCallback(async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
    const token = localStorage.getItem('sisma_delivery_token');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expirée');
    }

    if (response.status === 403) {
      throw new Error('Accès refusé');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur API');
    }

    return data;
  }, [logout]);

  return { apiRequest };
}

// Driver Auth
export function useDriverAuth() {
  const { apiRequest } = useDriverApi();

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<{
      success: boolean;
      data: { driver: any; token: string };
    }>('/login', {
      method: 'POST',
      body: { email, password },
    });

    if (response.data.token) {
      localStorage.setItem('sisma_delivery_token', response.data.token);
    }

    return response.data;
  }, [apiRequest]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('sisma_delivery_token');
    }
  }, [apiRequest]);

  const forgotPassword = useCallback(async (email: string) => {
    return apiRequest('/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }, [apiRequest]);

  return { login, logout, forgotPassword };
}

// Driver Deliveries
export function useDriverDeliveries() {
  const { apiRequest } = useDriverApi();

  const getDeliveries = useCallback(async (filters?: {
    status?: string;
    date?: string;
    delivery_type?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.delivery_type) params.append('delivery_type', filters.delivery_type);

    return apiRequest<{ success: boolean; data: any[]; meta: any }>(
      `/deliveries?${params.toString()}`
    );
  }, [apiRequest]);

  const getDelivery = useCallback(async (id: number) => {
    return apiRequest<{ success: boolean; data: any }>(`/deliveries/${id}`);
  }, [apiRequest]);

  const updateStatus = useCallback(async (id: number, status: string, exceptionReason?: string) => {
    const normalized = status.toLowerCase();

    if (normalized === 'accepted') {
      return apiRequest<{ success: boolean }>(`/deliveries/${id}/accept`, { method: 'POST' });
    }

    if (normalized === 'in_transit' || normalized === 'picked_up') {
      return apiRequest<{ success: boolean }>(`/deliveries/${id}/pickup`, { method: 'POST' });
    }

    if (normalized === 'exception' || normalized === 'failed') {
      return apiRequest<{ success: boolean }>(`/deliveries/${id}/fail`, {
        method: 'POST',
        body: {
          reason: 'other',
          notes: exceptionReason || 'Exception remontee par livreur',
        },
      });
    }

    throw new Error('Transition de statut non supportee par l API driver');
  }, [apiRequest]);

  const completeDelivery = useCallback(async (
    id: number,
    proof: {
      photo_base64: string;
      signature_base64: string;
      gps_lat: number;
      gps_lng: number;
      notes?: string;
    }
  ) => {
    return apiRequest<{ success: boolean }>(`/deliveries/${id}/complete`, {
      method: 'POST',
      body: proof,
    });
  }, [apiRequest]);

  const bulkUpdate = useCallback(async (deliveryIds: number[], status: string) => {
    return apiRequest<{ success: boolean }>('/deliveries/bulk-update', {
      method: 'POST',
      body: { delivery_ids: deliveryIds, status },
    });
  }, [apiRequest]);

  return { getDeliveries, getDelivery, updateStatus, completeDelivery, bulkUpdate };
}

// Driver Stats
export function useDriverStats() {
  const { apiRequest } = useDriverApi();

  const getStats = useCallback(async () => {
    return apiRequest<{ success: boolean; data: any; cached: boolean }>('/stats');
  }, [apiRequest]);

  const getWeeklyStats = useCallback(async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/stats/weekly');
  }, [apiRequest]);

  return { getStats, getWeeklyStats };
}

// Driver Profile
export function useDriverProfile() {
  const { apiRequest } = useDriverApi();

  const getProfile = useCallback(async () => {
    return apiRequest<{ success: boolean; data: any }>('/profile');
  }, [apiRequest]);

  const updateProfile = useCallback(async (data: { name?: string; phone?: string; photo?: string }) => {
    return apiRequest<{ success: boolean }>('/profile', {
      method: 'PUT',
      body: data,
    });
  }, [apiRequest]);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ) => {
    return apiRequest<{ success: boolean }>('/change-password', {
      method: 'PUT',
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      },
    });
  }, [apiRequest]);

  return { getProfile, updateProfile, changePassword };
}
