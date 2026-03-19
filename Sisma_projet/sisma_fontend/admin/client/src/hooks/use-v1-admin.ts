import { useQuery, useMutation } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "@/lib/apiConfig";

// ========== TYPES ==========

export interface V1Stats {
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
    revenue_by_supplier: Array<{ supplier_id: number; revenue: number }>;
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

export interface V1Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  address?: string;
  is_active: boolean;
  commission_rate: number;
  invoice_frequency: string;
  products_count?: number;
  pending_orders_count?: number;
  created_at: string;
  updated_at: string;
}

export interface V1Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_type?: string;
  zone: string;
  is_active: boolean;
  total_orders?: number;
  completed_orders?: number;
  created_at: string;
  updated_at: string;
}

export interface V1Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  commune?: string;
  quartier?: string;
  delivery_person_id?: number;
  delivery_person?: V1Driver | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: "pending" | "preparee" | "expediee" | "livree" | "annulee";
  notes?: string;
  delivery_date?: string;
  created_at: string;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  items_count: number;
}

export interface V1LogisticsLive {
  active_deliveries: V1Order[];
  exceptions: V1Order[];
  driver_positions: Array<{
    id: number;
    name: string;
    phone: string;
    zone: string;
    vehicle_type: string;
    latitude: number;
    longitude: number;
    last_update: string;
    status: string;
  }>;
}

export interface V1Zone {
  zone: string;
  total_orders: number;
  delivered: number;
  cancelled: number;
  in_progress: number;
  revenue: number;
  active_drivers: number;
  coverage_status: "covered" | "undercapacity";
}

export interface V1Alert {
  type: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
  count: number;
  zone?: string;
}

export interface V1Campaign {
  id: number;
  product_id: number;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  budget: number;
  cpc: number;
  status: "pending" | "approved" | "rejected" | "paused";
  impressions: number;
  clicks: number;
  spend: number;
  attributed_revenue: number;
  ctr: number;
  acos: number;
  created_at: string;
  updated_at: string;
}

export interface V1DeliveryZone {
  id: number;
  name: string;
  price: number;
  estimated_time?: string;
  created_at: string;
  updated_at: string;
}

// ========== HELPERS ==========

async function fetchV1<T>(endpoint: string): Promise<T> {
  const response = await fetch(buildApiUrl(endpoint), {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(`API Error (${response.status})`);
  }
  
  const json = await response.json();
  return json.data ?? json;
}

async function postV1<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(endpoint), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`API Error (${response.status})`);
  }
  
  const json = await response.json();
  return json.data ?? json;
}

// ========== HOOKS ==========

// Dashboard Stats
export function useV1Stats() {
  return useQuery({
    queryKey: ['v1', 'stats'],
    queryFn: () => fetchV1<V1Stats>('/api/v1/admin/stats'),
    refetchInterval: 30000, // 30 seconds
  });
}

export function useV1Kpis() {
  return useQuery({
    queryKey: ['v1', 'kpis'],
    queryFn: () => fetchV1<V1Stats>('/api/v1/admin/stats/kpis'),
    refetchInterval: 30000,
  });
}

// Suppliers
export function useV1Suppliers(params?: { status?: string; search?: string; page?: number; per_page?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));
  
  const query = searchParams.toString();
  
  return useQuery({
    queryKey: ['v1', 'suppliers', params],
    queryFn: () => fetchV1<V1Supplier[]>(`/api/v1/admin/suppliers${query ? '?' + query : ''}`),
    refetchInterval: 45000,
  });
}

export function useV1CreateSupplier() {
  return useMutation({
    mutationFn: (data: Partial<V1Supplier> & { send_invite?: boolean }) =>
      postV1<{ id: number; signed_url?: string }>('/api/v1/admin/suppliers', data),
  });
}

export function useV1UpdateSupplier() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<V1Supplier> }) =>
      postV1<{ id: number }>(`/api/v1/admin/suppliers/${id}`, data),
  });
}

export function useV1BlockSupplier() {
  return useMutation({
    mutationFn: (id: number) =>
      postV1<{ id: number; is_active: number }>(`/api/v1/admin/suppliers/${id}/block`, {}),
  });
}

export function useV1ResetSupplierPassword() {
  return useMutation({
    mutationFn: (id: number) =>
      postV1<{ reset_url: string }>(`/api/v1/admin/suppliers/${id}/reset-password`, {}),
  });
}

