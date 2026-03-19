import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/http';

export interface VendorMetrics {
  id: number;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  // Performance metrics
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  // Delivery metrics
  averageDeliveryTime: number; // in hours
  onTimeDeliveryRate: number;
  // Customer metrics
  averageRating: number;
  totalReviews: number;
  // Time-based
  activeSince: string;
  lastOrderDate: string | null;
}

export interface VendorRanking {
  id: number;
  name: string;
  revenue: number;
  ordersCount: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface VendorPerformanceResponse {
  vendor: VendorMetrics;
  recentOrders: Array<{
    id: number;
    date: string;
    total: number;
    status: string;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function useVendorPerformance(vendorId: number) {
  return useQuery({
    queryKey: ['vendor', 'performance', vendorId],
    queryFn: () => apiGet<VendorPerformanceResponse>(`/api/v1/admin/suppliers/${vendorId}/metrics`),
    enabled: !!vendorId,
  });
}

export function useVendorRankings(period: 'week' | 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: ['vendor', 'rankings', period],
    queryFn: () => apiGet<VendorRanking[]>(`/api/v1/admin/suppliers/rankings?period=${period}`),
  });
}

export function useTopVendors(limit = 10) {
  return useQuery({
    queryKey: ['vendor', 'top', limit],
    queryFn: () => apiGet<VendorRanking[]>(`/api/v1/admin/suppliers?sort=revenue&limit=${limit}&is_active=1`),
  });
}

export function useVendorActivity(vendorId: number) {
  return useQuery({
    queryKey: ['vendor', 'activity', vendorId],
    queryFn: () => apiGet<Array<{
      type: string;
      description: string;
      timestamp: string;
    }>>(`/api/v1/admin/suppliers/${vendorId}/activity`),
    enabled: !!vendorId,
    refetchInterval: 60000, // Refresh every minute
  });
}

// Helper functions for calculations
export function calculateSuccessRate(completed: number, cancelled: number): number {
  const total = completed + cancelled;
  if (total === 0) return 100;
  return Math.round((completed / total) * 100);
}

export function calculateVendorScore(metrics: VendorMetrics): number {
  // Weighted scoring algorithm
  const orderCompletionWeight = 0.3;
  const deliveryTimeWeight = 0.25;
  const ratingWeight = 0.25;
  const revenueWeight = 0.2;

  const successRate = calculateSuccessRate(metrics.completedOrders, metrics.cancelledOrders);
  const deliveryScore = Math.max(0, 100 - (metrics.averageDeliveryTime * 5)); // Lower is better
  const ratingScore = metrics.averageRating * 20; // Convert 5-star to 100
  const revenueScore = Math.min(100, (metrics.totalRevenue / 1000000) * 100); // Scale revenue

  return Math.round(
    successRate * orderCompletionWeight +
    deliveryScore * deliveryTimeWeight +
    ratingScore * ratingWeight +
    revenueScore * revenueWeight
  );
}

export function getPerformanceGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 90) return { grade: 'A', color: 'text-green-600', label: 'Excellent' };
  if (score >= 75) return { grade: 'B', color: 'text-blue-600', label: 'Bon' };
  if (score >= 60) return { grade: 'C', color: 'text-yellow-600', label: 'Moyen' };
  if (score >= 40) return { grade: 'D', color: 'text-orange-600', label: 'À améliorer' };
  return { grade: 'F', color: 'text-red-600', label: 'Critique' };
}
