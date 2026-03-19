import { useMutation, useQuery } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");

export interface PublicCategory {
  id: number;
  name: string;
  slug?: string;
}

export interface SupplierRequirementsResponse {
  success: boolean;
  data: {
    required_fields: Record<string, string>;
    optional_fields: Record<string, string>;
    documents_info?: Record<string, string>;
    validation_rules?: Record<string, string>;
    available_categories?: PublicCategory[];
  };
}

export interface SupplierRegistrationPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  company_rccm?: string;
  company_nif?: string;
  address: string;
  city: string;
  country: string;
  description?: string;
  category_ids?: number[];
  logo?: File | null;
  id_document?: File | null;
  business_document?: File | null;
}

export interface SupplierStatusResponse {
  success: boolean;
  data: {
    status: 'pending_validation' | 'approved' | 'rejected' | 'inactive';
    message: string;
    supplier_name?: string;
    activated_at?: string;
  };
}

function appendIfPresent(formData: FormData, key: string, value: string | File | null | undefined) {
  if (value === undefined || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  formData.append(key, value);
}

export function useSupplierRequirements() {
  return useQuery<SupplierRequirementsResponse>({
    queryKey: ["supplier-registration", "requirements"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/supplier/requirements`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Impossible de charger les exigences d'inscription.");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicCategories() {
  return useQuery<PublicCategory[]>({
    queryKey: ["supplier-registration", "categories"],
    queryFn: async () => {
      // Fetch from requirements endpoint which already includes categories
      const response = await fetch(`${API_BASE}/supplier/requirements`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Impossible de charger les catégories.");
      const payload = await response.json();
      // Extract categories from the requirements response
      const categories = payload?.data?.available_categories || [];
      return Array.isArray(categories) ? categories : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplierCheckStatus(token: string) {
  return useQuery<SupplierStatusResponse>({
    queryKey: ["supplier-registration", "status", token],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/supplier/register/status/${token}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Impossible de vérifier le statut.");
      return response.json();
    },
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useResendActivationMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const formData = new FormData();
      formData.append("email", email);
      
      const response = await fetch(`${API_BASE}/supplier/resend-activation`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.message || "Erreur lors de l'envoi de l'activation.";
        const error = new Error(message) as Error & { payload?: any };
        error.payload = payload;
        throw error;
      }
      return payload;
    },
  });
}

export function useSupplierRegisterMutation() {
  return useMutation({
    mutationFn: async (data: SupplierRegistrationPayload) => {
      const formData = new FormData();
      appendIfPresent(formData, "first_name", data.first_name);
      appendIfPresent(formData, "last_name", data.last_name);
      appendIfPresent(formData, "email", data.email);
      appendIfPresent(formData, "phone", data.phone);
      appendIfPresent(formData, "password", data.password);
      appendIfPresent(formData, "password_confirmation", data.password_confirmation);
      appendIfPresent(formData, "company_name", data.company_name);
      appendIfPresent(formData, "company_rccm", data.company_rccm || "");
      appendIfPresent(formData, "company_nif", data.company_nif || "");
      appendIfPresent(formData, "address", data.address);
      appendIfPresent(formData, "city", data.city);
      appendIfPresent(formData, "country", data.country);
      appendIfPresent(formData, "description", data.description || "");
      appendIfPresent(formData, "logo", data.logo || null);
      appendIfPresent(formData, "id_document", data.id_document || null);
      appendIfPresent(formData, "business_document", data.business_document || null);

      if (Array.isArray(data.category_ids)) {
        data.category_ids.forEach((id) => formData.append("category_ids[]", String(id)));
      }

      const response = await fetch(`${API_BASE}/supplier/register`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.message || "Erreur lors de l'inscription fournisseur.";
        const error = new Error(message) as Error & { payload?: any };
        error.payload = payload;
        throw error;
      }
      return payload;
    },
  });
}
