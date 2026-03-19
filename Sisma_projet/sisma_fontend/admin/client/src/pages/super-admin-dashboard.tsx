import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, BarChart, Bar } from "recharts";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuperAdminDashboardData } from "@/hooks/use-super-admin";
import { useAuth } from "@/context/auth-context";
import type { TimeGranularity } from "@/types/super-admin";
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Users,
  AlertCircle,
  Activity,
  Truck
} from "lucide-react";

type SalesPoint = { label: string; total: number; date: string };

function aggregateSales(points: SalesPoint[], granularity: TimeGranularity): SalesPoint[] {
  if (granularity === "day") return points;

  const grouped = new Map<string, number>();
  for (const point of points) {
    const date = new Date(point.date);
    if (Number.isNaN(date.getTime())) continue;

    const key =
      granularity === "week"
        ? `${date.getFullYear()}-S${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    grouped.set(key, (grouped.get(key) ?? 0) + point.total);
  }

  return Array.from(grouped.entries()).map(([key, total]) => ({ label: key, total, date: key }));
}

export default function SuperAdminDashboardPage() {
  const [granularity, setGranularity] = useState<TimeGranularity>("day");
  const { kpis, salesSeries, ordersSeries, ordersByStatus, activeSuppliers, isLoading, refetchAll } =
    useSuperAdminDashboardData();
  const { user } = useAuth();
  const basePath = user?.role === "super_admin" ? "/super-admin" : "/admin";
  const pageTitle = user?.role === "super_admin" ? "Dashboard Super Admin" : "Dashboard Administrateur";
  const pageSubtitle =
    user?.role === "super_admin"
      ? "Vue globale de la plateforme SISMA - Operations, fournisseurs, livreurs et commandes."
      : "Vue admin SISMA: operations, commandes, fournisseurs, livreurs et risques.";

  const sales = useMemo(() => aggregateSales(salesSeries, granularity), [granularity, salesSeries]);
  const ordersTrend = useMemo(() => aggregateSales(ordersSeries, granularity), [granularity, ordersSeries]);
  
  // Calculate order status percentages for pie chart
  const totalOrders = useMemo(() => {
    return ordersByStatus.reduce((sum, item) => sum + item.total, 0) || 1;
  }, [ordersByStatus]);

  const statusColors: Record<string, string> = {
    delivered: "#D81918",
    "in_transit": "#F7941D",
    pending: "#94a3b8",
    cancelled: "#f87171",
    processing: "#3b82f6",
    completed: "#22c55e",
  };

  const orderStatusData = useMemo(() => {
    return ordersByStatus.map((item) => ({
      name: item.status === "pending" ? "En attente" : 
            item.status === "processing" ? "En cours" :
            item.status === "completed" ? "Livré" :
            item.status === "cancelled" ? "Annulé" : item.status,
      value: item.total,
      color: statusColors[item.status] || "#94a3b8",
    }));
  }, [ordersByStatus]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-outfit">{pageTitle}</h1>
            <p className="text-slate-500 mt-1">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchAll()}
              className="border-slate-200"
            >
              <Activity className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* KPI Section - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {/* Total Orders */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-sisma-red" />
              </div>
              <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Commandes (Mois)</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">{kpis.totalOrders.toLocaleString("fr-FR")}</h3>
          </div>

          {/* Revenue */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-sisma-orange" />
              </div>
              <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Revenu Total</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">
              {formatCurrency(kpis.revenue)}
            </h3>
          </div>

          {/* Active Vendors */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5.3%
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Fournisseurs Actifs</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">{activeSuppliers.toLocaleString("fr-FR")}</h3>
          </div>

          {/* Products Out of Stock */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-500/10 rounded-xl">
                <Package className="w-6 h-6 text-slate-700" />
              </div>
              <span className="flex items-center text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-500/10 px-2 py-1 rounded-full">
                Stock
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Produits en rupture</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">{kpis.outOfStockProducts.toLocaleString("fr-FR")}</h3>
          </div>

          {/* Pending Orders */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <span className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">
                <TrendingDown className="w-3 h-3 mr-1" />
              
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Commandes Non Assignées</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">{kpis.pendingOrders.toLocaleString("fr-FR")}</h3>
          </div>
        </div>

        {/* Charts Row - Modern Design */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Evolution */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-xl text-slate-900 font-outfit">Evolution des Revenus</h4>
                <p className="text-sm text-slate-500 mt-1">Suivez la croissance financière sur tous les marchés</p>
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button
                  variant={granularity === "day" ? "default" : "ghost"}
                  size="sm"
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                    granularity === "day" 
                      ? "bg-sisma-red text-white shadow-md" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setGranularity("day")}
                >
                  Jour
                </Button>
                <Button
                  variant={granularity === "week" ? "default" : "ghost"}
                  size="sm"
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                    granularity === "week" 
                      ? "bg-sisma-red text-white shadow-md" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setGranularity("week")}
                >
                  Semaine
                </Button>
                <Button
                  variant={granularity === "month" ? "default" : "ghost"}
                  size="sm"
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                    granularity === "month" 
                      ? "bg-sisma-red text-white shadow-md" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setGranularity("month")}
                >
                  Mois
                </Button>
              </div>
            </div>
            <div className="h-72">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sisma-red"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sales}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D81918" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#D81918" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      stroke="#e2e8f0"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      stroke="#e2e8f0"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenu']}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#D81918" 
                      strokeWidth={3}
                      fill="url(#chartGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Order Status Breakdown - Modern */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <h4 className="font-bold text-xl text-slate-900 font-outfit mb-6">Répartition des Commandes</h4>
            <div className="flex-1 flex flex-col justify-center gap-6">
              <div className="relative w-40 h-40 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                {orderStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Over Time */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-xl text-slate-900 font-outfit">Commandes dans le temps</h4>
              <p className="text-sm text-slate-500 mt-1">Evolution du volume de commandes par periode</p>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <Button
                variant={granularity === "day" ? "default" : "ghost"}
                size="sm"
                className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                  granularity === "day"
                    ? "bg-sisma-red text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setGranularity("day")}
              >
                Jour
              </Button>
              <Button
                variant={granularity === "week" ? "default" : "ghost"}
                size="sm"
                className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                  granularity === "week"
                    ? "bg-sisma-red text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setGranularity("week")}
              >
                Semaine
              </Button>
              <Button
                variant={granularity === "month" ? "default" : "ghost"}
                size="sm"
                className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                  granularity === "month"
                    ? "bg-sisma-red text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setGranularity("month")}
              >
                Mois
              </Button>
            </div>
          </div>
          <div className="h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sisma-red"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip formatter={(value: number) => [value, "Commandes"]} />
                  <Bar dataKey="total" fill="#F7941D" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fournisseurs */}
          <Link 
            href={`${basePath}/suppliers`} 
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-500/10 dark:to-red-500/5 border border-red-200 dark:border-red-500/20 p-6 rounded-2xl flex flex-col justify-between group hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors">
                <Users className="w-6 h-6 text-sisma-red group-hover:text-white transition-colors" />
              </div>
              <h5 className="text-lg font-bold text-slate-900">Gestion Fournisseurs</h5>
              <p className="text-sm text-slate-600 mt-2">
                Gérez les fournisseurs et leurs performances.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sisma-red text-sm font-semibold">
              Voir plus <TrendingUp className="w-4 h-4" />
            </div>
          </Link>

          {/* Livreurs */}
          <Link 
            href={`${basePath}/drivers`} 
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5 border border-orange-200 dark:border-orange-500/20 p-6 rounded-2xl flex flex-col justify-between group hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                <Truck className="w-6 h-6 text-sisma-orange group-hover:text-white transition-colors" />
              </div>
              <h5 className="text-lg font-bold text-slate-900">Gestion Livreurs</h5>
              <p className="text-sm text-slate-600 mt-2">
                Suivez les livreurs et leurs performances.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sisma-orange text-sm font-semibold">
              Voir plus <TrendingUp className="w-4 h-4" />
            </div>
          </Link>

          {/* Logistique */}
          <Link 
            href={`${basePath}/logistics`} 
            className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-500/10 dark:to-slate-500/5 border border-slate-200 dark:border-slate-500/20 p-6 rounded-2xl flex flex-col justify-between group hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
                <Package className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors" />
              </div>
              <h5 className="text-lg font-bold text-slate-900">Dashboard Logistique</h5>
              <p className="text-sm text-slate-600 mt-2">
                Suivi en temps réel et optimisation des livraisons.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-slate-700 text-sm font-semibold">
              Voir plus <TrendingUp className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
