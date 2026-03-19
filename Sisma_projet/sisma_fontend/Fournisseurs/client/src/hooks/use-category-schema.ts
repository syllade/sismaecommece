import { useQuery, useMutation } from '@tanstack/react-query';
const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
const SUPPLIER_TOKEN_KEY = "sisma_supplier_token";
const LEGACY_SUPPLIER_TOKEN_KEY = "fashop_supplier_token";

// Types
export interface CategoryField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  help_text?: string;
  required: boolean;
  options?: string[];
  default_value?: any;
  min?: number;
  max?: number;
  accept?: string; // For file type
}

export interface CategorySchema {
  category: {
    id: number;
    name: string;
    slug: string;
    description?: string;
  };
  fields: CategoryField[];
}

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token =
    localStorage.getItem(SUPPLIER_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY) ||
    '';
  
  const response = await fetch(
    endpoint.startsWith('/api/')
      ? `${API_ROOT}${endpoint.replace(/^\/api/, '')}`
      : endpoint,
    {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem(SUPPLIER_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("app:unauthorized", { detail: { status: 401 } }));
    throw new Error('Session expirée');
  }

  if (response.status === 403) {
    window.dispatchEvent(new CustomEvent("app:forbidden", { detail: { status: 403 } }));
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `API request failed: ${response.status}`);
  }

  return response.json();
}

// ============ Category Schema Hooks ============

export function useCategories() {
  return useQuery<CategorySchema['category'][]>({
    queryKey: ['categories'],
    queryFn: () => fetchApi('/api/categories'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCategorySchema(categoryId: number | null) {
  return useQuery<CategorySchema>({
    queryKey: ['category-schema', categoryId],
    queryFn: () => fetchApi(`/api/categories/${categoryId}/schema`),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============ Dynamic Form Generator ============

export interface DynamicFieldProps {
  field: CategoryField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function generateDynamicFields(schema: CategorySchema | undefined) {
  if (!schema?.fields) return [];
  
  return schema.fields.map(field => ({
    ...field,
    // Generate validation rules
    validation: {
      required: field.required,
      type: field.type,
      min: field.min,
      max: field.max,
      options: field.options,
    },
    // Generate default handlers based on type
    handlers: {
      onChange: (value: any) => value,
      onValidate: (value: any) => {
        if (field.required && !value) {
          return `${field.label} est requis`;
        }
        if (field.type === 'number' && field.min !== undefined && value < field.min) {
          return `La valeur minimum est ${field.min}`;
        }
        if (field.type === 'number' && field.max !== undefined && value > field.max) {
          return `La valeur maximum est ${field.max}`;
        }
        return null;
      },
    },
  }));
}

// ============ Product Form Helper ============

export function prepareProductData(
  baseData: {
    name: string;
    description: string;
    price: number;
    category_id: number;
    images?: File[];
  },
  dynamicFields: Record<string, any>
) {
  // Separate main fields from dynamic fields
  const mainFields = {
    name: baseData.name,
    description: baseData.description,
    price: baseData.price,
    category_id: baseData.category_id,
  };

  // Combine with dynamic fields
  const allFields = {
    ...mainFields,
    ...dynamicFields,
  };

  // Handle images - they need to be sent as FormData
  if (baseData.images && baseData.images.length > 0) {
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.entries(allFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Add images
    baseData.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });
    
    return formData;
  }

  return allFields;
}

// ============ Import Hooks ============

export interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  created_at: string;
  completed_at?: string;
}

export function useProductImport() {
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'csv' | 'excel' }) => {
      const token =
        localStorage.getItem(SUPPLIER_TOKEN_KEY) ||
        localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY) ||
        '';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`${API_ROOT}/v1/supplier/products/import`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Import failed' }));
        throw new Error(error.message);
      }

      return response.json();
    },
  });
}

export function useImportProgress(jobId: string) {
  return useQuery<ImportJob>({
    queryKey: ['import-progress', jobId],
    queryFn: () => fetchApi(`/api/v1/supplier/products/import/${jobId}`),
    enabled: !!jobId,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 0,
  });
}
