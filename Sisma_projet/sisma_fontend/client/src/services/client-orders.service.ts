import { API_BASE_URL, buildApiUrl } from '../lib/apiConfig';

/**
 * Client Order Service
 * Handles all client order-related API calls
 */
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
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  notes?: string;
  qr_code?: string;
  qr_code_security?: string;
  delivery_person_id?: number;
  delivery_person_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

const getToken = () => localStorage.getItem('client_token');
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const clientOrderService = {
  /**
   * Get all client orders
   */
  getOrders: async (): Promise<{ success: boolean; data: ClientOrder[]; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/client/orders`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Get single order by ID
   */
  getOrderById: async (id: number): Promise<{ success: boolean; data: ClientOrder; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/client/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Get order by order number
   */
  getOrderByNumber: async (orderNumber: string): Promise<{ success: boolean; data: ClientOrder; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/client/orders/by-number/${orderNumber}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Track order with QR code data
   */
  getOrderQrData: async (id: number): Promise<{ success: boolean; data: { qr_data: string; order: ClientOrder }; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/client/orders/${id}/qr-data`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Get order tracking status
   */
  getTrackingStatus: async (id: number): Promise<{ success: boolean; data: { status: string; timeline: any[] }; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/client/orders/${id}/tracking`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};

export default clientOrderService;
