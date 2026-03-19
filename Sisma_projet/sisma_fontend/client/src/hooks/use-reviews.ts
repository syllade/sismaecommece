import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

// Types
export interface Review {
  id: number;
  product_id?: number;
  supplier_id?: number;
  user_id: number;
  order_id?: number;
  rating: number;
  comment: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface ReviewsSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verified_reviews: number;
}

// Get product reviews
export function useProductReviews(productId: number | null) {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const url = buildApiUrl(`/v1/products/${productId}/reviews`);
      const res = await fetch(url, { headers: getApiHeaders() });

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des avis");
      }

      const data = await res.json();
      return data.data || [];
    },
    enabled: !!productId,
  });
}

// Get product reviews summary
export function useProductReviewsSummary(productId: number | null) {
  return useQuery({
    queryKey: ["reviews", "summary", "product", productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const url = buildApiUrl(`/v1/products/${productId}/reviews-summary`);
      const res = await fetch(url, { headers: getApiHeaders() });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      return data.data || null;
    },
    enabled: !!productId,
  });
}

// Get supplier reviews
export function useSupplierReviews(supplierId: number | null) {
  return useQuery({
    queryKey: ["reviews", "supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const url = buildApiUrl(`/v1/shops/${supplierId}/reviews`);
      const res = await fetch(url, { headers: getApiHeaders() });

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des avis");
      }

      const data = await res.json();
      return data.data || [];
    },
    enabled: !!supplierId,
  });
}

// Get supplier reviews summary
export function useSupplierReviewsSummary(supplierId: number | null) {
  return useQuery({
    queryKey: ["reviews", "summary", "supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      
      const url = buildApiUrl(`/v1/shops/${supplierId}/reviews-summary`);
      const res = await fetch(url, { headers: getApiHeaders() });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      return data.data || null;
    },
    enabled: !!supplierId,
  });
}

// Submit a product review
export function useSubmitProductReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      product_id: number;
      rating: number;
      comment: string;
      order_id?: number;
    }) => {
      const url = buildApiUrl(`/v1/products/${data.product_id}/reviews`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          rating: data.rating,
          comment: data.comment,
          order_id: data.order_id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de l'envoi de l'avis");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "product", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "summary", "product", variables.product_id] });
    },
  });
}

// Submit a supplier review
export function useSubmitSupplierReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      supplier_id: number;
      rating: number;
      comment: string;
      order_id?: number;
    }) => {
      const url = buildApiUrl(`/v1/shops/${data.supplier_id}/reviews`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          rating: data.rating,
          comment: data.comment,
          order_id: data.order_id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de l'envoi de l'avis");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "supplier", variables.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "summary", "supplier", variables.supplier_id] });
    },
  });
}
