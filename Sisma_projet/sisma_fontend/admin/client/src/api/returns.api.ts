import { apiGet, apiPost, apiPut, apiDelete } from "@/api/http";

export interface AdminReturn {
  id: number;
  order_id: number;
  order_item_id: number | null;
  user_id: number | null;
  supplier_id: number | null;
  reason: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "refunded" | "completed";
  admin_notes: string | null;
  refund_amount: number | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_location: string;
    total: number;
  };
  order_item?: {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  supplier?: {
    id: number;
    name: string;
  };
}

export interface ReturnsListParams {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export const returnsApi = {
  list: async (params: ReturnsListParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set("status", params.status);
    if (params.search) queryParams.set("search", params.search);
    if (params.page) queryParams.set("page", String(params.page));
    if (params.per_page) queryParams.set("per_page", String(params.per_page));
    if (params.sort_by) queryParams.set("sort_by", params.sort_by);
    if (params.sort_dir) queryParams.set("sort_dir", params.sort_dir);
    
    const query = queryParams.toString();
    return apiGet<{ data: AdminReturn[]; meta: any }>(
      `/api/v1/returns${query ? `?${query}` : ""}`
    );
  },

  get: async (id: number) => {
    return apiGet<{ data: AdminReturn }>(`/api/v1/returns/${id}`);
  },

  approve: async (id: number, data: { refund_amount?: number; notes?: string } = {}) => {
    return apiPost<{ success: boolean; data: AdminReturn }>(
      `/api/v1/returns/${id}/approve`,
      data
    );
  },

  reject: async (id: number, reason: string) => {
    return apiPost<{ success: boolean; data: AdminReturn }>(
      `/api/v1/returns/${id}/reject`,
      { reason }
    );
  },

  refund: async (id: number) => {
    return apiPost<{ success: boolean; data: AdminReturn }>(
      `/api/v1/returns/${id}/refund`,
      {}
    );
  },
};
