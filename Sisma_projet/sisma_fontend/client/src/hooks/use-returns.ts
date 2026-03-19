import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

// Types
export interface OrderReturn {
  id: number;
  order_id: number;
  order_item_id: number | null;
  user_id: number | null;
  supplier_id: number | null;
  reason: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "refunded" | "completed";
  admin_notes: string | null;
  refund_amount: number | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  order?: any;
  order_item?: any;
  supplier?: any;
}

export const RETURN_REASONS = [
  { value: "defective_product", label: "Produit défectueux" },
  { value: "wrong_item", label: "Mauvais article reçu" },
  { value: "not_as_described", label: "Non conforme à la description" },
  { value: "size_issue", label: "Problème de taille" },
  { value: "quality_issue", label: "Problème de qualité" },
  { value: "changed_mind", label: "Changement d'avis" },
  { value: "other", label: "Autre" },
];

export const RETURN_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  refunded: "Remboursé",
  completed: "Terminé",
};

// Create a return request
export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      order_id: number;
      order_item_id?: number;
      reason: string;
      description?: string;
    }) => {
      const url = buildApiUrl("/v1/returns");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getApiHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la création de la demande de retour");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// Get client's returns
export function useMyReturns() {
  return useQuery({
    queryKey: ["returns", "my"],
    queryFn: async () => {
      const url = buildApiUrl("/v1/returns/my");
      const res = await fetch(url, { headers: getApiHeaders() });

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des retours");
      }

      const data = await res.json();
      return data.data || [];
    },
  });
}

// Get a specific return
export function useReturn(returnId: number | null) {
  return useQuery({
    queryKey: ["returns", returnId],
    queryFn: async () => {
      if (!returnId) return null;

      const url = buildApiUrl(`/v1/returns/${returnId}`);
      const res = await fetch(url, { headers: getApiHeaders() });

      if (!res.ok) {
        throw new Error("Erreur lors du chargement du retour");
      }

      const data = await res.json();
      return data.data;
    },
    enabled: !!returnId,
  });
}

// Approve a return (admin/supplier)
export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { returnId: number; refund_amount?: number; notes?: string }) => {
      const url = buildApiUrl(`/v1/returns/${data.returnId}/approve`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          refund_amount: data.refund_amount,
          notes: data.notes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de l'approbation");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
  });
}

// Reject a return (admin/supplier)
export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { returnId: number; reason: string }) => {
      const url = buildApiUrl(`/v1/returns/${data.returnId}/reject`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getApiHeaders(),
        },
        body: JSON.stringify({ reason: data.reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors du rejet");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
  });
}

// Mark as refunded (admin/supplier)
export function useRefundReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (returnId: number) => {
      const url = buildApiUrl(`/v1/returns/${returnId}/refund`);
      const res = await fetch(url, {
        method: "POST",
        headers: getApiHeaders(),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors du remboursement");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
  });
}
