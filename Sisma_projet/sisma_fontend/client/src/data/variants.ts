/**
 * Listes contrôlées pour les variantes produits (couleurs et tailles).
 * Utilisées côté client pour la sélection et côté admin pour la configuration des produits.
 */

export const PRODUCT_COLORS = [
  "Noir",
  "Blanc",
  "Gris",
  "Bleu",
  "Rouge",
  "Vert",
  "Jaune",
  "Orange",
  "Rose",
  "Marron",
  "Beige",
  "Multicouleur",
] as const;

export const PRODUCT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "cm",
  "m",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "Unique",
] as const;

export type ProductColor = (typeof PRODUCT_COLORS)[number];
export type ProductSize = (typeof PRODUCT_SIZES)[number];

/** Type produit avec variantes optionnelles (retour API ou admin) */
export type ProductWithVariants = {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  [key: string]: unknown;
} & {
  colors?: string[];
  sizes?: string[];
};

/**
 * Génère une clé unique pour un item panier : productId-color-size
 * Deux lignes distinctes si couleur ou taille différente.
 */
export function cartItemKey(productId: number, color?: string | null, size?: string | null): string {
  const c = color ?? "";
  const s = size ?? "";
  return `${productId}-${c}-${s}`;
}

/**
 * Indique si un produit requiert une sélection de variantes (couleur et/ou taille).
 * Utilisé côté client pour désactiver l’ajout direct au panier depuis les cartes.
 */
export function hasRequiredVariants(product: { colors?: string[]; sizes?: string[] } | null | undefined): boolean {
  if (!product) return false;
  const colors = normalizeVariants(product.colors);
  const sizes = normalizeVariants(product.sizes);
  return colors.length > 0 || sizes.length > 0;
}

/**
 * Normalise les variantes (couleurs ou tailles) renvoyées par l'API :
 * - si c'est un tableau, le retourne tel quel (sans les entrées vides)
 * - si c'est une chaîne (ex. "Noir,Blanc"), la découpe et renvoie un tableau
 */
export function normalizeVariants(value: string | string[] | null | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter((s) => s != null && String(s).trim() !== "");
  const s = String(value).trim();
  if (!s) return [];
  return s.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
}
