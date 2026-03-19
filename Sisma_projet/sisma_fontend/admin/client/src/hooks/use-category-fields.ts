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

// Predefined category-specific fields for common categories
// These are used when API data is not available
const CATEGORY_SPECIFIC_FIELDS: Record<string, CategoryField[]> = {
  // Vêtements
  vetements: [
    {
      id: 'size',
      name: 'Taille',
      slug: 'size',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la taille',
      options: [
        { label: 'XS', value: 'XS' },
        { label: 'S', value: 'S' },
        { label: 'M', value: 'M' },
        { label: 'L', value: 'L' },
        { label: 'XL', value: 'XL' },
        { label: 'XXL', value: 'XXL' },
      ],
    },
    {
      id: 'color',
      name: 'Couleur',
      slug: 'color',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la couleur',
      options: [
        { label: 'Noir', value: 'Noir' },
        { label: 'Blanc', value: 'Blanc' },
        { label: 'Rouge', value: 'Rouge' },
        { label: 'Bleu', value: 'Bleu' },
        { label: 'Vert', value: 'Vert' },
        { label: 'Jaune', value: 'Jaune' },
        { label: 'Orange', value: 'Orange' },
        { label: 'Violet', value: 'Violet' },
        { label: 'Rose', value: 'Rose' },
        { label: 'Gris', value: 'Gris' },
        { label: 'Marron', value: 'Marron' },
        { label: 'Beige', value: 'Beige' },
      ],
    },
    {
      id: 'material',
      name: 'Matière',
      slug: 'material',
      type: 'text',
      required: false,
      placeholder: 'Coton, polyester, etc.',
    },
  ],
  // Chaussures
  chaussures: [
    {
      id: 'shoe_size',
      name: 'Pointure',
      slug: 'shoe_size',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la pointure',
      options: [
        { label: '38', value: '38' },
        { label: '39', value: '39' },
        { label: '40', value: '40' },
        { label: '41', value: '41' },
        { label: '42', value: '42' },
        { label: '43', value: '43' },
        { label: '44', value: '44' },
        { label: '45', value: '45' },
        { label: '46', value: '46' },
      ],
    },
    {
      id: 'color',
      name: 'Couleur',
      slug: 'color',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la couleur',
      options: [
        { label: 'Noir', value: 'Noir' },
        { label: 'Blanc', value: 'Blanc' },
        { label: 'Rouge', value: 'Rouge' },
        { label: 'Bleu', value: 'Bleu' },
        { label: 'Marron', value: 'Marron' },
        { label: 'Gris', value: 'Gris' },
      ],
    },
    {
      id: 'style',
      name: 'Style',
      slug: 'style',
      type: 'select',
      required: false,
      placeholder: 'Sélectionner le style',
      options: [
        { label: 'Sport', value: 'Sport' },
        { label: 'Classique', value: 'Classique' },
        { label: 'Casual', value: 'Casual' },
        { label: 'Bottes', value: 'Bottes' },
        { label: 'Sandales', value: 'Sandales' },
      ],
    },
  ],
  // Téléphones
  telephones: [
    {
      id: 'brand',
      name: 'Marque',
      slug: 'brand',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la marque',
      options: [
        { label: 'Samsung', value: 'Samsung' },
        { label: 'Apple', value: 'Apple' },
        { label: 'Xiaomi', value: 'Xiaomi' },
        { label: 'Huawei', value: 'Huawei' },
        { label: 'Oppo', value: 'Oppo' },
        { label: 'Vivo', value: 'Vivo' },
        { label: 'Realme', value: 'Realme' },
        { label: 'Tecno', value: 'Tecno' },
        { label: 'Infinix', value: 'Infinix' },
        { label: 'Itel', value: 'Itel' },
        { label: 'Nokia', value: 'Nokia' },
        { label: 'Autre', value: 'Autre' },
      ],
    },
    {
      id: 'ram',
      name: 'RAM',
      slug: 'ram',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la RAM',
      options: [
        { label: '2 Go', value: '2' },
        { label: '4 Go', value: '4' },
        { label: '6 Go', value: '6' },
        { label: '8 Go', value: '8' },
        { label: '12 Go', value: '12' },
        { label: '16 Go', value: '16' },
      ],
    },
    {
      id: 'storage',
      name: 'Stockage',
      slug: 'storage',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner le stockage',
      options: [
        { label: '16 Go', value: '16' },
        { label: '32 Go', value: '32' },
        { label: '64 Go', value: '64' },
        { label: '128 Go', value: '128' },
        { label: '256 Go', value: '256' },
        { label: '512 Go', value: '512' },
        { label: '1 To', value: '1024' },
      ],
    },
    {
      id: 'screen_size',
      name: 'Taille écran',
      slug: 'screen_size',
      type: 'select',
      required: false,
      placeholder: 'Sélectionner la taille',
      options: [
        { label: '4.7"', value: '4.7' },
        { label: '5.0"', value: '5.0' },
        { label: '5.5"', value: '5.5' },
        { label: '6.0"', value: '6.0' },
        { label: '6.4"', value: '6.4' },
        { label: '6.7"', value: '6.7' },
        { label: '6.9"', value: '6.9' },
      ],
    },
    {
      id: 'battery',
      name: 'Batterie',
      slug: 'battery',
      type: 'select',
      required: false,
      placeholder: 'Capacité batterie',
      options: [
        { label: '3000 mAh', value: '3000' },
        { label: '4000 mAh', value: '4000' },
        { label: '5000 mAh', value: '5000' },
        { label: '6000 mAh', value: '6000' },
      ],
    },
    {
      id: 'condition',
      name: 'État',
      slug: 'condition',
      type: 'select',
      required: true,
      placeholder: 'État du téléphone',
      options: [
        { label: 'Neuf', value: 'Neuf' },
        { label: 'Occasion - Excellent', value: 'Occasion - Excellent' },
        { label: 'Occasion - Bon', value: 'Occasion - Bon' },
        { label: 'Occasion - Moyen', value: 'Occasion - Moyen' },
      ],
    },
  ],
  // Ordinateurs
  ordinateurs: [
    {
      id: 'brand',
      name: 'Marque',
      slug: 'brand',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la marque',
      options: [
        { label: 'HP', value: 'HP' },
        { label: 'Dell', value: 'Dell' },
        { label: 'Lenovo', value: 'Lenovo' },
        { label: 'Asus', value: 'Asus' },
        { label: 'Acer', value: 'Acer' },
        { label: 'Apple', value: 'Apple' },
        { label: 'MSI', value: 'MSI' },
        { label: 'Toshiba', value: 'Toshiba' },
      ],
    },
    {
      id: 'processor',
      name: 'Processeur',
      slug: 'processor',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner le processeur',
      options: [
        { label: 'Intel Core i3', value: 'Intel Core i3' },
        { label: 'Intel Core i5', value: 'Intel Core i5' },
        { label: 'Intel Core i7', value: 'Intel Core i7' },
        { label: 'Intel Core i9', value: 'Intel Core i9' },
        { label: 'AMD Ryzen 3', value: 'AMD Ryzen 3' },
        { label: 'AMD Ryzen 5', value: 'AMD Ryzen 5' },
        { label: 'AMD Ryzen 7', value: 'AMD Ryzen 7' },
        { label: 'Apple M1', value: 'Apple M1' },
        { label: 'Apple M2', value: 'Apple M2' },
      ],
    },
    {
      id: 'ram',
      name: 'RAM',
      slug: 'ram',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la RAM',
      options: [
        { label: '4 Go', value: '4' },
        { label: '8 Go', value: '8' },
        { label: '16 Go', value: '16' },
        { label: '32 Go', value: '32' },
        { label: '64 Go', value: '64' },
      ],
    },
    {
      id: 'storage',
      name: 'Stockage',
      slug: 'storage',
      type: 'select',
      required: true,
      placeholder: 'Stockage principal',
      options: [
        { label: '256 Go SSD', value: '256 SSD' },
        { label: '512 Go SSD', value: '512 SSD' },
        { label: '1 To SSD', value: '1024 SSD' },
        { label: '1 To HDD', value: '1024 HDD' },
        { label: '2 To HDD', value: '2048 HDD' },
      ],
    },
    {
      id: 'screen_size',
      name: 'Taille écran',
      slug: 'screen_size',
      type: 'select',
      required: true,
      placeholder: 'Sélectionner la taille',
      options: [
        { label: '13"', value: '13' },
        { label: '14"', value: '14' },
        { label: '15.6"', value: '15.6' },
        { label: '17.3"', value: '17.3' },
      ],
    },
    {
      id: 'condition',
      name: 'État',
      slug: 'condition',
      type: 'select',
      required: true,
      placeholder: 'État de l\'ordinateur',
      options: [
        { label: 'Neuf', value: 'Neuf' },
        { label: 'Occasion - Excellent', value: 'Occasion - Excellent' },
        { label: 'Occasion - Bon', value: 'Occasion - Bon' },
      ],
    },
  ],
  // Cosmétiques
  cosmetiques: [
    {
      id: 'skin_type',
      name: 'Type de peau',
      slug: 'skin_type',
      type: 'select',
      required: false,
      placeholder: 'Type de peau',
      options: [
        { label: 'Tous types', value: 'Tous types' },
        { label: 'Peau sèche', value: 'Peau sèche' },
        { label: 'Peau grasse', value: 'Peau grasse' },
        { label: 'Peau mixte', value: 'Peau mixte' },
        { label: 'Peau sensible', value: 'Peau sensible' },
      ],
    },
    {
      id: 'volume',
      name: 'Volume',
      slug: 'volume',
      type: 'text',
      required: false,
      placeholder: '50ml, 100ml, etc.',
    },
    {
      id: 'brand',
      name: 'Marque',
      slug: 'brand',
      type: 'text',
      required: false,
      placeholder: 'Marque du produit',
    },
  ],
  // Accessories / Bijoux
  accessoires: [
    {
      id: 'material',
      name: 'Matière',
      slug: 'material',
      type: 'select',
      required: false,
      placeholder: 'Matière principale',
      options: [
        { label: 'Or', value: 'Or' },
        { label: 'Argent', value: 'Argent' },
        { label: 'Acier inoxydable', value: 'Acier inoxydable' },
        { label: 'Cuir', value: 'Cuir' },
        { label: 'Tissu', value: 'Tissu' },
        { label: 'Plastique', value: 'Plastique' },
        { label: 'Bois', value: 'Bois' },
      ],
    },
    {
      id: 'color',
      name: 'Couleur',
      slug: 'color',
      type: 'select',
      required: false,
      placeholder: 'Couleur',
      options: [
        { label: 'Or', value: 'Or' },
        { label: 'Argent', value: 'Argent' },
        { label: 'Noir', value: 'Noir' },
        { label: 'Blanc', value: 'Blanc' },
        { label: 'Rose gold', value: 'Rose gold' },
      ],
    },
  ],
  // Alimentation
  alimentation: [
    {
      id: 'expiry_date',
      name: 'Date d\'expiration',
      slug: 'expiry_date',
      type: 'date',
      required: true,
      placeholder: 'JJ/MM/AAAA',
    },
    {
      id: 'weight',
      name: 'Poids',
      slug: 'weight',
      type: 'text',
      required: false,
      placeholder: '500g, 1kg, etc.',
    },
    {
      id: 'brand',
      name: 'Marque',
      slug: 'brand',
      type: 'text',
      required: false,
      placeholder: 'Marque du produit',
    },
  ],
};

// Get category-specific fields with fallback
export function getCategorySpecificFields(categorySlug: string): CategoryField[] {
  return CATEGORY_SPECIFIC_FIELDS[categorySlug.toLowerCase()] || [];
}

// Get all fields for a category (default + category-specific)
export function getAllFieldsForCategory(categorySlug: string): CategoryField[] {
  const categoryFields = getCategorySpecificFields(categorySlug);
  return [...DEFAULT_PRODUCT_FIELDS, ...categoryFields];
}
