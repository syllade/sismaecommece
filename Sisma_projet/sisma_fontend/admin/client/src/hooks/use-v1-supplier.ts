import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';

// Base API URL
const API_URL = '/api/v1/supplier';

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
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total: number;
  variants?: Record<string, string>;
}

export interface SupplierProduct {
  id: number;
  supplier_id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  discount: number;
  final_price: number;
  stock: number;
  sku: string;
  image: string;
  images: string[];
  is_variable: boolean;
  is_active: boolean;
  status: string;
  commission_rate: number;
  colors: string[];
  sizes: string[];
  dynamic_fields: Record<string, any>;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  supplier_id: number;
  product_id: number;
  product_name?: string;
  product_image?: string;
  name: string;
  type: string;
  budget: number;
  spent: number;
  remaining: number;
  cpc: number;
  ctr: number;
  acos: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
}

export interface SupplierProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  banner?: string;
  description?: string;
  commission_rate: number;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// ============ Dashboard Hooks ============

export function useSupplierDashboard() {
  return useQuery<SupplierDashboard>({
    queryKey: ['supplier', 'dashboard'],
    queryFn: () => fetchApi('/dashboard'),
  });
}

export function useSupplierRevenue(period: string = 'day', days: number = 30) {
  return useQuery({
    queryKey: ['supplier', 'dashboard', 'revenue', period, days],
    queryFn: () => fetchApi(`/dashboard/revenue?period=${period}&days=${days}`),
  });
}

export function useSupplierOrdersByStatus(days: number = 30) {
  return useQuery({
    queryKey: ['supplier', 'dashboard', 'orders-by-status', days],
    queryFn: () => fetchApi(`/dashboard/orders-by-status?days=${days}`),
  });
}

export function useSupplierTopProducts(limit: number = 10, days: number = 30) {
  return useQuery({
    queryKey: ['supplier', 'dashboard', 'top-products', limit, days],
    queryFn: () => fetchApi(`/dashboard/top-products?limit=${limit}&days=${days}`),
  });
}

export function useSupplierRecentOrders(limit: number = 10) {
  return useQuery({
    queryKey: ['supplier', 'dashboard', 'recent-orders', limit],
    queryFn: () => fetchApi(`/dashboard/recent-orders?limit=${limit}`),
  });
}

// ============ Orders Hooks ============

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
    queryKey: ['supplier', 'orders', params],
    queryFn: () => fetchApi(`/orders?${queryParams.toString()}`),
  });
}

export function useSupplierOrder(id: number) {
  return useQuery<{ order: SupplierOrder; items: OrderItem[] }>({
    queryKey: ['supplier', 'orders', id],
    queryFn: () => fetchApi(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetchApi(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
}

export function useBulkUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: number[]; status: string }) =>
      fetchApi('/orders/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ order_ids: orderIds, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
}

export function useCreateManualOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      client_name: string;
      client_phone: string;
      client_address: string;
      commune?: string;
      products: Array<{
        product_id: number;
        quantity: number;
        price_override?: number;
      }>;
      delivery_date?: string;
      delivery_time?: string;
      notes?: string;
    }) =>
      fetchApi('/orders/manual', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
}

export function usePendingOrdersCount() {
  return useQuery<{ pending_count: number }>({
    queryKey: ['supplier', 'orders', 'pending-count'],
    queryFn: () => fetchApi('/orders/pending-count'),
  });
}

// ============ Products Hooks ============

export function useSupplierProducts(params?: {
  status?: string;
  is_active?: boolean;
  category_id?: number;
  search?: string;
  stock_status?: string;
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
    queryKey: ['supplier', 'products', params],
    queryFn: () => fetchApi(`/products?${queryParams.toString()}`),
  });
}

