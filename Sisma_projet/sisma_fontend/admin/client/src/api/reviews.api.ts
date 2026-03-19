import { apiGet, apiPost, apiDelete } from "@/api/http";

export interface Review {
  id: number;
  product_id: number | null;
  supplier_id: number | null;
  user_id: number | null;
  order_id: number | null;
  rating: number;
  comment: string | null;
  user_name: string | null;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    image: string | null;
  };
  supplier?: {
    id: number;
    name: string;
  };
}

export interface ReviewsSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsListParams {
  type?: "product" | "supplier";
  status?: string;
  search?: string;
  min_rating?: number;
  max_rating?: number;
  page?: number;
  per_page?: number;
}

export const reviewsApi = {
  // List all reviews with filters
  list: async (params: ReviewsListParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.set("type", params.type);
    if (params.status) queryParams.set("status", params.status);
    if (params.search) queryParams.set("search", params.search);
    if (params.min_rating) queryParams.set("min_rating", String(params.min_rating));
    if (params.max_rating) queryParams.set("max_rating", String(params.max_rating));
    if (params.page) queryParams.set("page", String(params.page));
    if (params.per_page) queryParams.set("per_page", String(params.per_page));
    
    const query = queryParams.toString();
    return apiGet<{ data: Review[]; meta: any }>(
      `/api/v1/admin/reviews${query ? `?${query}` : ""}`
    );
  },

  // Get product reviews
  getProductReviews: async (productId: number) => {
    return apiGet<{ data: Review[] }>(`/api/v1/products/${productId}/reviews`);
  },

  // Get product reviews summary
  getProductReviewsSummary: async (productId: number) => {
    return apiGet<{ data: ReviewsSummary }>(`/api/v1/products/${productId}/reviews-summary`);
  },

  // Get supplier reviews
  getSupplierReviews: async (supplierId: number) => {
    return apiGet<{ data: Review[] }>(`/api/v1/shops/${supplierId}/reviews`);
  },

  // Get supplier reviews summary
  getSupplierReviewsSummary: async (supplierId: number) => {
    return apiGet<{ data: ReviewsSummary }>(`/api/v1/shops/${supplierId}/reviews-summary`);
  },

  // Verify a review (admin)
  verify: async (id: number) => {
    return apiPost<{ success: boolean; data: Review }>(
      `/api/v1/admin/reviews/${id}/verify`,
      {}
    );
  },

  // Delete a review (admin)
  delete: async (id: number) => {
    return apiDelete<{ success: boolean }>(`/api/v1/admin/reviews/${id}`);
  },
};
