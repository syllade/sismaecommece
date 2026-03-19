import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

const SLIDES = [
  {
    id: "promo",
    title: "Promotions du moment",
    subtitle: "Jusqu'à -30% sur une sélection d'articles",
    cta: "Découvrir",
    href: "/products",
    gradient: "linear-gradient(135deg, #f5f0ff 0%, #ede9fe 50%, #e9d5ff 100%)",
    accent: "#ae1bd8",
  },
  {
    id: "new",
    title: "Nouveautés",
    subtitle: "Les dernières arrivées, rien que pour vous",
    cta: "Voir l'offre",
    href: "/products",
    gradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #f5d0fe 100%)",
    accent: "#cf046d",
  },
  {
    id: "sale",
    title: "Soldes -10% à -30%",
    subtitle: "Profitez des meilleurs prix sur tout le catalogue",
    cta: "Voir l'offre",
    href: "/products",
    gradient: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 50%, #f5d0fe 100%)",
    accent: "#ae1bd8",
  },
];

const DURATION_MS = 5000;

/** Hero Slider catalogue : 3 slides, CTA Découvrir / Voir l'offre, transition douce */
export function CatalogueHeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), DURATION_MS);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
      <div className="relative min-h-[180px] sm:min-h-[200px] md:min-h-[220px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex items-center px-6 sm:px-8 md:px-12"
            style={{ background: slide.gradient }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full max-w-4xl">
              <div className="flex items-center gap-4">
                <span
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${slide.accent}20` }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: slide.accent }} />
                </span>
                <div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-gray-900 tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-gray-600 text-sm mt-0.5">{slide.subtitle}</p>
                </div>
              </div>
              <Link href={slide.href}>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${slide.accent}40` }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-shadow"
                  style={{ background: slide.accent }}
                >
                  {slide.cta}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flèches */}
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-all z-10"
          aria-label="Slide précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-all z-10"
          aria-label="Slide suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Points indicateurs */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === index ? "bg-[#ae1bd8] scale-110" : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
