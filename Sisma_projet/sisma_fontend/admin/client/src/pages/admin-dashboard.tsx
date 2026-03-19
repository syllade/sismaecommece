import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Truck,
  UserPlus,
  PackagePlus,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { statsApi, type AdminStatsPayload } from "@/api/stats.api";
import { ordersApi, type AdminOrder } from "@/api/orders.api";

function toNumber(value: string | number): number {
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

type PeriodType = "today" | "week" | "month";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<PeriodType>("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate date range based on period
  const getDateRange = (period: PeriodType) => {
    const now = new Date();
    let from: Date;
    const to = now;
    
    switch (period) {
      case "today":
        from = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        from = new Date(now);
        from.setDate(from.getDate() - 7);
        break;
      case "month":
      default:
        from = new Date(now);
        from.setDate(from.getDate() - 30);
        break;
    }
    
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  };

  // Fetch stats using the correct API
  const statsQuery = useQuery<AdminStatsPayload>({
    queryKey: ["admin", "stats", period],
    queryFn: () => {
      const range = getDateRange(period);
      return statsApi.getAdminStats();
    },
    retry: 1,
    refetchInterval: 30000, // Auto-refresh every 30 seconds for live stats
  });

  // Fetch recent orders using correct endpoint
  const ordersQuery = useQuery<AdminOrder[]>({
    queryKey: ["admin", "orders", "recent"],
    queryFn: () => ordersApi.listAdminOrders({ per_page: 50 }),
    retry: 1,
  });

  const stats = statsQuery.data;
  const orders = ordersQuery.data ?? [];

  // Calculate stats from orders if API fails
  const calculatedStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, item) => sum + toNumber(item.total ?? item.subtotal ?? 0), 0);
    const pendingOrders = orders.filter((item) => item.status === "pending").length;
    const processingOrders = orders.filter((item) => ["preparee", "processing", "expediee"].includes(item.status || "")).length;
    const deliveredOrders = orders.filter((item) => ["livree", "delivered", "completed"].includes(item.status || "")).length;
    
    return {
      totalOrders: stats?.orders_month ?? orders.length,
      pendingOrders: stats?.unassigned_orders ?? pendingOrders,
      processingOrders,
      deliveredOrders,
      totalRevenue: stats?.revenue_month ?? totalRevenue,
      revenueToday: stats?.revenue_today ?? 0,
      activeProducts: stats?.charts?.top_products?.length ?? 0,
      pendingSuppliers: stats?.pending_suppliers ?? 0,
      pendingDrivers: stats?.pending_drivers ?? 0,
    };
  }, [orders, stats]);

  const getStatusBadge = (status: string) => {
    const { label, variant } = formatStatus(status);
    return (
      <Badge variant={variant === "success" ? "default" : variant} className={variant === "success" ? "bg-green-100 text-green-800" : ""}>
        {label}
      </Badge>
    );
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    statsQuery.refetch().then(() => {
      ordersQuery.refetch().then(() => setIsRefreshing(false));
    });
  };

  // Calculate orders by day for chart
  const ordersByDay = useMemo(() => {
    const days: Record<string, number> = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      last7Days.push(key);
      days[key] = 0;
    }
    orders.forEach(order => {
      if (order.created_at) {
        const key = order.created_at.split('T')[0];
        if (days[key] !== undefined) {
          days[key]++;
        }
      }
    });
    return last7Days.map(date => ({
      date,
      label: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      count: days[date]
    }));
  }, [orders]);

  // Calculate sales by supplier
  const salesBySupplier = useMemo(() => {
    const suppliers: Record<string, { name: string; revenue: number; orders: number }> = {};
    orders.forEach(order => {
      const name = order.supplier_name || 'Sans fournisseur';
      if (!suppliers[name]) {
        suppliers[name] = { name, revenue: 0, orders: 0 };
      }
      suppliers[name].revenue += toNumber(order.total ?? order.subtotal ?? 0);
      suppliers[name].orders++;
    });
    return Object.values(suppliers)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const maxOrderCount = Math.max(...ordersByDay.map(d => d.count), 1);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-outfit text-2xl font-bold text-slate-900">Dashboard Administrateur</h1>
            <p className="text-sm text-slate-500">Vue d'ensemble de votre marketplace SISMA</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Period Filter */}
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Link href="/admin/orders/create">
              <Button size="sm" className="gap-1">
                <PackagePlus className="h-4 w-4" />
                Nouvelle commande
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards - Top Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {period === 'today' ? "Commandes aujourd'hui" : period === 'week' ? "Commandes semaine" : "Commandes mois"}
              </CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {period === 'today' 
                  ? (stats?.orders_today ?? 0) 
                  : period === 'week' 
                    ? (stats?.orders_week ?? 0) 
                    : (stats?.orders_month ?? 0)}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>{period === 'today' ? "ce jour" : period === 'week' ? "cette semaine" : "ce mois"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">En attente</CardTitle>
              <div className="rounded-full bg-orange-100 p-2">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{calculatedStats.pendingOrders}</div>
              <div className="text-xs text-slate-500 mt-1">non assignées</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Chiffre d'affaires</CardTitle>
              <div className="rounded-full bg-green-100 p-2">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {(period === 'today' 
                  ? (stats?.revenue_today ?? 0) 
                  : period === 'week' 
                    ? (stats?.revenue_week ?? 0) 
                    : (stats?.revenue_month ?? 0)).toLocaleString("fr-FR")}
              </div>
              <div className="text-xs text-slate-500 mt-1">CFA {period === 'today' ? "aujourd'hui" : period === 'week' ? "semaine" : "mois"}</div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${(stats?.out_of_stock_products ?? 0) > 0 ? 'from-red-50 to-white border-l-4 border-l-red-500' : 'from-purple-50 to-white border-l-4 border-l-purple-500'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {(stats?.out_of_stock_products ?? 0) > 0 ? "Alerte Stock" : "Fournisseurs"}
              </CardTitle>
              <div className={`rounded-full p-2 ${(stats?.out_of_stock_products ?? 0) > 0 ? 'bg-red-100' : 'bg-purple-100'}`}>
                {(stats?.out_of_stock_products ?? 0) > 0 
                  ? <AlertCircle className="h-4 w-4 text-red-600" />
                  : <Users className="h-4 w-4 text-purple-600" />
                }
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {(stats?.out_of_stock_products ?? 0) > 0 
                  ? stats?.out_of_stock_products 
                  : calculatedStats.pendingSuppliers}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {(stats?.out_of_stock_products ?? 0) > 0 
                  ? "produits en rupture" 
                  : "en attente de validation"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row - Secondary */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Commandes du mois</p>
                  <p className="text-2xl font-bold">{stats?.orders_month ?? calculatedStats.totalOrders}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Revenus du mois</p>
                  <p className="text-2xl font-bold">{(stats?.revenue_month ?? calculatedStats.totalRevenue).toLocaleString("fr-FR")}</p>
                </div>
                <DollarSign className="h-8 w-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Taux de livraison</p>
                  <p className="text-2xl font-bold">
                    {stats?.charts?.delivery_success_rate?.success_rate 
                      ? `${stats.charts.delivery_success_rate.success_rate.toFixed(1)}%`
                      : calculatedStats.deliveredOrders > 0 
                        ? `${((calculatedStats.deliveredOrders / orders.length) * 100).toFixed(1)}%`
                        : "0%"}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">En préparation</p>
                  <p className="text-2xl font-bold">{calculatedStats.processingOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Orders by Day Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Commandes des 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40">
                {ordersByDay.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-32">
                      <div 
                        className="w-full max-w-8 bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${(day.count / maxOrderCount) * 100}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                        title={`${day.count} commande(s)`}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">{day.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-sm text-slate-600">
                Total: <span className="font-bold">{ordersByDay.reduce((sum, d) => sum + d.count, 0)}</span> commandes cette semaine
              </div>
            </CardContent>
          </Card>

          {/* Sales by Supplier Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Top fournisseurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesBySupplier.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                  <Users className="h-12 w-12 text-slate-300 mb-2" />
                  <p>Aucune donnée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salesBySupplier.map((supplier, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{supplier.name}</span>
                          <span className="text-sm font-bold text-green-600">{supplier.revenue.toLocaleString("fr-FR")} CFA</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(supplier.revenue / (salesBySupplier[0]?.revenue || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-500">{supplier.orders} commande(s)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-outfit text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Dernières commandes
            </CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                Voir tout
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Package className="h-16 w-16 text-slate-300 mb-4" />
                <p className="text-lg font-medium">Aucune commande détectée</p>
                <p className="text-sm">Les commandes apparaîtront ici une fois passées</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-700">ID</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Client</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Téléphone</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Fournisseur</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Commune</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Statut</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-right">Montant</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map((order, idx) => (
                      <tr key={order.id} className={`border-t border-slate-100 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium">#{order.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{order.customer_name || "Client"}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{order.customer_phone || "-"}</td>
                        <td className="px-4 py-3">
                          {order.supplier_name ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                              {order.supplier_name}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{order.commune || order.customer_location || "-"}</td>
                        <td className="px-4 py-3">{getStatusBadge(order.status || "pending")}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {toNumber(order.total ?? order.subtotal ?? 0).toLocaleString("fr-FR")} CFA
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {order.created_at 
                            ? new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/orders/create" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <PackagePlus className="h-4 w-4 text-blue-600" />
                  Créer une commande
                </Button>
              </Link>
              <Link href="/admin/products/create" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  Ajouter un produit
                </Button>
              </Link>
              <Link href="/admin/suppliers/pending" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <UserPlus className="h-4 w-4 text-purple-600" />
                  Valider fournisseurs
                </Button>
              </Link>
              <Link href="/admin/drivers" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  Gérer livreurs
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Alerts */}
          {(calculatedStats.pendingSuppliers > 0 || calculatedStats.pendingDrivers > 0 || calculatedStats.pendingOrders > 0) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-outfit text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {calculatedStats.pendingSuppliers > 0 && (
                    <Link href="/admin/suppliers/pending">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer">
                        <div className="rounded-full bg-yellow-100 p-2">
                          <UserPlus className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-yellow-800">{calculatedStats.pendingSuppliers}</p>
                          <p className="text-xs text-yellow-600">Fournisseurs en attente</p>
                        </div>
                      </div>
                    </Link>
                  )}
                  {calculatedStats.pendingDrivers > 0 && (
                    <Link href="/admin/drivers">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">{calculatedStats.pendingDrivers}</p>
                          <p className="text-xs text-blue-600">Livreurs en attente</p>
                        </div>
                      </div>
                    </Link>
                  )}
                  {calculatedStats.pendingOrders > 0 && (
                    <Link href="/admin/orders">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer">
                        <div className="rounded-full bg-orange-100 p-2">
                          <ShoppingCart className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-orange-800">{calculatedStats.pendingOrders}</p>
                          <p className="text-xs text-orange-600">Commandes non assignées</p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
