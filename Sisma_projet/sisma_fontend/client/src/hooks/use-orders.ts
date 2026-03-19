import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateOrderRequest } from "@shared/schema";
import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

const CLIENT_TOKEN_KEY = "sisma_client_token";
const LOCAL_ORDERS_KEY = "sisma_guest_orders";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "preparing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export interface OrderItemView {
  id?: number;
  product_id?: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  color?: string;
  size?: string;
}

export interface OrderView {
  id: number;
  order_number?: string;
  status: OrderStatus | string;
  total: number;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_location?: string;
  items: OrderItemView[];
  source?: "api" | "local";
  qr_code?: string;
  qr_code_security?: string;
}

export interface OrdersResult {
  data: OrderView[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  source: "api" | "local";
}

interface UseOrdersParams {
  page?: number;
  perPage?: number;
  status?: string;
}

function readClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLIENT_TOKEN_KEY);
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeStatus(status: unknown): string {
  if (typeof status !== "string") return "pending";
  if (status === "in_progress") return "processing";
  return status;
}

function normalizeOrderItem(raw: any): OrderItemView {
  return {
    id: toOptionalNumber(raw?.id),
    product_id: toOptionalNumber(raw?.product_id ?? raw?.productId),
    name:
      raw?.product_name ??
      raw?.name ??
      raw?.product?.name ??
      (raw?.product_id ? `Produit #${raw.product_id}` : "Produit"),
    quantity: Math.max(1, toNumber(raw?.quantity, 1)),
    price: toNumber(raw?.price, 0),
    image: raw?.image ?? raw?.product_image ?? raw?.product?.image,
    color: raw?.color ?? undefined,
    size: raw?.size ?? undefined,
  };
}

export function normalizeOrder(raw: any, source: "api" | "local" = "api"): OrderView {
  const orderId = toNumber(raw?.id, Date.now());
  const createdAt = raw?.created_at ?? raw?.date ?? new Date().toISOString();
  const total = toNumber(raw?.total ?? raw?.amount ?? raw?.total_amount, 0);
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeOrderItem) : [];

  return {
    id: orderId,
    order_number:
      raw?.order_number ??
      raw?.numero_commande ??
      raw?.reference ??
      `CMD-${String(orderId).padStart(6, "0")}`,
    status: normalizeStatus(raw?.status),
    total,
    created_at: createdAt,
    customer_name: raw?.customer_name ?? raw?.customerName,
    customer_phone: raw?.customer_phone ?? raw?.customerPhone,
    customer_location: raw?.customer_location ?? raw?.customerLocation ?? raw?.delivery_address,
    items,
    source,
    qr_code: raw?.qr_code ?? raw?.qrCode ?? undefined,
    qr_code_security: raw?.qr_code_security ?? raw?.qrCodeSecurity ?? undefined,
  };
}

export function getLocalOrders(): OrderView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((order) => normalizeOrder(order, "local"));
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: OrderView) {
  if (typeof window === "undefined") return;
  const current = getLocalOrders();
  const next = [order, ...current.filter((item) => item.id !== order.id)].slice(0, 50);
  window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next));
}

export function cacheOrderSnapshot(raw: any, source: "api" | "local" = "local") {
  saveLocalOrder(normalizeOrder(raw, source));
}

function mergeOrders(primary: OrderView[], secondary: OrderView[]) {
  const seen = new Set<string>();
  const merged: OrderView[] = [];

  [...primary, ...secondary].forEach((order) => {
    const key = `${order.order_number || ""}-${order.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(order);
  });

  return merged.sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime() || 0;
    const rightTime = new Date(right.created_at).getTime() || 0;
    return rightTime - leftTime;
  });
}

function buildOrdersResult(
  data: OrderView[],
  source: "api" | "local",
  meta?: Partial<OrdersResult["meta"]>,
): OrdersResult {
  return {
    data,
    source,
    meta: {
      page: meta?.page ?? 1,
      per_page: meta?.per_page ?? data.length,
      total: meta?.total ?? data.length,
      last_page: meta?.last_page ?? 1,
    },
  };
}

function readErrorMessage(payload: any, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  if (typeof payload.message === "string") return payload.message;
  if (payload.errors && typeof payload.errors === "object") {
    const firstField = Object.keys(payload.errors)[0];
    const firstError = firstField ? payload.errors[firstField]?.[0] : null;
    if (typeof firstError === "string") return firstError;
  }
  return fallback;
}

export function useOrders(params: UseOrdersParams = {}) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;
  const status = params.status;

  return useQuery<OrdersResult>({
    queryKey: ["orders", page, perPage, status ?? "all"],
    queryFn: async () => {
      const token = readClientToken();
      const localOrders = getLocalOrders();
      const filteredLocal = status
        ? localOrders.filter((order) => String(order.status) === status)
        : localOrders;

      if (!token) {
        const start = (page - 1) * perPage;
        const paginated = filteredLocal.slice(start, start + perPage);
        const lastPage = Math.max(1, Math.ceil(filteredLocal.length / perPage));

        return buildOrdersResult(paginated, "local", {
          page,
          per_page: perPage,
          total: filteredLocal.length,
          last_page: lastPage,
        });
      }

      const search = new URLSearchParams();
      search.set("page", String(page));
      search.set("per_page", String(perPage));
      if (status) search.set("status", status);

      const url = buildApiUrl(`/client/orders?${search.toString()}`);
      const res = await fetch(url, { headers: getApiHeaders() });
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        throw new Error(readErrorMessage(errorPayload, "Impossible de charger les commandes"));
      }

      const payload = await res.json();
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const apiOrders = list.map((order: any) => normalizeOrder(order, "api"));
      const merged = mergeOrders(apiOrders, filteredLocal);

      return {
        data: merged,
        source: "api" as const,
        meta: {
          page: toNumber(payload?.meta?.page, page),
          per_page: Math.max(perPage, merged.length),
          total: Math.max(toNumber(payload?.meta?.total, apiOrders.length), merged.length),
          last_page: Math.max(1, toNumber(payload?.meta?.last_page, 1)),
        },
      };
    },
  });
}

export function useOrder(id: number) {
  return useQuery<OrderView | null>({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async () => {
      const localOrder = getLocalOrders().find((item) => item.id === id) ?? null;
      const token = readClientToken();

      if (!token) {
        return localOrder;
      }

      const url = buildApiUrl(`/client/orders/${id}`);
      const res = await fetch(url, { headers: getApiHeaders() });
      if (res.status === 404) return localOrder;
      if (!res.ok) {
        if (localOrder) return localOrder;
        const errorPayload = await res.json().catch(() => null);
        throw new Error(readErrorMessage(errorPayload, "Impossible de charger la commande"));
      }

      const payload = await res.json();
      const normalized = normalizeOrder(payload, "api");
      saveLocalOrder(normalized);
      return normalized;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const url = buildApiUrl("/orders");
      const res = await fetch(url, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        throw new Error(readErrorMessage(errorPayload, "Erreur lors de la création de la commande"));
      }

      const payload = await res.json();
      const normalized = normalizeOrder(payload?.order ?? payload, "local");
      saveLocalOrder(normalized);
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
