/**
 * SISMA E-commerce Platform - Shared Modules
 * This file exports all shared utilities, services, and components
 * that can be used across different frontend applications
 */

// ============================================
// API Service
// ============================================

export * from './api-service';

// ============================================
// Auth Contexts
// ============================================

export * from './admin-auth-context';
export * from './supplier-auth-context';
export * from './delivery-auth-context';
export * from './client-auth-context';

// ============================================
// Role-Based Route Protection
// ============================================

export * from './role-protected-route';

// ============================================
// Re-export commonly used types
// ============================================

export type { UserRole, AuthUser } from './api-service';
