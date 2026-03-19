import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApiRequest } from '../contexts/AuthContext';
import type { Delivery, DeliveryStats, DeliveryProof } from '../types/delivery';

// ============ Stats Hooks ============

export function useDriverStats() {
  return useQuery<DeliveryStats>({
    queryKey: ['driver-stats'],
    queryFn: async () => {
      const stats = await driverApiRequest<any>('/v1/driver/stats');
      const todayCompleted = Number(stats?.today?.completed ?? 0);
      const todayPending = Number(stats?.today?.pending ?? 0);
      const todayExceptions = Number(stats?.today?.exceptions ?? 0);
      return {
        deliveries_today: todayCompleted + todayPending + todayExceptions,
        completed: todayCompleted,
        failed: todayExceptions,
        earnings: Number(stats?.today?.revenue ?? 0),
        rating: 0,
        total: Number(stats?.monthly?.total ?? 0),
        delivered: Number(stats?.monthly?.completed ?? 0),
        pending: todayPending,
      };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });
}

// ============ Deliveries Hooks ============

export function useDriverDeliveries(params?: {
  status?: string;
  date?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.date) queryParams.append('date', params.date);

  return useQuery<Delivery[]>({
    queryKey: ['driver-deliveries', params],
    queryFn: () => driverApiRequest(`/v1/driver/deliveries?${queryParams.toString()}`),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useDriverDelivery(id: number) {
  return useQuery<Delivery>({
    queryKey: ['driver-delivery', id],
    queryFn: () => driverApiRequest(`/v1/driver/deliveries/${id}`),
    enabled: !!id,
  });
}

export function usePendingDeliveriesCount() {
  return useQuery<{ pending_count: number }>({
    queryKey: ['driver-pending-count'],
    queryFn: () => driverApiRequest('/v1/driver/deliveries/pending-count'),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ============ Delivery Actions Hooks ============

export function useAcceptDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: number) =>
      driverApiRequest(`/v1/driver/deliveries/${deliveryId}/accept`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['driver-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
    },
  });
}

export function usePickupDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: number) =>
      driverApiRequest(`/v1/driver/deliveries/${deliveryId}/pickup`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
    },
  });
}

export function useCompleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliveryId, proof }: { deliveryId: number; proof?: DeliveryProof }) =>
      driverApiRequest(`/v1/driver/deliveries/${deliveryId}/complete`, {
        method: 'POST',
        body: JSON.stringify(proof || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['driver-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
    },
  });
}

export function useFailDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliveryId, reason }: { deliveryId: number; reason: string }) =>
      driverApiRequest(`/v1/driver/deliveries/${deliveryId}/fail`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['driver-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
    },
  });
}

// ============ Profile Hooks ============

export function useDriverProfile() {
  return useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverApiRequest('/v1/driver/profile'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateDriverProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Delivery>) =>
      driverApiRequest('/v1/driver/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    },
  });
}

export function useChangeDriverPassword() {
  return useMutation({
    mutationFn: (data: { current_password: string; password: string; password_confirmation: string }) =>
      driverApiRequest('/v1/driver/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.password,
          new_password_confirmation: data.password_confirmation,
        }),
      }),
  });
}
