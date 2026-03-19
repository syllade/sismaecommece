/**
 * Service de gestion des fournisseurs pour les clients
 * Endpoints: /api/suppliers/*, /api/v1/shops/*
 */

import { apiGet, apiPost, PaginatedData } from '@/lib/api';
import { ClientProduct } from './products.service';

// =====================================================
// TYPES
// =====================================================

export interface Supplier {
  id: number;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logo?: string;
  cover_image?: string;
  description?: string;
  address?: string;
  rating?: number;
  reviews_count?: number;
  products_count?: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SupplierReview {
  id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified: boolean;
  created_at: string;
}

export interface SupplierReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface SupplierCategory {
  id: number;
  name: string;
  slug: string;
  products_count: number;
}

// =====================================================
// FONCTIONS DE SERVICE
// =====================================================

/**
 * Liste des fournisseurs
 */
export async function list(params?: {
  search?: string;
  category_id?: number;
  sort?: 'rating' | 'newest' | 'products';
  page?: number;
  per_page?: number;
}): Promise<PaginatedData<Supplier>> {
  return apiGet('/api/suppliers', params);
}

/**
 * Détails d'un fournisseur
 */
export async function get(slug: string): Promise<Supplier> {
  return apiGet(`/api/suppliers/${slug}`);
}

/**
 * Produits d'un fournisseur
 */
export async function getProducts(supplierId: number, params?: {
  category_id?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  per_page?: number;
}): Promise<PaginatedData<ClientProduct>> {
  return apiGet(`/api/suppliers/${supplierId}/products`, params);
}

/**
 * Meilleures boutiques
 */
export async function getTop(limit: number = 10): Promise<Supplier[]> {
  return apiGet('/api/v1/shops/top', { limit });
}

/**
 * Toutes les boutiques
 */
export async function getAll(params?: {
  page?: number;
  per_page?: number;
}): Promise<PaginatedData<Supplier>> {
  return apiGet('/api/v1/shops', params);
}

/**
 * Avis d'un fournisseur
 */
export async function getReviews(supplierId: number, params?: {
  page?: number;
  per_page?: number;
}): Promise<PaginatedData<SupplierReview>> {
  return apiGet(`/api/v1/shops/${supplierId}/reviews`, params);
}

/**
 * Résumé des avis
 */
export async function getReviewSummary(supplierId: number): Promise<SupplierReviewSummary> {
  return apiGet(`/api/v1/shops/${supplierId}/reviews-summary`);
}

/**
 * Ajouter un avis sur un fournisseur
 */
export async function addReview(supplierId: number, data: {
  rating: number;
  title?: string;
  comment: string;
}): Promise<{ id: number; message: string }> {
  return apiPost(`/api/v1/shops/${supplierId}/reviews`, data);
}

/**
 * Catégories d'un fournisseur
 */
export async function getCategories(supplierId: number): Promise<SupplierCategory[]> {
  return apiGet(`/api/suppliers/${supplierId}/categories`);
}

// =====================================================
// EXPORT PAR DÉFAUT
// =====================================================

const suppliersService = {
  list,
  get,
  getProducts,
  getTop,
  getAll,
  getReviews,
  getReviewSummary,
  addReview,
  getCategories,
};

export default suppliersService;
