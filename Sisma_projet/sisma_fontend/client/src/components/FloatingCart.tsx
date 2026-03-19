import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function FloatingCart() {
  const items = useCart((state) => state.items);
  const total = useCart((state) => state.total());
  const [showBadge, setShowBadge] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Afficher le badge avec animation quand un item est ajouté
  useEffect(() => {
    if (itemCount > 0) {
      setShowBadge(true);
      const timer = setTimeout(() => setShowBadge(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <Link href="/cart">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative bg-primary text-white p-4 rounded-full shadow-2xl hover:shadow-primary/50 transition-shadow"
        >
          <ShoppingBag className="w-6 h-6" />
          
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </motion.div>
            )}
          </AnimatePresence>

          {showBadge && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-12 right-0 bg-gray-900 text-white text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
            >
              {total.toLocaleString('fr-FR')} FCFA
              <div className="absolute bottom-0 right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </Link>
  );
}

