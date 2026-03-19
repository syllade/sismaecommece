import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProduct, type InsertCategory } from "@shared/schema";
import { mockProducts, mockCategories, getProductWithCategory } from "@/data/mockProducts";
import {
  normalizeProductShopCollection,
  normalizeProductShopData,
} from "@/lib/product-shop";

// --- Products ---

import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

export function useProducts(search?: string, categoryId?: string, onSale?: boolean) {
  return useQuery<any[]>({
    queryKey: ["products", search, categoryId, onSale],
    queryFn: async (): Promise<any[]> => {
      let url = buildApiUrl('/products');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryId) params.append('category_id', categoryId);
      if (onSale) params.append('on_sale', '1');
      if (params.toString()) url += '?' + params.toString();
      
      const res = await fetch(url, { headers: getApiHeaders() });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const products = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      return normalizeProductShopCollection(products);
    },
  });
}

export function useProduct(slug: string) {
  return useQuery<any | null>({
    queryKey: ["product", slug],
    queryFn: async (): Promise<any | null> => {
      const url = buildApiUrl(`/products/${slug}`);
      const res = await fetch(url, { headers: getApiHeaders() });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      const product = data?.data ?? data;
      return product ? normalizeProductShopData(product) : null;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProduct) => {
      // Coerce price and categoryId to numbers
      const payload = {
        ...data,
        price: Number(data.price),
        categoryId: Number(data.categoryId)
      };
      
      const validated = api.products.create.input.parse(payload);
      const res = await fetch(api.products.create.path, {
        method: api.products.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.products.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create product");
      }
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertProduct>) => {
       // Coerce if present
       const payload = { ...updates };
       if (payload.price) payload.price = Number(payload.price);
       if (payload.categoryId) payload.categoryId = Number(payload.categoryId);

      const validated = api.products.update.input.parse(payload);
      const url = buildUrl(api.products.update.path, { id });
      
      const res = await fetch(url, {
        method: api.products.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update product");
      return api.products.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.products.delete.path, { id });
      const res = await fetch(url, {
        method: api.products.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

// --- Categories ---

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const url = buildApiUrl('/categories');
      const res = await fetch(url, { headers: getApiHeaders() });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.data ?? data);
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCategory) => {
      const validated = api.categories.create.input.parse(data);
      const res = await fetch(api.categories.create.path, {
        method: api.categories.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create category");
      return api.categories.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.categories.delete.path, { id });
      const res = await fetch(url, { 
        method: api.categories.delete.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
    },
  });
}
