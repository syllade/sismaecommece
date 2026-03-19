import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorsApi } from "@/api/vendors.api";

export function useVendors(params?: { status?: "all" | "active" | "inactive" | "pending"; search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["vendors", params],
    queryFn: () => vendorsApi.listAdminSuppliers(params),
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof vendorsApi.createAdminSupplier>[0]) => vendorsApi.createAdminSupplier(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof vendorsApi.updateAdminSupplier>[1] }) =>
      vendorsApi.updateAdminSupplier(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vendorsApi.deleteAdminSupplier(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

