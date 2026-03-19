import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock3, MapPinned, Truck } from "lucide-react";
import { logisticsApi } from "@/api/logistics.api";
import { Layout } from "@/components/layout";
import { SuperPageHeader } from "@/components/super-admin/super-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminLogisticsPage() {
  const liveQuery = useQuery({
    queryKey: ["super-admin", "logistics", "live"],
    queryFn: () => logisticsApi.getLive(),
    refetchInterval: 30000,
  });

  const zonesQuery = useQuery({
    queryKey: ["super-admin", "logistics", "zones"],
    queryFn: () => logisticsApi.getZones(),
    refetchInterval: 120000,
  });

  const alertsQuery = useQuery({
    queryKey: ["super-admin", "logistics", "alerts"],
    queryFn: () => logisticsApi.getAlerts(24),
    refetchInterval: 60000,
  });

  const toursQuery = useQuery({
    queryKey: ["super-admin", "logistics", "tours"],
    queryFn: () => logisticsApi.getTours(),
    refetchInterval: 120000,
  });

  const activeDeliveries = liveQuery.data?.active_deliveries ?? [];
  const exceptions = liveQuery.data?.exceptions ?? [];
  const driverPositions = liveQuery.data?.driver_positions ?? [];
  const zones = zonesQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const tours = toursQuery.data ?? [];

  const returnDelivery = useMemo(
    () => activeDeliveries.filter((order) => order.delivery_type === "return").length,
    [activeDeliveries],
  );

  const forwardDelivery = useMemo(
    () => activeDeliveries.filter((order) => order.delivery_type !== "return").length,
    [activeDeliveries],
  );

  const unprocessedOrders = useMemo(
    () => alerts.find((alert) => alert.type === "unprocessed_orders")?.count ?? 0,
    [alerts],
  );

  const delayedOrders = useMemo(
    () => alerts.find((alert) => alert.type === "delayed_orders")?.count ?? 0,
    [alerts],
  );

  return (
    <Layout>
      <div className="space-y-6">
        <SuperPageHeader
          title="Dashboard Logistique"
          subtitle="Flux delivery, carte zones et alertes de charge operationnelle."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Forward Delivery</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-outfit font-bold text-slate-900">{forwardDelivery}</CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Return Delivery</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-outfit font-bold text-slate-900">{returnDelivery}</CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Exceptions</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-outfit font-bold text-slate-900">{exceptions.length}</CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Carte zones livraison (vue simplifiee)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {zones.map((zone) => (
                  <div key={zone.zone} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{zone.zone}</p>
                      <Badge className={zone.coverage_status === "covered" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {zone.coverage_status === "covered" ? "Couverte" : "Sous-capacite"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">Commandes: {zone.total_orders}</p>
                    <p className="text-xs text-slate-500">Livreurs actifs: {zone.active_drivers}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Cette vue est concue pour rester legere et mobile-first. L'integration carte temps reel (Leaflet/Reverb) peut se brancher sans casser la page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Alertes logistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-700" />
                  <p className="text-sm font-semibold text-orange-800">Commandes non traitees</p>
                </div>
                <p className="mt-1 text-xs text-orange-700">{unprocessedOrders} commande(s) en attente.</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-red-700" />
                  <p className="text-sm font-semibold text-red-800">Retards detectes</p>
                </div>
                <p className="mt-1 text-xs text-red-700">{delayedOrders} commande(s) hors delai de 4h.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-slate-700" />
                  <p className="text-sm font-semibold text-slate-800">Zones monitorées</p>
                </div>
                <p className="mt-1 text-xs text-slate-600">{zones.length} zone(s) principales analysees.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-sisma-red" />
                  <p className="text-sm font-semibold text-slate-900">Livreurs actifs</p>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {driverPositions.length} livreur(s) en ligne.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Livraisons actives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {liveQuery.isLoading ? (
                <p className="text-sm text-slate-500">Chargement des livraisons...</p>
              ) : activeDeliveries.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune livraison active en ce moment.</p>
              ) : (
                activeDeliveries.slice(0, 8).map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Commande #{delivery.id}</p>
                      <p className="text-xs text-slate-500">
                        {delivery.driver_name || "Livreur"} • {delivery.commune || delivery.driver_zone || "Zone"}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700">{delivery.status ?? "preparee"}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Tournées du jour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {toursQuery.isLoading ? (
                <p className="text-sm text-slate-500">Chargement des tournées...</p>
              ) : tours.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune tournée planifiée.</p>
              ) : (
                tours.slice(0, 8).map((tour, index) => (
                  <div key={`${tour.commune}-${tour.time_slot}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tour.commune}</p>
                      <p className="text-xs text-slate-500">{tour.time_slot} • {tour.count} commande(s)</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      {Number(tour.total_amount).toLocaleString("fr-FR")} FCFA
                    </p>
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
