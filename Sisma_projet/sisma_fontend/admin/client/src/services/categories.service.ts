import api from '@/lib/api';
import { ApiResponse } from '@/types';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  is_active: boolean;
  order?: number;
  products_count?: number;
  children?: Category[];
}

export interface CategoryField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: string[];
  default_value?: string | number | boolean;
}

export interface CategorySchema {
  category_id: number;
  category_name: string;
  fields: CategoryField[];
}

/**
 * Category Service
 * Handles all category-related API calls
 */
export const categoryService = {
  /**
   * Get all categories (public)
   */
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories');
    return response.data;
  },

  /**
   * Get active categories
   */
  getActive: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories?status=active');
    return response.data;
  },

  /**
   * Get category by ID
   */
  getById: async (id: number): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * Get category schema for dynamic forms
   */
  getSchema: async (categoryId: number): Promise<ApiResponse<CategorySchema>> => {
    const response = await api.get(`/categories/${categoryId}/schema`);
    return response.data;
  },

  /**
   * Create category (admin only)
   */
  create: async (data: Partial<Category>): Promise<ApiResponse<Category>> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  /**
   * Update category (admin only)
   */
  update: async (id: number, data: Partial<Category>): Promise<ApiResponse<Category>> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete category (admin only)
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Reorder categories
   */
  reorder: async (categoryIds: number[]): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.put('/categories/reorder', { order: categoryIds });
    return response.data;
  },
};

export default categoryService;
