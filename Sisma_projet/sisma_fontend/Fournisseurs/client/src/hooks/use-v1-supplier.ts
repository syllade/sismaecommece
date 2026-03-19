import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

// Base API URL for v1
const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
const API_BASE = `${API_ROOT}/v1/supplier`;
const SUPPLIER_TOKEN_KEY = "sisma_supplier_token";
const LEGACY_SUPPLIER_TOKEN_KEY = "fashop_supplier_token";

// Types
export interface SupplierDashboard {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  orders: {
    pending: number;
    total: number;
    completed: number;
    cancelled: number;
  };
  products: {
    active: number;
    out_of_stock: number;
    low_stock: number;
    pending_approval: number;
    rejected: number;
  };
  payments: {
    pending: number;
  };
  analytics: {
    conversion_rate: number;
    average_basket: number;
    total_views: number;
  };
  supplier: {
    name: string;
    commission_rate: number;
  };
}

export interface SupplierOrder {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  client_address: string;
  commune?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

export interface SupplierProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: string;
  image?: string;
}

export interface Campaign {
  id: number;
  name: string;
  type: string;
  budget: number;
  spent: number;
  status: string;
  ctr: number;
  acos: number;
}

function getSupplierToken(): string {
  const token = localStorage.getItem(SUPPLIER_TOKEN_KEY);
  if (token) return token;
  const legacyToken = localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY);
  if (legacyToken) {
    localStorage.setItem(SUPPLIER_TOKEN_KEY, legacyToken);
    localStorage.removeItem(LEGACY_SUPPLIER_TOKEN_KEY);
    return legacyToken;
  }
  return "";
}

