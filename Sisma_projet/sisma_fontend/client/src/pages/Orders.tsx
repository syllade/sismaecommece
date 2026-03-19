import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  ShoppingBag,
  Phone,
  Mail,
  RefreshCw,
  Search,
  User,
  Bell,
} from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { useGuestOrders } from "@/hooks/use-guest-orders";
import { useAuth } from "@/context/ClientAuthContext";
import { PageLoader } from "@/components/Loader";
import { SismaLogo } from "@/components/SismaLogo";
import { useToast } from "@/hooks/use-toast";
import { getSignupPrefill } from "@/lib/customerProfile";
import type { CustomerProfile } from "@/lib/customerProfile";
import {
  getNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreferences,
} from "@/lib/client-account";
import { Switch } from "@/components/ui/switch";
import { cacheOrderSnapshot } from "@/hooks/use-orders";

const S = {
  red: "#D81918",
  orange: "#F7941D",
};

const GRAD = `linear-gradient(135deg, ${S.red}, ${S.orange})`;

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  pending: {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: Clock,
  },
  confirmed: {
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle,
  },
  processing: {
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: Package,
  },
  preparing: {
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: Package,
  },
  shipped: {
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    icon: Truck,
  },
  out_for_delivery: {
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    icon: Truck,
  },
  delivered: {
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  completed: {
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Validée",
  processing: "En préparation",
  preparing: "En préparation",
  shipped: "En livraison",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  completed: "Terminée",
  cancelled: "Annulée",
};

const STATUS_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Validées" },
  { value: "processing", label: "En préparation" },
  { value: "shipped", label: "En livraison" },
  { value: "delivered", label: "Livrées" },
];

const ORDER_STEPS = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];
const NOTIFY_STATUSES = new Set(["confirmed", "out_for_delivery", "delivered"]);
const STATUS_STORAGE_KEY = "sisma_order_status_map";
const NOTIF_STORAGE_KEY = "sisma_order_notifications";

interface OrderNotification {
  id: string;
  orderId: number;
  status: string;
  createdAt: string;
}

function normalizeStatusKey(status: string) {
  const lower = String(status || "").toLowerCase();
  if (["validée", "validee", "confirmee", "confirmée", "confirmé", "confirme"].includes(lower)) return "confirmed";
  if (["processing", "en traitement", "en_preparation", "en préparation"].includes(lower)) return "preparing";
  if (["expediee", "expédiée", "shipped", "en livraison", "en_livraison"].includes(lower)) return "out_for_delivery";
  if (["livree", "livrée"].includes(lower)) return "delivered";
  if (["annulee", "annulée"].includes(lower)) return "cancelled";
  return lower || "pending";
}

function getOrderStepIndex(status: string) {
  const normalized = normalizeStatusKey(status);
  return ORDER_STEPS.indexOf(normalized);
}

function readStatusMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatusMap(next: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(next));
}

