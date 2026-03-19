import { apiDelete, apiGet, apiPost, apiPut } from "@/api/http";

export type BackendOrderStatus =
  | "pending"
  | "preparee"
  | "expediee"
  | "livree"
  | "annulee"
  | "processing"
  | "completed"
  | "cancelled"
  | "delivered";

export type UiOrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface AdminOrderItem {
  id?: number;
  product_id?: number;
  product_name?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
}

export interface AdminOrder {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_location?: string;
  commune?: string;
  quartier?: string;
  supplier_id?: number | null;
  supplier_name?: string;
  delivery_person_id?: number | null;
  delivery_person?: {
    id: number;
    name: string;
    phone?: string;
    zone?: string;
  } | null;
  subtotal?: number;
  delivery_fee?: number;
  total?: number;
  status: BackendOrderStatus;
  notes?: string;
  delivery_type?: string;
  delivery_date?: string;
  created_at?: string;
  items?: AdminOrderItem[];
  items_count?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function toUiOrderStatus(status: string): UiOrderStatus {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "preparee" || normalized === "expediee" || normalized === "processing") return "processing";
  if (normalized === "livree" || normalized === "delivered" || normalized === "completed") return "completed";
  if (normalized === "annulee" || normalized === "cancelled") return "cancelled";
  return "pending";
}

export function toBackendOrderStatusForUpdate(status: string): "pending" | "preparee" | "expediee" | "livree" | "annulee" {
  const normalized = status.toLowerCase();
  if (normalized === "processing") return "preparee";
  if (normalized === "completed") return "livree";
  if (normalized === "cancelled") return "annulee";
  if (normalized === "expediee") return "expediee";
  return "pending";
}

export const ordersApi = {
  listAdminOrders: (params?: {
    status?: string;
    supplier_id?: number;
    driver_id?: number;
    commune?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) =>
    apiGet<AdminOrder[]>(
      `/api/v1/admin/orders${buildQuery({
        status: params?.status,
        supplier_id: params?.supplier_id,
        driver_id: params?.driver_id,
        commune: params?.commune,
        start_date: params?.start_date,
        end_date: params?.end_date,
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  getAdminOrder: (id: number) => apiGet<AdminOrder>(`/api/v1/admin/orders/${id}`),

  updateAdminOrder: (
    id: number,
    payload: Partial<{
      customer_name: string;
      customer_phone: string;
      customer_location: string;
      commune: string;
      quartier: string;
      notes: string;
      delivery_date: string;
      delivery_fee: number;
    }>
  ) => apiPut<{ id: number }>(`/api/v1/admin/orders/${id}`, payload),

  updateAdminOrderStatus: (id: number, status: "pending" | "preparee" | "expediee" | "livree" | "annulee") =>
    apiPut<{ id: number; status: string }>(`/api/v1/admin/orders/${id}/status`, { status }),

  assignAdminOrderDriver: (orderId: number, driverId: number) =>
    apiPost<{ id: number; delivery_person_id: number }>(`/api/v1/admin/orders/${orderId}/assign-driver`, { driver_id: driverId }),

  bulkAssignAdminOrderDriver: (orderIds: number[], driverId: number) =>
    apiPost<{ affected_count: number }>("/api/v1/admin/orders/assign-driver", { order_ids: orderIds, driver_id: driverId }),

  autoAssignDriver: (params?: { zone?: string; max_orders?: number }) =>
    apiPost<{
      success: boolean;
      message: string;
      data: { order_ids: number[]; driver: { id: number; name: string }; assigned_count: number };
    }>("/api/v1/admin/orders/auto-assign", {
      zone: params?.zone,
      max_orders: params?.max_orders ?? 5,
    }),

  groupedAdminOrders: (groupBy: "commune" | "hour" | "zone" = "commune", status = "pending") =>
    apiGet<Array<{ group: string; count: number; orders: number[] }>>(
      `/api/v1/admin/orders/grouped${buildQuery({ group_by: groupBy, status })}`
    ),

  unprocessedAdminOrders: (hours = 24) => apiGet<AdminOrder[]>(`/api/v1/admin/orders/unprocessed?hours=${hours}`),

  deleteAdminOrder: (id: number) => apiDelete<{ success: boolean; message: string }>(`/api/v1/admin/orders/${id}`),

  // WhatsApp notifications
  sendWhatsAppToSupplier: (orderId: number, message?: string) =>
    apiPost<{
      success: boolean;
      message: string;
      data: { url: string; phone: string; message: string; supplier_name: string };
    }>(`/api/v1/admin/orders/${orderId}/whatsapp-supplier`, { message }),

  sendWhatsAppToDriver: (orderId: number, message?: string) =>
    apiPost<{
      success: boolean;
      message: string;
      data: { url: string; phone: string; message: string; driver_name: string };
    }>(`/api/v1/admin/orders/${orderId}/whatsapp-driver`, { message }),
};

