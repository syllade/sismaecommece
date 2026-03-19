import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ordersApi, type AdminOrder, type AdminOrderItem } from "@/api/orders.api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiConfig";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Store,
  QrCode,
  Calendar,
  ShoppingCart,
  Edit,
  Printer
} from "lucide-react";

// Material Symbols Icon component
function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className || ""}`}>
      {name}
    </span>
  );
}

export default function OrderDetailPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract order ID from URL
  const [match, params] = useRoute("/admin/orders/:id") || [false, null];
  const [superAdminMatch, superAdminParams] = useRoute("/super-admin/orders/:id") || [false, null];
  const orderId = match ? params?.id : superAdminMatch ? superAdminParams?.id : null;
  
  // Fetch order data from API
  const { data: order, isLoading, error } = useQuery<AdminOrder>({
    queryKey: ["admin", "order", orderId],
    queryFn: () => ordersApi.getAdminOrder(Number(orderId)),
    enabled: !!orderId,
    retry: 1,
  });
  
  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }: { orderId: number; nextStatus: string }) =>
      apiRequest(`/api/v1/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "order", orderId] });
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

  // Format currency in CFA (FCFA)
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "0 CFA";
    return new Intl.NumberFormat("fr-CI", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate timeline progress
  // Format status for display
  const formatStatus = (status: string): { label: string; variant: string } => {
    const normalized = status?.toLowerCase() || "";
    if (normalized === "pending") return { label: "En attente", variant: "bg-amber-100 text-amber-700" };
    if (normalized === "preparee" || normalized === "processing") return { label: "En préparation", variant: "bg-blue-100 text-blue-700" };
    if (normalized === "expediee") return { label: "Expédiée", variant: "bg-purple-100 text-purple-700" };
    if (normalized === "livree" || normalized === "delivered" || normalized === "completed") return { label: "Livrée", variant: "bg-green-100 text-green-700" };
    if (normalized === "annulee" || normalized === "cancelled") return { label: "Annulée", variant: "bg-red-100 text-red-700" };
    return { label: status || "Inconnu", variant: "bg-slate-100 text-slate-700" };
  };

  // Calculate progress steps based on order status
  const getProgressSteps = () => {
    if (!order) return [];
    
    const steps = [
      { key: "pending", label: "Commande passée", time: order.created_at },
      { key: "preparee", label: "En préparation", time: null },
      { key: "expediee", label: "Expédiée", time: null },
      { key: "livree", label: "Livrée", time: null },
    ];

    const statusOrder: Record<string, number> = {
      pending: 0,
      preparee: 1,
      processing: 1,
      expediee: 2,
      livree: 3,
      delivered: 3,
      completed: 3,
      annulee: -1,
      cancelled: -1,
    };

    const currentIndex = statusOrder[order.status?.toLowerCase() || ""] ?? 0;

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const progressSteps = getProgressSteps();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
            <p className="text-sm text-slate-500">Chargement de la commande...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Package className="h-16 w-16 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-600">Commande non trouvée</h2>
          <p className="text-sm text-slate-500">Cette commande n'existe pas ou a été supprimée.</p>
          <Link href="/admin/orders">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux commandes
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const orderStatus = formatStatus(order.status);
  const orderItems = order.items || [];
  const customerName = order.customer_name || "Client";
  const customerPhone = order.customer_phone || "-";
  const customerLocation = order.commune || order.customer_location || "-";
  const supplierName = order.supplier_name || "Fournisseur";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Order Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight">Commande #{order.id}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${orderStatus.variant}`}>
                {orderStatus.label}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Passée le {formatDate(order.created_at || "")} • {orderItems.length} article(s) • {formatCurrency(order.total)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/orders/qr?id=${order.id}`}>
              <Button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sisma-red/20 hover:bg-sisma-red/5 font-semibold text-sm transition-all">
                <QrCode className="h-4 w-4" />
                Voir QR Code
              </Button>
            </Link>
            <Button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sisma-red/20 hover:bg-sisma-red/5 font-semibold text-sm transition-all">
              <Printer className="h-4 w-4" />
              Imprimer facture
            </Button>
            {/* Status Action Buttons */}
            {order.status === "pending" && (
              <Button 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all bg-green-600 hover:bg-green-700"
                onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: "preparee" })}
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                Valider commande
              </Button>
            )}
            {(order.status === "preparee" || order.status === "processing") && (
              <Button 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all bg-purple-600 hover:bg-purple-700"
                onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: "expediee" })}
                disabled={statusMutation.isPending}
              >
                <Truck className="h-4 w-4" />
                Expédier
              </Button>
            )}
            {order.status === "expediee" && (
              <Button 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all bg-green-600 hover:bg-green-700"
                onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: "livree" })}
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                Confirmer livraison
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Real-time GPS Tracking */}
            <div className="bg-white dark:bg-white/5 border border-sisma-red/10 rounded-2xl overflow-hidden shadow-xl shadow-sisma-red/5">
              <div className="p-5 border-b border-sisma-red/10 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <MaterialIcon name="distance" className="text-sisma-red" />
                  Suivi GPS en temps réel
                </h3>
                <span className="text-xs font-medium opacity-60">Dernière mise à jour: il y a 1 min</span>
              </div>
              <div className="relative aspect-video w-full bg-slate-800">
                {/* Placeholder for Map - In production, integrate Google Maps or Mapbox */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                  <div className="text-center">
                    <MaterialIcon name="map" className="text-6xl text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Carte GPS en temps réel</p>
                    <p className="text-slate-500 text-xs mt-1">Intégration Google Maps à venir</p>
                  </div>
                </div>
                {/* Map Elements Simulated */}
                <div className="relative w-full h-full p-12">
                  <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                    <div className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg mb-1">Fournisseur</div>
                    <div className="size-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                  <div className="absolute bottom-1/4 right-1/4 flex flex-col items-center">
                    <div className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg mb-1">Client</div>
                    <div className="size-4 bg-sisma-red rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                  {/* Driver Marker */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="bg-sisma-red text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg mb-1 flex items-center gap-1">
                      <MaterialIcon name="local_shipping" className="text-[12px]" />
                      Livreur actif
                    </div>
                    <div className="size-6 bg-white rounded-full border-2 border-sisma-red shadow-xl flex items-center justify-center">
                      <MaterialIcon name="navigation" className="text-sisma-red text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-step Delivery Timeline */}
            <div className="bg-white dark:bg-white/5 border border-sisma-red/10 rounded-2xl p-6">
              <h3 className="font-bold mb-8 flex items-center gap-2">
                <Clock className="h-5 w-5 text-sisma-red" />
                Progression de la livraison
              </h3>
              <div className="relative flex justify-between items-start">
                {/* Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-green-500 -z-0 transition-all duration-300"
                  style={{ 
                    width: order.status === "livree" || order.status === "delivered" || order.status === "completed" ? "100%" : 
                           order.status === "expediee" ? "66%" :
                           order.status === "preparee" || order.status === "processing" ? "33%" : "0%"
                  }}
                ></div>
                
                {/* Steps */}
                {progressSteps.map((step, index) => (
                  <div key={step.key} className="relative z-10 flex flex-col items-center w-1/4 text-center">
                    <div 
                      className={`size-10 rounded-full flex items-center justify-center shadow-lg mb-3 transition-all ${
                        step.completed 
                          ? "bg-green-500 text-white shadow-green-300" 
                          : "bg-slate-100 border-2 border-slate-200 text-slate-400"
                      } ${step.active ? "animate-pulse" : ""}`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-tighter ${step.completed ? "text-slate-900" : "opacity-40"}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] opacity-60">{step.completed ? "Terminé" : "En attente"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Articles commandés ({orderItems.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3">Quantité</th>
                      <th className="px-4 py-3">Prix</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderItems.length > 0 ? (
                      orderItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-lg bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {item.product_name ? (
                                  <img src={item.image || "https://placehold.co/40"} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{item.product_name || "Produit"}</p>
                                <p className="text-xs text-slate-500">Réf: {item.product_id || "-"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">{item.quantity || 1}</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 font-bold text-right">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Aucun article trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar (Right Column) */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold mb-4 text-lg text-slate-900">Résumé financier</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Frais de livraison</span>
                  <span className="font-semibold">{formatCurrency(order.delivery_fee)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl text-blue-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Driver Info Card */}
            {order.delivery_person && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Livreur assigné
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-14 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-7 w-7 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{order.delivery_person.name}</p>
                    <p className="text-xs text-slate-500">{order.delivery_person.zone || "Zone non définie"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{order.delivery_person.phone || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier Info Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-600" />
                Fournisseur
              </h3>
              <p className="font-bold text-slate-900">{supplierName}</p>
            </div>

            {/* Customer Info Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Client
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-slate-900">{customerName}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{customerPhone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span>{customerLocation}</span>
                </div>
                {order.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Info Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Informations livraison
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Date de création</p>
                  <p className="text-sm font-medium">{formatDate(order.created_at || "")}</p>
                </div>
                {order.delivery_date && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Date de livraison</p>
                    <p className="text-sm font-medium">{formatDate(order.delivery_date)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Type de livraison</p>
                  <p className="text-sm font-medium">{order.delivery_type || "Standard"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