function readNotifications(): OrderNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotifications(next: OrderNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Orders() {
  const { token, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [signupPrefill, setSignupPrefill] = useState<CustomerProfile | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    getNotificationPreferences(),
  );
  
  // Guest order search
  const [showGuestSearch, setShowGuestSearch] = useState(false);
  const [guestPhone, setGuestPhone] = useState("");
  const { data: guestOrdersData, isLoading: guestLoading, error: guestError, refetch: refetchGuest } = useGuestOrders(guestPhone);

  const { data, isLoading, error, isFetching, refetch } = useOrders({
    page,
    perPage: 10,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const displayOrders = data?.data ?? [];
  const meta = data?.meta;
  const isLocalHistory = data?.source === "local";

  const searchString = typeof window !== "undefined" ? window.location.search : "";
  const query = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const created = query.get("created") === "1";
  const createdOrder = query.get("order");
  const createdPhone = query.get("phone");
  const welcome = query.get("welcome") === "1";

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (meta?.last_page && page > meta.last_page) {
      setPage(meta.last_page);
    }
  }, [meta?.last_page, page]);

  useEffect(() => {
    setNotifications(readNotifications());
    setSignupPrefill(getSignupPrefill());
    setNotificationPreferences(getNotificationPreferences());
  }, []);

  useEffect(() => {
    if (guestPhone) return;
    const fallbackPhone = createdPhone || signupPrefill?.phone || "";
    if (fallbackPhone) setGuestPhone(fallbackPhone);
  }, [createdPhone, signupPrefill, guestPhone]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!displayOrders.length) return;
    const statusMap = readStatusMap();
    const existing = readNotifications();
    const newNotifications: OrderNotification[] = [];

    displayOrders.forEach((order) => {
      const normalized = normalizeStatusKey(String(order.status));
      const previous = statusMap[String(order.id)];

      if (
        notificationPreferences.orderUpdates &&
        previous &&
        previous !== normalized &&
        NOTIFY_STATUSES.has(normalized)
      ) {
        const label = STATUS_LABELS[normalized] || normalized;
        newNotifications.push({
          id: `${order.id}-${normalized}-${Date.now()}`,
          orderId: order.id,
          status: normalized,
          createdAt: new Date().toISOString(),
        });
        toast({
          title: "Mise à jour de commande",
          description: `${order.order_number || `Commande #${order.id}`} — ${label}`,
          duration: 4000,
        });
      }

      statusMap[String(order.id)] = normalized;
    });

    saveStatusMap(statusMap);
    if (notificationPreferences.orderUpdates && newNotifications.length > 0) {
      const merged = [...newNotifications, ...existing].slice(0, 20);
      saveNotifications(merged);
      setNotifications(merged);
    }
  }, [displayOrders, notificationPreferences.orderUpdates, toast]);

  useEffect(() => {
    if (!guestOrdersData?.data?.length) return;
    guestOrdersData.data.forEach((order) => cacheOrderSnapshot(order, "local"));
  }, [guestOrdersData]);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    if (error instanceof Error) return error.message;
    return "Impossible de charger vos commandes.";
  }, [error]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Date indisponible";
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `${Number(price || 0).toLocaleString("fr-FR")} FCFA`;
  };

  const signupLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set("mode", "register");
    params.set("redirect", "/orders?welcome=1");
    params.set("source", "post-order");
    const phone = signupPrefill?.phone || createdPhone || "";
    const name = signupPrefill?.name || "";
    const email = signupPrefill?.email || "";
    if (phone) params.set("phone", phone);
    if (name) params.set("name", name);
    if (email) params.set("email", email);
    const qs = params.toString();
    return `/account${qs ? `?${qs}` : ""}`;
  }, [signupPrefill, createdPhone]);

  const handlePreferenceToggle = (key: keyof NotificationPreferences, checked: boolean) => {
    updateNotificationPreference(key, checked);
    const next = { ...notificationPreferences, [key]: checked };
    setNotificationPreferences(next);
  };

  // Recherche de commandes par téléphone
  const handleGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestPhone.length >= 8) {
      refetchGuest();
    }
  };

  const clearNotifications = () => {
    saveNotifications([]);
    setNotifications([]);
  };

  if (authLoading || isLoading) {
    return <PageLoader text="Chargement de vos commandes..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16 pb-12">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-3 max-w-4xl py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/" className="hover:text-red-600">
                  Accueil
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-800 font-medium">Mes commandes</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Mes commandes</h1>
              <p className="text-sm text-gray-500 mt-1">
                Suivez vos commandes en temps reel.
                {isLocalHistory ? " Historique local (cet appareil)." : ""}
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm">
              <SismaLogo variant="default" showSlogan={false} size="sm" align="start" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 max-w-4xl py-6 space-y-4">
        {created && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Commande confirmée</p>
                <p className="text-sm text-emerald-700">
                  {createdOrder ? `Votre commande ${createdOrder} a bien été enregistrée.` : "Votre commande a bien été enregistrée."}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Vous pouvez suivre l'évolution de la livraison dans cette page.
                </p>
              </div>
            </div>
          </div>
        )}

        {welcome && token && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Compte SISMA activé</p>
                <p className="text-sm text-gray-600">
                  Vos informations sont enregistrées pour les prochains achats, le suivi des commandes et les
                  recommandations personnalisées.
                </p>
              </div>
            </div>
          </div>
        )}

        {!token && (created || signupPrefill) && (
          <div className="bg-gradient-to-r from-primary/10 to-orange-50 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Première commande validée : créez votre compte quand vous voulez
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Retrouvez vos commandes, activez les notifications, gagnez du temps au checkout et débloquez des
                  produits plus abordables avec des recommandations personnalisées.
                </p>
                <Link
                  href={signupLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Créer mon compte
                </Link>
              </div>
            </div>
          </div>
        )}

        {token && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Préférences de compte</h3>
                <p className="text-sm text-gray-500">
                  Gérez les alertes utiles pour le suivi des commandes et l’activation des avantages membres.
                </p>
              </div>
              <Link
                href="/account"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-red-700"
              >
                Ouvrir mon compte
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                {
                  key: "orderUpdates" as const,
                  title: "Suivi des commandes",
                  text: "Validation, préparation et livraison.",
                },
                {
                  key: "promotions" as const,
                  title: "Produits moins chers",
                  text: "Bons plans et offres membres.",
                },
                {
                  key: "recommendations" as const,
                  title: "Recommandations",
                  text: "Suggestions liées à votre historique.",
                },
              ].map((item) => (
                <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.text}</p>
                    </div>
                    <Switch
                      checked={notificationPreferences[item.key]}
                      onCheckedChange={(checked) => handlePreferenceToggle(item.key, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
              </div>
              <button
                type="button"
                onClick={clearNotifications}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Tout effacer
              </button>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                >
                  <span>
                    Commande #{notif.orderId} — {STATUS_LABELS[notif.status] || notif.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(notif.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recherche commande par téléphone */}
        {!token && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <button
              onClick={() => setShowGuestSearch(!showGuestSearch)}
              className="flex items-center gap-2 text-primary font-medium"
            >
              <Search className="w-5 h-5" />
              Rechercher une commande par téléphone
            </button>
            
            {showGuestSearch && (
              <form onSubmit={handleGuestSearch} className="mt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Entrez votre numéro de téléphone"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={guestLoading || guestPhone.length < 8}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {guestLoading ? "Recherche..." : "Rechercher"}
                  </button>
                </div>
                
                {guestError && (
                  <p className="mt-2 text-sm text-red-600">
                    {guestError instanceof Error ? guestError.message : "Aucune commande trouvée"}
                  </p>
                )}
                
                {guestOrdersData?.data && guestOrdersData.data.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {guestOrdersData.data.length} commande(s) trouvée(s)
                    </p>
                    {guestOrdersData.data.map((order) => (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="block p-3 border border-gray-200 rounded-xl hover:border-primary transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.order_number || `#${order.id}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.created_at)} • {order.items?.length || 0} article(s)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatPrice(order.total)}
                            </p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "delivered" || order.status === "livrée"
                                ? "bg-green-100 text-green-700"
                                : order.status === "cancelled" || order.status === "annulée"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {STATUS_LABELS[normalizeStatusKey(order.status)] || order.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  statusFilter === filter.value
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-red-200 hover:text-red-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
            {isFetching && <span className="text-xs text-gray-400 ml-1">Mise à jour...</span>}
          </div>
        </div>

        {!token && isLocalHistory && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Vous n'etes pas connecte. Les commandes affichees sont celles creees depuis cet appareil.
          </div>
        )}

        {errorMessage ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reessayer
            </button>
          </div>
        ) : displayOrders.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl border border-gray-200 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune commande</h2>
            <p className="text-gray-500 mb-6">
              {token
                ? "Vous n'avez pas encore passe de commande."
                : "Vos commandes apparaitront ici apres validation depuis le checkout."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: GRAD }}
            >
              Decouvrir nos produits
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order, idx: number) => {
              const rawStatus = String(order.status || "pending");
              const normalizedStatus = normalizeStatusKey(rawStatus);
              const statusConfig = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const stepIndex = getOrderStepIndex(normalizedStatus);
              const progressPct =
                stepIndex >= 0 ? Math.round((stepIndex / (ORDER_STEPS.length - 1)) * 100) : 0;

              return (
                <motion.div
                  key={order.id || idx}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: idx * 0.06 }}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">
                        {order.order_number || `Commande #${order.id}`}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {STATUS_LABELS[normalizedStatus] || rawStatus}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                  </div>

                  <div className="p-4">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {order.items?.slice(0, 4).map((item: any, i: number) => (
                        <div
                          key={`${order.id}-${item.id ?? i}`}
                          className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0"
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">[]</div>
                          )}
                        </div>
                      ))}
                      {order.items?.length > 4 && (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-sm font-medium text-gray-500">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span>En attente</span>
                        <span>Livrée</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%`, background: GRAD }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Étape actuelle: {STATUS_LABELS[normalizedStatus] || rawStatus}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">{order.items?.length || 0} article(s)</div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-red-600">{formatPrice(order.total)}</span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
                        >
                          Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-200"
            >
              Precedent
            </button>
            <span className="text-sm text-gray-600">
              Page {meta.page} / {meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(meta.last_page, prev + 1))}
              disabled={page >= meta.last_page}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-200"
            >
              Suivant
            </button>
          </div>
        )}

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-2xl border border-gray-200 p-6"
        >
          <h3 className="font-bold text-gray-900 mb-4">Besoin d'aide ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="tel:+2250700000000"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Appelez-nous</p>
                <p className="text-xs text-gray-500">07 00 00 00 00</p>
              </div>
            </a>
            <a
              href="mailto:support@sisma.ci"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Email</p>
                <p className="text-xs text-gray-500">support@sisma.ci</p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
