export type ProductShopCandidate = {
  [key: string]: unknown;
  supplier_id?: number | string | null;
  supplierId?: number | string | null;
  supplier_name?: string | null;
  supplierName?: string | null;
  supplier_slug?: string | null;
  supplierSlug?: string | null;
  shop_id?: number | string | null;
  shopId?: number | string | null;
  shop_name?: string | null;
  shopName?: string | null;
  shop_slug?: string | null;
  shopSlug?: string | null;
  supplier?: {
    id?: number | string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  shop?: {
    id?: number | string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
};

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeIdentifier(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRawSupplierId(product: ProductShopCandidate | null | undefined): string | undefined {
  return normalizeIdentifier(
    product?.supplier_id ??
      product?.supplierId ??
      product?.shop_id ??
      product?.shopId ??
      product?.supplier?.id ??
      product?.shop?.id,
  );
}

function getRawSupplierSlug(product: ProductShopCandidate | null | undefined): string | undefined {
  return normalizeText(
    product?.supplier_slug ??
      product?.supplierSlug ??
      product?.shop_slug ??
      product?.shopSlug ??
      product?.supplier?.slug ??
      product?.shop?.slug,
  );
}

export function getProductSupplierName(
  product: ProductShopCandidate | null | undefined,
): string | undefined {
  const directName = normalizeText(
    product?.supplier_name ??
      product?.supplierName ??
      product?.shop_name ??
      product?.shopName ??
      product?.supplier?.name ??
      product?.shop?.name,
  );

  if (directName) {
    return directName;
  }

  const slug = getRawSupplierSlug(product);
  return slug ? toTitleCase(slug.replace(/[^a-zA-Z0-9]+/g, " ")) : undefined;
}

export function getProductShopHref(
  product: ProductShopCandidate | null | undefined,
): string | undefined {
  const supplierId = getRawSupplierId(product);
  if (supplierId) {
    return `/shop/${encodeURIComponent(supplierId)}`;
  }

  const supplierSlug = getRawSupplierSlug(product);
  if (supplierSlug) {
    return `/shop/${encodeURIComponent(supplierSlug)}`;
  }

  return undefined;
}

function coerceIdentifier(value: string): string | number {
  return /^\d+$/.test(value) ? Number(value) : value;
}

export function normalizeProductShopData<T extends Record<string, unknown>>(
  product: T,
): T &
  ProductShopCandidate & {
  supplier_id?: string | number;
  supplierId?: string | number;
  supplier_name?: string;
  supplierName?: string;
  supplier_slug?: string;
  supplierSlug?: string;
} {
  const supplierId = getRawSupplierId(product) ?? getRawSupplierSlug(product);
  const supplierName = getProductSupplierName(product);
  const supplierSlug = getRawSupplierSlug(product);

  return {
    ...product,
    ...(supplierId
      ? {
          supplier_id: coerceIdentifier(supplierId),
          supplierId: coerceIdentifier(supplierId),
        }
      : {}),
    ...(supplierName
      ? {
          supplier_name: supplierName,
          supplierName: supplierName,
        }
      : {}),
    ...(supplierSlug
      ? {
          supplier_slug: supplierSlug,
          supplierSlug: supplierSlug,
        }
      : {}),
  };
}

export function normalizeProductShopCollection<T extends Record<string, unknown>>(
  products: T[],
): Array<
  T &
    ProductShopCandidate & {
    supplier_id?: string | number;
    supplierId?: string | number;
    supplier_name?: string;
    supplierName?: string;
    supplier_slug?: string;
    supplierSlug?: string;
    }
> {
  return products.map((product) => normalizeProductShopData(product));
}
