import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageSliderProps {
  images: string[];
  productName: string;
  hasDiscount: boolean;
  discount: number;
  category?: any;
}

const SWIPE_THRESHOLD = 50;

export function ProductImageSlider({ images, productName, hasDiscount, discount, category }: ProductImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) prevImage();
      else nextImage();
    }
    setTouchStart(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-gray-100 shadow-xl touch-pan-y group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      whileHover={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
    >
      {/* Badge de réduction — léger mouvement pour attirer l'œil */}
      {hasDiscount && (
        <motion.div
          className="absolute top-4 right-4 md:top-6 md:right-6 z-20 bg-red-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 shadow-lg"
          initial={false}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
        >
          <span className="text-xs md:text-sm font-bold">-{discount}%</span>
        </motion.div>
      )}

      {/* Badge catégorie */}
      {category && (
        <span className="absolute top-4 left-4 md:top-6 md:left-6 z-20 bg-white/95 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg border border-gray-100">
          {category.name}
        </span>
      )}

      {/* Conteneur image avec zoom au survol (desktop) */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="absolute inset-0 w-full h-full"
          >
            <motion.img
              src={images[currentIndex]}
              alt={`${productName} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Boutons navigation — feedback tactile */}
      {images.length > 1 && (
        <>
          <motion.button
            type="button"
            onClick={prevImage}
            whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,1)" }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center z-10"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <motion.button
            type="button"
            onClick={nextImage}
            whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,1)" }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center z-10"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </motion.button>
        </>
      )}

      {/* Indicateurs — points qui s’animent (actif = plus large) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {images.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                whileTap={{ scale: 0.9 }}
              >
                <motion.span
                  className="block h-1.5 rounded-full bg-white shadow-sm"
                  animate={{
                    width: isActive ? 24 : 6,
                    opacity: isActive ? 1 : 0.6,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

