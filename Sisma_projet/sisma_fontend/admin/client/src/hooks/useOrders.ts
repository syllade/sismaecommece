import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services';
import { OrderFilters, CreateOrderInput } from '@/types';

/**
 * Hook for fetching orders
 */
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook for fetching single order
 */
export const useOrder = (id: number) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching order stats
 */
export const useOrderStats = () => {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: () => orderService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for fetching QR code
 */
export const useOrderQrCode = (orderId: number) => {
  return useQuery({
    queryKey: ['order-qr', orderId],
    queryFn: () => orderService.getQrCode(orderId),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for creating an order
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOrderInput) => orderService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
};

/**
 * Hook for updating order status
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      orderService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
};

/**
 * Hook for assigning driver
 */
export const useAssignDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) => 
      orderService.assignDriver(orderId, driverId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
};

/**
 * Hook for validating QR code
 */
export const useValidateQrCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, qrData }: { orderId: number; qrData: string }) => 
      orderService.validateQr(orderId, qrData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
};

/**
 * Hook for regenerating QR code
 */
export const useRegenerateQrCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: number) => orderService.regenerateQr(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['order-qr', orderId] });
    },
  });
};

/**
 * Hook for deleting order
 */
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => orderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
};

/**
 * Hook for fetching unprocessed orders
 */
export const useUnprocessedOrders = () => {
  return useQuery({
    queryKey: ['unprocessed-orders'],
    queryFn: () => orderService.getUnprocessed(),
    staleTime: 30 * 1000,
  });
};
