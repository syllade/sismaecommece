import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
const API_BASE = `${API_ROOT}/v1/supplier`;
const SUPPLIER_TOKEN_KEY = "sisma_supplier_token";
const LEGACY_SUPPLIER_TOKEN_KEY = "fashop_supplier_token";

export interface SupplierProductView {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  status: "draft" | "pending" | "published";
  rawStatus: string;
  createdAt: string;
  categoryId?: number | null;
  image?: string | null;
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

function toUiStatus(status: unknown, isActive: unknown): "draft" | "pending" | "published" {
  const raw = String(status || "").toLowerCase();
  if (raw === "active" && Boolean(isActive)) return "published";
  if (raw === "pending") return "pending";
  return "draft";
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getSupplierToken();
  const hasFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(hasFormData ? {} : { "Content-Type": "application/json" }),
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

function mapProduct(raw: any): SupplierProductView {
  return {
    id: Number(raw?.id || 0),
    title: raw?.name || raw?.title || "Produit sans nom",
    description: raw?.description || "",
    price: Number(raw?.price || 0),
    stock: Number(raw?.stock || 0),
    status: toUiStatus(raw?.status, raw?.is_active),
    rawStatus: String(raw?.status || "draft"),
    createdAt: raw?.created_at || new Date().toISOString(),
    categoryId: raw?.category_id ?? null,
    image: raw?.image ?? null,
  };
}

function buildProductPayload(data: any) {
  const name = data?.name || data?.title || "";
  const descriptionParts: string[] = [];
  if (typeof data?.description === "string" && data.description.trim()) {
    descriptionParts.push(data.description.trim());
  }
  if (Array.isArray(data?.bulletPoints) && data.bulletPoints.length > 0) {
    const bullets = data.bulletPoints
      .map((item: string) => String(item || "").trim())
      .filter(Boolean)
      .map((item: string) => `- ${item}`)
      .join("\n");
    if (bullets) descriptionParts.push(bullets);
  }
  if (typeof data?.metaDescription === "string" && data.metaDescription.trim()) {
    descriptionParts.push(`SEO: ${data.metaDescription.trim()}`);
  }

  return {
    name,
    description: descriptionParts.join("\n\n"),
    price: Number(data?.price || 0),
    stock: Number(data?.stock || 0),
    is_variable: Boolean(data?.isVariable ?? data?.is_variable ?? false),
    category_id:
      data?.category_id != null
        ? Number(data.category_id)
        : data?.categoryId != null
          ? Number(data.categoryId)
          : null,
    colors: Array.isArray(data?.colors) ? data.colors : undefined,
    sizes: Array.isArray(data?.sizes) ? data.sizes : undefined,
  };
}

export function useProducts(params?: {
  status?: string;
  search?: string;
  category_id?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category_id) query.set("category_id", String(params.category_id));
  if (params?.status === "published") {
    query.set("status", "active");
    query.set("is_active", "1");
  } else if (params?.status === "pending") {
    query.set("status", "pending");
  }
  query.set("per_page", "200");

  return useQuery<SupplierProductView[]>({
    queryKey: ["supplier-products", params],
    queryFn: async () => {
      const payload = await fetchApi<{ data: any[] }>(`/products?${query.toString()}`);
      return (payload?.data || []).map(mapProduct);
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const payload = buildProductPayload(data);
      if (!payload.name || payload.price <= 0) {
        throw new Error("Le nom et le prix du produit sont obligatoires.");
      }
      return fetchApi<{ product: any }>("/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({
        title: "Produit créé",
        description: "Produit enregistré et transmis au workflow fournisseur.",
      });
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-v1", "products"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-v1", "dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de création",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Record<string, unknown>) => {
      const payload = buildProductPayload(updates);
      return fetchApi(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({
        title: "Produit mis à jour",
        description: "Les modifications ont été enregistrées.",
      });
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-v1", "products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Mise à jour échouée",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAIGenerateProduct() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      productName: string;
      keywords?: string[];
      tone?: "professional" | "friendly" | "formal" | "casual" | "persuasive";
      length?: "short" | "medium" | "long";
      language?: "fr" | "en";
      category?: string;
      features?: string[];
    }) => {
      const payload = {
        product_name: data.productName,
        keywords: data.keywords || [],
        tone: data.tone || "professional",
        length: data.length || "medium",
        language: data.language || "fr",
        category: data.category,
        features: data.features || [],
      };
      return fetchApi<{ description: string }>("/ai/generate-description", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Génération IA impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
