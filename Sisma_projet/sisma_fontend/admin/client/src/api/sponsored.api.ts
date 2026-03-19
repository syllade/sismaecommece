import { apiDelete, apiGet, apiGetBlob, apiPut } from "@/api/http";
import type { CampaignStatus, SponsoredCampaign, SponsoredDashboard } from "@/types/super-admin";

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
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

export const sponsoredApi = {
  getDashboard: () => apiGet<SponsoredDashboard>("/api/v1/admin/sponsored/dashboard"),

  listCampaigns: (params?: { status?: CampaignStatus | "all"; search?: string; page?: number; per_page?: number }) =>
    apiGet<PaginatedResponse<SponsoredCampaign>>(
      `/api/v1/admin/sponsored/campaigns${buildQuery({
        status: params?.status && params.status !== "all" ? params.status : undefined,
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  updateCampaignStatus: (id: number, status: CampaignStatus) =>
    apiPut<{ success: boolean; message: string }>(`/api/v1/admin/sponsored/campaigns/${id}/status`, { status }),

  deleteCampaign: (id: number) =>
    apiDelete<{ success: boolean; message: string }>(`/api/v1/admin/sponsored/campaigns/${id}`),

  exportCsv: () => apiGetBlob("/api/v1/admin/sponsored/export"),
};
