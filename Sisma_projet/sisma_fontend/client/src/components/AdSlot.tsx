import { motion } from "framer-motion";

interface AdSlotProps {
  /** Identifiant pour scripts pub (ex. Google AdSense) */
  id: string;
  /** Dimensions recommandées pour la pub */
  width?: number;
  height?: number;
  /** Label affiché en placeholder */
  label?: string;
  className?: string;
  /** Contenu personnalisé (script pub) ; si absent, affiche le placeholder */
  children?: React.ReactNode;
  /** minimal = placeholder discret (bordure légère, petit texte) pour ne pas surcharger la page */
  variant?: "default" | "minimal";
}

/**
 * Emplacement publicitaire : placeholder ou zone pour insérer de vraies pubs
 * (Google AdSense, etc.). Remplacez children par votre script/iframe.
 */
export function AdSlot({
  id,
  width = 300,
  height = 250,
  label = "Espace publicitaire",
  className = "",
  children,
  variant = "default",
}: AdSlotProps) {
  const isMinimal = variant === "minimal";

  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      className={
        isMinimal
          ? `rounded-xl border border-gray-200/80 bg-gray-50/50 overflow-hidden ${className}`
          : `rounded-2xl border-2 border-dashed border-[#ae1bd8]/30 bg-white/80 overflow-hidden ${className}`
      }
      style={{ minWidth: width, minHeight: isMinimal && !children ? Math.min(height, 60) : height }}
    >
      {children ? (
        <div id={id} className="w-full h-full min-h-[100px] flex items-center justify-center">
          {children}
        </div>
      ) : isMinimal ? (
        <div
          id={id}
          className="w-full h-full flex items-center justify-center py-2 px-3 text-gray-400"
          style={{ minHeight: Math.min(height, 60) }}
        >
          <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        </div>
      ) : (
        <div
          id={id}
          className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-gray-500"
          style={{ minHeight: height }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#ae1bd8]/80">{label}</span>
          <span className="text-[10px] mt-1 opacity-80">{width} × {height}</span>
        </div>
      )}
    </motion.div>
  );
}
