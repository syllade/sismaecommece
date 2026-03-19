import { Link, useRoute } from "wouter";
import { ChevronRight, Package, MapPin, Phone, CalendarDays, QrCode, UserPlus, Shield, History, RotateCcw, X, Check, Clock, CheckCircle, XCircle, Star, Send } from "lucide-react";
import { useOrder } from "@/hooks/use-orders";
import { useAuth } from "@/context/ClientAuthContext";
import { PageLoader } from "@/components/Loader";
import { OrderTrackingTimeline } from "@/components/OrderTrackingTimeline";
import { SismaLogo } from "@/components/SismaLogo";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCreateReturn, RETURN_REASONS } from "@/hooks/use-returns";
import { getReturnRequest, saveReturnRequest, type ReturnRequest } from "@/lib/returns";
import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

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

const RETURN_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  refused: "bg-red-50 text-red-700 border-red-200",
};

const RETURN_STATUS_ICON = {
  pending: Clock,
  accepted: CheckCircle,
  refused: XCircle,
};

const RETURN_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
};

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = Number(params?.id ?? 0);
  const { token } = useAuth();
  const { data: order, isLoading, error } = useOrder(id);
  const { toast } = useToast();
  const createReturn = useCreateReturn();
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(() =>
    id ? getReturnRequest(id) : null
  );

  // Rating state
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Check if order is delivered
  const isDelivered = order?.status?.toLowerCase() === "delivered" || 
                     order?.status?.toLowerCase() === "livree" || 
                     order?.status?.toLowerCase() === "completed";

  // Get supplier ID from order
  const getSupplierId = () => {
    // Try to get from order directly
    const orderAny = order as any;
    if (orderAny.supplier_id) return orderAny.supplier_id;
    // Try from first item
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0] as any;
      if (firstItem.supplier_id) return firstItem.supplier_id;
    }
    return null;
  };

  // Submit rating function
  const submitRating = async () => {
    const supplierId = getSupplierId();
    if (!supplierId) {
      toast({ title: "Erreur", description: "Aucun fournisseur trouvé pour cette commande", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une note", variant: "destructive" });
      return;
    }

    setRatingLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/v1/shops/${supplierId}/reviews`), {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          rating,
          comment: ratingComment || undefined,
          order_id: id,
        }),
      });
      const data = await response.json();
      if (data.id || data.success) {
        setHasRated(true);
        toast({ title: "Merci !", description: "Votre avis a été enregistré" });
      } else {
        throw new Error(data.message || "Erreur lors de l'envoi");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'enregistrer votre avis", variant: "destructive" });
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setReturnRequest(getReturnRequest(id));
  }, [id]);
  // Vérifier si la commande peut être retournée (livrée depuis moins de 7 jours)
  const canRequestReturn = () => {
    if (!order) return false;
    if (returnRequest) return false;
    const status = order.status?.toLowerCase();
    if (status !== "delivered" && status !== "livree" && status !== "completed") return false;
    
    const deliveredDate = new Date((order as any).delivered_at || (order as any).updated_at || order.created_at);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 7;
  };

  // Soumettre une demande de retour
  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un motif de retour", variant: "destructive" as any });
      return;
    }
    
    setReturnLoading(true);
    
    try {
      await createReturn.mutateAsync({
        order_id: id,
        reason: returnReason,
        description: returnDescription || undefined,
      });
      
      setReturnLoading(false);
      setShowReturnModal(false);
      setReturnReason("");
      setReturnDescription("");
      toast({
        title: "Demande de retour envoyée",
        description: "Votre demande a été transmise au vendeur. Nous vous contacterons sous 24-48h.",
      });
    } catch (error: any) {
      setReturnLoading(false);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de créer la demande de retour. Veuillez réessayer.", 
        variant: "destructive" as any 
      });
    }
  };

  const formatPrice = (value: number) => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date indisponible";
    return date.toLocaleString("fr-FR");
  };

  if (!id) {
    return (
      <div className="container mx-auto px-3 max-w-4xl py-10">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          Identifiant de commande invalide.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader text="Chargement de la commande..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 max-w-4xl py-10">
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center text-red-700">
          {error instanceof Error ? error.message : "Impossible de charger la commande."}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-3 max-w-4xl py-10">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          Commande introuvable.
        </div>
      </div>
    );
  }

  const signupLink = `/account?${new URLSearchParams({
    mode: "register",
    redirect: `/orders/${order.id}`,
    source: "order-detail",
    ...(order.customer_phone ? { phone: order.customer_phone } : {}),
    ...(order.customer_name ? { name: order.customer_name } : {}),
  }).toString()}`;

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
                <Link href="/orders" className="hover:text-red-600">
                  Mes commandes
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-800 font-medium">Commande #{order.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {order.order_number || `Commande #${order.id}`}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Statut: {STATUS_LABELS[String(order.status).toLowerCase()] || order.status}
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm">
              <SismaLogo variant="default" showSlogan={false} size="sm" align="start" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 max-w-4xl py-6 space-y-4">
        {/* Timeline de suivi */}
        <OrderTrackingTimeline 
          status={order.status} 
          createdAt={order.created_at}
          updatedAt={(order as any).updated_at || order.created_at}
        />

        {/* Proposition de création de compte pour clients non connectés */}
        {!token && (
          <>
            {order.source === "local" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                Ceci est une commande locale (non synchronisee a un compte client connecte).
              </div>
            )}
            
            <div className="bg-gradient-to-r from-primary/10 to-orange-50 border border-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Créez votre compte SISMA après votre achat
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Gardez cette commande, activez le suivi intelligent et débloquez les avantages membres :
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    <li className="flex items-center gap-2">
                      <History className="w-4 h-4 text-green-500" />
                      <span>Historique de toutes vos commandes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Suivi en temps réel de vos livraisons</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-500" />
                      <span>Commande rapide avec informations pré-remplies</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Accès aux produits moins chers et recommandations personnalisées</span>
                    </li>
                  </ul>
                  <Link
                    href={signupLink}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Créer mon compte
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">{formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500">Telephone</p>
                <p className="font-semibold text-gray-900">{order.customer_phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500">Adresse</p>
                <p className="font-semibold text-gray-900">{order.customer_location || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-700" />
            <span className="font-semibold text-gray-900">Articles ({order.items.length})</span>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, index) => (
              <div key={`${item.id ?? index}`} className="p-4 flex gap-3 items-start">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">[]</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Qte: {item.quantity}
                    {item.color ? ` | Couleur: ${item.color}` : ""}
                    {item.size ? ` | Taille: ${item.size}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price)}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-lg font-bold text-red-600">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* QR Code Section */}
        {order.qr_code && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-gray-900">QR Code de suivi</span>
            </div>
            <div className="flex flex-col items-center">
              {order.qr_code ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.qr_code)}`}
                  alt="QR Code" 
                  className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-3 text-center">
                Présentez ce code au livreur pour confirmer la livraison
              </p>
              {order.qr_code_security && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Code de sécurité:</p>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                    {order.qr_code_security.substring(0, 8)}...
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rating Section - Only show when delivered */}
        {isDelivered && !hasRated && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-gray-900">Noter ce fournisseur</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Comment évaluez-vous votre expérience avec ce fournisseur ?
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= rating 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-gray-300"
                    }`} 
                  />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Votre commentaire (optionnel)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full p-3 text-sm border border-gray-200 rounded-lg mb-3 resize-none"
              rows={3}
            />
            <button
              onClick={submitRating}
              disabled={rating === 0 || ratingLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                rating === 0 || ratingLoading 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              {ratingLoading ? (
                "Envoi en cours..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Envoyer ma note
                </span>
              )}
            </button>
          </div>
        )}

        {/* Already rated message */}
        {isDelivered && hasRated && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Merci pour votre avis !</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Vous avez noté ce fournisseur {rating} étoile{rating > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {returnRequest && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  Suivi du retour
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Motif: {returnRequest.reason}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  RETURN_STATUS_STYLES[returnRequest.status]
                }`}
              >
                {(() => {
                  const Icon = RETURN_STATUS_ICON[returnRequest.status];
                  return <Icon className="w-3.5 h-3.5" />;
                })()}
                {RETURN_STATUS_LABELS[returnRequest.status] || returnRequest.status}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Demande envoyée le {formatDate(returnRequest.requestedAt)}
            </p>
          </div>
        )}

        {/* Bouton demande de retour */}
        {canRequestReturn() && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  Politique de retour
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Vous avez 7 jours après livraison pour demander un retour.
                </p>
              </div>
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Demander un retour
              </button>
            </div>
          </div>
        )}

        {/* Modal de demande de retour */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Demander un retour</h3>
                <button onClick={() => setShowReturnModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez le motif de votre retour :
              </p>
              
              <div className="space-y-2 mb-4">
                {[
                  { value: "defectueux", label: "Produit défectueux" },
                  { value: "incorrect", label: "Mauvais produit reçu" },
                  { value: "taille", label: "Taille ne correspond pas" },
                  { value: "qualite", label: "Qualité non conforme" },
                  { value: "autre", label: "Autre raison" },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      returnReason === reason.value 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason.value}
                      checked={returnReason === reason.value}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-gray-700">{reason.label}</span>
                  </label>
                ))}
              </div>
              
              <button
                onClick={handleReturnRequest}
                disabled={returnLoading || !returnReason}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {returnLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Envoyer la demande
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-red-200 hover:text-red-700"
        >
          Retour aux commandes
        </Link>
      </div>
    </div>
  );
}
