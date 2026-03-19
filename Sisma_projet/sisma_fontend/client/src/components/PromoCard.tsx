import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Tag, TrendingUp } from "lucide-react";
import type { Product } from "@shared/schema";

interface PromoCardProps {
  product: Product;
  discountPercentage: number;
  index?: number;
}

export function PromoCard({ product, discountPercentage, index = 0 }: PromoCardProps) {
  const discountedPrice = Math.round(product.price * (1 - discountPercentage / 100));
  const savings = product.price - discountedPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 md:p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]"
    >
      {/* Effet de brillance animé */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        animate={{
          x: ["-200%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut",
        }}
      />

      {/* Éléments décoratifs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Image du produit */}
        <div className="relative flex-shrink-0">
          <motion.div
            whileHover={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5 }}
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl"
          >
            <img
              src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Badge de réduction animé */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg border-2 border-white"
            >
              <Tag className="w-3 h-3" />
              <span className="text-xs font-bold">-{discountPercentage}%</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Contenu */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 justify-center md:justify-start mb-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-yellow-300">
              Promotion Flash
            </span>
          </motion.div>

          <h3 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">
            {product.name}
          </h3>

          <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 md:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-yellow-300">
                {discountedPrice.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-sm text-white/70 line-through">
                {product.price.toLocaleString("fr-FR")} FCFA
              </span>
              <span className="text-xs text-yellow-300 font-semibold">
                Économisez {savings.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>

          <Link
            href={`/product/${product.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-yellow-300 hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105"
          >
            <span>Voir l'offre</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Compteur de temps limité (optionnel) */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-white/80"
      >
        <TrendingUp className="w-3 h-3" />
        <span>Offre limitée</span>
      </motion.div>
    </motion.div>
  );
}

