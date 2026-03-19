import api from '@/lib/api';
import { 
  Product, 
  Category, 
  ProductFilters, 
  ProductStats,
  CreateProductInput,
  UpdateProductInput 
} from '@/types';
import { ApiResponse } from '@/types';

/**
 * Product Service
 * Handles all product-related API calls
 */
export const productService = {
  /**
   * Get all products with filters
   */
  getAll: async (filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category_id) params.append('category_id', String(filters.category_id));
    if (filters?.supplier_id) params.append('supplier_id', String(filters.supplier_id));
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters?.on_sale !== undefined) params.append('on_sale', String(filters.on_sale));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    
    const response = await api.get(`/admin/products?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product by ID
   */
  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },

  /**
   * Create new product
   */
  create: async (data: CreateProductInput): Promise<ApiResponse<Product>> => {
    const response = await api.post('/admin/products', data);
    return response.data;
  },

  /**
   * Update product
   */
  update: async (data: UpdateProductInput): Promise<ApiResponse<Product>> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/admin/products/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete product
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  /**
   * Duplicate product
   */
  duplicate: async (id: number): Promise<ApiResponse<Product>> => {
    const response = await api.post(`/admin/products/${id}/duplicate`);
    return response.data;
  },

  /**
   * Get all categories
   */
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  /**
   * Create category
   */
  createCategory: async (data: Partial<Category>): Promise<ApiResponse<Category>> => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },

  /**
   * Update category
   */
  updateCategory: async (id: number, data: Partial<Category>): Promise<ApiResponse<Category>> => {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete category
   */
  deleteCategory: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  /**
   * Get product statistics
   */
  getStats: async (): Promise<ApiResponse<ProductStats>> => {
    const response = await api.get('/admin/products/stats');
    return response.data;
  },
};

export default productService;
