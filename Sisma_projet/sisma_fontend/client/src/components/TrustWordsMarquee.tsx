import { motion } from "framer-motion";
import { Truck, Shield, RefreshCw, Headphones, BadgeCheck, Lock } from "lucide-react";

const TRUST_WORDS = [
  { text: "Livraison gratuite", icon: Truck },
  { text: "Paiement sécurisé", icon: Lock },
  { text: "Satisfait ou remboursé", icon: RefreshCw },
  { text: "Retours faciles", icon: BadgeCheck },
  { text: "Service client 7j/7", icon: Headphones },
  { text: "Qualité garantie", icon: Shield },
];

/** Bande défilante de mots de confiance (marquee) avec icônes */
export function TrustWordsMarquee() {
  const duplicated = [...TRUST_WORDS, ...TRUST_WORDS];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-xl border border-gray-200/80 bg-white/95 py-2.5 mb-4"
    >
      <div className="flex w-max animate-trust-scroll">
        {duplicated.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.text}-${index}`}
              className="flex items-center gap-2 mx-6 shrink-0 text-gray-700"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ae1bd8]/10 text-[#ae1bd8]">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">{item.text}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes trust-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-trust-scroll {
          animation: trust-scroll 25s linear infinite;
        }
        .animate-trust-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </motion.div>
  );
}
