import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@shared/schema";
import { cartItemKey } from "@/data/variants";

/**
 * Item panier identifié par : productId + color + size.
 * Deux produits avec le même ID mais des variantes différentes = deux lignes distinctes.
 */
export interface CartItem extends Product {
  quantity: number;
  /** Couleur sélectionnée (si le produit propose des couleurs) */
  color?: string;
  /** Taille sélectionnée (si le produit propose des tailles) */
  size?: string;
  /** Remise en pourcentage utilisée par plusieurs vues produit */
  discount?: number;
  /** Alias historique de remise */
  discountPercentage?: number;
  /** Prix final déjà calculé */
  discountedPrice?: number;
  /** Campagne sponsorisée associée */
  sponsored_campaign_id?: number;
  /** Produit sponsorisé */
  is_sponsored?: boolean;
}

/** Clé unique pour un item : productId-color-size */
export function getCartItemKey(item: CartItem): string {
  return cartItemKey(item.id, item.color, item.size);
}

interface CartStore {
  items: CartItem[];
  addItem: (
    product: Product & {
      discount?: number;
      discountPercentage?: number;
      discountedPrice?: number;
      sponsored_campaign_id?: number;
      is_sponsored?: boolean;
    },
    options?: { color?: string; size?: string; quantity?: number }
  ) => void;
  removeItem: (productId: number, color?: string, size?: string) => void;
  updateQuantity: (productId: number, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  total: () => number;
}

function getCartItemUnitPrice(item: CartItem): number {
  if (item.discountedPrice != null) {
    return Number(item.discountedPrice);
  }

  const discountRate = Number(item.discountPercentage ?? item.discount ?? 0);
  if (discountRate > 0) {
    return Number(item.price) * (1 - discountRate / 100);
  }

  return Number(item.price);
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, options = {}) => {
        const { color, size, quantity = 1 } = options;
        const items = get().items;
        const key = cartItemKey(product.id, color, size);
        const existingIndex = items.findIndex(
          (item) => cartItemKey(item.id, item.color, item.size) === key
        );

        if (existingIndex >= 0) {
          const next = items.map((item, i) =>
            i === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ items: next });
        } else {
          const newItem: CartItem = {
            ...product,
            quantity,
            ...(color != null && { color }),
            ...(size != null && { size }),
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (productId, color, size) => {
        const key = cartItemKey(productId, color, size);
        set({
          items: get().items.filter(
            (item) => cartItemKey(item.id, item.color, item.size) !== key
          ),
        });
      },

      updateQuantity: (productId, quantity, color, size) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, size);
          return;
        }
        const key = cartItemKey(productId, color, size);
        set({
          items: get().items.map((item) =>
            cartItemKey(item.id, item.color, item.size) === key
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (sum, item) => sum + getCartItemUnitPrice(item) * item.quantity,
          0
        ),
    }),
    { name: "fashop-cart" }
  )
);
