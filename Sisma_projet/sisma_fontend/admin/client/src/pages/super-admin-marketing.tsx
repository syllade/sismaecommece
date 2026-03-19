import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Megaphone, TrendingUp, TrendingDown, DollarSign, 
  Eye, MousePointer, ShoppingCart, Plus, Search,
  Calendar, Filter, MoreHorizontal, Pause, Play, Trash2, Edit, AlertCircle, CheckCircle
} from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  type: "product" | "supplier" | "banner";
  status: "active" | "paused" | "expired" | "draft";
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date: string;
  end_date: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("sisma_admin_token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
}

function buildApiUrl(path: string) {
  const baseUrl = "http://localhost:8000";
  return `${baseUrl}${path}`;
}

export default function SuperAdminMarketingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Fetch marketing campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin", "marketing", "campaigns", statusFilter],
    queryFn: async () => {
      try {
        let url = buildApiUrl("/api/v1/admin/campaigns");
        if (statusFilter !== "all") {
          url += `?status=${statusFilter}`;
        }
        
        const res = await fetch(url, { headers: getAuthHeaders() });
        const data = await res.json();
        return data.data || [];
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      }
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin", "marketing", "stats"],
    queryFn: async () => {
      try {
        const res = await fetch(buildApiUrl("/api/v1/admin/stats"), { 
          headers: getAuthHeaders() 
        });
        return await res.json();
      } catch (error) {
        return {};
      }
    },
  });

  const formatCurrency = (value: number | undefined) => 
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(value || 0);

  const formatNumber = (value: number | undefined) => 
    new Intl.NumberFormat("fr-FR").format(value || 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      paused: "secondary",
      expired: "destructive",
      draft: "outline",
    };
    const labels: Record<string, string> = {
      active: "Active",
      paused: "En pause",
      expired: "Expirée",
      draft: "Brouillon",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing & Campagnes</h1>
            <p className="text-gray-500">Gérez les campagnes marketing et promotions</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle campagne
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Budget Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_budget)}</div>
              <p className="text-xs text-gray-500 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +12% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Dépensé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_spent)}</div>
              <p className="text-xs text-gray-500 mt-1">
                sur {formatCurrency(stats?.total_budget)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Impressions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.total_impressions)}</div>
              <p className="text-xs text-gray-500 mt-1">
                <Eye className="w-3 h-3 inline mr-1" />
                Clicks: {formatNumber(stats?.total_clicks)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.total_conversions)}</div>
              <p className="text-xs text-gray-500 mt-1">
                <ShoppingCart className="w-3 h-3 inline mr-1" />
                Taux: {stats?.conversion_rate || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {campaigns?.some((c: Campaign) => c.status === 'active' && (c.spent / c.budget) > 0.8) && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Budget proche de l'épuisement</p>
                  <p className="text-sm">Les campagnes suivantes ont utilisé plus de 80% de leur budget:</p>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {campaigns?.filter((c: Campaign) => c.status === 'active' && (c.spent / c.budget) > 0.8).map((c: Campaign) => (
                      <li key={c.id}>{c.name} - {((c.spent / c.budget) * 100).toFixed(0)}% utilisé</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {campaigns?.some((c: Campaign) => c.status === 'expired') && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Campagnes expirées</p>
                  <p className="text-sm">Les campagnes suivantes ont expiré et nécessitent une action:</p>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {campaigns?.filter((c: Campaign) => c.status === 'expired').map((c: Campaign) => (
                      <li key={c.id}>{c.name} - expirée le {new Date(c.end_date).toLocaleDateString("fr-FR")}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Campagnes</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actives</option>
                  <option value="paused">En pause</option>
                  <option value="expired">Expirées</option>
                  <option value="draft">Brouillon</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : campaigns?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune campagne trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns?.map((campaign: Campaign) => (
                  <div
                    key={campaign.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(campaign.start_date).toLocaleDateString("fr-FR")}
                          {" - "}
                          {new Date(campaign.end_date).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(campaign.impressions)} vues
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="w-3 h-3" />
                          {formatNumber(campaign.clicks)} clics
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Budget</p>
                        <p className="font-semibold">{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</p>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className={`h-2 rounded-full ${campaign.spent / campaign.budget > 0.8 ? 'bg-red-500' : campaign.spent / campaign.budget > 0.5 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          {campaign.status === "active" ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
