/**
 * Service de gestion des produits pour les clients
 * Endpoints: /api/products/*
 */

import { apiGet, apiPost, PaginatedData } from '@/lib/api';

// =====================================================
// TYPES
// =====================================================

export interface ClientProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_id: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  supplier_id: number;
  supplier_name?: string;
  supplier_slug?: string;
  supplierId?: number;
  supplierName?: string;
  supplier?: {
    id: number;
    name: string;
    slug: string;
    logo?: string;
    rating?: number;
  };
  price: number;
  compare_price?: number;
  images: string[];
  image?: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  discount?: number;
  rating?: number;
  reviews_count?: number;
  variants?: ProductVariant[];
  created_at: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  image?: string;
}

export interface ProductReview {
  id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified: boolean;
  created_at: string;
  reply?: {
    content: string;
    created_at: string;
  };
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verified_reviews: number;
}

export interface CreateReviewData {
  rating: number;
  title?: string;
  comment: string;
}

// =====================================================
// FONCTIONS DE SERVICE
// =====================================================

const BASE_URL = '/api/products';

/**
 * Liste des produits (public)
 */
export async function list(params?: {
  category_id?: number;
  supplier_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  per_page?: number;
}): Promise<PaginatedData<ClientProduct>> {
  return apiGet(BASE_URL, params);
}

/**
 * Détails d'un produit
 */
export async function get(slug: string): Promise<ClientProduct> {
  return apiGet(`${BASE_URL}/${slug}`);
}

/**
 * Produits en vedette
 */
export async function getFeatured(limit: number = 10): Promise<ClientProduct[]> {
  return apiGet('/api/v1/home/top-products', { limit });
}

/**
 * Nouveaux produits
 */
export async function getNew(limit: number = 10): Promise<ClientProduct[]> {
  return apiGet('/api/v1/home/new-products', { limit });
}

/**
 * Produits en promotion
 */
export async function getPromotions(limit: number = 10): Promise<ClientProduct[]> {
  return apiGet('/api/v1/home/promotions', { limit });
}

/**
 * Variantes d'un produit
 */
export async function getVariants(productId: number): Promise<ProductVariant[]> {
  return apiGet(`${BASE_URL}/${productId}/variants`);
}

/**
 * Avis d'un produit
 */
export async function getReviews(productId: number, params?: {
  page?: number;
  per_page?: number;
}): Promise<PaginatedData<ProductReview>> {
  return apiGet(`/api/v1/products/${productId}/reviews`, params);
}

/**
 * Résumé des avis
 */
export async function getReviewSummary(productId: number): Promise<ReviewSummary> {
  return apiGet(`/api/v1/products/${productId}/reviews-summary`);
}

/**
 * Ajouter un avis
 */
export async function addReview(productId: number, data: CreateReviewData): Promise<{
  id: number;
  message: string;
}> {
  return apiPost(`/api/v1/products/${productId}/reviews`, data);
}

/**
 * Rechercher des produits
 */
export async function search(query: string, params?: {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
}): Promise<PaginatedData<ClientProduct>> {
  return apiGet(BASE_URL, { search: query, ...params });
}

// =====================================================
// EXPORT PAR DÉFAUT
// =====================================================

const productsService = {
  list,
  get,
  getFeatured,
  getNew,
  getPromotions,
  getVariants,
  getReviews,
  getReviewSummary,
  addReview,
  search,
};

export default productsService;
