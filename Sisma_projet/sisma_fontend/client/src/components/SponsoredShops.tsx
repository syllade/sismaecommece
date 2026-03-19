import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, CheckCircle, ArrowRight, Store } from "lucide-react";
import { useSponsoredSuppliers } from "@/hooks/use-sponsored";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function SponsoredShops() {
  const { data: suppliers, isLoading, error } = useSponsoredSuppliers(6);

  if (isLoading) {
    return (
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide px-1 -mx-1 snap-x snap-mandatory sm:snap-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="shrink-0 w-32 sm:w-32 animate-pulse snap-start">
            <div className="aspect-square bg-gray-200 rounded-2xl mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !suppliers || suppliers.length === 0) {
    return null;
  }

  return (
    <motion.div 
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide px-1 -mx-1 snap-x snap-mandatory sm:snap-none"
    >
      {suppliers.map((supplier, index) => (
        <motion.div
          key={supplier.id}
          variants={fadeUp}
          custom={index * 0.1}
          className="shrink-0 w-32 sm:w-40 snap-start"
        >
          <Link 
            href={`/shop/${supplier.id}`}
            className="block group"
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 text-center hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              {/* Logo */}
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3">
                <img
                  src={supplier.logo || "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=200"}
                  alt={supplier.name}
                  className="w-full h-full object-cover rounded-full border-2 border-gray-100 group-hover:border-primary transition-colors"
                />
                {supplier.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Nom - truncué sur mobile */}
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 truncate group-hover:text-primary transition-colors">
                {supplier.name}
              </h3>

              {/* Note et produits */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">
                {supplier.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-400 fill-yellow-400" />
                    <span>{supplier.rating.toFixed(1)}</span>
                  </div>
                )}
                <span>•</span>
                <span>{supplier.product_count}</span>
              </div>

              {/* Badge sponsorisé */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] sm:text-xs font-medium rounded-full">
                <Store className="w-2 h-2 sm:w-3 sm:h-3" />
                <span>Sponsorisé</span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}

      {/* Bouton voir plus */}
      <motion.div variants={fadeUp} custom={suppliers.length * 0.1} className="shrink-0 w-32 sm:w-40 snap-start">
        <Link 
          href="/shops"
          className="block h-full"
        >
          <div className="h-full min-h-[140px] sm:min-h-[180px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-3 sm:p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors group">
            <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-primary mb-2" />
            <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-primary text-center">
              Voir toutes
            </span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default SponsoredShops;
