import { apiDelete, apiGet, apiGetBlob, apiPost, apiPut } from "@/api/http";

export interface AdminStatsPayload {
  orders_today: number;
  orders_week: number;
  orders_month: number;
  revenue_total: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_by_supplier: Array<{ supplier_id: number; revenue: number }>;
  out_of_stock_products: number;
  pending_suppliers: number;
  pending_drivers: number;
  unassigned_orders: number;
  charts: {
    orders_over_time: Array<{ date: string; orders: number; revenue: number }>;
    revenue_by_supplier: Array<{ supplier_id: number; supplier_name: string; revenue: number }>;
    top_products: Array<{ id: number; name: string; quantity_sold: number; revenue: number }>;
    delivery_success_rate: {
      total: number;
      delivered: number;
      exceptions: number;
      success_rate: number;
      exception_rate: number;
    };
  };
}

export interface OrdersReportPayload {
  period: { from: string; to: string };
  daily: Array<{ date: string; orders: number; revenue: number; avg_order_value: number }>;
  summary: { total_orders: number; total_revenue: number; avg_order_value: number };
}

export interface SupplierReportPayload {
  id: number;
  name: string;
  commission_rate: number;
  orders_count: number;
  revenue: number;
  commission: number;
}

export interface TopProductReportPayload {
  id: number;
  name: string;
  image?: string;
  quantity_sold: number;
  revenue: number;
}

export interface AdminCommissionsPayload {
  global_commission: number;
  supplier_commissions: Array<{ supplier_id: number; supplier_name: string; rate: number; type?: string }>;
}

export interface AdminCategoryPayload {
  id: number;
  name: string;
  slug: string;
  fields_config?: string;
  products_count?: number;
}

export interface DeliveryZonePayload {
  id: number;
  name: string;
  price: number;
  estimated_time?: string;
}

export const statsApi = {
  getAdminStats: () => apiGet<AdminStatsPayload>("/api/v1/admin/stats"),

  getAdminKpis: () => apiGet<Partial<AdminStatsPayload>>("/api/v1/admin/stats/kpis"),

  getOrdersReport: (from?: string, to?: string) =>
    apiGet<OrdersReportPayload>(`/api/v1/admin/reports/orders${from && to ? `?from=${from}&to=${to}` : ""}`),

  getSuppliersReport: (from?: string, to?: string) =>
    apiGet<SupplierReportPayload[]>(`/api/v1/admin/reports/suppliers${from && to ? `?from=${from}&to=${to}` : ""}`),

  getTopProductsReport: (limit = 10, from?: string, to?: string) =>
    apiGet<TopProductReportPayload[]>(
      `/api/v1/admin/reports/top-products?limit=${limit}${from && to ? `&from=${from}&to=${to}` : ""}`
    ),

  exportOrdersCsv: (from?: string, to?: string) =>
    apiGetBlob(`/api/v1/admin/reports/export/csv${from && to ? `?from=${from}&to=${to}` : ""}`),

  exportOrdersPdf: (from?: string, to?: string) =>
    apiGetBlob(`/api/v1/admin/reports/export/pdf${from && to ? `?from=${from}&to=${to}` : ""}`),

  getAdminCommissions: () => apiGet<AdminCommissionsPayload>("/api/v1/admin/settings/commissions"),

  updateGlobalCommission: (rate: number) => apiPut<{ success: boolean; message: string }>("/api/v1/admin/settings/commissions/global", { rate }),

  updateSupplierCommission: (supplierId: number, rate: number) =>
    apiPut<{ success: boolean; message: string }>("/api/v1/admin/settings/commissions/supplier", { supplier_id: supplierId, rate }),

  getAdminCategories: () => apiGet<AdminCategoryPayload[]>("/api/v1/admin/settings/categories"),

  createAdminCategory: (payload: { name: string; description?: string; image?: string }) =>
    apiPost<{ id: number; name: string }>("/api/v1/admin/settings/categories", payload),

  updateAdminCategory: (id: number, payload: { name?: string; description?: string; image?: string }) =>
    apiPut<{ success: boolean; message: string }>(`/api/v1/admin/settings/categories/${id}`, payload),

  deleteAdminCategory: (id: number) =>
    apiDelete<{ success: boolean; message: string }>(`/api/v1/admin/settings/categories/${id}`),

  reorderAdminCategories: (categoryIds: number[]) =>
    apiPut<{ success: boolean; message: string }>("/api/v1/admin/settings/categories/reorder", { order: categoryIds }),

  getAdminDeliveryZones: () => apiGet<DeliveryZonePayload[]>("/api/v1/admin/settings/delivery-zones"),

  createAdminDeliveryZone: (payload: { name: string; price: number; estimated_time?: string }) =>
    apiPost<{ id: number }>("/api/v1/admin/settings/delivery-zones", payload),

  deleteAdminDeliveryZone: (id: number) => apiDelete<{ success: boolean; message: string }>(`/api/v1/admin/settings/delivery-zones/${id}`),

  updateAdminSettings: (payload: Record<string, unknown>) => apiPut<{ success: boolean; message: string }>("/api/v1/admin/settings", payload),
};