export function useV1InviteSupplier() {
  return useMutation({
    mutationFn: (data: { name: string; email: string; phone?: string }) =>
      postV1<{ id: number; signed_url: string }>('/api/v1/admin/suppliers/invite', data),
  });
}

// Drivers
export function useV1Drivers(params?: { status?: string; zone?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.zone) searchParams.set('zone', params.zone);
  if (params?.search) searchParams.set('search', params.search);
  
  const query = searchParams.toString();
  
  return useQuery({
    queryKey: ['v1', 'drivers', params],
    queryFn: () => fetchV1<V1Driver[]>(`/api/v1/admin/drivers${query ? '?' + query : ''}`),
    refetchInterval: 45000,
  });
}

export function useV1CreateDriver() {
  return useMutation({
    mutationFn: (data: Partial<V1Driver>) =>
      postV1<{ id: number; signed_url?: string }>('/api/v1/admin/drivers', data),
  });
}

export function useV1UpdateDriver() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<V1Driver> }) =>
      postV1<{ id: number }>(`/api/v1/admin/drivers/${id}`, data),
  });
}

export function useV1ToggleDriverStatus() {
  return useMutation({
    mutationFn: (id: number) =>
      postV1<{ id: number; is_active: number }>(`/api/v1/admin/drivers/${id}/toggle-status`, {}),
  });
}

export function useV1DriverZones() {
  return useQuery({
    queryKey: ['v1', 'driver-zones'],
    queryFn: () => fetchV1<string[]>('/api/v1/admin/drivers/zones'),
  });
}

// Orders
export function useV1Orders(params?: {
  status?: string;
  supplier_id?: number;
  driver_id?: number;
  commune?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.supplier_id) searchParams.set('supplier_id', String(params.supplier_id));
  if (params?.driver_id) searchParams.set('driver_id', String(params.driver_id));
  if (params?.commune) searchParams.set('commune', params.commune);
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));
  
  return useQuery({
    queryKey: ['v1', 'orders', params],
    queryFn: () => fetchV1<V1Order[]>(`/api/v1/admin/orders?${searchParams.toString()}`),
    refetchInterval: 30000,
  });
}

export function useV1UpdateOrderStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      postV1<{ id: number; status: string }>(`/api/v1/admin/orders/${id}/status`, { status }),
  });
}

export function useV1AssignDriver() {
  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) =>
      postV1<{ id: number; delivery_person_id: number }>(`/api/v1/admin/orders/${orderId}/assign-driver`, { driver_id: driverId }),
  });
}

export function useV1BulkAssignDriver() {
  return useMutation({
    mutationFn: ({ orderIds, driverId }: { orderIds: number[]; driverId: number }) =>
      postV1<{ affected_count: number }>('/api/v1/admin/orders/assign-driver', { order_ids: orderIds, driver_id: driverId }),
  });
}

export function useV1UnprocessedOrders(hours: number = 24) {
  return useQuery({
    queryKey: ['v1', 'unprocessed-orders', hours],
    queryFn: () => fetchV1<V1Order[]>(`/api/v1/admin/orders/unprocessed?hours=${hours}`),
    refetchInterval: 60000,
  });
}

// Logistics
export function useV1LogisticsLive() {
  return useQuery({
    queryKey: ['v1', 'logistics', 'live'],
    queryFn: () => fetchV1<V1LogisticsLive>('/api/v1/admin/logistics/live'),
    refetchInterval: 15000, // 15 seconds for real-time
  });
}

export function useV1LogisticsZones() {
  return useQuery({
    queryKey: ['v1', 'logistics', 'zones'],
    queryFn: () => fetchV1<V1Zone[]>('/api/v1/admin/logistics/zones'),
    refetchInterval: 60000,
  });
}

export function useV1LogisticsAlerts(hours: number = 24) {
  return useQuery({
    queryKey: ['v1', 'logistics', 'alerts', hours],
    queryFn: () => fetchV1<V1Alert[]>(`/api/v1/admin/logistics/alerts?hours=${hours}`),
    refetchInterval: 30000,
  });
}

export function useV1LogisticsTours(date?: string) {
  return useQuery({
    queryKey: ['v1', 'logistics', 'tours', date],
    queryFn: () => fetchV1<Array<{ commune: string; time_slot: string; order_ids: number[]; count: number }>>(
      `/api/v1/admin/logistics/tours${date ? '?date=' + date : ''}`
    ),
    refetchInterval: 60000,
  });
}

