import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiConfig";
import { ordersApi, toUiOrderStatus, type AdminOrder } from "@/api/orders.api";
import { Eye, Truck, Plus, Search, Filter, Calendar, ChevronDown, MoreHorizontal, Package, Clock, CheckCircle, XCircle, QrCode, Check, ExternalLink } from "lucide-react";

// Type for the order row in the table
type OrderRow = {
  id: number;
  customerName: string;
  customerPhone: string;
  supplierName: string | null;
  supplierId: number | null;
  commune: string | null;
  deliveryDate: string | null;
  deliveryTime: string | null;
  status: string;
  total: number;
  date: string;
  deliveryPersonId: number | null;
};

function normalizeAmount(value: number | string): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatStatus(status: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" } {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return { label: "En attente", variant: "secondary" };
  if (normalized === "preparee" || normalized === "processing") return { label: "En préparation", variant: "default" };
  if (normalized === "expediee") return { label: "Expédiée", variant: "outline" };
  if (normalized === "livree" || normalized === "delivered" || normalized === "completed") return { label: "Livrée", variant: "success" };
  if (normalized === "annulee" || normalized === "cancelled") return { label: "Annulée", variant: "destructive" };
  return { label: status, variant: "secondary" };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "-";
  try {
    return new Date(timeStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "-";
  }
}

function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const orderDate = new Date(dateStr);
  return (
    orderDate.getDate() === today.getDate() &&
    orderDate.getMonth() === today.getMonth() &&
    orderDate.getFullYear() === today.getFullYear()
  );
}

