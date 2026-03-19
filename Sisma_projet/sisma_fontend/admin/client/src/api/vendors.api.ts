import { apiDelete, apiGet, apiGetBlob, apiPost, apiPut } from "@/api/http";

export interface AdminSupplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  address?: string;
  is_active: boolean | number;
  commission_rate?: number;
  invoice_frequency?: string;
  products_count?: number;
  pending_orders_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierPerformance {
  id: number;
  name: string;
  logo?: string;
  email: string;
  phone?: string;
  is_active: number;
  products_count: number;
  total_orders: number;
  revenue: number;
  pending_orders: number;
  delivery_success_rate: number;
  avg_rating: number;
  score: number;
  grade: string;
  rank: number;
  created_at?: string;
}

export interface SupplierMetrics {
  total_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

type SupplierStatus = "all" | "active" | "inactive" | "pending";
type SupplierBulkAction = "activate" | "deactivate" | "delete";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const vendorsApi = {
  listAdminSuppliers: (params?: { status?: SupplierStatus; search?: string; page?: number; per_page?: number }) =>
    apiGet<AdminSupplier[]>(
      `/api/v1/admin/suppliers${buildQuery({
        status: params?.status ?? "all",
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  getAdminSupplier: (id: number) => apiGet<AdminSupplier>(`/api/v1/admin/suppliers/${id}`),

  createAdminSupplier: (payload: Partial<AdminSupplier> & { send_invite?: boolean }) =>
    apiPost<{ id: number; signed_url?: string; expires_at?: string }>("/api/v1/admin/suppliers", payload),

  updateAdminSupplier: (id: number, payload: Partial<AdminSupplier>) =>
    apiPut<{ id: number }>(`/api/v1/admin/suppliers/${id}`, payload),

  deleteAdminSupplier: (id: number) => apiDelete<{ success: boolean; message: string }>(`/api/v1/admin/suppliers/${id}`),

  toggleAdminSupplierBlock: (id: number) =>
    apiPost<{ id: number; is_active: number }>(`/api/v1/admin/suppliers/${id}/block`, {}),

  resetAdminSupplierPassword: (id: number) =>
    apiPost<{ reset_url: string; expires_at: string }>(`/api/v1/admin/suppliers/${id}/reset-password`, {}),

  inviteAdminSupplier: (payload: { name: string; email: string; phone?: string }) =>
    apiPost<{ id: number; signed_url: string; expires_at: string }>("/api/v1/admin/suppliers/invite", payload),

  bulkAdminSuppliers: (supplierIds: number[], action: SupplierBulkAction) =>
    apiPost<{ affected_count: number; action: SupplierBulkAction }>("/api/v1/admin/suppliers/bulk-action", {
      supplier_ids: supplierIds,
      action,
    }),

  // Performance & Ranking
  getSupplierPerformance: (params?: { period?: string; sort_by?: string; sort_order?: string }) =>
    apiGet<SupplierPerformance[]>(
      `/api/v1/admin/suppliers/performance${buildQuery({
        period: params?.period ?? 'month',
        sort_by: params?.sort_by ?? 'score',
        sort_order: params?.sort_order ?? 'desc',
      })}`
    ),

  // Pending Registrations
  getPendingRegistrations: (params?: { search?: string; page?: number; per_page?: number }) =>
    apiGet<AdminSupplier[]>(
      `/api/v1/admin/suppliers/pending-registrations${buildQuery({
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  // Validate/Reject Supplier
  validateSupplier: (id: number) =>
    apiPost<{ success: boolean; message: string }>(`/api/v1/admin/suppliers/${id}/validate`, {}),

  rejectSupplier: (id: number, reason?: string) =>
    apiPost<{ success: boolean; message: string }>(`/api/v1/admin/suppliers/${id}/reject`, { reason }),

  // Export PDF
  exportSupplierPdf: (id: number) =>
    apiGetBlob(`/api/v1/admin/suppliers/${id}/export-pdf`),
};

