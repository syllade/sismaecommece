import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";

interface SponsoredProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  supplier_id: number;
  category_id: number;
  is_sponsored: boolean;
  sponsored_campaign_id?: number;
}

interface SponsoredSupplier {
  id: number;
  name: string;
  slug: string;
  logo: string;
  cover_image: string;
  rating: number;
  product_count: number;
  is_verified: boolean;
}

async function fetchSponsoredProducts(limit = 10): Promise<SponsoredProduct[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sponsored/products?limit=${limit}`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sponsored products");
  }

  const data = await response.json();
  return data.data;
}

async function fetchSponsoredSuppliers(limit = 6): Promise<SponsoredSupplier[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sponsored/suppliers?limit=${limit}`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sponsored suppliers");
  }

  const data = await response.json();
  return data.data;
}

async function fetchMixedProducts(limit = 20): Promise<SponsoredProduct[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sponsored/mixed?limit=${limit}`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch mixed products");
  }

  const data = await response.json();
  return data.data;
}

export function useSponsoredProducts(limit = 10) {
  return useQuery({
    queryKey: ["sponsored-products", limit],
    queryFn: () => fetchSponsoredProducts(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

export function useSponsoredSuppliers(limit = 6) {
  return useQuery({
    queryKey: ["sponsored-suppliers", limit],
    queryFn: () => fetchSponsoredSuppliers(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

export function useMixedProducts(limit = 20) {
  return useQuery({
    queryKey: ["mixed-products", limit],
    queryFn: () => fetchMixedProducts(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

// Enregistrer une impression
export async function recordImpression(campaignId?: number, productId?: number) {
  if (!campaignId && !productId) return;
  
  try {
    await fetch(`${API_BASE_URL}/api/v1/sponsored/impression`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ campaign_id: campaignId, product_id: productId }),
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to record impression:", error);
  }
}

// Enregistrer un clic
export async function recordClick(campaignId?: number, productId?: number) {
  if (!campaignId && !productId) return;
  
  try {
    await fetch(`${API_BASE_URL}/api/v1/sponsored/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ campaign_id: campaignId, product_id: productId }),
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to record click:", error);
  }
}

// Enregistrer une conversion
export async function recordConversion(campaignId?: number, productId?: number) {
  if (!campaignId && !productId) return;
  
  try {
    await fetch(`${API_BASE_URL}/api/v1/sponsored/conversion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ campaign_id: campaignId, product_id: productId }),
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to record conversion:", error);
  }
}
