// Export all types
export * from './supplier';
export * from './order';
export * from './product';

// Common types
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
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

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ActionState<T> extends LoadingState {
  data: T | null;
}
