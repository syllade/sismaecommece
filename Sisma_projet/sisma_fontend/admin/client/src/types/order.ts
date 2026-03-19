// TypeScript Types for Order Management

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  city?: string;
  supplier_id?: number;
  supplier_name?: string;
  delivery_person_id?: number;
  delivery_person_name?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items_count: number;
  qr_code?: string;
  qr_code_data?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  paid_at?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentMethod = 
  | 'cash_on_delivery'
  | 'online'
  | 'wave'
  | 'orange_money'
  | 'mtn_momo';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  city?: string;
  supplier_id?: number;
  product_id: number;
  quantity: number;
  notes?: string;
  delivery_date?: string;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  supplier_id?: number;
  delivery_person_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  today_orders: number;
  week_orders: number;
}

export interface QrCodeData {
  order_id: number;
  order_number: string;
  qr_code: string;
  qr_code_data: string;
  security_code: string;
  expires_at?: string;
}
