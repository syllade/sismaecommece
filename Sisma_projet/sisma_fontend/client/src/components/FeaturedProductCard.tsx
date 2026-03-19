import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Star, Sparkles, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { hasRequiredVariants } from "@/data/variants";
import type { Product } from "@shared/schema";
import { ProductShopLink } from "@/components/ProductShopLink";
import { SponsoredBadge } from "@/components/SponsoredBadge";
import { trackSponsoredClick, useSponsoredImpression } from "@/hooks/use-sponsored-tracking";

interface FeaturedProductCardProps {
  product: Product;
  index?: number;
}

export function FeaturedProductCard({ product, index = 0 }: FeaturedProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });
  const campaignId = Number((product as any).sponsored_campaign_id || (product as any).campaign_id || 0) || undefined;
  const isSponsored = Boolean((product as any).is_sponsored || campaignId);
  const impressionRef = useSponsoredImpression(campaignId, product.id);
  const trackClick = () => trackSponsoredClick(campaignId, product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsVariants) return;
    trackClick();
    addItem(product);
    toast({
      title: "Ajouté au panier",
      description: `${product.name} a été ajouté.`,
      duration: 2000,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsVariants) return;
    trackClick();
    setLocation(`/checkout?direct=1&productId=${product.id}`);
    toast({
      title: "Achat rapide",
      description: `${product.name} - ${discountedPrice.toLocaleString("fr-FR")} FCFA`,
      duration: 2000,
    });
  };

  const hasDiscount = (product as any).discountPercentage && (product as any).discountPercentage > 0;
  const discountPercentage = (product as any).discountPercentage || 0;
  const discountedPrice = hasDiscount
    ? Math.round(product.price * (1 - discountPercentage / 100))
    : product.price;
  const rating = Number((product as any).rating || (product as any).averageRating || 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      ref={impressionRef}
      className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl overflow-hidden border-2 border-gray-100 hover:border-primary/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
    >
      {/* Badge "Vedette" */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Vedette</span>
      </div>

      {isSponsored && (
        <div className="absolute top-4 right-4 z-20">
          <SponsoredBadge tone="solid" />
        </div>
      )}

      {/* Badge de réduction si applicable */}
      {hasDiscount && (
        <div className={`absolute ${isSponsored ? "top-14" : "top-4"} right-4 z-20 bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg`}>
          <span className="text-xs font-bold">-{discountPercentage}%</span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <motion.img
          src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          whileHover={{ scale: 1.1 }}
        />

        {/* Overlay avec actions au survol */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-3">
          <Link
            href={`/product/${product.id}`}
            onClick={trackClick}
            className="px-4 py-2 bg-white text-gray-900 rounded-full hover:bg-primary hover:text-white transition-colors transform hover:scale-110 font-semibold text-sm"
          >
            Voir détails
          </Link>
          {needsVariants ? (
            <Link
              href={`/product/${product.id}`}
              onClick={trackClick}
              className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors transform hover:scale-110 font-semibold text-sm flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Choisir options
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors transform hover:scale-110 font-semibold text-sm flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>

        {/* Note avec étoiles */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-bold text-gray-900">{rating > 0 ? rating.toFixed(1) : "—"}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Link href={`/product/${product.id}`} onClick={trackClick} className="block">
          <h3 className="font-display font-bold text-xl text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <ProductShopLink
          product={product}
          showIcon
          className="mb-3 text-sm text-gray-500 hover:text-primary"
        />

        {/* Prix */}
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl text-primary">
                    {discountedPrice.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <span className="text-sm text-gray-500 line-through">
                  {product.price.toLocaleString("fr-FR")} FCFA
                </span>
              </>
            ) : (
              <span className="font-extrabold text-2xl text-primary">
                {product.price.toLocaleString("fr-FR")} FCFA
              </span>
            )}
          </div>
        </div>

        {/* Bouton CTA */}
        {needsVariants ? (
          <Link
            href={`/product/${product.id}`}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105"
          >
            <span>Choisir options</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <button
            onClick={handleBuyNow}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105"
          >
            <span>Acheter maintenant</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Effet de brillance au survol */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
        animate={{
          x: ["-200%", "200%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    </motion.div>
  );
}

