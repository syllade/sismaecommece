import api from '@/lib/api';
import { 
  Order, 
  OrderFilters, 
  OrderStats, 
  CreateOrderInput,
  QrCodeData 
} from '@/types';
import { ApiResponse } from '@/types';

/**
 * Order Service
 * Handles all order-related API calls
 */
export const orderService = {
  /**
   * Get all orders with filters
   */
  getAll: async (filters?: OrderFilters): Promise<ApiResponse<Order[]>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.supplier_id) params.append('supplier_id', String(filters.supplier_id));
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    
    const response = await api.get(`/admin/orders?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single order by ID
   */
  getById: async (id: number): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  /**
   * Create new order (admin)
   */
  create: async (data: CreateOrderInput): Promise<ApiResponse<Order>> => {
    const response = await api.post('/admin/orders/create', data);
    return response.data;
  },

  /**
   * Update order status
   */
  updateStatus: async (
    id: number, 
    status: string
  ): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/admin/orders/${id}/status`, { status });
    return response.data;
  },

  /**
   * Assign delivery person
   */
  assignDriver: async (
    id: number, 
    deliveryPersonId: number
  ): Promise<ApiResponse<Order>> => {
    const response = await api.post(`/admin/orders/${id}/assign-driver`, {
      delivery_person_id: deliveryPersonId
    });
    return response.data;
  },

  /**
   * Get QR code for order
   */
  getQrCode: async (id: number): Promise<ApiResponse<QrCodeData>> => {
    const response = await api.get(`/admin/orders/${id}/qr`);
    return response.data;
  },

  /**
   * Validate QR code
   */
  validateQr: async (
    id: number, 
    qrData: string
  ): Promise<ApiResponse<{ valid: boolean; order?: Order }>> => {
    const response = await api.post(`/admin/orders/${id}/validate-qr`, { qr_data: qrData });
    return response.data;
  },

  /**
   * Regenerate QR code
   */
  regenerateQr: async (id: number): Promise<ApiResponse<QrCodeData>> => {
    const response = await api.post(`/admin/orders/${id}/regenerate-qr`);
    return response.data;
  },

  /**
   * Delete order
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/admin/orders/${id}`);
    return response.data;
  },

  /**
   * Get order statistics
   */
  getStats: async (): Promise<ApiResponse<OrderStats>> => {
    const response = await api.get('/admin/orders/stats');
    return response.data;
  },

  /**
   * Get unprocessed orders
   */
  getUnprocessed: async (): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/admin/orders/unprocessed');
    return response.data;
  },

  /**
   * Get grouped orders
   */
  getGrouped: async (): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/admin/orders/grouped');
    return response.data;
  },

  /**
   * Bulk assign drivers
   */
  bulkAssignDriver: async (
    orderIds: number[], 
    deliveryPersonId: number
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/admin/orders/assign-driver', {
      order_ids: orderIds,
      delivery_person_id: deliveryPersonId
    });
    return response.data;
  },
};

export default orderService;
