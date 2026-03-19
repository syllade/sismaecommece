import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Star, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";

interface PromoSliderProps {
  products: Product[];
}

export function PromoSlider({ products }: PromoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products.length]);

  if (products.length === 0) return null;

  const currentProduct = products[currentIndex];
  const discount = (currentProduct as any).discountPercentage || (currentProduct as any).discount || 0;
  const discountedPrice = Math.round(currentProduct.price * (1 - discount / 100));
  const currentImage = Array.isArray((currentProduct as any).images) && (currentProduct as any).images.length > 0
    ? (currentProduct as any).images[0]
    : currentProduct.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600";

  return (
    <section className="relative py-12 md:py-16 overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* En-tête de section professionnel */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Promotions
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 tracking-tight">
              Produits en promotion
            </h2>
            <p className="text-gray-500 text-sm mt-1 max-w-md">
              Découvrez nos offres du moment, sélectionnées pour vous.
            </p>
          </div>
          {products.length > 1 && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span className="font-medium text-gray-700">{currentIndex + 1}</span>
              <span>/</span>
              <span>{products.length}</span>
            </div>
          )}
        </div>

        {/* Carte produit principale */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_12px_48px_-12px_rgba(124,58,237,0.08)]"
            >
              <div className="flex flex-col md:flex-row md:min-h-[340px]">
                {/* Bloc image avec infos */}
                <Link
                  href={`/product/${currentProduct.id}`}
                  className="relative flex-shrink-0 w-full md:w-[42%] aspect-square md:aspect-auto md:min-h-[340px] bg-gray-50 flex items-center justify-center"
                >
                  <img
                    src={currentImage}
                    alt={currentProduct.name}
                    className="w-full h-full object-contain p-8 md:p-10"
                  />
                  {discount > 0 && (
                    <div
                      className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                      −{discount}%
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900/70 to-transparent flex items-end p-3">
                    <span className="text-white text-sm font-semibold line-clamp-1 drop-shadow-sm">
                      {currentProduct.name}
                    </span>
                  </div>
                </Link>

                {/* Contenu */}
                <div className="flex-1 flex flex-col justify-center p-6 md:p-8 lg:p-10">
                  <h3 className="font-display font-bold text-xl md:text-2xl text-gray-900 tracking-tight mb-3 line-clamp-2">
                    {currentProduct.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-gray-400 text-sm ml-2">4.0</span>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-5 line-clamp-3">
                    {(currentProduct as any).description || "Produit de qualité, livraison rapide."}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-3 mb-6">
                    {discount > 0 && (
                      <span className="text-gray-400 line-through text-sm">
                        {currentProduct.price.toLocaleString("fr-FR")} FCFA
                      </span>
                    )}
                    <span className="font-bold text-2xl text-gray-900">
                      {discountedPrice.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <Link href={`/product/${currentProduct.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                      style={{ background: "linear-gradient(90deg, #6d28d9, #7c3aed)" }}
                    >
                      Voir l&apos;offre
                      <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation prev/next */}
          {products.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 shadow-md border border-gray-100 hover:bg-white hover:shadow-lg flex items-center justify-center z-20 text-gray-600 hover:text-gray-900 transition-all duration-200"
                aria-label="Produit précédent"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % products.length)}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 shadow-md border border-gray-100 hover:bg-white hover:shadow-lg flex items-center justify-center z-20 text-gray-600 hover:text-gray-900 transition-all duration-200"
                aria-label="Produit suivant"
              >
                <ArrowRight className="w-5 h-5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