function isScheduled(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const orderDate = new Date(dateStr);
  const now = new Date();
  return orderDate > now;
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Search and filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "total" | "commune" | "supplier">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 20;

  // Fetch orders using the correct API
  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", "list", statusFilter, page, dateFilter],
    queryFn: async () => {
      // Map UI status to backend status
      let backendStatus = undefined;
      if (statusFilter === "pending") backendStatus = "pending";
      else if (statusFilter === "processing") backendStatus = "preparee,processing";
      else if (statusFilter === "completed") backendStatus = "livree,delivered,completed";
      else if (statusFilter === "cancelled") backendStatus = "annulee,cancelled";
      
      // Handle date filter
      let startDate = undefined;
      let endDate = undefined;
      const today = new Date().toISOString().split('T')[0];
      
      if (dateFilter === "today") {
        startDate = today;
        endDate = today;
      } else if (dateFilter === "scheduled") {
        // Orders with future delivery date
        startDate = today;
      }
      
      try {
        const result = await ordersApi.listAdminOrders({
          status: backendStatus,
          search: search || undefined,
          start_date: startDate,
          end_date: endDate,
          page,
          per_page: perPage,
        });
        return result || [];
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }: { orderId: number; nextStatus: string }) =>
      apiRequest(`/api/v1/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast({ title: "Statut mis à jour", description: "La commande a été mise à jour avec succès" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Mise à jour impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    },
  });

  // Handle assign driver action
  const handleAssignDriver = (orderId: number) => {
    toast({
      title: "Attribution livreur",
      description: `Ouvrir la liste des livreurs pour la commande #${orderId}`,
    });
  };

  // Handle validate order action
  const handleValidateOrder = (orderId: number) => {
    statusMutation.mutate(
      { orderId, nextStatus: "preparee" },
      {
        onSuccess: () => {
          toast({
            title: "Commande validée",
            description: `La commande #${orderId} a été validée et passe en préparation`,
          });
        },
      }
    );
  };

  // Transform API data to row data
  const orders: OrderRow[] = useMemo(() => {
    const raw = ordersQuery.data ?? [];
    return raw.map((order: AdminOrder) => ({
      id: order.id,
      customerName: order.customer_name || "Client",
      customerPhone: order.customer_phone || "-",
      supplierName: order.supplier_name || null,
      supplierId: order.supplier_id ?? null,
      commune: order.commune || order.customer_location || null,
      deliveryDate: order.delivery_date || order.created_at || null,
      deliveryTime: order.delivery_date ? (order.delivery_date as unknown as string) : null,
      status: order.status || "pending",
      total: order.total ?? order.subtotal ?? 0,
      date: order.created_at || new Date().toISOString(),
      deliveryPersonId: order.delivery_person_id ?? null,
    }));
  }, [ordersQuery.data]);

  // Filter and sort orders
  const filtered = useMemo(() => {
    let result = [...orders];

    // Date filter
    if (dateFilter === "today") {
      result = result.filter((order) => isToday(order.deliveryDate || order.date));
    } else if (dateFilter === "scheduled") {
      result = result.filter((order) => isScheduled(order.deliveryDate || order.date));
    } else if (dateFilter === "delivered") {
      result = result.filter((order) => {
        const s = (order.status || "").toLowerCase();
        return s === "livree" || s === "delivered" || s === "completed";
      });
    } else if (dateFilter === "cancelled") {
      result = result.filter((order) => {
        const s = (order.status || "").toLowerCase();
        return s === "annulee" || s === "cancelled";
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortField === "total") {
        cmp = a.total - b.total;
      } else if (sortField === "commune") {
        cmp = (a.commune || "").localeCompare(b.commune || "");
      } else if (sortField === "supplier") {
        cmp = (a.supplierName || "").localeCompare(b.supplierName || "");
      }
      return sortDir === "asc" ? -cmp : cmp;
    });

    return result;
  }, [orders, dateFilter, sortField, sortDir]);

  const handleSort = (field: "date" | "total" | "commune" | "supplier") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const { label, variant } = formatStatus(status);
    return (
      <Badge 
        variant={variant === "success" ? "default" : variant}
        className={`${variant === "success" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
      >
        {variant === "success" && <CheckCircle className="h-3 w-3 mr-1" />}
        {variant === "destructive" && <XCircle className="h-3 w-3 mr-1" />}
        {variant === "default" && <Clock className="h-3 w-3 mr-1" />}
        {label}
      </Badge>
    );
  };

  // Get stats for the header
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending").length;
    const preparing = orders.filter(o => o.status === "preparee" || o.status === "processing").length;
    const delivered = orders.filter(o => ["livree", "delivered", "completed"].includes(o.status)).length;
    const cancelled = orders.filter(o => ["annulee", "cancelled"].includes(o.status)).length;
    return { total, pending, preparing, delivered, cancelled };
  }, [orders]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-outfit text-2xl font-bold text-slate-900">Gestion des commandes</h1>
            <p className="text-sm text-slate-500">Suivez et gérez toutes les commandes de votre marketplace</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">En attente</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">En préparation</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.preparing}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Livrées</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Annulées</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher par ID, client, téléphone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("all"); setPage(1); }}
                >
                  Tous
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("pending"); setPage(1); }}
                  className={statusFilter === "pending" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  En attente
                </Button>
                <Button
                  variant={statusFilter === "processing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("processing"); setPage(1); }}
                >
                  En cours
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("completed"); setPage(1); }}
                  className={statusFilter === "completed" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  Livrées
                </Button>
                <Button
                  variant={statusFilter === "cancelled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("cancelled"); setPage(1); }}
                  className={statusFilter === "cancelled" ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  Annulées
                </Button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <select
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Toutes dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="scheduled">Programmées</option>
                  <option value="delivered">Livrées</option>
                  <option value="cancelled">Annulées</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-outfit text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Liste des commandes ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="flex items-center text-sm text-slate-500 px-2">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={orders.length < perPage}
              >
                Suivant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
                  <p className="text-sm text-slate-500">Chargement des commandes...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-16 w-16 text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">Aucune commande trouvée</p>
                <p className="text-sm text-slate-500">Essayez de modifier vos filtres de recherche</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-700">ID</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Client</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Fournisseur</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Livraison</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Statut</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order, index) => (
                      <tr 
                        key={order.id} 
                        className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-slate-900">#{order.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-slate-900">{order.customerName}</div>
                            <div className="text-xs text-slate-500">{order.customerPhone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {order.supplierName ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              {order.supplierName}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm text-slate-900">{order.commune || "-"}</div>
                            <div className="text-xs text-slate-500">
                              {formatDate(order.deliveryDate || order.date)}
                              {order.deliveryTime && ` à ${formatTime(order.deliveryTime)}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-slate-900">
                            {normalizeAmount(order.total).toLocaleString("fr-FR")} CFA
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {/* QR Code Button */}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-purple-50"
                              onClick={() => window.location.href = `/admin/orders/qr?id=${order.id}`}
                              title="Voir QR Code"
                            >
                              <QrCode className="h-4 w-4 text-purple-600" />
                            </Button>
                            
                            {/* Validate Button - only for pending orders */}
                            {order.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-green-50"
                                onClick={() => handleValidateOrder(order.id)}
                                title="Valider la commande"
                                disabled={statusMutation.isPending}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50">
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </Link>
                            
                            {order.status !== "annulee" && order.status !== "livree" && !order.deliveryPersonId && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-purple-50"
                                onClick={() => handleAssignDriver(order.id)}
                                title="Assigner livreur"
                              >
                                <Truck className="h-4 w-4 text-purple-600" />
                              </Button>
                            )}
                            
                            {order.status === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: "preparee" })}
                                disabled={statusMutation.isPending}
                                title="Marquer en préparation"
                              >
                                <Package className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {(order.status === "preparee" || order.status === "processing") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-orange-50"
                                onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: "expediee" })}
                                disabled={statusMutation.isPending}
                                title="Marquer comme expédiée"
                              >
                                <Truck className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                            {order.status === "expediee" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-green-50"
                                onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: "livree" })}
                                disabled={statusMutation.isPending}
                                title="Marquer comme livrée"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            
                            {order.status !== "annulee" && order.status !== "livree" && !["delivered", "completed"].includes(order.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-50"
                                onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: "annulee" })}
                                disabled={statusMutation.isPending}
                                title="Annuler la commande"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
