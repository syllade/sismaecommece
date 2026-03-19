import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { clientApiRequest } from '../context/ClientAuthContext';

// Types
export interface ClientOrder {
  id: number;
  order_number: string;
  items: {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  commune?: string;
  created_at: string;
  updated_at?: string;
  delivered_at?: string;
}

export interface CartItem {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

// ============ Cart Hooks ============

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('sisma_cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('sisma_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === item.product_id);
      if (existing) {
        return prev.map(i => 
          i.product_id === item.product_id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(i => 
      i.product_id === productId ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  };
}

// ============ Orders Hooks ============

export function useClientOrders() {
  return useQuery<ClientOrder[]>({
    queryKey: ['client-orders'],
    queryFn: () => clientApiRequest('/client/orders'),
    staleTime: 30 * 1000,
  });
}

export function useClientOrder(id: number) {
  return useQuery<ClientOrder>({
    queryKey: ['client-order', id],
    queryFn: () => clientApiRequest(`/client/orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { clearCart } = useCart();

  return useMutation({
    mutationFn: (data: {
      customer_name: string;
      customer_phone: string;
      customer_address: string;
      commune?: string;
      payment_method: string;
    }) => {
      const cart = JSON.parse(localStorage.getItem('sisma_cart') || '[]');
      return clientApiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({ ...data, items: cart }),
      });
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
    },
  });
}

// ============ Profile Hooks ============

export function useClientProfile() {
  return useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientApiRequest('/client/profile'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateClientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; phone?: string }) =>
      clientApiRequest('/client/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
    },
  });
}