// Marketing Campaigns
export function useV1Campaigns(params?: { status?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  
  return useQuery({
    queryKey: ['v1', 'campaigns', params],
    queryFn: () => fetchV1<V1Campaign[]>(`/api/v1/admin/campaigns?${searchParams.toString()}`),
    refetchInterval: 60000,
  });
}

export function useV1CreateCampaign() {
  return useMutation({
    mutationFn: (data: Partial<V1Campaign>) =>
      postV1<{ id: number }>('/api/v1/admin/campaigns', data),
  });
}

export function useV1ApproveCampaign() {
  return useMutation({
    mutationFn: (id: number) =>
      postV1<{ success: boolean }>(`/api/v1/admin/campaigns/${id}/approve`, {}),
  });
}

export function useV1RejectCampaign() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      postV1<{ success: boolean }>(`/api/v1/admin/campaigns/${id}/reject`, { reason }),
  });
}

// Reports
export function useV1ReportOrders(from?: string, to?: string) {
  return useQuery({
    queryKey: ['v1', 'reports', 'orders', from, to],
    queryFn: () => fetchV1<{
      period: { from: string; to: string };
      daily: Array<{ date: string; orders: number; revenue: number; avg_order_value: number }>;
      summary: { total_orders: number; total_revenue: number; avg_order_value: number };
    }>(`/api/v1/admin/reports/orders?from=${from}&to=${to}`),
  });
}

export function useV1ReportTopProducts(limit: number = 10) {
  return useQuery({
    queryKey: ['v1', 'reports', 'top-products', limit],
    queryFn: () => fetchV1<Array<{ id: number; name: string; image: string; quantity_sold: number; revenue: number }>>(
      `/api/v1/admin/reports/top-products?limit=${limit}`
    ),
  });
}

// Settings - Delivery Zones
export function useV1DeliveryZones() {
  return useQuery({
    queryKey: ['v1', 'settings', 'delivery-zones'],
    queryFn: () => fetchV1<V1DeliveryZone[]>('/api/v1/admin/settings/delivery-zones'),
  });
}

export function useV1CreateDeliveryZone() {
  return useMutation({
    mutationFn: (data: { name: string; price: number; estimated_time?: string }) =>
      postV1<{ id: number }>('/api/v1/admin/settings/delivery-zones', data),
  });
}

export function useV1UpdateDeliveryZone() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<V1DeliveryZone> }) =>
      postV1<{ success: boolean }>(`/api/v1/admin/settings/delivery-zones/${id}`, data),
  });
}

export function useV1DeleteDeliveryZone() {
  return useMutation({
    mutationFn: (id: number) =>
      postV1<{ success: boolean }>(`/api/v1/admin/settings/delivery-zones/${id}`, {}),
  });
}

// Settings - Categories
export function useV1Categories() {
  return useQuery({
    queryKey: ['v1', 'settings', 'categories'],
    queryFn: () => fetchV1<Array<{ id: number; name: string; slug: string; fields_config: string; products_count: number }>>(
      '/api/v1/admin/settings/categories'
    ),
  });
}

export function useV1CreateCategory() {
  return useMutation({
    mutationFn: (data: { name: string; slug?: string; fields_config?: string }) =>
      postV1<{ id: number }>('/api/v1/admin/settings/categories', data),
  });
}

export function useV1UpdateCategory() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; slug: string; fields_config: string }> }) =>
      postV1<{ success: boolean }>(`/api/v1/admin/settings/categories/${id}`, data),
  });
}

export function useV1DeleteCategory() {
  return useMutation({
    mutationFn: (id: number) =>
      postV1<{ success: boolean }>(`/api/v1/admin/settings/categories/${id}`, {}),
  });
}

// Settings - Commissions
export function useV1Commissions() {
  return useQuery({
    queryKey: ['v1', 'settings', 'commissions'],
    queryFn: () => fetchV1<{
      global_commission: number;
      supplier_commissions: Array<{ supplier_id: number; supplier_name: string; rate: number; type: string }>;
    }>('/api/v1/admin/settings/commissions'),
  });
}

export function useV1UpdateGlobalCommission() {
  return useMutation({
    mutationFn: (rate: number) =>
      postV1<{ success: boolean }>('/api/v1/admin/settings/commissions/global', { rate }),
  });
}

export function useV1UpdateSupplierCommission() {
  return useMutation({
    mutationFn: ({ supplierId, rate }: { supplierId: number; rate: number }) =>
      postV1<{ success: boolean }>('/api/v1/admin/settings/commissions/supplier', { supplier_id: supplierId, rate }),
  });
}
