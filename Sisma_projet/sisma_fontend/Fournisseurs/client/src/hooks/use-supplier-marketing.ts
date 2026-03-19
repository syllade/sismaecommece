import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

// Base API URL
const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
const API_BASE = `${API_ROOT}/v1/supplier`;
const SUPPLIER_TOKEN_KEY = "sisma_supplier_token";
const LEGACY_SUPPLIER_TOKEN_KEY = "fashop_supplier_token";

// Types
export interface Campaign {
  id: number;
  name: string;
  type: 'cpc' | 'cpm' | 'fixed';
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  daily_budget: number;
  spent: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  acos: number;
  keywords?: string[];
  target_url?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  clicks: number;
  impressions: number;
  ctr: number;
  spend: number;
  conversions: number;
  cost_per_conversion: number;
  revenue: number;
  acos: number;
  daily_data: {
    date: string;
    clicks: number;
    impressions: number;
    conversions: number;
    spend: number;
  }[];
}

export interface AdvertisingBalance {
  balance: number;
  pending_credits: number;
  total_spent: number;
  currency: string;
}

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(SUPPLIER_TOKEN_KEY) || localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY) || '';
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem(SUPPLIER_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("app:unauthorized", { detail: { status: 401 } }));
    throw new Error('Session expirée');
  }

  if (response.status === 403) {
    window.dispatchEvent(new CustomEvent("app:forbidden", { detail: { status: 403 } }));
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `API request failed: ${response.status}`);
  }

  return response.json();
}

// ============ Campaigns Hooks ============

export function useCampaigns(params?: {
  status?: string;
  type?: string;
  page?: number;
  per_page?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.per_page) queryParams.append('per_page', String(params.per_page));

  return useQuery<{ data: Campaign[]; meta?: any }>({
    queryKey: ['supplier-campaigns', params],
    queryFn: () => fetchApi(`/campaigns?${queryParams.toString()}`),
    staleTime: 30 * 1000,
  });
}

export function useCampaign(id: number) {
  return useQuery<Campaign>({
    queryKey: ['supplier-campaign', id],
    queryFn: () => fetchApi(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCampaignStats(id: number, period: 'day' | 'week' | 'month' = 'day') {
  return useQuery<CampaignStats>({
    queryKey: ['supplier-campaign-stats', id, period],
    queryFn: () => fetchApi(`/campaigns/${id}/stats?period=${period}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<Campaign>) =>
      fetchApi('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Campagne créée',
        description: 'Votre campagne a été créée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Campaign> }) =>
      fetchApi(`/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Campagne mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/campaigns/${id}/toggle`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      toast({
        title: 'Campagne pausée',
        description: 'La campagne a été mise en pause.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/campaigns/${id}/toggle`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      toast({
        title: 'Campagne activée',
        description: 'La campagne est maintenant active.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/campaigns/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: 'Campagne supprimée',
        description: 'La campagne a été supprimée.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ Advertising Balance Hooks ============

export function useAdvertisingBalance() {
  return useQuery<AdvertisingBalance>({
    queryKey: ['supplier-advertising-balance'],
    queryFn: () => fetchApi('/advertising/balance'),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useDepositFunds() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ amount, payment_method }: { amount: number; payment_method: string }) =>
      fetchApi('/advertising/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount, payment_method }),
      }),
    onSuccess: () => {
      toast({
        title: 'Dépôt effectué',
        description: 'Les fonds ont été ajoutés à votre compte advertising.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-advertising-balance'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ Marketing Overview Hook ============

export function useMarketingOverview() {
  return useQuery({
    queryKey: ['supplier-marketing-overview'],
    queryFn: () => fetchApi('/marketing/overview'),
    staleTime: 60 * 1000,
  });
}

// ============ Keywords Hooks ============

export function useCampaignKeywords(campaignId: number) {
  return useQuery<string[]>({
    queryKey: ['supplier-campaign-keywords', campaignId],
    queryFn: () => fetchApi(`/campaigns/${campaignId}/keywords`),
    enabled: !!campaignId,
  });
}

export function useAddKeywords() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ campaignId, keywords }: { campaignId: number; keywords: string[] }) =>
      fetchApi(`/campaigns/${campaignId}/keywords`, {
        method: 'POST',
        body: JSON.stringify({ keywords }),
      }),
    onSuccess: () => {
      toast({
        title: 'Mots-clés ajoutés',
        description: 'Les mots-clés ont été ajoutés à la campagne.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-campaign-keywords'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveKeyword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ campaignId, keyword }: { campaignId: number; keyword: string }) =>
      fetchApi(`/campaigns/${campaignId}/keywords`, {
        method: 'DELETE',
        body: JSON.stringify({ keyword }),
      }),
    onSuccess: () => {
      toast({
        title: 'Mot-clé supprimé',
        description: 'Le mot-clé a été retiré de la campagne.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-campaign-keywords'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
