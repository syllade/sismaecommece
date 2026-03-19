import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/http';

// Category field types
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'date' | 'boolean' | 'file';

export interface CategoryField {
  id: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  defaultValue?: string | number | boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  fields?: CategoryField[];
  parentId?: number;
}

// Default fields for all products
export const DEFAULT_PRODUCT_FIELDS: CategoryField[] = [
  {
    id: 'name',
    name: 'Nom du produit',
    slug: 'name',
    type: 'text',
    required: true,
    placeholder: 'Entrez le nom du produit',
  },
  {
    id: 'description',
    name: 'Description',
    slug: 'description',
    type: 'textarea',
    required: true,
    placeholder: 'Décrivez votre produit...',
  },
  {
    id: 'price',
    name: 'Prix',
    slug: 'price',
    type: 'number',
    required: true,
    placeholder: '0',
    validation: { min: 0 },
  },
  {
    id: 'stock',
    name: 'Stock',
    slug: 'stock',
    type: 'number',
    required: true,
    placeholder: '0',
    validation: { min: 0 },
  },
  {
    id: 'category_id',
    name: 'Catégorie',
    slug: 'category_id',
    type: 'select',
    required: true,
  },
  {
    id: 'images',
    name: 'Images',
    slug: 'images',
    type: 'multiselect',
    required: false,
  },
];

// Interface for API category attributes response
interface CategoryAttributeFromApi {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  type: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: string[];
  validation?: Record<string, unknown>;
  default_value?: string;
  sort_order: number;
}

interface CategoryWithAttributes {
  id: number;
  name: string;
  slug: string;
  attributes: CategoryAttributeFromApi[];
}

// Fetch categories from API
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<Category[]>('/api/v1/admin/settings/categories'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch all category attributes from API
export function useCategoryAttributes() {
  return useQuery({
    queryKey: ['category-attributes'],
    queryFn: () =>
      apiGet<CategoryWithAttributes[]>('/api/v1/admin/settings/categories/all/attributes'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch attributes for a specific category
export function useCategoryAttributesById(categoryId: number | null) {
  return useQuery({
    queryKey: ['category-attributes', categoryId],
    queryFn: () =>
      categoryId
        ? apiGet<CategoryAttributeFromApi[]>(
            `/api/v1/admin/settings/categories/${categoryId}/attributes`
          )
        : Promise.resolve([]),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  });
}

// Transform API attributes to frontend format
function transformApiAttribute(attr: CategoryAttributeFromApi): CategoryField {
  return {
    id: attr.slug,
    name: attr.name,
    slug: attr.slug,
    type: attr.type as FieldType,
    required: attr.required,
    placeholder: attr.placeholder,
    helpText: attr.help_text,
    options: attr.options?.map((value) => ({ label: value, value })),
    validation: attr.validation as CategoryField['validation'],
    defaultValue: attr.default_value,
  };
}

// Get fields for a specific category (from API)
export function getCategoryFields(categorySlug: string): CategoryField[] {
  // This function is used by dynamic form - actual data comes from API hook
  return [];
}

// Get all fields (default + category-specific) - now fetches from API
export function getAllProductFields(
  categorySlug: string,
  categoryAttributes?: CategoryWithAttributes[]
): CategoryField[] {
  if (!categoryAttributes || categoryAttributes.length === 0) {
    return DEFAULT_PRODUCT_FIELDS;
  }

  const category = categoryAttributes.find((c) => c.slug === categorySlug);
  if (!category || !category.attributes) {
    return DEFAULT_PRODUCT_FIELDS;
  }

  const categoryFields = category.attributes.map(transformApiAttribute);
  return [...DEFAULT_PRODUCT_FIELDS, ...categoryFields];
}
