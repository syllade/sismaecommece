import { apiGet } from "@/api/http";

export interface AdminLogisticsOrder {
  id: number;
  status?: string;
  delivery_person_id?: number | null;
  driver_name?: string;
  driver_phone?: string;
  driver_zone?: string;
  commune?: string;
  delivery_type?: string;
  total?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminLogisticsDriverPosition {
  id: number;
  name: string;
  phone?: string;
  zone?: string;
  vehicle_type?: string;
  latitude: number;
  longitude: number;
  last_update?: string;
  status?: string;
}

export interface AdminLogisticsLivePayload {
  active_deliveries: AdminLogisticsOrder[];
  exceptions: AdminLogisticsOrder[];
  driver_positions: AdminLogisticsDriverPosition[];
}

export interface AdminLogisticsZone {
  zone: string;
  total_orders: number;
  delivered: number;
  cancelled: number;
  in_progress: number;
  revenue: number;
  active_drivers: number;
  coverage_status: "covered" | "undercapacity";
}

export interface AdminLogisticsAlert {
  type: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
  count?: number;
  zone?: string;
}

export interface AdminLogisticsTour {
  commune: string;
  time_slot: string;
  order_ids: number[];
  count: number;
  total_amount: number;
}

export const logisticsApi = {
  getLive: () => apiGet<AdminLogisticsLivePayload>("/api/v1/admin/logistics/live"),
  getZones: () => apiGet<AdminLogisticsZone[]>("/api/v1/admin/logistics/zones"),
  getAlerts: (hours = 24) => apiGet<AdminLogisticsAlert[]>(`/api/v1/admin/logistics/alerts?hours=${hours}`),
  getTours: (date?: string) =>
    apiGet<AdminLogisticsTour[]>(`/api/v1/admin/logistics/tours${date ? `?date=${date}` : ""}`),
};
