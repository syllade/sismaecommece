import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/services';
import { SupplierFilters } from '@/types';

/**
 * Hook for fetching supplier performance
 */
export const useSupplierPerformance = (filters?: SupplierFilters) => {
  return useQuery({
    queryKey: ['supplier-performance', filters],
    queryFn: () => supplierService.getPerformance(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching pending supplier registrations
 */
export const usePendingSuppliers = (search?: string) => {
  return useQuery({
    queryKey: ['pending-suppliers', search],
    queryFn: () => supplierService.getPendingRegistrations(search),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook for fetching all suppliers
 */
export const useSuppliers = (filters?: SupplierFilters) => {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => supplierService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching single supplier
 */
export const useSupplier = (id: number) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching supplier stats
 */
export const useSupplierStats = () => {
  return useQuery({
    queryKey: ['supplier-stats'],
    queryFn: () => supplierService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for approving a supplier
 */
export const useApproveSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => supplierService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
    },
  });
};

/**
 * Hook for rejecting a supplier
 */
export const useRejectSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => 
      supplierService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
    },
  });
};

/**
 * Hook for blocking a supplier
 */
export const useBlockSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => supplierService.block(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
    },
  });
};

/**
 * Hook for unblocking a supplier
 */
export const useUnblockSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => supplierService.unblock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
    },
  });
};
