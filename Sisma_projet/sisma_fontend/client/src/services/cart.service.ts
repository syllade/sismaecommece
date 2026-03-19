/**
 * Service de panier et commandes pour les clients
 * Endpoints: /api/orders/*, /api/client/orders/*
 */

import { apiGet, apiPost, PaginatedData } from '@/lib/api';

// =====================================================
// TYPES - PANIER
// =====================================================

export interface CartItem {
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant_id?: number;
  variant_name?: string;
  attributes?: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  commune?: string;
  promo_discount?: number;
  promo_code?: string;
}

// =====================================================
// TYPES - COMMANDE
// =====================================================

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant_name?: string;
}

export interface ClientOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name: string;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  commune?: string;
  quartier?: string;
  delivery_notes?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparee'
  | 'expediee'
  | 'livree'
  | 'annulee';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'partial'
  | 'refunded';

export interface CreateOrderData {
  supplier_id: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  commune: string;
  quartier?: string;
  delivery_notes?: string;
  payment_method: 'cash' | 'card' | 'mobile_money';
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    variant_id?: number;
  }>;
  promo_code?: string;
}

// =====================================================
// TYPES - LIVRAISON
// =====================================================

export interface DeliveryFee {
  commune: string;
  price: number;
  estimated_time?: string;
}

export interface DeliveryCalculation {
  commune: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
}

// =====================================================
// FONCTIONS DE SERVICE - PANIER
// =====================================================

/**
 * Le panier est géré côté client avec localStorage
 * Cette fonction同步 le panier avec l'API
 */

// Fonction pour sauvegarder le panier dans localStorage
export function saveCart(cart: Cart): void {
  localStorage.setItem('sisma_cart', JSON.stringify(cart));
}

// Fonction pour charger le panier depuis localStorage
export function loadCart(): Cart {
  const stored = localStorage.getItem('sisma_cart');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { items: [], subtotal: 0, delivery_fee: 0, total: 0 };
    }
  }
  return { items: [], subtotal: 0, delivery_fee: 0, total: 0 };
}

// Fonction pour vider le panier
export function clearCart(): void {
  localStorage.removeItem('sisma_cart');
}

// Ajouter un article au panier
export function addToCart(item: Omit<CartItem, 'subtotal'>): Cart {
  const cart = loadCart();
  const existingIndex = cart.items.findIndex(
    i => i.product_id === item.product_id && i.variant_id === item.variant_id
  );

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += item.quantity;
    cart.items[existingIndex].subtotal = 
      cart.items[existingIndex].quantity * cart.items[existingIndex].price;
  } else {
    cart.items.push({
      ...item,
      subtotal: item.quantity * item.price
    });
  }

  recalculateCart(cart);
  saveCart(cart);
  return cart;
}

// Retirer un article du panier
export function removeFromCart(productId: number, variantId?: number): Cart {
  const cart = loadCart();
  cart.items = cart.items.filter(
    item => !(item.product_id === productId && item.variant_id === variantId)
  );
  recalculateCart(cart);
  saveCart(cart);
  return cart;
}

// Mettre à jour la quantité
export function updateCartItemQuantity(productId: number, quantity: number, variantId?: number): Cart {
  const cart = loadCart();
  const item = cart.items.find(
    i => i.product_id === productId && i.variant_id === variantId
  );
  
  if (item) {
    if (quantity <= 0) {
      cart.items = cart.items.filter(
        i => !(i.product_id === productId && i.variant_id === variantId)
      );
    } else {
      item.quantity = quantity;
      item.subtotal = quantity * item.price;
    }
  }
  
  recalculateCart(cart);
  saveCart(cart);
  return cart;
}

// Recalculer les totaux du panier
function recalculateCart(cart: Cart): void {
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  cart.total = cart.subtotal + cart.delivery_fee - (cart.promo_discount || 0);
}

// =====================================================
// FONCTIONS DE SERVICE - COMMANDES API
// =====================================================

/**
 * Créer une commande
 */
export async function createOrder(data: CreateOrderData): Promise<{
  id: number;
  order_number: string;
  total: number;
  message: string;
}> {
  return apiPost('/api/orders', data);
}

/**
 * Liste des commandes du client (authentifié)
 */
export async function listOrders(): Promise<PaginatedData<ClientOrder>> {
  return apiGet('/api/client/orders');
}

/**
 * Détails d'une commande
 */
export async function getOrder(id: number): Promise<ClientOrder> {
  return apiGet(`/api/client/orders/${id}`);
}

/**
 * Annuler une commande
 */
export async function cancelOrder(id: number, reason: string): Promise<{
  message: string;
}> {
  return apiPost(`/api/client/orders/${id}/cancel`, { reason });
}

// =====================================================
// FONCTIONS DE SERVICE - LIVRAISON
// =====================================================

/**
 * Calculer les frais de livraison
 */
export async function calculateDelivery(params: {
  commune: string;
  subtotal: number;
}): Promise<DeliveryCalculation> {
  return apiGet('/api/delivery-fees/calculate', params);
}

/**
 * Liste des communes/zones de livraison
 */
export async function getDeliveryZones(): Promise<DeliveryFee[]> {
  return apiGet('/api/delivery-fees');
}

// =====================================================
// FONCTIONS DE SERVICE - PROMOSS
// =====================================================

/**
 * Valider un code promo
 */
export async function validatePromoCode(code: string, orderTotal: number): Promise<{
  valid: boolean;
  discount: number;
  discount_type: 'percentage' | 'fixed';
  message: string;
}> {
  return apiPost('/api/v1/promotions/validate', { code, total: orderTotal });
}

// =====================================================
// EXPORT PAR DÉFAUT
// =====================================================

const cartService = {
  // Cart local
  saveCart,
  loadCart,
  clearCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  // Orders API
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
  // Delivery
  calculateDelivery,
  getDeliveryZones,
  // Promo
  validatePromoCode,
};

export default cartService;
