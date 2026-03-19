import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deliveriesApi } from "@/api/deliveries.api";

export function useDeliveries(params?: { status?: string; zone?: string; search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["deliveries", params],
    queryFn: () => deliveriesApi.listAdminDrivers(params),
  });
}

export function useCreateDeliveryDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof deliveriesApi.createAdminDriver>[0]) => deliveriesApi.createAdminDriver(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export function useToggleDeliveryDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deliveriesApi.toggleAdminDriverStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

