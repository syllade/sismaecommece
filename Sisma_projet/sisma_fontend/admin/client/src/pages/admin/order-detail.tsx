import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";

// Material Symbols Icon component
function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className || ""}`}>
      {name}
    </span>
  );
}

// Mock order data - in real app this would come from API
interface OrderItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "processing" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  date: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  commission: number;
  total: number;
  paymentStatus: "settled" | "pending" | "failed";
  driver?: {
    name: string;
    rating: number;
    photo?: string;
    phone: string;
    vehiclePlate: string;
  };
  supplier: {
    name: string;
    address: string;
    phone: string;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
  };
}

// Mock data
const mockOrder: Order = {
  id: "1",
  orderNumber: "ORD-8921",
  status: "in_transit",
  date: "2023-10-24T10:30:00",
  items: [
    {
      id: 1,
      name: "Premium Runners X-2",
      sku: "SM-88219-R",
      quantity: 1,
      price: 45000,
    },
    {
      id: 2,
      name: "Quantum Smartwatch",
      sku: "SM-44102-S",
      quantity: 1,
      price: 22500,
    },
  ],
  subtotal: 67500,
  shippingFee: 2500,
  commission: 5600,
  total: 75600,
  paymentStatus: "settled",
  driver: {
    name: "Mohamed Traoré",
    rating: 4.95,
    phone: "+225 07 12 34 56 78",
    vehiclePlate: "AB-1234-SIS",
  },
  supplier: {
    name: "Urban Gear Co.",
    address: "Zone Industrielle, Batiment 4A, Abidjan",
    phone: "+225 05 12 34 56 78",
  },
  customer: {
    name: "Elena Valenzuela",
    address: "Av. Houphouet-Boigny 120, Apt 502, Plateau, Abidjan",
    phone: "+225 05 55 44 33 22",
  },
};

const statusLabels: Record<Order["status"], string> = {
  pending: "En attente",
  processing: "En traitement",
  picked_up: "Ramassé",
  in_transit: "En livraison",
  delivered: "Livré",
  cancelled: "Annulé",
};

const statusColors: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  picked_up: "bg-purple-100 text-purple-700",
  in_transit: "bg-primary/20 text-sisma-red",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderDetailPage() {
  const [location] = useLocation();
  const [order] = useState<Order>(mockOrder);

  // Format currency in CFA (FCFA)
  const formatCurrency = (amount: number) => {
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
  const getProgressSteps = () => {
    const steps = [
      { key: "pending", label: "Commande passée", time: order.date },
      { key: "processing", label: "En traitement", time: "2023-10-24T09:00:00" },
      { key: "picked_up", label: "Ramassé", time: "2023-10-24T11:15:00" },
      { key: "in_transit", label: "En livraison", time: "2023-10-24T12:00:00" },
      { key: "delivered", label: "Livré", time: "" },
    ];

    const statusIndex: Record<Order["status"], number> = {
      pending: 0,
      processing: 1,
      picked_up: 2,
      in_transit: 3,
      delivered: 4,
      cancelled: -1,
    };

    const currentIndex = statusIndex[order.status];

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const progressSteps = getProgressSteps();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Order Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight">Commande {order.orderNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[order.status]} ${statusColors[order.status].includes('primary') ? '' : 'bg-opacity-20'}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Passée le {formatDate(order.date)} • {order.items.length} articles • {formatCurrency(order.total)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sisma-red/20 hover:bg-sisma-red/5 font-semibold text-sm transition-all">
              <MaterialIcon name="print" className="text-lg" />
              Imprimer facture
            </Button>
            <Button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sisma-red/20 hover:bg-sisma-red/5 font-semibold text-sm transition-all">
              <MaterialIcon name="chat" className="text-lg" />
              Contacter livreur
            </Button>
            <Button variant="destructive" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <MaterialIcon name="cancel" className="text-lg" />
              Annuler commande
            </Button>
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
                <MaterialIcon name="route" className="text-sisma-red" />
                Progression de la livraison
              </h3>
              <div className="relative flex justify-between items-start">
                {/* Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-sisma-red/10 dark:bg-sisma-red/20 -z-0"></div>
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-sisma-red -z-0"
                  style={{ 
                    width: order.status === "delivered" ? "100%" : 
                           order.status === "in_transit" ? "66%" :
                           order.status === "picked_up" ? "50%" :
                           order.status === "processing" ? "33%" : "0%"
                  }}
                ></div>
                
                {/* Steps */}
                {progressSteps.map((step, index) => (
                  <div key={step.key} className="relative z-10 flex flex-col items-center w-1/5 text-center">
                    <div 
                      className={`size-10 rounded-full flex items-center justify-center shadow-lg mb-3 transition-all ${
                        step.completed 
                          ? "bg-sisma-red text-white shadow-sisma-red/30" 
                          : "bg-slate-100 dark:bg-slate-800 border-2 border-sisma-red/20 text-slate-400"
                      } ${step.active ? "animate-pulse" : ""}`}
                    >
                      {step.completed && order.status !== "cancelled" ? (
                        <MaterialIcon name="check_circle" className="text-xl" />
                      ) : (
                        <MaterialIcon name={
                          step.key === "pending" ? "shopping_cart" :
                          step.key === "processing" ? "inventory_2" :
                          step.key === "picked_up" ? "inventory" :
                          step.key === "in_transit" ? "local_shipping" :
                          "verified"
                        } className="text-xl" />
                      )}
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-tighter ${step.completed ? "text-slate-900 dark:text-white" : "opacity-40"}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] opacity-60">{step.time ? formatDate(step.time).split(" à ")[1] : "En attente"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-white dark:bg-white/5 border border-sisma-red/10 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-sisma-red/10">
                <h3 className="font-bold flex items-center gap-2">
                  <MaterialIcon name="shopping_bag" className="text-sisma-red" />
                  Articles commandés
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-sisma-red/5 text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Produit</th>
                      <th className="px-6 py-4">Quantité</th>
                      <th className="px-6 py-4">Prix</th>
                      <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sisma-red/5">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-slate-200 dark:bg-white/10 flex-shrink-0 flex items-center justify-center">
                              <MaterialIcon name="inventory_2" className="text-slate-400" />
                            </div>
                            <div>
                              <p className="font-bold">{item.name}</p>
                              <p className="text-xs opacity-60">SKU: {item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-medium">{item.quantity}</td>
                        <td className="px-6 py-5 font-medium">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-5 font-bold text-right">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar (Right Column) */}
          <div className="space-y-8">
            {/* Financial Summary */}
            <div className="bg-white dark:bg-white/5 border border-sisma-red/10 rounded-2xl p-6 shadow-xl shadow-sisma-red/5">
              <h3 className="font-bold mb-6 text-lg">Résumé financier</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Sous-total</span>
                  <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Frais de livraison</span>
                  <span className="font-semibold">{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm text-sisma-red">
                  <span className="font-medium">Commission Sisma (8%)</span>
                  <span className="font-bold">+{formatCurrency(order.commission)}</span>
                </div>
                <div className="pt-4 border-t border-sisma-red/10 flex justify-between items-center">
                  <span className="font-black text-lg">Total</span>
                  <span className="font-black text-2xl text-sisma-red tracking-tighter">{formatCurrency(order.total)}</span>
                </div>
              </div>
              <div className="mt-6 p-3 rounded-xl bg-sisma-red/5 border border-sisma-red/10 flex items-center gap-3">
                <MaterialIcon name="account_balance_wallet" className="text-sisma-red" />
                <div className="text-[10px] leading-tight">
                  <p className="font-bold uppercase tracking-widest text-sisma-red">Statut du paiement</p>
                  <p className="font-medium opacity-80 uppercase">
                    {order.paymentStatus === "settled" ? "Réglé via Sisma Wallet" : 
                     order.paymentStatus === "pending" ? "En attente" : "Échoué"}
                  </p>
                </div>
              </div>
            </div>

            {/* Driver Info Card */}
            {order.driver && (
              <div className="bg-white dark:bg-white/5 border border-sisma-red/10 rounded-2xl p-6">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <MaterialIcon name="person" className="text-sisma-red" />
                  Livreur assigné
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-16 rounded-2xl bg-slate-200 dark:bg-white/10 overflow-hidden border-2 border-sisma-red/20 flex items-center justify-center">
                    <MaterialIcon name="person" className="text-3xl text-slate-400" />
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight">{order.driver.name}</p>
                    <p className="text-xs text-sisma-red font-bold flex items-center gap-1">
                      <MaterialIcon name="stars" className="text-sm" />
                      {order.driver.rating} Rating
                    </p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <MaterialIcon name="directions_car" className="opacity-60" />
                    <div>
                      <p className="text-[10px] opacity-60 uppercase font-bold">Plaque d'immatriculation</p>
                      <p className="font-bold">{order.driver.vehiclePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MaterialIcon name="call" className="opacity-60" />
                    <div>
                      <p className="text-[10px] opacity-60 uppercase font-bold">Numéro de téléphone</p>
                      <p className="font-bold">{order.driver.phone}</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full py-3 rounded-xl bg-sisma-red text-white font-bold text-sm shadow-lg shadow-sisma-red/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Envoyer un message sécurisé
                </Button>
              </div>
            )}

            {/* Customer & Supplier Info */}
            <div className="space-y-4">
              {/* Supplier */}
              <div className="bg-white dark:bg-white/5 border border-sisma-red/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MaterialIcon name="storefront" className="text-sisma-red text-lg" />
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Fournisseur</h4>
                </div>
                <p className="font-bold mb-1">{order.supplier.name}</p>
                <p className="text-xs opacity-70 leading-relaxed mb-3">{order.supplier.address}</p>
                <a className="text-xs font-bold text-sisma-red flex items-center gap-1" href={`tel:${order.supplier.phone}`}>
                  <MaterialIcon name="phone" className="text-sm" />
                  {order.supplier.phone}
                </a>
              </div>

              {/* Customer */}
              <div className="bg-white dark:bg-white/5 border border-sisma-red/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MaterialIcon name="person_pin_circle" className="text-sisma-red text-lg" />
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Client</h4>
                </div>
                <p className="font-bold mb-1">{order.customer.name}</p>
                <p className="text-xs opacity-70 leading-relaxed mb-3">{order.customer.address}</p>
                <a className="text-xs font-bold text-sisma-red flex items-center gap-1" href={`tel:${order.customer.phone}`}>
                  <MaterialIcon name="phone" className="text-sm" />
                  {order.customer.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
