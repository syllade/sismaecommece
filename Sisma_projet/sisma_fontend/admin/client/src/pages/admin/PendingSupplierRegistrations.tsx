import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  UserPlus,
  Check,
  X,
  Search,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Store,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders, buildApiUrl } from "@/lib/apiConfig";
import { cn } from "@/lib/utils";

interface PendingSupplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  address?: string;
  availability?: string;
  is_active: boolean;
  created_at: string;
  pending_products_count: number;
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierCard({
  supplier,
  onValidate,
  onReject,
  isValidating,
  isRejecting,
}: {
  supplier: PendingSupplier;
  onValidate: (id: number) => void;
  onReject: (id: number) => void;
  isValidating: boolean;
  isRejecting: boolean;
}) {
  const waitingDays = Math.floor(
    (Date.now() - new Date(supplier.created_at).getTime()) / 86_400_000
  );

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      {/* Avatar */}
      <div className="shrink-0">
        {supplier.logo ? (
          <img
            src={supplier.logo}
            alt={supplier.name}
            className="h-14 w-14 rounded-xl object-cover ring-2 ring-slate-100"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 ring-2 ring-slate-100">
            <Store className="h-7 w-7 text-orange-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900 truncate">{supplier.name}</h3>
          {waitingDays > 3 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {waitingDays}j d'attente
            </Badge>
          )}
          {supplier.pending_products_count > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <ShoppingBag className="mr-1 h-3 w-3" />
              {supplier.pending_products_count} produit(s)
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {supplier.email}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {supplier.phone}
          </span>
        </div>
        {supplier.address && (
          <p className="text-xs text-slate-400 truncate">{supplier.address}</p>
        )}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="h-3 w-3 shrink-0" />
          Inscrit le {new Date(supplier.created_at).toLocaleDateString("fr-FR")}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReject(supplier.id)}
          disabled={isRejecting || isValidating}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 h-9"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Rejeter
        </Button>
        <Button
          size="sm"
          onClick={() => onValidate(supplier.id)}
          disabled={isValidating || isRejecting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Valider
        </Button>
      </div>
    </div>
  );
}

export default function PendingSupplierRegistrationsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery<{
    success: boolean;
    data: PendingSupplier[];
    meta: any;
  }>({
    queryKey: ["pending-supplier-registrations", search],
    queryFn: async () => {
      const url = search
        ? buildApiUrl(`/api/v1/admin/suppliers/pending-registrations?search=${encodeURIComponent(search)}`)
        : buildApiUrl("/api/v1/admin/suppliers/pending-registrations");
      const response = await fetch(url, { headers: getAuthHeaders() });
      return response.json();
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(buildApiUrl(`/api/v1/admin/suppliers/${id}/validate`), {
        method: "POST",
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Fournisseur validé ✓", description: "Le compte a été activé avec succès." });
        refetch();
      } else {
        toast({ title: "Erreur", description: res.message, variant: "destructive" });
      }
    },
    onError: () =>
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await fetch(buildApiUrl(`/api/v1/admin/suppliers/${id}/reject`), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return response.json();
    },
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Inscription rejetée", description: "L'inscription a été supprimée." });
        refetch();
      } else {
        toast({ title: "Erreur", description: res.message, variant: "destructive" });
      }
    },
    onError: () =>
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" }),
  });

  const suppliers = data?.data ?? [];
  const stats = data?.meta;

  const handleValidate = (id: number) => {
    if (confirm("Confirmer la validation de ce fournisseur ?")) {
      validateMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    const reason = prompt("Motif du rejet (optionnel) :");
    rejectMutation.mutate({ id, reason: reason ?? "" });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <UserPlus className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h1 className="font-outfit text-xl font-bold text-slate-900">
                Inscriptions en attente
              </h1>
              <p className="text-sm text-slate-500">Validation des nouveaux fournisseurs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 pl-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Clock className="h-5 w-5 text-orange-500" />}
            iconBg="bg-orange-50"
            label="En attente"
            value={stats?.total ?? suppliers.length}
          />
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-blue-500" />}
            iconBg="bg-blue-50"
            label="Avec produits"
            value={suppliers.filter((s) => s.pending_products_count > 0).length}
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            iconBg="bg-red-50"
            label="Action requise"
            value={suppliers.length}
          />
        </div>

        {/* List */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Dossiers en attente de validation</span>
              {suppliers.length > 0 && (
                <Badge variant="secondary" className="font-semibold">
                  {suppliers.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sisma-red" />
                <p className="text-sm text-slate-400">Chargement...</p>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <AlertCircle className="h-7 w-7 text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">Aucune inscription en attente</p>
                <p className="text-xs text-slate-400">
                  Tous les fournisseurs ont été traités.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onValidate={handleValidate}
                    onReject={handleReject}
                    isValidating={validateMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
