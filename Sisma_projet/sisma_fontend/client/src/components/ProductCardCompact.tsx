import type { Product, Category } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { hasRequiredVariants } from "@/data/variants";
import { Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { SponsoredBadge } from "@/components/SponsoredBadge";
import { ProductShopLink } from "@/components/ProductShopLink";
import { trackSponsoredClick, useSponsoredImpression } from "@/hooks/use-sponsored-tracking";

interface ProductCardCompactProps {
  product: Product & { category?: Category; discountPercentage?: number };
  index?: number;
}

export function ProductCardCompact({ product, index = 0 }: ProductCardCompactProps) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const discount = (product as any).discount || (product as any).discountPercentage || 0;
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? Math.round(product.price * (1 - discount / 100))
    : product.price;
  const rating = Number((product as any).rating || (product as any).averageRating || 0);
  const reviewCount = Number((product as any).reviewCount || (product as any).reviews_count || 0);
  const campaignId = Number((product as any).sponsored_campaign_id || (product as any).campaign_id || 0) || undefined;
  const isSponsored = Boolean((product as any).is_sponsored || campaignId);
  const impressionRef = useSponsoredImpression(campaignId, product.id);
  const trackClick = () => trackSponsoredClick(campaignId, product.id);

  const formatPrice = (value: number) =>
    Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsVariants) return;
    trackClick();
    addItem(product);
    toast({
      title: "Ajouté au panier",
      description: `${product.name} ajouté.`,
      duration: 2000,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsVariants) {
      setLocation(`/product/${(product as any).slug ?? product.id}`);
      return;
    }
    trackClick();
    setLocation(`/checkout?direct=1&productId=${product.id}`);
    toast({
      title: "Achat rapide",
      description: `${product.name} - ${discountedPrice.toLocaleString("fr-FR")} FCFA`,
      duration: 2000,
    });
  };

  const productImage = Array.isArray((product as any).images) && (product as any).images.length > 0
    ? (product as any).images[0]
    : product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.03,
        type: "spring",
        stiffness: 320,
        damping: 26,
      }}
      whileHover={{
        y: -10,
        boxShadow: "0 20px 50px -16px rgba(174, 27, 216, 0.35)",
        transition: { type: "spring", stiffness: 400, damping: 28 },
      }}
      whileTap={{ scale: 0.98 }}
      ref={impressionRef}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-md hover:shadow-[0_20px_50px_-16px_rgba(174,27,216,0.35)] hover:border-[#ae1bd8]/25 relative w-full min-w-0 max-w-full flex flex-col transition-shadow duration-300"
    >
      {/* Badge réduction — pulse léger */}
      {hasDiscount && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.03 + 0.12, type: "spring", stiffness: 280 }}
          className="absolute top-2 left-2 z-10"
        >
          <motion.span
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-md bg-gradient-to-r from-[#cf046d] to-[#ae1bd8]"
          >
            -{discount}%
          </motion.span>
        </motion.div>
      )}

      {isSponsored && (
        <div className="absolute top-2 right-2 z-10">
          <SponsoredBadge tone="light" />
        </div>
      )}

      {/* Image - zoom au survol */}
      <Link
        href={`/product/${(product as any).slug ?? product.id}`}
        onClick={() => {
          trackClick();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="min-w-0 flex-shrink-0 block overflow-hidden"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50 min-h-0 w-full">
          <motion.img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-contain p-3 sm:p-4"
            loading="lazy"
            whileHover={{ scale: 1.12 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          />
        </div>
      </Link>

      <div className="p-3 sm:p-3.5 md:p-4 flex flex-col flex-1 min-w-0">
        <Link
          href={`/product/${(product as any).slug ?? product.id}`}
          onClick={() => {
            trackClick();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="min-w-0 block"
        >
          <motion.h3
            className="font-semibold text-[10px] sm:text-xs text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-[#ae1bd8] transition-colors break-words"
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {product.name}
          </motion.h3>
        </Link>
        <ProductShopLink
          product={product}
          showIcon
          className="mb-1 text-[10px] sm:text-[11px] text-gray-500 hover:text-[#ae1bd8]"
        />

        {rating > 0 && (
          <motion.div
            className="flex items-center gap-0.5 mb-1 sm:mb-1.5 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0"
                fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                stroke={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
                strokeWidth={2}
              />
            ))}
            <span className="text-gray-400 text-[9px] sm:text-[10px] ml-0.5 sm:ml-1">
              {rating.toFixed(1)}
              {reviewCount > 0 ? ` (${reviewCount})` : ""}
            </span>
          </motion.div>
        )}

        <div className="mb-1.5 sm:mb-2 flex flex-wrap items-baseline gap-1.5 min-w-0">
          {hasDiscount && (
            <span className="text-gray-400 line-through text-[9px] sm:text-[10px]">
              {formatPrice(product.price)} FCFA
            </span>
          )}
          <span className="font-bold text-gray-900 text-[10px] sm:text-xs md:text-sm">
            {formatPrice(discountedPrice)} FCFA
          </span>
        </div>

        {needsVariants ? (
          <Link href={`/product/${(product as any).slug ?? product.id}`}>
            <motion.div
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(174, 27, 216, 0.45)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="w-full min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 px-3 rounded-xl text-white font-bold text-[10px] sm:text-[10px] uppercase flex items-center justify-center gap-1.5 shadow-md transition-shadow duration-300 flex-shrink-0 mt-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ae1bd8] focus-visible:ring-offset-2"
              style={{ background: "linear-gradient(90deg, #ae1bd8, #cf046d)" }}
            >
              <span>Choisir options</span>
              <motion.span whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
              </motion.span>
            </motion.div>
          </Link>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(174, 27, 216, 0.45)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={handleBuyNow}
            className="w-full min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 px-3 rounded-xl text-white font-bold text-[10px] sm:text-[10px] uppercase flex items-center justify-center gap-1.5 shadow-md transition-shadow duration-300 flex-shrink-0 mt-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ae1bd8] focus-visible:ring-offset-2"
            style={{ background: "linear-gradient(90deg, #ae1bd8, #cf046d)" }}
          >
            <span>Acheter maintenant</span>
            <motion.span whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
            </motion.span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
