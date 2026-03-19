import { apiDelete, apiGet, apiPost, apiPut } from "@/api/http";

export type CampaignStatus = "pending" | "approved" | "rejected" | "paused";

export interface AdminCampaign {
  id: number;
  product_id: number;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  budget: number;
  cpc: number;
  status: CampaignStatus;
  impressions?: number;
  clicks?: number;
  spend?: number;
  attributed_revenue?: number;
  ctr?: number;
  acos?: number;
  created_at?: string;
  updated_at?: string;
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

export const marketingApi = {
  listAdminCampaigns: (params?: { status?: string; search?: string; page?: number; per_page?: number }) =>
    apiGet<AdminCampaign[]>(
      `/api/v1/admin/campaigns${buildQuery({
        status: params?.status,
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  getAdminCampaign: (id: number) => apiGet<AdminCampaign>(`/api/v1/admin/campaigns/${id}`),

  createAdminCampaign: (payload: {
    product_id: number;
    product_name: string;
    supplier_id: number;
    supplier_name: string;
    budget: number;
    cpc: number;
  }) => apiPost<AdminCampaign>("/api/v1/admin/campaigns", payload),

  updateAdminCampaign: (id: number, payload: Partial<Pick<AdminCampaign, "product_name" | "budget" | "cpc" | "status">>) =>
    apiPut<{ success: boolean; message: string }>(`/api/v1/admin/campaigns/${id}`, payload),

  approveAdminCampaign: (id: number) =>
    apiPut<{ success: boolean; message: string }>(`/api/v1/admin/campaigns/${id}/approve`, {}),

  rejectAdminCampaign: (id: number, reason: string) =>
    apiPut<{ success: boolean; message: string }>(`/api/v1/admin/campaigns/${id}/reject`, { reason }),

  deleteAdminCampaign: (id: number) => apiDelete<{ success: boolean; message: string }>(`/api/v1/admin/campaigns/${id}`),

  getAdminCampaignStats: (id: number) =>
    apiGet<{
      campaign_id: number;
      impressions: number;
      clicks: number;
      spend: number;
      revenue: number;
      budget: number;
      ctr: number;
      acos: number;
      budget_used_percent: number;
      cpc: number;
      roas: number;
    }>(`/api/v1/admin/campaigns/${id}/stats`),
};

