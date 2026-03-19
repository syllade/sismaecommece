import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";

interface GuestOrderResponse {
  success: boolean;
  data: {
    id: number;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    items: Array<{
      id: number;
      product_name: string;
      quantity: number;
      price: number;
    }>;
  }[];
  message?: string;
}

async function fetchGuestOrders(phone: string): Promise<GuestOrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/guest?phone=${encodeURIComponent(phone)}`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de la recherche des commandes");
  }

  return response.json();
}

export function useGuestOrders(phone: string) {
  return useQuery({
    queryKey: ["guest-orders", phone],
    queryFn: () => fetchGuestOrders(phone),
    enabled: phone.length >= 8, // Minimum 8 caractères pour le téléphone
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
