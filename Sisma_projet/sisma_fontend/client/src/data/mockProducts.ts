import type { Product, Category } from "@shared/schema";

export const mockCategories: Category[] = [
  { id: 1, name: "Mode", slug: "mode" },
  { id: 2, name: "Chaussures", slug: "chaussures" },
  { id: 3, name: "Accessoires", slug: "accessoires" },
  { id: 4, name: "Sacs", slug: "sacs" },
];

export type ProductWithDiscount = Product & {
  discountPercentage?: number;
  supplier_id?: number;
  supplierId?: number;
  supplier_name?: string;
  supplierName?: string;
  supplier_slug?: string;
  supplierSlug?: string;
};

function createMockProduct(
  product: Omit<ProductWithDiscount, "commissionRate" | "image" | "isActive" | "createdAt"> &
    Partial<Pick<ProductWithDiscount, "commissionRate" | "image" | "isActive" | "createdAt">>,
): ProductWithDiscount {
  return {
    commissionRate: null,
    image: null,
    isActive: true,
    createdAt: new Date(),
    ...product,
  };
}

export const mockProducts: ProductWithDiscount[] = [
  createMockProduct({
    id: 1,
    categoryId: 1,
    name: "T-shirt Premium Coton Bio",
    description: "T-shirt confortable en coton bio, coupe moderne",
    price: 15000,
    supplier_id: 2,
    supplierId: 2,
    supplier_name: "Mode Afro",
    supplierName: "Mode Afro",
    supplier_slug: "mode-afro",
    supplierSlug: "mode-afro",
    discountPercentage: 20,
    createdAt: new Date("2024-01-15"),
  }),
  createMockProduct({
    id: 2,
    categoryId: 1,
    name: "Chemise Élégante Slim Fit",
    description: "Chemise élégante pour toutes occasions",
    price: 25000,
    supplier_id: 2,
    supplierId: 2,
    supplier_name: "Mode Afro",
    supplierName: "Mode Afro",
    supplier_slug: "mode-afro",
    supplierSlug: "mode-afro",
    discountPercentage: 15,
    createdAt: new Date("2024-01-16"),
  }),
  createMockProduct({
    id: 3,
    categoryId: 2,
    name: "Baskets Sport Premium",
    description: "Baskets confortables pour le sport et le quotidien",
    price: 35000,
    supplier_id: 5,
    supplierId: 5,
    supplier_name: "Sports & Fitness",
    supplierName: "Sports & Fitness",
    supplier_slug: "sports-fitness",
    supplierSlug: "sports-fitness",
    discountPercentage: 10,
    createdAt: new Date("2024-01-17"),
  }),
  createMockProduct({
    id: 4,
    categoryId: 2,
    name: "Chaussures de Ville Classiques",
    description: "Chaussures élégantes pour le bureau",
    price: 40000,
    supplier_id: 2,
    supplierId: 2,
    supplier_name: "Mode Afro",
    supplierName: "Mode Afro",
    supplier_slug: "mode-afro",
    supplierSlug: "mode-afro",
    createdAt: new Date("2024-01-18"),
  }),
  createMockProduct({
    id: 5,
    categoryId: 3,
    name: "Montre Design Moderne",
    description: "Montre élégante avec bracelet en cuir",
    price: 45000,
    supplier_id: 1,
    supplierId: 1,
    supplier_name: "Electronique Pro CI",
    supplierName: "Electronique Pro CI",
    supplier_slug: "electronique-pro-ci",
    supplierSlug: "electronique-pro-ci",
    discountPercentage: 25,
    createdAt: new Date("2024-01-19"),
  }),
  createMockProduct({
    id: 6,
    categoryId: 3,
    name: "Lunettes de Soleil Premium",
    description: "Protection UV avec style",
    price: 20000,
    supplier_id: 4,
    supplierId: 4,
    supplier_name: "Beauty Care",
    supplierName: "Beauty Care",
    supplier_slug: "beauty-care",
    supplierSlug: "beauty-care",
    discountPercentage: 30,
    createdAt: new Date("2024-01-20"),
  }),
  createMockProduct({
    id: 7,
    categoryId: 4,
    name: "Sac à Main Tendance",
    description: "Sac élégant pour toutes occasions",
    price: 30000,
    supplier_id: 3,
    supplierId: 3,
    supplier_name: "Home & Deco",
    supplierName: "Home & Deco",
    supplier_slug: "home-deco",
    supplierSlug: "home-deco",
    discountPercentage: 18,
    createdAt: new Date("2024-01-21"),
  }),
  createMockProduct({
    id: 8,
    categoryId: 4,
    name: "Sac à Dos Urbain",
    description: "Sac à dos pratique et stylé",
    price: 28000,
    supplier_id: 3,
    supplierId: 3,
    supplier_name: "Home & Deco",
    supplierName: "Home & Deco",
    supplier_slug: "home-deco",
    supplierSlug: "home-deco",
    createdAt: new Date("2024-01-22"),
  }),
  createMockProduct({
    id: 9,
    categoryId: 1,
    name: "Pantalon Chino Moderne",
    description: "Pantalon confortable et élégant",
    price: 22000,
    supplier_id: 2,
    supplierId: 2,
    supplier_name: "Mode Afro",
    supplierName: "Mode Afro",
    supplier_slug: "mode-afro",
    supplierSlug: "mode-afro",
    discountPercentage: 12,
    createdAt: new Date("2024-01-23"),
  }),
  createMockProduct({
    id: 10,
    categoryId: 1,
    name: "Veste Denim Classique",
    description: "Veste intemporelle en denim",
    price: 32000,
    supplier_id: 2,
    supplierId: 2,
    supplier_name: "Mode Afro",
    supplierName: "Mode Afro",
    supplier_slug: "mode-afro",
    supplierSlug: "mode-afro",
    discountPercentage: 22,
    createdAt: new Date("2024-01-24"),
  }),
];

export function getProductWithCategory(
  product: ProductWithDiscount,
): ProductWithDiscount & { category?: Category } {
  const category = mockCategories.find((cat) => cat.id === product.categoryId);
  return { ...product, category };
}
