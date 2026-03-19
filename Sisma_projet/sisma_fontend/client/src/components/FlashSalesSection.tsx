import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { hasRequiredVariants } from "@/data/variants";
import { SponsoredBadge } from "@/components/SponsoredBadge";
import { trackSponsoredClick, useSponsoredImpression } from "@/hooks/use-sponsored-tracking";

interface FlashSalesSectionProps {
  products: Product[];
}

function FlashSaleCard({
  product,
  index,
  onBuyNow,
}: {
  product: Product & { discountPercentage?: number; discount?: number };
  index: number;
  onBuyNow: (product: Product) => void;
}) {
  const discount = (product as any).discountPercentage || (product as any).discount || 0;
  const discountedPrice = Math.round(product.price * (1 - discount / 100));
  const img = Array.isArray((product as any).images) && (product as any).images.length > 0
    ? (product as any).images[0]
    : product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400";
  const stockLeft = Math.floor(Math.random() * 20) + 5;
  const stockPercent = Math.min(100, (stockLeft / 25) * 100);
  const campaignId = Number((product as any).sponsored_campaign_id || (product as any).campaign_id || 0) || undefined;
  const isSponsored = Boolean((product as any).is_sponsored || campaignId);
  const impressionRef = useSponsoredImpression(campaignId, product.id);
  const trackClick = () => trackSponsoredClick(campaignId, product.id);

  return (
    <motion.div
      ref={impressionRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6, boxShadow: "0 12px 24px rgba(0,0,0,0.12)" }}
      className="flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] bg-white rounded-xl border border-gray-100 shadow-md overflow-hidden transition-shadow duration-300"
    >
      <Link href={`/product/${product.id}`} onClick={trackClick}>
        <div className="relative aspect-square bg-gray-50">
          <img src={img} alt={product.name} className="w-full h-full object-contain p-4" />
          {discount > 0 && (
            <motion.div
              className={`absolute top-2 left-2 ${isSponsored ? "top-10" : "top-2"} bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, delay: index * 0.05 + 0.2 }}
            >
              -{discount}%
            </motion.div>
          )}
          {isSponsored && (
            <div className="absolute top-2 left-2">
              <SponsoredBadge tone="light" />
            </div>
          )}
        </div>
      </Link>
      {discount > 0 && (
        <div className="bg-gray-800 text-white text-xs font-bold py-1.5 px-2 text-center rounded-b-lg">
          -{discount}%
        </div>
      )}
      <div className="p-3">
        <Link href={`/product/${product.id}`} onClick={trackClick}>
          <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1.5 hover:text-violet-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-sm text-gray-900">
            {discountedPrice.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
        {discount > 0 && (
          <span className="text-gray-400 line-through text-xs">
            {product.price.toLocaleString("fr-FR")} FCFA
          </span>
        )}
        <p className="text-gray-500 text-[10px] mt-2">{stockLeft} articles restants</p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stockPercent}%` }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          />
        </div>
        <button
          onClick={() => {
            trackClick();
            onBuyNow(product);
          }}
          className="mt-3 w-full h-8 rounded-lg bg-orange-500 text-white text-[11px] font-bold hover:bg-orange-600 transition-colors"
        >
          Acheter maintenant
        </button>
      </div>
    </motion.div>
  );
}

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h : ${m.toString().padStart(2, "0")}m : ${s.toString().padStart(2, "0")}s`;
}

export function FlashSalesSection({ products }: FlashSalesSectionProps) {
  const [countdown, setCountdown] = useState(13 * 3600 + 23 * 60 + 9); // 13h 23m 09s
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (products.length === 0) return null;

  const handleBuyNow = (product: any) => {
    const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });
    if (needsVariants) {
      setLocation(`/product/${product.slug ?? product.id}`);
      return;
    }
    setLocation(`/checkout?direct=1&productId=${product.id}`);
    toast({ title: "Achat rapide", description: product.name, duration: 2000 });
  };

  return (
    <section className="relative pt-0 pb-6 md:pb-8 overflow-hidden bg-white">
      {/* Bandeau Ventes Flash collé à la navbar - avec animations pub */}
      <motion.div
        className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 md:py-4">
            {/* Icône éclair + texte - animation pulse sur l'éclair */}
            <div className="flex items-center gap-2">
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <Zap className="w-5 h-5 text-yellow-300 shrink-0 drop-shadow-md" />
              </motion.span>
              <motion.span
                className="font-bold text-sm md:text-base uppercase tracking-wide"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                Ventes Flash | Chaque jour
              </motion.span>
            </div>
            {/* Compte à rebours - boîte qui pulse pour attirer l'œil */}
            <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
              <span className="text-white/90">Termine dans :</span>
              <motion.span
                className="font-mono bg-white/25 px-3 py-1.5 rounded-lg font-bold min-w-[120px] text-center"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(255,255,255,0.3)",
                    "0 0 12px 2px rgba(255,255,255,0.4)",
                    "0 0 0 0 rgba(255,255,255,0.3)",
                  ],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                {formatCountdown(countdown)}
              </motion.span>
            </div>
            {/* Voir plus - animation au survol */}
            <Link href="/products">
              <motion.span
                className="inline-flex items-center gap-1 font-bold text-sm md:text-base cursor-pointer"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Voir plus
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Cartes produits en défilement horizontal */}
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl mt-6">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {products.slice(0, 6).map((product: any, index: number) => (
            <FlashSaleCard
              key={product.id}
              product={product}
              index={index}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>

        {/* Bouton Découvrez - animation type Jumia */}
        <div className="text-center mt-6">
          <Link href="/products">
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 8px 24px rgba(174, 27, 216, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm uppercase tracking-wide shadow-lg transition-all duration-300"
              style={{ background: "linear-gradient(90deg, #ae1bd8, #cf046d)" }}
            >
              Découvrez
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </motion.span>
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
}
