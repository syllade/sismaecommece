import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/api/http';

export interface Driver {
  id: number;
  name: string;
  email?: string;
  phone: string;
  vehicle_type?: string;
  city?: string;
  zone?: string;
  is_active: boolean;
  is_available: boolean;
  created_at?: string;
  completed_deliveries?: number;
}

export interface DriverMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageDeliveryTime: number; // in minutes
  totalDistance: number; // in km
  todayDeliveries: number;
  weekDeliveries: number;
  monthDeliveries: number;
  rating: number;
}

export interface DriverPerformance {
  id: number;
  name: string;
  phone: string;
  metrics: DriverMetrics;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

// API functions
export const driverManagementApi = {
  // List drivers
  listDrivers: (params?: {
    status?: 'all' | 'active' | 'inactive';
    zone?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) => apiGet<Driver[]>(
    `/api/v1/admin/drivers${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`
  ),

  // Get single driver
  getDriver: (id: number) => apiGet<Driver>(`/api/v1/admin/drivers/${id}`),

  // Get driver metrics
  getDriverMetrics: (id: number) => apiGet<DriverMetrics>(`/api/v1/admin/drivers/${id}/metrics`),

  // Get driver rankings
  getDriverRankings: (params?: { period?: 'day' | 'week' | 'month'; limit?: number }) =>
    apiGet<DriverPerformance[]>(
      `/api/v1/admin/drivers/rankings${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`
    ),

  // Get zones
  getZones: () => apiGet<string[]>('/api/v1/admin/drivers/zones'),

  // Create driver
  createDriver: (data: Partial<Driver> & { send_invite?: boolean }) =>
    apiPost<{ id: number; signed_url?: string }>('/api/v1/admin/drivers', data),

  // Update driver
  updateDriver: (id: number, data: Partial<Driver>) =>
    apiPost<{ id: number }>(`/api/v1/admin/drivers/${id}`, data),

  // Toggle driver status
  toggleDriverStatus: (id: number) =>
    apiPost<{ id: number; is_active: boolean }>(`/api/v1/admin/drivers/${id}/toggle-status`, {}),

  // Toggle driver availability
  toggleDriverAvailability: (id: number) =>
    apiPost<{ id: number; is_available: boolean }>(`/api/v1/admin/drivers/${id}/toggle-availability`, {}),

  // Assign order to driver
  assignOrder: (orderId: number, driverId: number) =>
    apiPost<{ success: boolean }>(`/api/v1/admin/orders/${orderId}/assign-driver`, { driver_id: driverId }),

  // Bulk assign orders
  bulkAssignOrders: (orderIds: number[], driverId: number) =>
    apiPost<{ affected_count: number }>('/api/v1/admin/orders/assign-driver', {
      order_ids: orderIds,
      driver_id: driverId,
    }),

  // Delete driver
  deleteDriver: (id: number) => apiDelete<{ success: boolean }>(`/api/v1/admin/drivers/${id}`),

  // Bulk actions
  bulkAction: (ids: number[], action: 'activate' | 'deactivate' | 'delete') =>
    apiPost<{ affected_count: number }>('/api/v1/admin/drivers/bulk-toggle', {
      driver_ids: ids,
      action,
    }),
};

// Hooks
export function useDrivers(params?: { status?: 'all' | 'active' | 'inactive'; zone?: string; search?: string }) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driverManagementApi.listDrivers(params),
    staleTime: 30000,
  });
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => driverManagementApi.getDriver(id),
    enabled: !!id,
  });
}

export function useDriverMetrics(id: number) {
  return useQuery({
    queryKey: ['driver', id, 'metrics'],
    queryFn: () => driverManagementApi.getDriverMetrics(id),
    enabled: !!id,
  });
}

export function useDriverRankings(period: 'day' | 'week' | 'month' = 'week', limit = 10) {
  return useQuery({
    queryKey: ['driver', 'rankings', period, limit],
    queryFn: () => driverManagementApi.getDriverRankings({ period, limit }),
  });
}

export function useDriverZones() {
  return useQuery({
    queryKey: ['driver', 'zones'],
    queryFn: () => driverManagementApi.getZones(),
  });
}

// Mutations
export function useCreateDriver() {
  return useMutation({
    mutationFn: (data: Partial<Driver> & { send_invite?: boolean }) =>
      driverManagementApi.createDriver(data),
  });
}

export function useUpdateDriver() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Driver> }) =>
      driverManagementApi.updateDriver(id, data),
  });
}

export function useToggleDriverStatus() {
  return useMutation({
    mutationFn: (id: number) => driverManagementApi.toggleDriverStatus(id),
  });
}

export function useToggleDriverAvailability() {
  return useMutation({
    mutationFn: (id: number) => driverManagementApi.toggleDriverAvailability(id),
  });
}

export function useAssignOrder() {
  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) =>
      driverManagementApi.assignOrder(orderId, driverId),
  });
}

export function useBulkAssignOrders() {
  return useMutation({
    mutationFn: ({ orderIds, driverId }: { orderIds: number[]; driverId: number }) =>
      driverManagementApi.bulkAssignOrders(orderIds, driverId),
  });
}

export function useDeleteDriver() {
  return useMutation({
    mutationFn: (id: number) => driverManagementApi.deleteDriver(id),
  });
}

export function useBulkDriverAction() {
  return useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: 'activate' | 'deactivate' | 'delete' }) =>
      driverManagementApi.bulkAction(ids, action),
  });
}

// Helper functions
export function calculateDriverScore(metrics: DriverMetrics): number {
  const successScore = metrics.successRate;
  const timeScore = Math.max(0, 100 - (metrics.averageDeliveryTime / 60) * 50); // 60 min = 50% penalty
  const volumeScore = Math.min(100, (metrics.monthDeliveries / 100) * 100);
  
  return Math.round(
    successScore * 0.5 +
    timeScore * 0.3 +
    volumeScore * 0.2
  );
}

export function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
