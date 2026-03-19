import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

export type MarketplaceGender = "homme" | "femme";

export interface MarketplaceProduct {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  discount?: number;
  image?: string;
  images?: string[];
  stock?: number;
  is_active?: boolean;
  category_name?: string;
  category_id?: number;
  supplier_id?: number | string;
  supplierId?: number | string;
  supplier_name?: string;
  supplierName?: string;
  supplier_slug?: string;
  rating?: number;
  reviews_count?: number;
  sales_count?: number;
  popularity?: number;
  views?: number;
  created_at?: string;
  createdAt?: string;
}

export interface MarketplaceSupplier {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  address?: string;
  products_count?: number;
  totalProducts?: number;
  total_sales?: number;
  avg_rating?: number;
  rating?: number;
  ratings_count?: number;
  reviews_count?: number;
  products?: MarketplaceProduct[];
}

export interface ShopMetric {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  availability?: string;
  created_at?: string;
  products_count?: number;
  total_sales?: number;
  revenue?: number;
  avg_rating?: number;
  ratings_count?: number;
}

export interface ShopTestimonial {
  id: number;
  user_name?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
}

export interface ShopDetailsPayload {
  shop: ShopMetric;
  testimonials: ShopTestimonial[];
}

export function slugifyCategory(value: string | number | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildQuery(path: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return buildApiUrl(query ? `${path}?${query}` : path);
}

export function getSupplierRating(supplier: Partial<MarketplaceSupplier> | null | undefined): number {
  const value = Number(supplier?.avg_rating ?? supplier?.rating ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function getSupplierReviewCount(supplier: Partial<MarketplaceSupplier> | null | undefined): number {
  const value = Number(supplier?.ratings_count ?? supplier?.reviews_count ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function getSupplierProductCount(supplier: Partial<MarketplaceSupplier> | null | undefined): number {
  const value = Number(
    supplier?.products_count ??
      supplier?.totalProducts ??
      supplier?.products?.length ??
      0,
  );
  return Number.isFinite(value) ? value : 0;
}

export function getSupplierSalesCount(supplier: Partial<MarketplaceSupplier> | null | undefined): number {
  const directValue = Number(supplier?.total_sales ?? 0);
  if (Number.isFinite(directValue) && directValue > 0) {
    return directValue;
  }

  const nestedValue = Array.isArray(supplier?.products)
    ? supplier.products.reduce((total, product) => total + Number(product?.sales_count ?? 0), 0)
    : 0;

  return Number.isFinite(nestedValue) ? nestedValue : 0;
}

export function getSupplierPopularityScore(supplier: Partial<MarketplaceSupplier> | null | undefined): number {
  return (
    getSupplierRating(supplier) * 30 +
    getSupplierReviewCount(supplier) * 3 +
    getSupplierSalesCount(supplier) * 4 +
    getSupplierProductCount(supplier)
  );
}

export function getProductPrice(product: Partial<MarketplaceProduct> | null | undefined): number {
  const value = Number(product?.price ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function getProductDiscount(product: Partial<MarketplaceProduct> | null | undefined): number {
  const value = Number(product?.discount ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function getProductFinalPrice(product: Partial<MarketplaceProduct> | null | undefined): number {
  const price = getProductPrice(product);
  const discount = getProductDiscount(product);

  if (discount <= 0) {
    return price;
  }

  return Math.round(price * (1 - discount / 100));
}

export function getProductCategoryLabel(product: Partial<MarketplaceProduct> | null | undefined): string {
  return product?.category_name?.trim() || "Collection";
}

export function getProductSupplierId(product: Partial<MarketplaceProduct> | null | undefined): string {
  const value =
    (product as any)?.supplier_id ??
    (product as any)?.supplierId ??
    (product as any)?.supplier?.id ??
    product?.supplier_slug ??
    (product as any)?.supplier?.slug ??
    product?.supplier_name ??
    "";

  return String(value);
}

export function getProductSupplierName(product: Partial<MarketplaceProduct> | null | undefined): string {
  return (
    product?.supplier_name?.trim() ||
    (product as any)?.supplier?.name ||
    "Boutique partenaire"
  );
}

export function getProductCreatedAt(product: Partial<MarketplaceProduct> | null | undefined): string {
  return String(product?.created_at ?? product?.createdAt ?? "");
}

export function getProductPopularityScore(product: Partial<MarketplaceProduct> | null | undefined): number {
  const rating = Number(product?.rating ?? 0);
  const reviews = Number(product?.reviews_count ?? 0);
  const directPopularity = Number(product?.sales_count ?? product?.popularity ?? product?.views ?? 0);
  const discount = getProductDiscount(product);

  return directPopularity * 10 + reviews * 4 + rating * 25 + discount;
}

export function inferMarketplaceGender(
  ...values: Array<string | null | undefined>
): MarketplaceGender | null {
  const normalized = values
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  const femmeKeywords = ["femme", "femmes", "woman", "women", "lady", "ladies", "girl", "girls"];
  const hommeKeywords = ["homme", "hommes", "man", "men", "male", "masculin", "boy", "boys"];

  if (femmeKeywords.some((keyword) => normalized.includes(keyword))) {
    return "femme";
  }

  if (hommeKeywords.some((keyword) => normalized.includes(keyword))) {
    return "homme";
  }

  return null;
}

export function useMarketplaceSuppliers(gender?: MarketplaceGender) {
  return useQuery({
    queryKey: ["marketplace-suppliers", gender ?? "all"],
    queryFn: async (): Promise<MarketplaceSupplier[]> => {
      const response = await fetch(
        buildQuery("/v1/home/suppliers-with-products", {
          gender,
          limit: 30,
          products_limit: 6,
        }),
        { headers: getApiHeaders() },
      );

      if (!response.ok) {
        throw new Error("Impossible de charger les boutiques marketplace");
      }

      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useShopDetails(slug: string) {
  return useQuery({
    queryKey: ["shop-details", slug],
    queryFn: async (): Promise<ShopDetailsPayload | null> => {
      const response = await fetch(buildApiUrl(`/v1/shops/${slug}`), {
        headers: getApiHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Impossible de charger la boutique");
      }

      const payload = await response.json();
      return payload?.data ?? null;
    },
    enabled: Boolean(slug),
  });
}
