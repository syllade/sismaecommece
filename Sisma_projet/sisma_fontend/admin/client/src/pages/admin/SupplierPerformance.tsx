import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Star,
  TrendingUp,
  Package,
  DollarSign,
  Filter,
  Medal,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuthHeaders, buildApiUrl } from "@/lib/apiConfig";
import { cn } from "@/lib/utils";

interface SupplierPerformance {
  id: number;
  name: string;
  logo?: string;
  email: string;
  phone: string;
  products_count: number;
  total_orders: number;
  revenue: number;
  pending_orders: number;
  delivery_success_rate: number;
  avg_rating: number;
  score: number;
  rank: number;
}

function MedalBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md text-yellow-900 font-black text-sm">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow text-slate-700 font-black text-sm">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow text-white font-black text-sm">
        🥉
      </span>
    );
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-sm">
      {rank}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
      ? "bg-blue-500"
      : score >= 40
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span
        className={cn(
          "text-sm font-bold",
          score >= 80
            ? "text-emerald-600"
            : score >= 60
            ? "text-blue-600"
            : score >= 40
            ? "text-amber-600"
            : "text-red-600"
        )}
      >
        {score}
      </span>
    </div>
  );
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
  value: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupplierPerformancePage() {
  const [period, setPeriod] = useState("month");
  const [sortBy, setSortBy] = useState("score");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery<{
    success: boolean;
    data: SupplierPerformance[];
    meta: any;
  }>({
    queryKey: ["supplier-performance", period, sortBy],
    queryFn: async () => {
      const response = await fetch(
        buildApiUrl(`/api/v1/admin/suppliers/performance?period=${period}&sort_by=${sortBy}`),
        { headers: getAuthHeaders() }
      );
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds when enabled
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  // Update lastUpdated when data changes
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const suppliers = data?.data ?? [];
  const stats = data?.meta;
  const totalRevenue = suppliers.reduce((acc, s) => acc + s.revenue, 0);
  const avgRating =
    suppliers.length > 0
      ? suppliers.reduce((acc, s) => acc + s.avg_rating, 0) / suppliers.length
      : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="font-outfit text-xl font-bold text-slate-900">
                Classement des Fournisseurs
              </h1>
              <p className="text-sm text-slate-500">
                Performance et statistiques par fournisseur
                {lastUpdated && (
                  <span className="ml-2 text-xs text-slate-400">
                    • Mis à jour {lastUpdated.toLocaleTimeString('fr-FR')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="revenue">Chiffre d'affaires</SelectItem>
                <SelectItem value="total_orders">Commandes</SelectItem>
                <SelectItem value="delivery_success_rate">Livraison</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn("h-9", autoRefresh && "bg-green-600 hover:bg-green-700")}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
              {autoRefresh ? "Auto" : "Manuel"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-4">
          <div className="col-span-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={<Package className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
              label="Fournisseurs actifs"
              value={stats?.total_suppliers ?? suppliers.length}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              label="Top fournisseur"
              value={
                <span className="text-base font-bold text-slate-800 truncate">
                  {suppliers[0]?.name ?? "—"}
                </span>
              }
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-50"
              label="CA Total"
              value={`${totalRevenue.toLocaleString()} F`}
            />
            <StatCard
              icon={<Star className="h-5 w-5 text-purple-600" />}
              iconBg="bg-purple-50"
              label="Note moyenne"
              value={`${avgRating.toFixed(1)} / 5`}
            />
          </div>
          <div className={cn(
            "flex items-center justify-center rounded-lg border-2 p-3 text-center transition-colors",
            autoRefresh 
              ? "border-green-200 bg-green-50" 
              : "border-slate-200 bg-slate-50"
          )}>
            <div className="flex flex-col items-center gap-1">
              {autoRefresh ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
                  <span className="text-xs font-medium text-green-700">Auto</span>
                  <span className="text-[10px] text-green-600">30s</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Manuel</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Medal className="h-4 w-4 text-yellow-500" />
              Tableau de classement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sisma-red" />
                  <p className="text-sm text-slate-400">Chargement...</p>
                </div>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Trophy className="h-10 w-10 text-slate-200" />
                <p className="text-sm text-slate-400">Aucun fournisseur actif pour cette période</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Rang
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fournisseur
                      </th>
                      <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">
                        Produits
                      </th>
                      <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">
                        Commandes
                      </th>
                      <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                        Chiffre d'affaires
                      </th>
                      <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                        Livraison
                      </th>
                      <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Note
                      </th>
                      <th className="py-3 pl-3 pr-5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {suppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className={cn(
                          "transition-colors hover:bg-slate-50/70",
                          supplier.rank <= 3 && "bg-amber-50/30"
                        )}
                      >
                        <td className="py-3.5 pl-5 pr-3">
                          <MedalBadge rank={supplier.rank} />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            {supplier.logo ? (
                              <img
                                src={supplier.logo}
                                alt={supplier.name}
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 ring-2 ring-slate-100">
                                <span className="text-sm font-bold text-sisma-red">
                                  {supplier.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {supplier.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{supplier.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {supplier.products_count}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 text-center hidden md:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            {supplier.total_orders}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 text-right hidden lg:table-cell">
                          <span className="font-semibold text-slate-800">
                            {supplier.revenue.toLocaleString()}
                            <span className="ml-1 text-xs font-normal text-slate-400">CFA</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center hidden lg:table-cell">
                          <Badge
                            variant={
                              supplier.delivery_success_rate >= 90 ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {supplier.delivery_success_rate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-slate-700">
                              {supplier.avg_rating.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 pl-3 pr-5 text-center">
                          <ScoreBar score={supplier.score} />
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
