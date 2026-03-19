import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { Eye, XCircle } from "lucide-react";
import { ordersApi, toBackendOrderStatusForUpdate } from "@/api/orders.api";
import { Layout } from "@/components/layout";
import { SuperDataTable } from "@/components/super-admin/super-data-table";
import { SuperPageHeader } from "@/components/super-admin/super-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useSuperAdminDashboardData } from "@/hooks/use-super-admin";
import type { SuperAdminOrder } from "@/types/super-admin";

function formatOrderDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusClass(status: string): string {
  if (status === "completed" || status === "delivered") return "bg-green-100 text-green-700";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  return "bg-orange-100 text-orange-700";
}

export default function SuperAdminOrdersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { orders, suppliers, deliveryPeople, refetchAll, isLoading } = useSuperAdminDashboardData();
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<SuperAdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [bulkDeliveryId, setBulkDeliveryId] = useState("");
  const basePath = user?.role === "super_admin" ? "/super-admin" : "/admin";

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.customer.toLowerCase().includes(normalizedSearch) ||
        order.supplier.toLowerCase().includes(normalizedSearch) ||
        String(order.id).includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSupplier = supplierFilter === "all" || order.supplier === supplierFilter;
      const matchesDelivery = deliveryFilter === "all" || order.deliveryPerson === deliveryFilter;

      const matchesDate = (() => {
        if (!dateFilter) return true;
        const orderDate = new Date(order.date);
        if (Number.isNaN(orderDate.getTime())) return false;
        const [year, month, day] = dateFilter.split("-").map((part) => Number(part));
        if (!year || !month || !day) return true;
        return (
          orderDate.getFullYear() === year &&
          orderDate.getMonth() + 1 === month &&
          orderDate.getDate() === day
        );
      })();

      return matchesSearch && matchesStatus && matchesSupplier && matchesDelivery && matchesDate;
    });
  }, [dateFilter, deliveryFilter, orders, search, statusFilter, supplierFilter]);

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await ordersApi.updateAdminOrderStatus(orderId, toBackendOrderStatusForUpdate(status));
    },
    onSuccess: async () => {
      await refetchAll();
      toast({ title: "Statut mis a jour" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Echec action", description: message, variant: "destructive" });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      const deliveryId = Number(bulkDeliveryId);
      if (!deliveryId || selectedRows.length === 0) {
        throw new Error("Selectionnez des commandes et un livreur.");
      }

      await ordersApi.bulkAssignAdminOrderDriver(
        selectedRows.map((row) => row.id),
        deliveryId,
      );
    },
    onSuccess: async () => {
      setSelectedRows([]);
      setBulkDeliveryId("");
      await refetchAll();
      toast({ title: "Attribution terminee", description: "Les commandes selectionnees ont ete attribuees." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Attribution impossible", description: message, variant: "destructive" });
    },
  });

  const columns = useMemo<ColDef<SuperAdminOrder>[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        maxWidth: 90,
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      { field: "customer", headerName: "Client", minWidth: 180 },
      { field: "supplier", headerName: "Fournisseur", minWidth: 180 },
      { field: "deliveryPerson", headerName: "Livreur", minWidth: 160 },
      {
        field: "status",
        headerName: "Statut",
        minWidth: 130,
        cellRenderer: ({ value }: { value: string }) => <Badge className={statusClass(value)}>{value}</Badge>,
      },
      {
        field: "date",
        headerName: "Date",
        minWidth: 180,
        valueFormatter: ({ value }: { value: string }) => formatOrderDate(value),
      },
      {
        field: "total",
        headerName: "Total",
        minWidth: 150,
        valueFormatter: ({ value }: { value: number }) => `${value.toLocaleString("fr-FR")} FCFA`,
      },
      {
        headerName: "Actions",
        minWidth: 240,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }: { data: SuperAdminOrder }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => (window.location.href = `${basePath}/orders/${data.id}`)}
            >
              <Eye className="mr-1 h-4 w-4" />
              Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-blue-300 text-blue-700"
              onClick={() => statusMutation.mutate({ orderId: data.id, status: "processing" })}
            >
              En cours
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-red-300 text-red-700"
              onClick={() => statusMutation.mutate({ orderId: data.id, status: "cancelled" })}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Annuler
            </Button>
          </div>
        ),
      },
    ],
    [statusMutation],
  );

  return (
    <Layout>
      <div className="space-y-6">
        <SuperPageHeader
          title="Gestion Commandes"
          subtitle="Tri multi-colonnes, filtres metier et attribution massive des livreurs."
        />

        <Card>
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Filtres commandes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input placeholder="Recherche (ID, client, fournisseur)" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="completed">Livree</SelectItem>
                <SelectItem value="cancelled">Annulee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous fournisseurs</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Livreur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous livreurs</SelectItem>
                {deliveryPeople.map((person) => (
                  <SelectItem key={person.id} value={person.name}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </CardContent>
        </Card>

        <SuperDataTable
          title="Commandes"
          description="Selection multiple + attribution livreur + actions rapides sur statut."
          rows={filteredOrders}
          columns={columns}
          searchValue={search}
          onSearchChange={setSearch}
          loading={isLoading}
          onSelectionChange={setSelectedRows}
          toolbar={
            <div className="flex items-center gap-2">
              <Select value={bulkDeliveryId} onValueChange={setBulkDeliveryId}>
                <SelectTrigger className="h-9 w-56">
                  <SelectValue placeholder="Attribuer a..." />
                </SelectTrigger>
                <SelectContent>
                  {deliveryPeople.map((person) => (
                    <SelectItem key={person.id} value={String(person.id)}>
                      {person.name} ({person.zone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="bg-sisma-red hover:bg-sisma-red/90"
                onClick={() => bulkAssignMutation.mutate()}
                disabled={selectedRows.length === 0 || bulkAssignMutation.isPending}
              >
                Attribuer
              </Button>
            </div>
          }
        />
      </div>
    </Layout>
  );
}
