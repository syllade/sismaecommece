import { motion } from "framer-motion";
import { Link } from "wouter";
import { Package, Search, ShoppingCart, Inbox } from "lucide-react";

interface EmptyStateProps {
  /** Type of empty state to display */
  type?: "products" | "cart" | "search" | "orders" | "default";
  /** Custom title (overrides type default) */
  title?: string;
  /** Custom description */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action button link */
  actionHref?: string;
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// Default messages by type
const EMPTY_STATE_MESSAGES = {
  products: {
    title: "Aucun produit disponible",
    description: "Cette catégorie est actuellement vide. Revenez bientôt !",
    icon: Package,
  },
  cart: {
    title: "Votre panier est vide",
    description: "Découvrez nos produits et ajoutez-les à votre panier.",
    icon: ShoppingCart,
  },
  search: {
    title: "Aucun résultat trouvé",
    description: "Essayez avec d'autres mots-clés ou parcourir nos catégories.",
    icon: Search,
  },
  orders: {
    title: "Aucune commande",
    description: "Vous n'avez pas encore passé de commande.",
    icon: Inbox,
  },
  default: {
    title: "Rien à afficher",
    description: "Les données demandées ne sont pas disponibles.",
    icon: Inbox,
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }
  }),
};

// SISMA Colors
const GRAD = "linear-gradient(135deg, #D81918, #F7941D)";

export function EmptyState({
  type = "default",
  title,
  description,
  actionText,
  actionHref = "/",
  icon,
  className = "",
}: EmptyStateProps) {
  const config = EMPTY_STATE_MESSAGES[type];
  const IconComponent = config.icon;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      {/* Icon Circle */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(216, 25, 24, 0.1)" }}
      >
        {icon ? (
          <div className="w-12 h-12 text-red-600">{icon}</div>
        ) : (
          <IconComponent className="w-12 h-12" style={{ color: "#D81918" }} />
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center">
        {title || config.title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-md mb-8">
        {description || config.description}
      </p>

      {/* Action Button */}
      {actionText && (
        <Link
          href={actionHref}
          className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg hover:scale-105"
          style={{ background: GRAD }}
        >
          {actionText}
        </Link>
      )}
    </motion.div>
  );
}

export default EmptyState;
