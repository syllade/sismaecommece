import { motion } from "framer-motion";
import { Truck, Lock, RefreshCw, Headphones } from "lucide-react";

const ITEMS = [
  { text: "Livraison rapide", icon: Truck },
  { text: "Paiement sécurisé", icon: Lock },
  { text: "Satisfait ou remboursé", icon: RefreshCw },
  { text: "Service client à l'écoute", icon: Headphones },
];

/** Mini-bannière de confiance : icônes avec hover/pulse léger, messages courts */
export function TrustMiniBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
    >
      {ITEMS.map(({ text, icon: Icon }, i) => (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white/95 px-5 py-4 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <motion.span
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#ae1bd8]/10 flex items-center justify-center"
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className="w-5 h-5 text-[#ae1bd8]" />
          </motion.span>
          <span className="text-sm font-medium text-gray-700">{text}</span>
        </motion.div>
      ))}
    </motion.section>
  );
}
