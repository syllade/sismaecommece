import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
const API_BASE = `${API_ROOT}/v1/supplier`;
const SUPPLIER_TOKEN_KEY = "sisma_supplier_token";
const LEGACY_SUPPLIER_TOKEN_KEY = "fashop_supplier_token";

export type SupplierOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "prepared";

export interface SupplierOrderView {
  id: number;
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  totalAmount: number;
  status: SupplierOrderStatus;
  createdAt: string;
  rawStatus: string;
}

function getSupplierToken(): string {
  const token = localStorage.getItem(SUPPLIER_TOKEN_KEY);
  if (token) return token;
  const legacy = localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(SUPPLIER_TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_SUPPLIER_TOKEN_KEY);
    return legacy;
  }
  return "";
}

function toUiStatus(status: string): SupplierOrderStatus {
  if (status === "ready" || status === "confirmed" || status === "preparing") return "prepared";
  if (
    status === "pending" ||
    status === "shipped" ||
    status === "delivered" ||
    status === "cancelled" ||
    status === "completed" ||
    status === "prepared"
  ) {
    return status;
  }
  return "pending";
}

function toApiStatus(status: string): string {
  if (status === "prepared") return "ready";
  return status;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getSupplierToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem(SUPPLIER_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("app:unauthorized", { detail: { status: 401 } }));
    throw new Error("Session expirée");
  }

  if (response.status === 403) {
    window.dispatchEvent(new CustomEvent("app:forbidden", { detail: { status: 403 } }));
    throw new Error("Accès refusé");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Erreur API" }));
    throw new Error(payload.message || "Erreur API");
  }

  return response.json();
}

function mapOrder(raw: any): SupplierOrderView {
  const rawStatus = String(raw?.status || "pending");
  return {
    id: Number(raw?.id || 0),
    orderNumber: raw?.order_number || `#${raw?.id || "-"}`,
    customerName: raw?.client_name || raw?.customer_name || "Client",
    customerAddress: raw?.client_address || raw?.customer_location || "-",
    customerPhone: raw?.client_phone || raw?.customer_phone || "-",
    totalAmount: Number(raw?.total || 0),
    status: toUiStatus(rawStatus),
    rawStatus,
    createdAt: raw?.created_at || new Date().toISOString(),
  };
}

export function useOrders(params?: {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", toApiStatus(params.status));
  if (params?.search) query.set("search", params.search);
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (!query.has("per_page")) query.set("per_page", "100");

  return useQuery<SupplierOrderView[]>({
    queryKey: ["supplier-orders", params],
    queryFn: async () => {
      const payload = await fetchApi<{ data: any[] }>(`/orders?${query.toString()}`);
      return (payload?.data || []).map(mapOrder);
    },
    staleTime: 30 * 1000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: SupplierOrderStatus;
      deliveryPersonId?: number | null;
    }) => {
      const apiStatus = toApiStatus(status);
      return fetchApi(`/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: apiStatus }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "La commande a été mise à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-v1", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-v1", "dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de mise à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
