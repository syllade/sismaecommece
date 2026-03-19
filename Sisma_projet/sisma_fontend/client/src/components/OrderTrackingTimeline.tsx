import { motion } from "framer-motion";
import { Check, Clock, Package, Truck, Store, MapPin, Home } from "lucide-react";

interface OrderTrackingTimelineProps {
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// Ordres des étapes de suivi
const TRACKING_STEPS = [
  { key: "pending", label: "En attente", icon: Clock, description: "Votre commande a été reçue" },
  { key: "confirmed", label: "Validée", icon: Check, description: "Votre commande est validée" },
  { key: "preparing", label: "En préparation", icon: Store, description: "Votre colis est en préparation" },
  { key: "out_for_delivery", label: "En livraison", icon: MapPin, description: "Le livreur est en route" },
  { key: "delivered", label: "Livrée", icon: Home, description: "Commande livrée avec succès" },
];

// Statuts équivalents (alias)
const STATUS_ALIASES: Record<string, string> = {
  "en attente": "pending",
  "attente": "pending",
  "validée": "confirmed",
  "validee": "confirmed",
  "validé": "confirmed",
  "valide": "confirmed",
  "confirmée": "confirmed",
  "confirmee": "confirmed",
  "confirmé": "confirmed",
  "confirme": "confirmed",
  "processing": "preparing",
  "en traitement": "preparing",
  "en_preparation": "preparing",
  "en préparation": "preparing",
  "expediee": "out_for_delivery",
  "expédiée": "out_for_delivery",
  "shipped": "out_for_delivery",
  "en livraison": "out_for_delivery",
  "en_livraison": "out_for_delivery",
  "livree": "delivered",
  "livrée": "delivered",
  "terminee": "completed",
  "terminée": "completed",
  "annulee": "cancelled",
  "annulée": "cancelled",
};

function normalizeStatus(status: string): string {
  const lowerStatus = status?.toLowerCase() || "";
  return STATUS_ALIASES[lowerStatus] || lowerStatus;
}

function getCurrentStepIndex(status: string): number {
  const normalizedStatus = normalizeStatus(status);
  
  // Si annulée, on n'affiche pas la timeline
  if (normalizedStatus === "cancelled" || normalizedStatus === "annulee" || normalizedStatus === "annulée") {
    return -1;
  }
  
  // Trouver l'étape actuelle
  const stepIndex = TRACKING_STEPS.findIndex(step => step.key === normalizedStatus);
  
  // Si le statut exact n'est pas trouvé, chercher une correspondance partielle
  if (stepIndex === -1) {
    for (let i = 0; i < TRACKING_STEPS.length; i++) {
      if (normalizedStatus.includes(TRACKING_STEPS[i].key)) {
        return i;
      }
    }
    return 0; // Par défaut, commencer à la première étape
  }
  
  return stepIndex;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function OrderTrackingTimeline({ status, createdAt, updatedAt }: OrderTrackingTimelineProps) {
  const currentStepIndex = getCurrentStepIndex(status);
  const normalizedStatus = normalizeStatus(status);
  
  // Si annulée, afficher un message spécial
  if (normalizedStatus === "cancelled" || normalizedStatus === "annulee" || normalizedStatus === "annulée") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Commande annulée</h3>
            <p className="text-sm text-red-600">Cette commande a été annulée.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary" />
        Suivi de votre commande
      </h3>
      
      <div className="relative">
        {/* Ligne de progression */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200">
          <motion.div 
            className="w-full bg-primary"
            initial={{ height: 0 }}
            animate={{ height: `${Math.min(((currentStepIndex) / (TRACKING_STEPS.length - 1)) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        {/* Étapes */}
        <div className="space-y-4">
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;
            
            return (
              <motion.div 
                key={step.key}
                className={`flex items-start gap-4 ${isCompleted ? "opacity-100" : "opacity-40"}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isCompleted ? 1 : 0.4, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Icône */}
                <div className={`
                  relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  ${isCompleted 
                    ? isCurrent 
                      ? "bg-primary text-white shadow-lg shadow-primary/30" 
                      : "bg-green-500 text-white" 
                    : "bg-gray-100 text-gray-400"
                  }
                `}>
                  {isCompleted && !isCurrent ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  
                  {/* Animation pulsante pour l'étape actuelle */}
                  {isCurrent && (
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                
                {/* Texte */}
                <div className="flex-1 pt-2">
                  <p className={`font-medium ${isCurrent ? "text-primary" : "text-gray-900"}`}>
                    {step.label}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                  {isCurrent && (
                    <motion.p 
                      className="text-xs text-primary mt-1 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {updatedAt ? `Mis à jour le ${formatDate(updatedAt)}` : "En cours..."}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Message d'étape suivante */}
      {currentStepIndex < TRACKING_STEPS.length - 1 && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Prochaine étape:</span>{" "}
            {TRACKING_STEPS[currentStepIndex + 1]?.description}
          </p>
        </div>
      )}
      
      {/* Message de livraison terminée */}
      {currentStepIndex === TRACKING_STEPS.length - 1 && (
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            🎉 Votre commande a été livrée avec succès ! Nous vous remercions pour votre confiance.
          </p>
        </div>
      )}
    </div>
  );
}

export default OrderTrackingTimeline;
