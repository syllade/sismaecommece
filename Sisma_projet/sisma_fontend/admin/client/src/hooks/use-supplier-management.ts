import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/api/http';

export interface Supplier {
  id: number;
  name: string;
  store_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  is_active: boolean;
  commission_rate?: number;
  rating?: number;
  created_at?: string;
  products_count?: number;
  orders_count?: number;
}

export interface SupplierMetrics {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageRating: number;
  cancellationRate: number;
  activeSince: string;
  lastOrderDate: string | null;
}

export interface SupplierPerformance {
  id: number;
  name: string;
  store_name: string;
  metrics: SupplierMetrics;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SupplierActivity {
  id: number;
  type: 'order' | 'product' | 'status' | 'settings';
  description: string;
  timestamp: string;
}

// API functions
export const supplierManagementApi = {
  // List suppliers with filters
  listSuppliers: (params?: {
    status?: 'all' | 'active' | 'inactive' | 'pending';
    search?: string;
    page?: number;
    per_page?: number;
  }) => apiGet<Supplier[]>(
    `/api/v1/admin/suppliers${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`
  ),

  // Get single supplier details
  getSupplier: (id: number) => apiGet<Supplier>(`/api/v1/admin/suppliers/${id}`),

  // Get supplier metrics
  getSupplierMetrics: (id: number) => apiGet<SupplierMetrics>(`/api/v1/admin/suppliers/${id}/metrics`),

  // Get supplier performance
  getSupplierPerformance: (id: number) => apiGet<SupplierPerformance>(`/api/v1/admin/suppliers/${id}/performance`),

  // Get all supplier rankings
  getSupplierRankings: (params?: { period?: 'week' | 'month' | 'year'; limit?: number }) => 
    apiGet<SupplierPerformance[]>(
      `/api/v1/admin/suppliers/rankings${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`
    ),

  // Get supplier activity
  getSupplierActivity: (id: number) => apiGet<SupplierActivity[]>(`/api/v1/admin/suppliers/${id}/activity`),

  // Create supplier
  createSupplier: (data: Partial<Supplier> & { send_invite?: boolean }) => 
    apiPost<{ id: number; signed_url?: string }>('/api/v1/admin/suppliers', data),

  // Update supplier
  updateSupplier: (id: number, data: Partial<Supplier>) => 
    apiPost<{ id: number }>(`/api/v1/admin/suppliers/${id}`, data),

  // Approve supplier
  approveSupplier: (id: number) => apiPost<{ success: boolean }>(`/api/v1/admin/suppliers/${id}/approve`, {}),

  // Reject supplier
  rejectSupplier: (id: number, reason: string) => 
    apiPost<{ success: boolean }>(`/api/v1/admin/suppliers/${id}/reject`, { reason }),

  // Suspend supplier
  suspendSupplier: (id: number, reason?: string) => 
    apiPost<{ success: boolean }>(`/api/v1/admin/suppliers/${id}/suspend`, { reason }),

  // Reactivate supplier
  reactivateSupplier: (id: number) => 
    apiPost<{ success: boolean }>(`/api/v1/admin/suppliers/${id}/reactivate`, {}),

  // Delete supplier
  deleteSupplier: (id: number) => apiDelete<{ success: boolean }>(`/api/v1/admin/suppliers/${id}`),

  // Bulk actions
  bulkAction: (ids: number[], action: 'activate' | 'deactivate' | 'delete' | 'suspend') => 
    apiPost<{ affected_count: number }>('/api/v1/admin/suppliers/bulk-action', {
      supplier_ids: ids,
      action,
    }),
};

// Hooks
export function useSuppliers(params?: { status?: 'all' | 'active' | 'inactive' | 'pending'; search?: string }) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => supplierManagementApi.listSuppliers(params),
    staleTime: 30000,
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierManagementApi.getSupplier(id),
    enabled: !!id,
  });
}

export function useSupplierMetrics(id: number) {
  return useQuery({
    queryKey: ['supplier', id, 'metrics'],
    queryFn: () => supplierManagementApi.getSupplierMetrics(id),
    enabled: !!id,
  });
}

export function useSupplierRankings(period: 'week' | 'month' | 'year' = 'month', limit = 10) {
  return useQuery({
    queryKey: ['supplier', 'rankings', period, limit],
    queryFn: () => supplierManagementApi.getSupplierRankings({ period, limit }),
  });
}

export function useSupplierActivity(id: number) {
  return useQuery({
    queryKey: ['supplier', id, 'activity'],
    queryFn: () => supplierManagementApi.getSupplierActivity(id),
    enabled: !!id,
    refetchInterval: 60000,
  });
}

// Mutations
export function useApproveSupplier() {
  return useMutation({
    mutationFn: (id: number) => supplierManagementApi.approveSupplier(id),
  });
}

export function useRejectSupplier() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      supplierManagementApi.rejectSupplier(id, reason),
  });
}

export function useSuspendSupplier() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => 
      supplierManagementApi.suspendSupplier(id, reason),
  });
}

export function useReactivateSupplier() {
  return useMutation({
    mutationFn: (id: number) => supplierManagementApi.reactivateSupplier(id),
  });
}

export function useDeleteSupplier() {
  return useMutation({
    mutationFn: (id: number) => supplierManagementApi.deleteSupplier(id),
  });
}

export function useBulkSupplierAction() {
  return useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: 'activate' | 'deactivate' | 'delete' | 'suspend' }) =>
      supplierManagementApi.bulkAction(ids, action),
  });
}

// Helper functions
export function calculatePerformanceScore(metrics: SupplierMetrics): number {
  const completionRate = metrics.totalOrders > 0 
    ? (metrics.completedOrders / metrics.totalOrders) * 100 
    : 100;
  const ratingScore = (metrics.averageRating / 5) * 100;
  const orderValueScore = Math.min(100, (metrics.averageOrderValue / 50000) * 100);
  
  return Math.round(
    completionRate * 0.4 +
    ratingScore * 0.35 +
    orderValueScore * 0.25
  );
}

export function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
