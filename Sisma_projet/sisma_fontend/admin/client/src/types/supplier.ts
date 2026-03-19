// TypeScript Types for Supplier Management

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  status: 'pending_validation' | 'active' | 'inactive' | 'blocked';
  is_active: boolean;
  commission_rate: number;
  total_sales?: number;
  total_orders?: number;
  revenue?: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierPerformance {
  id: number;
  name: string;
  logo?: string;
  email: string;
  phone: string;
  products_count: number;
  total_orders: number;
  revenue: number;
  pending_orders: number;
  delivery_success_rate: number;
  avg_rating: number;
  score: number;
  rank: number;
}

export interface PendingSupplier extends Supplier {
  pending_products_count: number;
  category_ids?: number[];
}

export interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  pending_suppliers: number;
  blocked_suppliers: number;
}

export interface SupplierFilters {
  search?: string;
  status?: string;
  period?: 'day' | 'week' | 'month' | 'year';
  sort_by?: 'score' | 'revenue' | 'orders' | 'name';
  page?: number;
  per_page?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
