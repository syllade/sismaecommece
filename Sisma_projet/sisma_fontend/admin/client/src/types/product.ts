// TypeScript Types for Product Management

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  category_id: number;
  category_name?: string;
  supplier_id: number;
  supplier_name?: string;
  stock: number;
  stock_alert?: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  on_sale: boolean;
  commission_rate?: number;
  rating?: number;
  reviews_count?: number;
  sold_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  image?: string;
  is_active: boolean;
  products_count?: number;
  children?: Category[];
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  category_id: number;
  supplier_id?: number;
  stock: number;
  stock_alert?: number;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  on_sale?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: number;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  supplier_id?: number;
  is_active?: boolean;
  on_sale?: boolean;
  price_min?: number;
  price_max?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  page?: number;
  per_page?: number;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_value: number;
}

export interface BulkProductAction {
  product_ids: number[];
  action: 'activate' | 'deactivate' | 'delete' | 'update_category';
  value?: any;
}
