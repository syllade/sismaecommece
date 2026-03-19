import type { Product, Category } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { hasRequiredVariants } from "@/data/variants";
import { ShoppingBag, Eye, Share2, Tag, Zap, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { FaWhatsapp, FaTiktok, FaFacebook } from "react-icons/fa";
import { SponsoredBadge } from "@/components/SponsoredBadge";
import { ProductShopLink } from "@/components/ProductShopLink";
import { trackSponsoredClick, useSponsoredImpression } from "@/hooks/use-sponsored-tracking";

interface ProductCardHomeProps {
  product: Product & { category?: Category; discountPercentage?: number };
}

export function ProductCardHome({ product }: ProductCardHomeProps) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Calcul du prix réduit
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
  const discountedPrice = hasDiscount
    ? Math.round(product.price * (1 - product.discountPercentage! / 100))
    : product.price;
  const rating = Number((product as any).rating || (product as any).averageRating || 0);
  const reviewCount = Number((product as any).reviewCount || (product as any).reviews_count || 0);
  const campaignId = Number((product as any).sponsored_campaign_id || (product as any).campaign_id || 0) || undefined;
  const isSponsored = Boolean((product as any).is_sponsored || campaignId);
  const impressionRef = useSponsoredImpression(campaignId, product.id);
  const trackClick = () => trackSponsoredClick(campaignId, product.id);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu]);

  const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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
    if (needsVariants) {
      setLocation(`/product/${product.id}`);
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

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/product/${product.id}` : "";
  const shareText = `Découvrez ${product.name} sur SISMA Marketplace - ${discountedPrice.toLocaleString("fr-FR")} FCFA${hasDiscount ? ` (${product.discountPercentage}% de réduction!)` : ""}`;

  const handleShare = (platform: "whatsapp" | "facebook" | "tiktok") => {
    let url = "";
    
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case "tiktok":
        // TikTok n'a pas de partage direct, on copie le lien
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Lien copié !",
          description: "Le lien du produit a été copié dans le presse-papiers.",
          duration: 2000,
        });
        setShowShareMenu(false);
        return;
    }
    
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      ref={impressionRef}
      className="group bg-white rounded-2xl  overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative"
    >
      {/* Badge de réduction en haut à droite */}
      {hasDiscount && (
        <div className="absolute top-3 right-3 z-20 bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <Tag className="w-3 h-3" />
          <span className="text-xs font-bold">-{product.discountPercentage}%</span>
        </div>
      )}

      {isSponsored && (
        <div className="absolute top-3 left-3 z-20">
          <SponsoredBadge tone="light" />
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img 
          src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"} 
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Quick Actions avec partage */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Link 
            href={`/product/${product.id}`} 
            onClick={trackClick}
            className="p-3 bg-white text-gray-900 rounded-full hover:bg-primary hover:text-white transition-colors transform hover:scale-110"
          >
            <Eye className="w-5 h-5" />
          </Link>
          {needsVariants ? (
            <Link
              href={`/product/${product.id}`}
              className="p-3 bg-white text-gray-900 rounded-full hover:bg-primary hover:text-white transition-colors transform hover:scale-110"
              title="Choisir couleur et/ou taille"
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="p-3 bg-white text-gray-900 rounded-full hover:bg-primary hover:text-white transition-colors transform hover:scale-110"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
          )}
          
          {/* Bouton partage */}
          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-3 bg-white text-gray-900 rounded-full hover:bg-primary hover:text-white transition-colors transform hover:scale-110"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Menu de partage */}
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-0 top-14 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 min-w-[180px] z-20"
              >
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors text-left"
                >
                  <FaWhatsapp className="w-5 h-5 text-[#25D366]" />
                  <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <FaFacebook className="w-5 h-5 text-[#1877F2]" />
                  <span className="text-sm font-medium text-gray-700">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare("tiktok")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <FaTiktok className="w-5 h-5 text-black" />
                  <span className="text-sm font-medium text-gray-700">Copier le lien</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Badge catégorie */}
        {product.category && (
          <span
            className={`absolute ${isSponsored ? "top-12" : "top-3"} left-3 bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider text-gray-800`}
          >
            {product.category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <Link href={`/product/${product.id}`} onClick={trackClick} className="block">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <ProductShopLink
          product={product}
          showIcon
          className="mb-1.5 text-xs text-gray-500 hover:text-primary"
        />
        {rating > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-3 h-3"
                  fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                  stroke={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
                />
              ))}
            </div>
            {reviewCount > 0 && <span>({reviewCount})</span>}
          </div>
        )}
        <div className="flex items-baseline justify-between mt-2 gap-2">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-primary">
                    {discountedPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <span className="text-sm text-gray-500 line-through">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </span>
              </>
            ) : (
              <span className="font-bold text-xl text-primary">
                {product.price.toLocaleString('fr-FR')} FCFA
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          {needsVariants ? (
            <Link href={`/product/${product.id}`}>
              <button className="w-full bg-primary text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group">
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Choisir options
              </button>
            </Link>
          ) : (
            <button
              onClick={handleBuyNow}
              className="w-full bg-primary text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group"
            >
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Acheter maintenant
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
