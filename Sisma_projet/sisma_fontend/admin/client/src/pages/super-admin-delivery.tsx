import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { MailPlus, Power, PowerOff } from "lucide-react";
import { deliveriesApi } from "@/api/deliveries.api";
import { Layout } from "@/components/layout";
import { SuperDataTable } from "@/components/super-admin/super-data-table";
import { SuperPageHeader } from "@/components/super-admin/super-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSuperAdminDashboardData } from "@/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";
import type { SuperAdminDeliveryPerson } from "@/types/super-admin";

export default function SuperAdminDeliveryPage() {
  const { toast } = useToast();
  const { deliveryPeople, refetchAll, isLoading } = useSuperAdminDashboardData();
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<SuperAdminDeliveryPerson[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");

  const toggleDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      await deliveriesApi.toggleAdminDriverStatus(id);
    },
    onSuccess: async () => {
      await refetchAll();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Action echouee", description: message, variant: "destructive" });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (status: "active" | "inactive") => {
      const ids = selectedRows.map((row) => row.id);
      if (ids.length === 0) return;
      await deliveriesApi.bulkToggleAdminDrivers(ids, status === "active" ? "activate" : "deactivate");
    },
    onSuccess: async (_, status) => {
      setSelectedRows([]);
      await refetchAll();
      toast({
        title: "Action appliquee",
        description: `Les livreurs selectionnes sont maintenant ${status === "active" ? "actifs" : "inactifs"}.`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Action impossible", description: message, variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !email.trim() || !phone.trim() || !zone.trim()) {
        throw new Error("Nom, email, telephone et zone sont obligatoires.");
      }
      console.log("[Driver Create] Sending request with:", { name: name.trim(), email: email.trim(), phone: phone.trim(), zone: zone.trim() });
      try {
        const result = await deliveriesApi.createAdminDriver({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          zone: zone.trim(),
          is_active: true,
          send_invite: true,
        });
        console.log("[Driver Create] Success:", result);
        return result;
      } catch (err: unknown) {
        console.error("[Driver Create] Error:", err);
        throw err;
      }
    },
    onSuccess: async () => {
      setName("");
      setEmail("");
      setPhone("");
      setZone("");
      await refetchAll();
      toast({
        title: "Acces livreur cree",
        description: "Le livreur recevra son email d'activation securise.",
      });
    },
    onError: (error: unknown) => {
      console.error("[Driver Create] Mutation error:", error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Creation impossible", description: message, variant: "destructive" });
    },
  });

  const columns = useMemo<ColDef<SuperAdminDeliveryPerson>[]>(
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
      { field: "phone", headerName: "Telephone", minWidth: 150 },
      { field: "zone", headerName: "Zone", minWidth: 140 },
      {
        field: "status",
        headerName: "Statut",
        minWidth: 130,
        cellRenderer: ({ value }: { value: SuperAdminDeliveryPerson["status"] }) => (
          <Badge className={value === "active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"}>
            {value === "active" ? "Actif" : "Inactif"}
          </Badge>
        ),
      },
      { field: "assignedOrders", headerName: "Commandes assignees", minWidth: 170 },
      {
        headerName: "Actions",
        sortable: false,
        filter: false,
        minWidth: 200,
        cellRenderer: ({ data }: { data: SuperAdminDeliveryPerson }) => (
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-sisma-red text-sisma-red hover:bg-sisma-red hover:text-white"
            onClick={() => toggleDeliveryMutation.mutate(data.id)}
          >
            {data.status === "active" ? "Desactiver" : "Activer"}
          </Button>
        ),
      },
    ],
    [toggleDeliveryMutation],
  );

  return (
    <Layout>
      <div className="space-y-6">
        <SuperPageHeader
          title="Gestion Livreurs"
          subtitle="Administration des profils livreurs, zones de livraison et activation en masse."
        />

        <SuperDataTable
          title="Livreurs"
          description="Table avancee livreurs: zone, statut, commandes assignees, actions groupees."
          rows={deliveryPeople}
          columns={columns}
          searchValue={search}
          onSearchChange={setSearch}
          onSelectionChange={setSelectedRows}
          loading={isLoading}
          searchPlaceholder="Nom, email, zone..."
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
                onClick={() => bulkMutation.mutate("active")}
              >
                <Power className="mr-1 h-4 w-4" />
                Activer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-400 text-slate-700"
                disabled={selectedRows.length === 0 || bulkMutation.isPending}
                onClick={() => bulkMutation.mutate("inactive")}
              >
                <PowerOff className="mr-1 h-4 w-4" />
                Desactiver
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Creation / invitation livreur</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input placeholder="Nom complet" value={name} onChange={(event) => setName(event.target.value)} />
            <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input placeholder="Telephone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Input placeholder="Zone de livraison" value={zone} onChange={(event) => setZone(event.target.value)} />
            <Button className="bg-sisma-red hover:bg-sisma-red/90" onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
              <MailPlus className="mr-2 h-4 w-4" />
              Envoyer acces
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