function buildApiPath(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) return endpoint;
  if (endpoint.startsWith("/api/")) return `${API_ROOT}${endpoint.replace(/^\/api/, "")}`;
  return `${API_BASE}${endpoint}`;
}

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getSupplierToken();
  const hasFormDataBody = typeof FormData !== "undefined" && options?.body instanceof FormData;

  const response = await fetch(buildApiPath(endpoint), {
    ...options,
    headers: {
      ...(hasFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem(SUPPLIER_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("app:unauthorized", { detail: { status: 401 } }));
    throw new Error("Session expirée");
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

// ============ Dashboard Hooks ============

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders_count: number;
}

export interface TopProductData {
  product_id: number;
  product_name: string;
  total_sold: number;
  revenue: number;
  image?: string;
}

export function useRevenueChart(period: 'day' | 'week' | 'month' = 'day', days: number = 30) {
  return useQuery<RevenueChartData[]>({
    queryKey: ['supplier-v1', 'dashboard', 'revenue', period, days],
    queryFn: () => fetchApi(`/dashboard/revenue?period=${period}&days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopProducts(limit: number = 10, days: number = 30) {
  return useQuery<TopProductData[]>({
    queryKey: ['supplier-v1', 'dashboard', 'top-products', limit, days],
    queryFn: () => fetchApi(`/dashboard/top-products?limit=${limit}&days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplierDashboard() {
  return useQuery<SupplierDashboard>({
    queryKey: ['supplier-v1', 'dashboard'],
    queryFn: () => fetchApi('/dashboard'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useSupplierRevenue(period: string = 'day', days: number = 30) {
  return useQuery({
    queryKey: ['supplier-v1', 'dashboard', 'revenue', period, days],
    queryFn: () => fetchApi(`/dashboard/revenue?period=${period}&days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplierTopProducts(limit: number = 10, days: number = 30) {
  return useQuery({
    queryKey: ['supplier-v1', 'dashboard', 'top-products', limit, days],
    queryFn: () => fetchApi(`/dashboard/top-products?limit=${limit}&days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}

// ============ Orders Hooks ============

export interface ManualOrderItem {
  product_id: number;
  product_name?: string;
  quantity: number;
  price_override?: number;
  variants?: Record<string, string>;
}

export interface ManualOrderData {
  client_name: string;
  client_phone: string;
  client_address: string;
  commune?: string;
  products: ManualOrderItem[];
  delivery_date?: string;
  delivery_time?: string;
  notes?: string;
}

export function useSupplierOrders(params?: {
  status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['supplier-v1', 'orders', params],
    queryFn: () => fetchApi(`/orders?${queryParams.toString()}`),
  });
}

export function useSupplierOrder(id: number) {
  return useQuery<{ order: SupplierOrder; items: any[] }>({
    queryKey: ['supplier-v1', 'orders', id],
    queryFn: () => fetchApi(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetchApi(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast({
        title: 'Statut mis à jour',
        description: 'Le client sera notifié du changement.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'dashboard'] });
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

export function useCreateManualOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi('/orders/manual', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Commande créée',
        description: 'La commande a été créée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'dashboard'] });
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

export function usePendingOrdersCount() {
  return useQuery<{ pending_count: number }>({
    queryKey: ['supplier-v1', 'orders', 'pending-count'],
    queryFn: () => fetchApi('/orders/pending-count'),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ============ Settings Hooks ============

export interface SupplierProfileResponse {
  supplier: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
    banner?: string;
    description?: string;
    commission_rate?: number;
    is_approved?: boolean;
    is_active?: boolean;
    created_at?: string;
  };
  user?: {
    id: number;
    name?: string;
    email?: string;
  };
}

export interface SupplierNotificationSettingsResponse {
  settings: Record<string, string | number | boolean>;
}

export interface SupplierDeliverySettingsResponse {
  settings: Record<string, string | number | boolean | string[]>;
}

export function useSupplierProfile() {
  return useQuery<SupplierProfileResponse>({
    queryKey: ['supplier-v1', 'settings', 'profile'],
    queryFn: () => fetchApi('/settings/profile'),
    staleTime: 60 * 1000,
  });
}

export function useUpdateSupplierProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      phone?: string;
      address?: string;
      description?: string;
      logo?: string;
      banner?: string;
    }) =>
      fetchApi('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'settings', 'profile'] });
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

export function useSupplierNotificationSettings() {
  return useQuery<SupplierNotificationSettingsResponse>({
    queryKey: ['supplier-v1', 'settings', 'notifications'],
    queryFn: () => fetchApi('/settings/notifications'),
    staleTime: 60 * 1000,
  });
}

export function useUpdateSupplierNotificationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      fetchApi('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Notifications mises à jour',
        description: 'Vos préférences sont enregistrées.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'settings', 'notifications'] });
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

export function useSupplierDeliverySettings() {
  return useQuery<SupplierDeliverySettingsResponse>({
    queryKey: ['supplier-v1', 'settings', 'delivery'],
    queryFn: () => fetchApi('/settings/delivery'),
    staleTime: 60 * 1000,
  });
}

export function useUpdateSupplierDeliverySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchApi('/settings/delivery', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Livraison mise à jour',
        description: 'Vos paramètres de livraison sont enregistrés.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'settings', 'delivery'] });
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

// ============ Order Notifications Hooks ============

export interface OrderNotification {
  id: number;
  order_id: number;
  type: 'whatsapp' | 'email' | 'sms';
  status: 'pending' | 'sent' | 'failed';
  message?: string;
  recipient?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export function useOrderNotifications(orderId: number) {
  return useQuery<OrderNotification[]>({
    queryKey: ['supplier-v1', 'orders', orderId, 'notifications'],
    queryFn: () => fetchApi(`/orders/${orderId}/notifications`),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  });
}

export function useSendWhatsApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (orderId: number) =>
      fetchApi(`/orders/${orderId}/send-whatsapp`, { method: 'POST' }),
    onSuccess: (data, orderId) => {
      toast({
        title: 'WhatsApp généré',
        description: 'L\'historique des notifications a été mis à jour.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'orders', orderId, 'notifications'] });
      // Open WhatsApp in new tab
      const responseData = data as { whatsapp_url?: string };
      if (responseData.whatsapp_url) {
        window.open(responseData.whatsapp_url, '_blank');
      }
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

export function useSendEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (orderId: number) =>
      fetchApi(`/orders/${orderId}/send-email`, { method: 'POST' }),
    onSuccess: (data, orderId) => {
      toast({
        title: 'Email envoyé',
        description: 'Le client devrait recevoir l\'email sous peu.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'orders', orderId, 'notifications'] });
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

export function useInvoiceHtml(orderId: number) {
  return useQuery<{ html: string; order_number: string }>({
    queryKey: ['supplier-v1', 'orders', orderId, 'invoice-html'],
    queryFn: () => fetchApi(`/orders/${orderId}/invoice-html`),
    enabled: !!orderId,
    staleTime: 60 * 1000,
  });
}

export function usePrintView(orderId: number) {
  return useQuery<{ html: string }>({
    queryKey: ['supplier-v1', 'orders', orderId, 'print'],
    queryFn: () => fetchApi(`/orders/${orderId}/print`),
    enabled: !!orderId,
    staleTime: 60 * 1000,
  });
}

// ============ Products Hooks ============

export function useSupplierProducts(params?: any) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['supplier-v1', 'products', params],
    queryFn: () => fetchApi(`/products?${queryParams.toString()}`),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Produit créé',
        description: 'Votre produit a été ajouté au catalogue.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'dashboard'] });
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

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetchApi(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Produit mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'products'] });
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

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/products/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'dashboard'] });
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

// ============ Marketing Hooks ============

export function useAIGenerateDescription() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi('/ai/generate-description', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onError: (error: Error) => {
      toast({
        title: 'Erreur IA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ Category Schema Hooks ============

export interface CategoryField {
  name: string;
  type: 'text' | 'select' | 'textarea' | 'number' | 'date' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  help_text?: string;
}

export interface CategorySchema {
  category: {
    id: number;
    name: string;
    slug: string;
  };
  fields: CategoryField[];
  version: string;
}

export function useCategorySchema(categoryId: number) {
  return useQuery<CategorySchema>({
    queryKey: ['category', 'schema', categoryId],
    queryFn: () => fetchApi(`/api/categories/${categoryId}/schema`),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============ Marketing Hooks ============

export function useSupplierCampaigns(params?: any) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['supplier-v1', 'campaigns', params],
    queryFn: () => fetchApi(`/campaigns?${queryParams.toString()}`),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Campagne créée',
        description: 'Votre campagne est en attente de validation.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'campaigns'] });
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

export function useToggleCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/campaigns/${id}/toggle`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'campaigns'] });
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
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'campaigns'] });
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

export function useAdvertisingBalance() {
  return useQuery<{ balance: number; currency: string }>({
    queryKey: ['supplier-v1', 'advertising', 'balance'],
    queryFn: () => fetchApi('/advertising/balance'),
  });
}

export function useDepositFunds() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (amount: number) =>
      fetchApi('/advertising/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
    onSuccess: () => {
      toast({
        title: 'Funds added',
        description: 'Your advertising balance has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'advertising', 'balance'] });
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
