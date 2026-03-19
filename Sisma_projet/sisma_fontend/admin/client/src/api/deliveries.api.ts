import { apiDelete, apiGet, apiPost, apiPut } from "@/api/http";

export interface AdminDriver {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_type?: string;
  zone: string;
  is_active: boolean | number;
  total_orders?: number;
  completed_orders?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LogisticsLivePayload {
  active_deliveries: unknown[];
  exceptions: unknown[];
  driver_positions: unknown[];
}

export interface LogisticsZonePayload {
  zone: string;
  total_orders: number;
  delivered: number;
  cancelled: number;
  in_progress: number;
  revenue: number;
  active_drivers: number;
  coverage_status: "covered" | "undercapacity";
}

export interface LogisticsAlertPayload {
  type: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
  count: number;
  zone?: string;
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

export const deliveriesApi = {
  listAdminDrivers: (params?: { status?: string; zone?: string; search?: string; page?: number; per_page?: number }) =>
    apiGet<AdminDriver[]>(
      `/api/v1/admin/drivers${buildQuery({
        status: params?.status,
        zone: params?.zone,
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  getAdminDriver: (id: number) => apiGet<AdminDriver>(`/api/v1/admin/drivers/${id}`),

  createAdminDriver: (payload: Partial<AdminDriver> & { send_invite?: boolean }) =>
    apiPost<{ id: number; signed_url?: string; success?: boolean; message?: string }>("/api/v1/admin/drivers", payload)
    .then((result) => {
      console.log("[deliveriesApi] createAdminDriver result:", result);
      return result;
    })
    .catch((error) => {
      console.error("[deliveriesApi] createAdminDriver error:", error);
      throw error;
    }),

  updateAdminDriver: (id: number, payload: Partial<AdminDriver>) =>
    apiPut<{ id: number }>(`/api/v1/admin/drivers/${id}`, payload),

  toggleAdminDriverStatus: (id: number) =>
    apiPost<{ id: number; is_active: number }>(`/api/v1/admin/drivers/${id}/toggle-status`, {}),

  deleteAdminDriver: (id: number) => apiDelete<{ success: boolean; message: string }>(`/api/v1/admin/drivers/${id}`),

  listAdminDriverZones: () => apiGet<string[]>("/api/v1/admin/drivers/zones"),

  bulkToggleAdminDrivers: (driverIds: number[], action: "activate" | "deactivate") =>
    apiPost<{ affected_count: number }>("/api/v1/admin/drivers/bulk-toggle", {
      driver_ids: driverIds,
      action,
    }),

  getLogisticsLive: () => apiGet<LogisticsLivePayload>("/api/v1/admin/logistics/live"),

  getLogisticsZones: () => apiGet<LogisticsZonePayload[]>("/api/v1/admin/logistics/zones"),

  getLogisticsAlerts: (hours = 24) => apiGet<LogisticsAlertPayload[]>(`/api/v1/admin/logistics/alerts?hours=${hours}`),

  getLogisticsTours: (date?: string) =>
    apiGet<Array<{ commune: string; time_slot: string; order_ids: number[]; count: number; total_amount: number }>>(
      `/api/v1/admin/logistics/tours${date ? `?date=${date}` : ""}`
    ),
};

