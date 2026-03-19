import api from '@/lib/api';
import { ApiResponse } from '@/types';

/**
 * Landing Page Service
 * Handles all landing page management API calls
 */
export const landingService = {
  /**
   * Get landing page settings (public)
   */
  getSettings: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/landing');
    return response.data;
  },

  /**
   * Get home page data (public)
   */
  getHomeData: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/v1/home');
    return response.data;
  },

  /**
   * Get top products for home page
   */
  getTopProducts: async (limit: number = 10): Promise<ApiResponse<any>> => {
    const response = await api.get(`/v1/home/top-products?limit=${limit}`);
    return response.data;
  },

  /**
   * Get new products for home page
   */
  getNewProducts: async (limit: number = 10): Promise<ApiResponse<any>> => {
    const response = await api.get(`/v1/home/new-products?limit=${limit}`);
    return response.data;
  },

  /**
   * Get top shops/suppliers for home page
   */
  getTopShops: async (limit: number = 10): Promise<ApiResponse<any>> => {
    const response = await api.get(`/v1/home/top-shops?limit=${limit}`);
    return response.data;
  },

  /**
   * Get categories for home page
   */
  getCategories: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/categories');
    return response.data;
  },

  /**
   * Get promotions for home page
   */
  getPromotions: async (limit: number = 10): Promise<ApiResponse<any>> => {
    const response = await api.get(`/v1/home/promotions?limit=${limit}`);
    return response.data;
  },

  /**
   * Update landing page settings (admin only)
   */
  updateSettings: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.put('/settings/landing', data);
    return response.data;
  },

  /**
   * Get landing settings (admin only)
   */
  getAdminSettings: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/settings/landing');
    return response.data;
  },
};

export default landingService;
