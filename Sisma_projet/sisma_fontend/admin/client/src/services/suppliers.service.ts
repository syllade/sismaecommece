import api from '@/lib/api';
import { 
  Supplier, 
  SupplierPerformance, 
  PendingSupplier, 
  SupplierStats,
  SupplierFilters 
} from '@/types';
import { ApiResponse } from '@/types';

/**
 * Supplier Service
 * Handles all supplier-related API calls
 */
export const supplierService = {
  /**
   * Get supplier performance ranking
   */
  getPerformance: async (filters?: SupplierFilters): Promise<ApiResponse<SupplierPerformance[]>> => {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    
    const response = await api.get(`/v1/admin/suppliers/performance?${params.toString()}`);
    return response.data;
  },

  /**
   * Get pending supplier registrations
   */
  getPendingRegistrations: async (search?: string): Promise<ApiResponse<PendingSupplier[]>> => {
    const url = search 
      ? `/v1/admin/suppliers/pending-registrations?search=${encodeURIComponent(search)}`
      : '/v1/admin/suppliers/pending-registrations';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get all suppliers
   */
  getAll: async (filters?: SupplierFilters): Promise<ApiResponse<Supplier[]>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    
    const response = await api.get(`/v1/admin/suppliers?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single supplier by ID
   */
  getById: async (id: number): Promise<ApiResponse<Supplier>> => {
    const response = await api.get(`/v1/admin/suppliers/${id}`);
    return response.data;
  },

  /**
   * Validate/Approve supplier
   */
  approve: async (id: number): Promise<ApiResponse<Supplier>> => {
    const response = await api.post(`/v1/admin/suppliers/${id}/validate`);
    return response.data;
  },

  /**
   * Reject supplier
   */
  reject: async (id: number, reason?: string): Promise<ApiResponse<Supplier>> => {
    const response = await api.post(`/v1/admin/suppliers/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Block supplier
   */
  block: async (id: number): Promise<ApiResponse<Supplier>> => {
    const response = await api.post(`/v1/admin/suppliers/${id}/block`);
    return response.data;
  },

  /**
   * Unblock supplier
   */
  unblock: async (id: number): Promise<ApiResponse<Supplier>> => {
    const response = await api.post(`/v1/admin/suppliers/${id}/unblock`);
    return response.data;
  },

  /**
   * Get supplier statistics
   */
  getStats: async (): Promise<ApiResponse<SupplierStats>> => {
    const response = await api.get('/v1/admin/suppliers/stats');
    return response.data;
  },

  /**
   * Reset supplier password
   */
  resetPassword: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/v1/admin/suppliers/${id}/reset-password`);
    return response.data;
  },

  /**
   * Invite new supplier
   */
  invite: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/v1/admin/suppliers/invite', { email });
    return response.data;
  },

  /**
   * Bulk action on suppliers
   */
  bulkAction: async (
    supplierIds: number[], 
    action: 'activate' | 'deactivate' | 'delete'
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/v1/admin/suppliers/bulk-action', {
      supplier_ids: supplierIds,
      action
    });
    return response.data;
  },
};

export default supplierService;
