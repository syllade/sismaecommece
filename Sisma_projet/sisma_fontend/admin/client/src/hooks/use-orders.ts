import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/api/orders.api";

export function useOrders(params?: {
  status?: string;
  supplier_id?: number;
  driver_id?: number;
  commune?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.listAdminOrders(params),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "pending" | "preparee" | "expediee" | "livree" | "annulee" }) =>
      ordersApi.updateAdminOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAssignDriverToOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) => ordersApi.assignAdminOrderDriver(orderId, driverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

