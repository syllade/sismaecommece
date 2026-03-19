import { apiDelete, apiGet, apiPost, apiPut } from "@/api/http";

export interface AdminProduct {
  id: number;
  supplierId?: number | null;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  categoryId?: number | null;
  price: number;
  image?: string;
  images?: string[];
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  discount?: number;
  createdAt?: string;
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

export const productsApi = {
  // Public products
  listPublicProducts: (params?: { category_id?: number; search?: string; page?: number; per_page?: number }) =>
    apiGet<AdminProduct[]>(
      `/api/products${buildQuery({
        category_id: params?.category_id,
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  getPublicProduct: (slug: string) => apiGet<AdminProduct>(`/api/products/${slug}`),

  // Admin products (v1)
  listAdminProducts: (params?: { 
    category_id?: number; 
    is_active?: string | boolean; 
    search?: string;
    page?: number;
    per_page?: number;
  }) =>
    apiGet<AdminProduct[]>(
      `/api/v1/admin/products${buildQuery({
        category_id: params?.category_id,
        is_active: typeof params?.is_active === "boolean" ? Number(params.is_active) : params?.is_active,
        search: params?.search,
        page: params?.page,
        per_page: params?.per_page,
      })}`
    ),

  getAdminProduct: (id: number) => apiGet<AdminProduct>(`/api/v1/admin/products/${id}`),

  createAdminProduct: (payload: Record<string, unknown>) => 
    apiPost<{ id?: number; product?: AdminProduct }>("/api/v1/admin/products", payload),

  updateAdminProduct: (id: number, payload: Record<string, unknown>) =>
    apiPut<{ id?: number; product?: AdminProduct }>(`/api/v1/admin/products/${id}`, payload),

  deleteAdminProduct: (id: number) => 
    apiDelete<{ message: string }>(`/api/v1/admin/products/${id}`),

  toggleAdminProductStatus: (id: number) =>
    apiPost<{ id: number; is_active: boolean }>(`/api/v1/admin/products/${id}/toggle-status`, {}),

  duplicateAdminProduct: (id: number) => 
    apiPost<{ product?: AdminProduct }>(`/api/v1/admin/products/${id}/duplicate`, {}),

  // Get product attributes for a category
  getProductAttributes: (categoryId: number) =>
    apiGet<Array<{
      id: number;
      name: string;
      slug: string;
      type: string;
      required: boolean;
      placeholder?: string;
      options?: string[];
    }>>(`/api/v1/admin/settings/categories/${categoryId}/attributes`),
};

