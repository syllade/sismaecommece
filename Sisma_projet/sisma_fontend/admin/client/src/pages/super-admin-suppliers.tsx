import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { ShieldAlert, ShieldCheck, UserPlus, Clock, X, Check } from "lucide-react";
import { productsApi } from "@/api/products.api";
import { vendorsApi } from "@/api/vendors.api";
import { Layout } from "@/components/layout";
import { SuperDataTable } from "@/components/super-admin/super-data-table";
import { SuperPageHeader } from "@/components/super-admin/super-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useSuperAdminSuppliers } from "@/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";
import type { SuperAdminSupplier } from "@/types/super-admin";

interface PendingProduct {
  id: number;
  name: string;
  supplierId: number | null;
}

type PendingProductAction = "approve" | "reject";

export default function SuperAdminSuppliersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const suppliersQuery = useSuperAdminSuppliers();
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<SuperAdminSupplier[]>([]);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const basePath = user?.role === "super_admin" ? "/super-admin" : "/admin";

  const suppliers = suppliersQuery.data ?? [];
  const supplierNameById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers]);

  const pendingProductsQuery = useQuery({
    queryKey: ["super-admin", "pending-products"],
    queryFn: async (): Promise<PendingProduct[]> => {
      const products = await productsApi.listAdminProducts({ is_active: false });
      return products.slice(0, 20).map((product) => ({
        id: product.id,
        name: product.name,
        supplierId: product.supplierId ?? null,
      }));
    },
    refetchInterval: 45000,
  });

  const toggleSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      await vendorsApi.toggleAdminSupplierBlock(id);
    },
    onSuccess: async () => {
      await suppliersQuery.refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (status: "active" | "blocked") => {
      const ids = selectedRows.map((row) => row.id);
      if (ids.length === 0) return;
      await vendorsApi.bulkAdminSuppliers(ids, status === "active" ? "activate" : "deactivate");
    },
    onSuccess: async (_, status) => {
      setSelectedRows([]);
      await suppliersQuery.refetch();
      toast({
        title: "Action groupee executee",
        description: `Les fournisseurs selectionnes sont maintenant ${status === "active" ? "actifs" : "bloques"}.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!inviteName.trim() || !inviteEmail.trim()) throw new Error("Nom et email sont obligatoires.");
      await vendorsApi.inviteAdminSupplier({ name: inviteName.trim(), email: inviteEmail.trim() });
    },
    onSuccess: async () => {
      setInviteName("");
      setInviteEmail("");
      await suppliersQuery.refetch();
      toast({
        title: "Invitation envoyee",
        description: "Le fournisseur recevra un lien securise pour activer son acces.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Invitation echouee", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => vendorsApi.resetAdminSupplierPassword(id),
    onSuccess: (payload) => {
      toast({
        title: "Lien de reinitialisation genere",
        description: payload.reset_url ? "Le lien est disponible cote backend." : "Lien cree.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Reinitialisation impossible", description: error.message, variant: "destructive" });
    },
  });

  const pendingProductMutation = useMutation({
    mutationFn: async ({ productId, action }: { productId: number; action: PendingProductAction }) => {
      await productsApi.updateAdminProduct(productId, { is_active: action === "approve" });
    },
    onSuccess: async (_, variables) => {
      await pendingProductsQuery.refetch();
      toast({
        title: variables.action === "approve" ? "Produit approuve" : "Produit laisse inactif",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action non appliquee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Validate supplier mutation
  const validateSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      await vendorsApi.validateSupplier(id);
    },
    onSuccess: async () => {
      await suppliersQuery.refetch();
      toast({
        title: "Fournisseur valide",
        description: "Le fournisseur a ete valide avec succes.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Validation echouee", description: error.message, variant: "destructive" });
    },
  });

  // Reject supplier mutation
  const rejectSupplierMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      await vendorsApi.rejectSupplier(id, reason);
    },
    onSuccess: async () => {
      await suppliersQuery.refetch();
      toast({
        title: "Fournisseur refuse",
        description: "L'inscription du fournisseur a ete refusee.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Rejet echoue", description: error.message, variant: "destructive" });
    },
  });

  const columns = useMemo<ColDef<SuperAdminSupplier>[]>(
    () => [
      {
        field: "id",
        headerName: "#",
        maxWidth: 90,
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      { field: "name", headerName: "Nom", minWidth: 180 },
      { field: "email", headerName: "Email", minWidth: 220 },
      { field: "phone", headerName: "Telephone", minWidth: 140 },
      {
        field: "status",
        headerName: "Statut",
        minWidth: 130,
        cellRenderer: ({ value }: { value: SuperAdminSupplier["status"] }) => (
          <div className="flex items-center gap-2">
            {value === "active" ? (
              <Badge className="bg-green-100 text-green-700">
                <Check className="h-3 w-3 mr-1" />
                Valide
              </Badge>
            ) : value === "pending" ? (
              <Badge className="bg-yellow-100 text-yellow-700">
                <Clock className="h-3 w-3 mr-1" />
                En attente
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700">
                <X className="h-3 w-3 mr-1" />
                Refuse
              </Badge>
            )}
          </div>
        ),
      },
      { field: "productsCount", headerName: "Produits", minWidth: 110 },
      { field: "pendingOrders", headerName: "Cmd en attente", minWidth: 140 },
      {
        headerName: "Actions",
        minWidth: 320,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }: { data: SuperAdminSupplier }) => (
          <div className="flex items-center gap-2">
            {/* Validate/Refuse buttons for pending suppliers */}
            {data.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    if (confirm("Voulez-vous valider ce fournisseur ?")) {
                      validateSupplierMutation.mutate(data.id);
                    }
                  }}
                  disabled={validateSupplierMutation.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Valider
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    const reason = prompt("Motif du refus (optionnel):");
                    rejectSupplierMutation.mutate({ id: data.id, reason: reason || undefined });
                  }}
                  disabled={rejectSupplierMutation.isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Refuser
                </Button>
              </>
            )}
            {/* Block/Unblock for active suppliers */}
            {data.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-sisma-red text-sisma-red hover:bg-sisma-red hover:text-white"
                onClick={() => toggleSupplierMutation.mutate(data.id)}
              >
                Bloquer
              </Button>
            )}
            {/* Unblock for blocked suppliers */}
            {data.status === "blocked" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => toggleSupplierMutation.mutate(data.id)}
              >
                Debloquer
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7" onClick={() => resetPasswordMutation.mutate(data.id)}>
              Reinit MDP
            </Button>
          </div>
        ),
      },
    ],
    [resetPasswordMutation, toggleSupplierMutation, validateSupplierMutation, rejectSupplierMutation],
  );

  return (
    <Layout>
      <div className="space-y-6">
        <SuperPageHeader
          title="Gestion Fournisseurs"
          subtitle="Controle des marchands, invitations securisees, validation produits et actions groupees."
        />

        <SuperDataTable
          title="Fournisseurs"
          description="Table avancee: filtres, multi-selection, blocage/deblocage en masse."
          rows={suppliers}
          columns={columns}
          searchValue={search}
          onSearchChange={setSearch}
          loading={suppliersQuery.isLoading}
          searchPlaceholder="Rechercher par nom, email ou telephone..."
          onSelectionChange={setSelectedRows}
          toolbar={
            <div className="flex items-center gap-2">
              {selectedRows.length > 0 && (
                <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  {selectedRows.length} sélectionnée{selectedRows.length > 1 ? 's' : ''}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={selectedRows.length === 0 || bulkMutation.isPending}
                className="border-slate-300"
                onClick={() => bulkMutation.mutate("active")}
              >
                <ShieldCheck className="mr-1 h-4 w-4" />
                Activer
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedRows.length === 0 || bulkMutation.isPending}
                className="border-sisma-red text-sisma-red hover:bg-sisma-red hover:text-white"
                onClick={() => bulkMutation.mutate("blocked")}
              >
                <ShieldAlert className="mr-1 h-4 w-4" />
                Bloquer
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Creation fournisseur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Nom fournisseur" value={inviteName} onChange={(event) => setInviteName(event.target.value)} />
              <Input
                type="email"
                placeholder="Email invitation"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <Button
                className="w-full bg-sisma-red hover:bg-sisma-red/90"
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Envoyer invitation securisee
              </Button>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Validation produits fournisseurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(pendingProductsQuery.data ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Aucun produit inactif detecte.
                </p>
              ) : (
                (pendingProductsQuery.data ?? []).map((product) => (
                  <div key={product.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">
                        {product.supplierId ? supplierNameById.get(product.supplierId) ?? `Fournisseur #${product.supplierId}` : "Fournisseur"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => pendingProductMutation.mutate({ productId: product.id, action: "approve" })}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-sisma-red text-sisma-red hover:bg-sisma-red hover:text-white"
                        onClick={() => pendingProductMutation.mutate({ productId: product.id, action: "reject" })}
                      >
                        Rejeter
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => (window.location.href = `${basePath}/products`)}>
                        Modifier
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
