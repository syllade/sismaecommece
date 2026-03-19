import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiConfig';

// ============ Types ============

export interface RiskDashboard {
  clients: {
    at_risk: number;
    warning: number;
    red_zone: number;
    banned: number;
  };
  suppliers: {
    at_risk: number;
    warning: number;
    red_zone: number;
    suspended: number;
  };
  security: {
    unresolved_events: number;
    blacklisted_count: number;
  };
}

export interface RiskClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  risk_level: 'normal' | 'warning' | 'red_zone';
  cancellation_count: number;
  risk_score: number;
  banned_at: string | null;
  suspended_at: string | null;
  created_at: string;
}

export interface RiskSupplier {
  id: number;
  name: string;
  email: string;
  company_name: string;
  risk_level: 'normal' | 'warning' | 'red_zone';
  risk_score: number;
  suspended_at: string | null;
  created_at: string;
}

export interface SecurityEvent {
  id: number;
  event_type: string;
  description: string;
  ip_address: string;
  user_agent: string;
  user_id: number | null;
  user_type: string | null;
  resolved: boolean;
  created_at: string;
}

export interface BlacklistEntry {
  id: number;
  type: 'email' | 'phone' | 'ip' | 'device';
  value: string;
  reason: string;
  added_by: number;
  created_at: string;
}

// ============ Risk Dashboard Hooks ============

export function useRiskDashboard() {
  return useQuery<RiskDashboard>({
    queryKey: ['admin-risk-dashboard'],
    queryFn: () => apiRequest('/api/v1/admin/risk/dashboard'),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });
}

export function useRiskClients(params?: {
  risk_level?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.risk_level) queryParams.append('risk_level', params.risk_level);
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.per_page) queryParams.append('per_page', String(params.per_page));

  return useQuery<{ data: RiskClient[]; summary: any }>({
    queryKey: ['admin-risk-clients', params],
    queryFn: () => apiRequest(`/api/v1/admin/risk/clients?${queryParams.toString()}`),
    staleTime: 30 * 1000,
  });
}

export function useRiskSuppliers(params?: {
  risk_level?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.risk_level) queryParams.append('risk_level', params.risk_level);
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.per_page) queryParams.append('per_page', String(params.per_page));

  return useQuery<{ data: RiskSupplier[]; summary: any }>({
    queryKey: ['admin-risk-suppliers', params],
    queryFn: () => apiRequest(`/api/v1/admin/risk/suppliers?${queryParams.toString()}`),
    staleTime: 30 * 1000,
  });
}

// ============ Risk Actions Hooks ============

export function useBanClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest(`/api/v1/admin/risk/clients/${id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

export function useSuspendClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, duration_days }: { id: number; reason: string; duration_days?: number }) =>
      apiRequest(`/api/v1/admin/risk/clients/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason, duration_days }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

export function useUnbanClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/admin/risk/clients/${id}/unban`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

export function useUnsuspendClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/admin/risk/clients/${id}/unsuspend`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

export function useSuspendSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, permanent }: { id: number; reason: string; permanent?: boolean }) =>
      apiRequest(`/api/v1/admin/risk/suppliers/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason, permanent }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

export function useUnsuspendSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/admin/risk/suppliers/${id}/unsuspend`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

// ============ Security Events Hooks ============

export function useSecurityEvents(params?: {
  event_type?: string;
  resolved?: boolean;
  page?: number;
  per_page?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.event_type) queryParams.append('event_type', params.event_type);
  if (params?.resolved !== undefined) queryParams.append('resolved', String(params.resolved));
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.per_page) queryParams.append('per_page', String(params.per_page));

  return useQuery<{ data: SecurityEvent[] }>({
    queryKey: ['admin-security-events', params],
    queryFn: () => apiRequest(`/api/v1/admin/risk/security-events?${queryParams.toString()}`),
    staleTime: 30 * 1000,
  });
}

export function useResolveSecurityEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/admin/risk/security-events/${id}/resolve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-security-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

// ============ Blacklist Hooks ============

export function useBlacklist(params?: {
  type?: string;
  page?: number;
  per_page?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.per_page) queryParams.append('per_page', String(params.per_page));

  return useQuery<{ data: BlacklistEntry[] }>({
    queryKey: ['admin-blacklist', params],
    queryFn: () => apiRequest(`/api/v1/admin/risk/blacklist?${queryParams.toString()}`),
    staleTime: 60 * 1000,
  });
}

export function useAddToBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, value, reason }: { type: 'email' | 'phone' | 'ip' | 'device'; value: string; reason: string }) =>
      apiRequest(`/api/v1/admin/risk/blacklist/add`, {
        method: 'POST',
        body: JSON.stringify({ type, value, reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blacklist'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}

export function useRemoveFromBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/admin/risk/blacklist/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blacklist'] });
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
    },
  });
}
