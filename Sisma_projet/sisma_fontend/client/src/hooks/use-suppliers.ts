import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

// Types
export interface Supplier {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  rating?: number;
  totalProducts?: number;
  deliveryDays?: string;
  isVerified?: boolean;
  phone?: string;
  email?: string;
}

// Fetch all approved suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const url = buildApiUrl('/suppliers');
      const res = await fetch(url, { headers: getApiHeaders() });
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const data = await res.json();
      return data.data || data;
    },
  });
}

// Fetch single supplier by slug
export function useSupplier(slug: string) {
  return useQuery({
    queryKey: ["supplier", slug],
    queryFn: async () => {
      const url = buildApiUrl(`/suppliers/${slug}`);
      const res = await fetch(url, { headers: getApiHeaders() });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch supplier");
      return res.json();
    },
    enabled: !!slug,
  });
}

// Fetch products by supplier
export function useSupplierProducts(supplierId: number, categoryId?: number) {
  return useQuery({
    queryKey: ["supplierProducts", supplierId, categoryId],
    queryFn: async () => {
      let url = buildApiUrl(`/suppliers/${supplierId}/products`);
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId.toString());
      if (params.toString()) url += '?' + params.toString();
      
      const res = await fetch(url, { headers: getApiHeaders() });
      if (!res.ok) throw new Error("Failed to fetch supplier products");
      const data = await res.json();
      return data.data || data;
    },
    enabled: !!supplierId,
  });
}

// Mock data for development (when backend not available)
export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: "Électronique Pro CI",
    slug: "electronique-pro-ci",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=150&fit=crop",
    banner: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&h=300&fit=crop",
    description: "Spécialiste téléphones & accessoires de qualité",
    rating: 4.7,
    totalProducts: 24,
    deliveryDays: "24-48h",
    isVerified: true,
    phone: "+225 07 00 00 0001",
    email: "contact@electroniquepro.ci",
  },
  {
    id: 2,
    name: "Mode Afro",
    slug: "mode-afro",
    logo: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=150&h=150&fit=crop",
    banner: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop",
    description: "Tissus traditionnels et vêtements africains",
    rating: 4.5,
    totalProducts: 18,
    deliveryDays: "3-5 jours",
    isVerified: true,
    phone: "+225 07 00 00 0002",
    email: "contact@modeafro.ci",
  },
  {
    id: 3,
    name: "Home & Déco",
    slug: "home-deco",
    logo: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=150&h=150&fit=crop",
    banner: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=300&fit=crop",
    description: "Meubles et décoration pour votre intérieur",
    rating: 4.8,
    totalProducts: 32,
    deliveryDays: "5-7 jours",
    isVerified: true,
    phone: "+225 07 00 00 0003",
    email: "contact@homedeco.ci",
  },
  {
    id: 4,
    name: "Beauty Care",
    slug: "beauty-care",
    logo: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150&h=150&fit=crop",
    banner: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&h=300&fit=crop",
    description: "Cosmétiques et produits de beauté naturels",
    rating: 4.6,
    totalProducts: 45,
    deliveryDays: "24-72h",
    isVerified: false,
    phone: "+225 07 00 00 0004",
    email: "contact@beautycare.ci",
  },
  {
    id: 5,
    name: "Sports & Fitness",
    slug: "sports-fitness",
    logo: "https://images.unsplash.com/photo-1461896836934- voices-v1?w=150&h=150&fit=crop",
    banner: "https://images.unsplash.com/photo-1461897026036-b14a6bc9c1e9?w=1200&h=300&fit=crop",
    description: "Équipements sportifs et accessoires fitness",
    rating: 4.4,
    totalProducts: 15,
    deliveryDays: "3-5 jours",
    isVerified: true,
    phone: "+225 07 00 00 0005",
    email: "contact@sportsfitness.ci",
  },
];

// Helper to get supplier initials for fallback avatar
export function getSupplierInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Generate random gradient for supplier avatar fallback
export function getSupplierGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #D81918, #F7941D)',
    'linear-gradient(135deg, #F7941D, #D81918)',
    'linear-gradient(135deg, #22c55e, #14b8a6)',
    'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    'linear-gradient(135deg, #ec4899, #f97316)',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}
