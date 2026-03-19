import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertSupplier, Supplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSupplier(id: number) {
  return useQuery({
    queryKey: [api.suppliers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.suppliers.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch supplier");
      return api.suppliers.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const validated = api.suppliers.create.input.parse(data);
      // Map frontend supplier shape to Laravel backend expected fields
      const payload: Record<string, any> = {
        name: (validated as any).storeName || (validated as any).name || "",
        phone: (validated as any).phone || null,
        email: (validated as any).email || null,
        address: (validated as any).address || null,
        // preserve optional flags if provided
        create_user: (validated as any).create_user ?? true,
        send_invite: (validated as any).send_invite ?? true,
      };

      const res = await fetch(api.suppliers.create.path, {
        method: api.suppliers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.suppliers.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to register supplier");
      }
      return api.suppliers.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: `Welcome to SISMA, ${data.storeName}!`,
      });
      // Optionally invalidate supplier lists if an admin dashboard exists
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