export function useSupplierProduct(id: number) {
  return useQuery<{ product: SupplierProduct; variants: any[]; category_fields: any[] }>({
    queryKey: ['supplier', 'products', id],
    queryFn: () => fetchApi(`/products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SupplierProduct>) =>
      fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierProduct> }) =>
      fetchApi(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/products/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
}

export function useImportProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`${API_URL}/products/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Import failed' }));
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
}

export function useExportProducts() {
  return useMutation({
    mutationFn: () => fetchApi('/products/export'),
  });
}

// ============ AI Hooks ============

export function useAIGenerateDescription() {
  return useMutation({
    mutationFn: (data: {
      product_name: string;
      keywords?: string[];
      tone?: 'professional' | 'friendly' | 'formal' | 'casual' | 'persuasive';
      length?: 'short' | 'medium' | 'long';
      language?: 'fr' | 'en';
      category?: string;
      features?: string[];
    }) =>
      fetchApi('/ai/generate-description', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useAIGenerateVariations() {
  return useMutation({
    mutationFn: (data: {
      product_name: string;
      count?: number;
      language?: 'fr' | 'en';
    }) =>
      fetchApi('/ai/generate-variations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useAITranslate() {
  return useMutation({
    mutationFn: (data: {
      text: string;
      target_language: 'fr' | 'en';
      source_language?: 'fr' | 'en' | 'auto';
    }) =>
      fetchApi('/ai/translate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useAIImprove() {
  return useMutation({
    mutationFn: (data: {
      description: string;
      improvement_type?: 'seo' | 'engagement' | 'clarity' | 'length';
      language?: 'fr' | 'en';
    }) =>
      fetchApi('/ai/improve', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useAIStats() {
  return useQuery({
    queryKey: ['supplier', 'ai', 'stats'],
    queryFn: () => fetchApi('/ai/stats'),
  });
}

// ============ Marketing Hooks ============

export function useSupplierCampaigns(params?: {
  status?: string;
  type?: string;
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
    queryKey: ['supplier', 'campaigns', params],
    queryFn: () => fetchApi(`/campaigns?${queryParams.toString()}`),
  });
}

export function useSupplierCampaign(id: number) {
  return useQuery<{ campaign: Campaign; product: any; stats: any }>({
    queryKey: ['supplier', 'campaigns', id],
    queryFn: () => fetchApi(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      type: 'sponsored' | 'featured' | 'banner';
      product_id: number;
      budget: number;
      cpc?: number;
      start_date?: string;
      end_date?: string;
    }) =>
      fetchApi('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Campaign> }) =>
      fetchApi(`/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'campaigns'] });
    },
  });
}

export function useToggleCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/campaigns/${id}/toggle`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/campaigns/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'campaigns'] });
    },
  });
}

export function useCampaignStats(id: number) {
  return useQuery({
    queryKey: ['supplier', 'campaigns', id, 'stats'],
    queryFn: () => fetchApi(`/campaigns/${id}/stats`),
    enabled: !!id,
  });
}

export function useAdvertisingBalance() {
  return useQuery<{ balance: number; currency: string }>({
    queryKey: ['supplier', 'advertising', 'balance'],
    queryFn: () => fetchApi('/advertising/balance'),
  });
}

export function useDepositFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) =>
      fetchApi('/advertising/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'advertising', 'balance'] });
    },
  });
}

// ============ Settings Hooks ============

export function useSupplierProfile() {
  return useQuery<{ supplier: SupplierProfile; user: any }>({
    queryKey: ['supplier', 'settings', 'profile'],
    queryFn: () => fetchApi('/settings/profile'),
  });
}

export function useUpdateSupplierProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SupplierProfile>) =>
      fetchApi('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'settings', 'profile'] });
    },
  });
}

export function useNotificationSettings() {
  return useQuery<{ settings: Record<string, boolean> }>({
    queryKey: ['supplier', 'settings', 'notifications'],
    queryFn: () => fetchApi('/settings/notifications'),
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Record<string, boolean>) =>
      fetchApi('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'settings', 'notifications'] });
    },
  });
}

export function useBillingSettings() {
  return useQuery({
    queryKey: ['supplier', 'settings', 'billing'],
    queryFn: () => fetchApi('/settings/billing'),
  });
}

export function useDeliverySettings() {
  return useQuery({
    queryKey: ['supplier', 'settings', 'delivery'],
    queryFn: () => fetchApi('/settings/delivery'),
  });
}

export function useUpdateDeliverySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Record<string, any>) =>
      fetchApi('/settings/delivery', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'settings', 'delivery'] });
    },
  });
}

export function useSupplierApiKeys() {
  return useQuery<{ keys: Array<{ id: number; name: string; prefix: string; last_used_at?: string; created_at: string }> }>({
    queryKey: ['supplier', 'settings', 'api'],
    queryFn: () => fetchApi('/settings/api'),
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      fetchApi('/settings/api/generate', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'settings', 'api'] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/settings/api/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'settings', 'api'] });
    },
  });
}
