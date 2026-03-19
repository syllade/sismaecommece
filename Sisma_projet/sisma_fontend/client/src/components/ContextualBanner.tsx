import { motion } from "framer-motion";
import { Home, Tv, Shirt, Sparkles } from "lucide-react";

/** Thème visuel selon la catégorie (ambiance déco, tech, etc.) */
function getCategoryTheme(categoryName: string) {
  const n = (categoryName || "").toLowerCase();
  if (/maison|deco|décoration|chambre/.test(n))
    return {
      label: "Maison & déco",
      subtitle: "Ambiance cosy et tendances",
      gradient: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 50%, #f5d0fe 100%)",
      icon: Home,
    };
  if (/electronique|tech|informatique|tv/.test(n))
    return {
      label: "Électronique",
      subtitle: "Tech et innovation",
      gradient: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #c7d2fe 100%)",
      icon: Tv,
    };
  if (/mode|vetement|fashion/.test(n))
    return {
      label: "Mode",
      subtitle: "Style et nouveautés",
      gradient: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)",
      icon: Shirt,
    };
  if (/beaute|hygiene/.test(n))
    return {
      label: "Beauté",
      subtitle: "Soins et bien-être",
      gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
      icon: Sparkles,
    };
  return null;
}

interface ContextualBannerProps {
  categoryName: string;
  className?: string;
}

/** Bannière contextuelle : ambiance selon la catégorie sélectionnée */
export function ContextualBanner({ categoryName, className = "" }: ContextualBannerProps) {
  const theme = getCategoryTheme(categoryName);
  if (!theme) return null;

  const Icon = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.005 }}
      className={`rounded-xl border border-gray-200/80 overflow-hidden shadow-sm ${className}`}
      style={{ background: theme.gradient }}
    >
      <div className="flex items-center gap-4 px-4 py-3 sm:px-5 sm:py-4">
        <motion.span
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center shadow-sm"
          whileHover={{ rotate: 5, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Icon className="w-5 h-5 text-gray-700" />
        </motion.span>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{theme.label}</p>
          <p className="text-gray-600 text-xs mt-0.5">{theme.subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
