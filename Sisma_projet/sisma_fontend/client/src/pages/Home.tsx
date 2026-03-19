import { useProducts, useCategories } from "@/hooks/use-products";
import { useSuppliers } from "@/hooks/use-suppliers";
import { slugifyCategory } from "@/hooks/use-marketplace";
import { useTestimonials } from "@/hooks/use-testimonials";
import { SupplierSection } from "@/components/SupplierSection";
import { SponsoredShops } from "@/components/SponsoredShops";
import { MemberBenefitsSection } from "@/components/MemberBenefitsSection";
import { ProductShopLink } from "@/components/ProductShopLink";
import { MarqueeCredibility } from "@/components/MarqueeCredibility";
import { BannerPromoDefilant } from "@/components/BannerPromoDefilant";
import { SocialSubscribe } from "@/components/SocialSubscribe";
import {
  Star, Quote, Truck, ShieldCheck, RefreshCw, Headphones,
  ChevronRight, ChevronLeft, Zap, Share2, ShoppingCart,
  Heart, Check, Tag, TrendingUp, Clock,
} from "lucide-react";
import { FaWhatsapp, FaFacebook } from "react-icons/fa";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { hasRequiredVariants } from "@/data/variants";

// ─── SISMA PALETTE ───────────────────────────────────────────────────────────
const S = {
  red:      "#D81918",
  redDark:  "#A01010",
  orange:   "#F7941D",
  orangeAlt:"#E8820A",
};

// Dégradé principal Sisma
const GRAD = `linear-gradient(135deg, ${S.red}, ${S.orange})`;

// ─── VARIANTS FRAMER-MOTION réutilisables ─────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] } }),
};
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

// ─── BADGE PROMO ─────────────────────────────────────────────────────────────
// Shimmer à l'entrée UNIQUEMENT (une fois), sans boucle — performant & élégant
function PromoBadge({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size];

  return (
    <motion.span
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      className={`relative inline-flex overflow-hidden rounded font-black text-white shadow-sm ${cls}`}
      style={{ background: GRAD }}
    >
      -{value}%
      {/* Shimmer glissant 1 fois à l'entrée — pas de repeat */}
      <motion.span
        className="absolute inset-0 skew-x-12"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)" }}
        initial={{ x: "-100%" }}
        animate={{ x: "260%" }}
        transition={{ duration: 0.65, delay: 0.25, ease: "easeOut" }}
      />
    </motion.span>
  );
}

// ─── CARTE PRODUIT PRINCIPALE ────────────────────────────────────────────────
function ProductCard({ product, index }: { product: any; index: number }) {
  const addItem  = useCart((s) => s.addItem);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [wished, setWished]           = useState(false);
  const [adding, setAdding]           = useState(false);
  const [sharing, setSharing]         = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const discount    = Number(product.discountPercentage || product.discount || 0);
  const price       = Number(product.price);
  const finalPrice  = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const rating      = Number(product.rating || product.averageRating || 0);
  const reviewCount = Number(product.reviewCount || product.reviews_count || 0);
  const isAvailable = product.isAvailable !== false && product.stock !== 0;
  const productUrl  = typeof window !== "undefined"
    ? `${window.location.origin}/product/${product.slug ?? product.id}` : "";
  const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });

  useEffect(() => {
    if (!sharing) return;
    const h = (e: MouseEvent) => { if (!shareRef.current?.contains(e.target as Node)) setSharing(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sharing]);

  const doShare = (p: "whatsapp" | "facebook" | "copy") => {
    setSharing(false);
    const text = `${product.name} – ${finalPrice.toLocaleString("fr-FR")} FCFA`;
    if (p === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${productUrl}`)}`, "_blank");
    else if (p === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(text)}`, "_blank", "width=640,height=480");
    else { navigator.clipboard.writeText(productUrl); toast({ title: "Lien copié !", duration: 1800 }); }
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAvailable) return;
    setAdding(true);
    addItem(product, { quantity: 1 });
    toast({ title: "Ajouté au panier", description: product.name, duration: 2000 });
    await new Promise(r => setTimeout(r, 700));
    setAdding(false);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (needsVariants) {
      setLocation(`/product/${product.slug ?? product.id}`);
      return;
    }
    setLocation(`/checkout?direct=1&productId=${product.id}`);
    toast({ title: "Achat rapide", description: product.name, duration: 2000 });
  };

  return (
    <motion.div
      variants={fadeUp}
      custom={index * 0.04}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8px" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group bg-white border   border-gray-200 rounded-xl overflow-hidden flex flex-col cursor-pointer"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Image */}
      <Link href={`/product/${product.slug ?? product.id}`} className="block relative bg-gray-50 aspect-square overflow-hidden">
        {/* Overlay hover subtil */}
        <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        {/* Badges */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 z-20"><PromoBadge value={discount} /></div>
        )}
        {product.isNew && discount === 0 && (
          <span className="absolute top-2 left-2 z-20 inline-block px-2 py-0.5 text-[10px] font-black text-white rounded bg-emerald-500">
            NOUVEAU
          </span>
        )}
        {product.freeShipping && (
          <span className="absolute top-2 right-8 z-20 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full"
            style={{ background: "#16a34a" }}>
            <Truck className="w-2.5 h-2.5" /> Gratuit
          </span>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWished(v => !v); }}
        >
          <Heart className="w-3.5 h-3.5 transition-colors duration-150"
            fill={wished ? S.red : "none"} stroke={wished ? S.red : "#9ca3af"} />
        </button>

        <img
          src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400"}
          alt={product.name} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Rupture */}
        {!isAvailable && (
          <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>

      {/* Infos */}
      <div className="p-2.5 flex flex-col flex-1">
        <Link href={`/product/${product.slug ?? product.id}`} className="flex-1 block">
          <p className="text-xs text-gray-800 line-clamp-2 mb-1.5 leading-snug font-medium min-h-[2rem]">
            {product.name}
          </p>
          <ProductShopLink
            product={product}
            showIcon
            className="mb-1.5 text-[11px] text-gray-500 hover:text-[#D81918]"
          />

          {/* Étoiles — seulement si note réelle */}
          {rating > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-2.5 h-2.5"
                    fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                    stroke={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"} />
                ))}
              </div>
              {reviewCount > 0 && <span className="text-[10px] text-gray-400">({reviewCount})</span>}
            </div>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-gray-900">
              {finalPrice.toLocaleString("fr-FR")}
              <span className="text-[10px] font-normal text-gray-400 ml-0.5">FCFA</span>
            </span>
            {discount > 0 && (
              <span className="text-[10px] text-gray-400 line-through">{price.toLocaleString("fr-FR")}</span>
            )}
          </div>

          {/* Badge stock réel — seulement si product.stock est un nombre connu */}
          {typeof product.stock === "number" && product.stock > 0 && (
            <div className="mt-1.5">
              {product.stock <= 5 ? (
                <div>
                  <div className="flex items-center justify-between text-[9px] mb-0.5">
                    <span className="text-gray-400">Stock</span>
                    <span className="font-bold" style={{ color: S.red }}>
                      Plus que {product.stock} dispo{product.stock > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%`, background: GRAD }} />
                  </div>
                </div>
              ) : product.stock <= 15 ? (
                <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  Stock limité · {product.stock} restants
                </span>
              ) : (
                <span className="inline-block text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ✓ En stock
                </span>
              )}
            </div>
          )}
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <button
            onClick={addToCart}
            disabled={!isAvailable || adding}
            className="flex-1 h-8 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-all duration-150 disabled:opacity-50 active:scale-95"
            style={{ background: GRAD }}
          >
            {adding
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><ShoppingCart className="w-3 h-3" /> Ajouter</>
            }
          </button>

          <div className="relative" ref={shareRef}>
            <button onClick={() => setSharing(v => !v)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
              <Share2 className="w-3 h-3 text-gray-500" />
            </button>
            <AnimatePresence>
              {sharing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 w-38 min-w-[148px]"
                >
                  <button onClick={() => doShare("whatsapp")} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-green-50 text-xs">
                    <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366] shrink-0" /> WhatsApp
                  </button>
                  <button onClick={() => doShare("facebook")} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-blue-50 text-xs">
                    <FaFacebook className="w-3.5 h-3.5 text-[#1877F2] shrink-0" /> Facebook
                  </button>
                  <button onClick={() => doShare("copy")} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-xs">
                    <Share2 className="w-3.5 h-3.5 text-gray-400 shrink-0" /> Copier le lien
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isAvailable && (
          <div className="mt-2">
            {needsVariants ? (
              <Link href={`/product/${product.slug ?? product.id}`}>
                <button className="w-full h-8 rounded-lg border border-[#f57224] text-[#f57224] text-[11px] font-bold hover:bg-[#f57224]/10 transition-colors">
                  Choisir options
                </button>
              </Link>
            ) : (
              <button
                onClick={handleBuyNow}
                className="w-full h-8 rounded-lg bg-[#f57224] text-white text-[11px] font-bold hover:bg-[#e56614] transition-colors"
              >
                Acheter maintenant
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── MINI CARD pour scroll horizontal catégorie ──────────────────────────────
function MiniCard({ product, index }: { product: any; index: number }) {
  const addItem  = useCart((s) => s.addItem);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [wished, setWished] = useState(false);
  const [adding, setAdding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const discount   = Number(product.discountPercentage || product.discount || 0);
  const price      = Number(product.price);
  const final      = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const rating     = Number(product.rating || product.averageRating || 0);
  const reviews    = Number(product.reviewCount || product.reviews_count || 0);
  const avail      = product.isAvailable !== false && product.stock !== 0;
  const productUrl = typeof window !== "undefined"
    ? `${window.location.origin}/product/${product.slug ?? product.id}` : "";
  const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });

  useEffect(() => {
    if (!sharing) return;
    const h = (e: MouseEvent) => { if (!shareRef.current?.contains(e.target as Node)) setSharing(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sharing]);

  const doShare = (p: "whatsapp" | "facebook" | "copy") => {
    setSharing(false);
    const text = `${product.name} – ${final.toLocaleString("fr-FR")} FCFA`;
    if (p === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${productUrl}`)}`, "_blank");
    else if (p === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(text)}`, "_blank", "width=640,height=480");
    else { navigator.clipboard.writeText(productUrl); toast({ title: "Lien copié !", duration: 1800 }); }
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!avail) return;
    setAdding(true);
    addItem(product, { quantity: 1 });
    toast({ title: "Ajouté au panier", description: product.name, duration: 2000 });
    await new Promise(r => setTimeout(r, 700));
    setAdding(false);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (needsVariants) {
      setLocation(`/product/${product.slug ?? product.id}`);
      return;
    }
    setLocation(`/checkout?direct=1&productId=${product.id}`);
    toast({ title: "Achat rapide", description: product.name, duration: 2000 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.28) }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
      className="group shrink-0 w-[182px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col cursor-pointer"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)", scrollSnapAlign: "start" }}
    >
      <Link href={`/product/${product.slug ?? product.id}`} className="block relative bg-gray-50 aspect-square overflow-hidden">
        <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        {discount > 0 && <div className="absolute top-2 left-2 z-20"><PromoBadge value={discount} /></div>}
        {product.isNew && discount === 0 && (
          <span className="absolute top-2 left-2 z-20 text-[10px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded">
            NOUVEAU
          </span>
        )}

        <button
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWished(v => !v); }}
        >
          <Heart className="w-3 h-3" fill={wished ? S.red : "none"} stroke={wished ? S.red : "#9ca3af"} />
        </button>

        <img
          src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400"}
          alt={product.name} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!avail && (
          <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">Rupture</span>
          </div>
        )}
      </Link>

      <div className="p-2.5 flex flex-col flex-1">
        <Link href={`/product/${product.slug ?? product.id}`} className="flex-1 block">
          <p className="text-xs text-gray-800 line-clamp-2 mb-1.5 leading-snug font-medium min-h-[2rem]">{product.name}</p>
          <ProductShopLink
            product={product}
            className="mb-1 text-[10px] text-gray-500 hover:text-[#D81918]"
          />
          {rating > 0 && (
            <div className="flex items-center gap-0.5 mb-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-2.5 h-2.5"
                  fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                  stroke={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"} />
              ))}
              {reviews > 0 && <span className="text-[10px] text-gray-400 ml-0.5">({reviews})</span>}
            </div>
          )}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-gray-900">
              {final.toLocaleString("fr-FR")}
              <span className="text-[10px] font-normal text-gray-400 ml-0.5">FCFA</span>
            </span>
            {discount > 0 && <span className="text-[10px] text-gray-400 line-through">{price.toLocaleString("fr-FR")}</span>}
          </div>
          {product.freeShipping && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-semibold">
              <Truck className="w-2.5 h-2.5" /> Livraison gratuite
            </div>
          )}

          {/* Badge stock réel */}
          {typeof product.stock === "number" && product.stock > 0 && (
            <div className="mt-1.5">
              {product.stock <= 5 ? (
                <div>
                  <div className="flex items-center justify-between text-[9px] mb-0.5">
                    <span className="text-gray-400">Stock</span>
                    <span className="font-bold" style={{ color: S.red }}>
                      Plus que {product.stock} dispo{product.stock > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%`, background: GRAD }} />
                  </div>
                </div>
              ) : product.stock <= 15 ? (
                <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  Stock limité · {product.stock} restants
                </span>
              ) : (
                <span className="inline-block text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ✓ En stock
                </span>
              )}
            </div>
          )}
        </Link>

        <div className="flex items-center gap-1.5 mt-2">
          <button onClick={addToCart} disabled={!avail || adding}
            className="flex-1 h-8 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50 active:scale-95 transition-transform"
            style={{ background: GRAD }}>
            {adding
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><ShoppingCart className="w-3 h-3" /> {avail ? "Ajouter" : "Indisponible"}</>
            }
          </button>

          <div className="relative" ref={shareRef}>
            <button onClick={() => setSharing(v => !v)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
              <Share2 className="w-3 h-3 text-gray-400" />
            </button>
            <AnimatePresence>
              {sharing && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.14 }}
                  className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 min-w-[148px]">
                  <button onClick={() => doShare("whatsapp")} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-green-50 text-xs">
                    <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp
                  </button>
                  <button onClick={() => doShare("facebook")} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-xs">
                    <FaFacebook className="w-3.5 h-3.5 text-[#1877F2]" /> Facebook
                  </button>
                  <button onClick={() => doShare("copy")} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-xs">
                    <Share2 className="w-3.5 h-3.5 text-gray-400" /> Copier
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {avail && (
          <div className="mt-2">
            {needsVariants ? (
              <Link href={`/product/${product.slug ?? product.id}`}>
                <button className="w-full h-8 rounded-lg border border-[#f57224] text-[#f57224] text-[11px] font-bold hover:bg-[#f57224]/10 transition-colors">
                  Choisir options
                </button>
              </Link>
            ) : (
              <button
                onClick={handleBuyNow}
                className="w-full h-8 rounded-lg bg-[#f57224] text-white text-[11px] font-bold hover:bg-[#e56614] transition-colors"
              >
                Acheter maintenant
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── SECTION CATÉGORIE — premium + partage social ────────────────────────────
// Dégradés de têtes de section : variations rouge→orange, tous dans la charte Sisma
const CAT_THEMES = [
  { from: "#C8160F", to: "#F7941D" },  // rouge → orange chaud
  { from: "#9E0E0E", to: "#D81918" },  // bordeaux → rouge
  { from: "#B51414", to: "#E8700A" },  // rouge intermédiaire → orange foncé
  { from: "#D81918", to: "#C45A00" },  // rouge → marron-orange
  { from: "#A51010", to: "#F7941D" },  // rouge sombre → orange vif
  { from: "#C01A1A", to: "#E87510" },  // rouge moyen → orange doré
];

function CategorySection({
  name, products, href, idx, subtitle, description,
}: {
  name: string; products: any[]; href: string; idx: number;
  subtitle?: string; description?: string;
}) {
  const theme      = CAT_THEMES[idx % CAT_THEMES.length];
  const scrollRef  = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const [shareCat, setShareCat] = useState(false);
  const shareCatRef = useRef<HTMLDivElement>(null);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 8);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 200, behavior: "smooth" });

  useEffect(() => {
    if (!shareCat) return;
    const h = (e: MouseEvent) => { if (!shareCatRef.current?.contains(e.target as Node)) setShareCat(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [shareCat]);

  const catUrl  = typeof window !== "undefined" ? `${window.location.origin}${href}` : href;
  const catText = `Découvrez notre collection "${name}" sur Sisma Shop !`;

  const shareCatFn = (p: "whatsapp" | "facebook" | "copy") => {
    setShareCat(false);
    if (p === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(`${catText}\n${catUrl}`)}`, "_blank");
    else if (p === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(catUrl)}&quote=${encodeURIComponent(catText)}`, "_blank", "width=640,height=480");
    else { navigator.clipboard.writeText(catUrl); }
  };

  if (products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 container mx-auto px-3 max-w-7xl"
    >
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

        {/* ── Header catégorie ── */}
        <div className="relative" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
          {/* Texture — discret, non animé en boucle */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
          {/* Halo décoratif coin droite — statique */}
          <div className="absolute right-0 top-0 w-32 h-full rounded-l-full opacity-10"
            style={{ background: "radial-gradient(circle at right, white, transparent)" }} />

          <div className="relative z-10 flex items-center justify-between px-5 py-3 gap-3">
            {/* Titre */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-[3px] h-5 rounded-full bg-white/75 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-extrabold text-[15px] text-white tracking-wide leading-none truncate">
                  {name}
                </h2>
                {subtitle && (
                  <p className="text-white/55 text-[11px] font-normal mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Actions droite : Partager + Voir plus */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Bouton partage catégorie */}
              <div className="relative" ref={shareCatRef}>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShareCat(v => !v)}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-colors duration-150"
                >
                  <Share2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Partager</span>
                </motion.button>

                <AnimatePresence>
                  {shareCat && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5 z-50 min-w-[160px]"
                    >
                      <p className="text-[10px] text-gray-400 px-2.5 py-1 font-semibold uppercase tracking-wide">
                        Partager la catégorie
                      </p>
                      <button onClick={() => shareCatFn("facebook")}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-blue-50 text-xs font-medium">
                        <FaFacebook className="w-4 h-4 text-[#1877F2] shrink-0" />
                        Partager sur Facebook
                      </button>
                      <button onClick={() => shareCatFn("whatsapp")}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-green-50 text-xs font-medium">
                        <FaWhatsapp className="w-4 h-4 text-[#25D366] shrink-0" />
                        Envoyer sur WhatsApp
                      </button>
                      <button onClick={() => shareCatFn("copy")}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-xs font-medium">
                        <Share2 className="w-4 h-4 text-gray-400 shrink-0" />
                        Copier le lien
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Voir plus */}
              <Link href={href}>
                <motion.div
                  whileHover={{ scale: 1.06, backgroundColor: "rgba(255,255,255,0.3)" }}
                  whileTap={{ scale: 0.94 }}
                  className="flex items-center gap-1 bg-white/20 border border-white/25 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-150"
                >
                  Voir plus <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Zone scroll produits ── */}
        <div className="bg-white relative">
          {/* Flèche gauche */}
          <AnimatePresence>
            {canL && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => scroll(-1)}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl hover:border-gray-300 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
          </AnimatePresence>

          <div
            ref={scrollRef} onScroll={check}
            className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 py-3.5"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {products.map((p: any, i: number) => (
              <MiniCard key={p.id} product={p} index={i} />
            ))}

            {/* Carte "Voir tout" */}
            <div className="shrink-0 w-[120px] flex items-center justify-center" style={{ scrollSnapAlign: "start" }}>
              <Link href={href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-2.5 cursor-pointer"
                >
                  <div
                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors duration-150"
                    style={{ borderColor: theme.from, color: theme.from }}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold text-center" style={{ color: theme.from }}>
                    Voir tout
                  </span>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Flèche droite */}
          <AnimatePresence>
            {canR && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => scroll(1)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl hover:border-gray-300 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}

// ─── SECTION PROMOS EN VEDETTE — header sombre premium ───────────────────────
function PromoSpotlight({ products }: { products: any[] }) {
  if (products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 container mx-auto px-3 max-w-7xl"
    >
      {/* Header sombre style premium — se distingue des catégories */}
      <div
        className="relative rounded-2xl overflow-hidden mb-3 px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #1A0000 0%, #3D0800 50%, #1A0000 100%)" }}
      >
        {/* Texture dot */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #F7941D 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        {/* Halo gauche */}
        <div className="absolute left-0 top-0 w-48 h-full opacity-15"
          style={{ background: `radial-gradient(ellipse at 0% 50%, ${S.orange}, transparent 70%)` }} />

        <div className="relative z-10 flex items-center gap-3">
          {/* Icône Tag animée — entrée seulement, pas en boucle */}
          <motion.div
            initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
            whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: GRAD }}>
            <Tag className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <motion.h2
              initial={{ x: -16, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="font-black text-white text-[15px] leading-tight">
              Promotions du moment
            </motion.h2>
            <motion.p
              initial={{ x: -10, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="text-white/50 text-[11px] font-normal">
              Les meilleures offres sélectionnées pour vous
            </motion.p>
          </div>
        </div>

        <Link href="/products?promo=1" className="relative z-10 shrink-0">
          <motion.div
            whileHover={{ scale: 1.06, backgroundColor: "rgba(255,255,255,0.28)" }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[11px] font-extrabold px-3.5 py-2 rounded-full cursor-pointer transition-colors duration-150"
          >
            Voir tout <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </Link>
      </div>

      {/* Grille produits promo — entrée staggerée */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10px" }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5"
      >
        {products.map((p, i) => (
          <PromoProductCard key={p.id} product={p} index={i} />
        ))}
      </motion.div>
    </motion.section>
  );
}

// ─── CARTE PRODUIT SPÉCIALE PROMO ─────────────────────────────────────────────
// Variante de ProductCard avec traitement visuel renforcé pour les promos :
// glow orange au hover, badge mis en avant, économie affichée
function PromoProductCard({ product, index }: { product: any; index: number }) {
  const addItem  = useCart((s) => s.addItem);
  const { toast } = useToast();
  const [wished, setWished]   = useState(false);
  const [adding, setAdding]   = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const discount    = Number(product.discountPercentage || product.discount || 0);
  const price       = Number(product.price);
  const final       = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const saving      = price - final;
  const rating      = Number(product.rating || product.averageRating || 0);
  const reviews     = Number(product.reviewCount || product.reviews_count || 0);
  const isAvail     = product.isAvailable !== false && product.stock !== 0;
  const productUrl  = typeof window !== "undefined"
    ? `${window.location.origin}/product/${product.slug ?? product.id}` : "";

  useEffect(() => {
    if (!sharing) return;
    const h = (e: MouseEvent) => { if (!shareRef.current?.contains(e.target as Node)) setSharing(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sharing]);

  const doShare = (p: "whatsapp" | "facebook" | "copy") => {
    setSharing(false);
    const text = `${product.name} – ${final.toLocaleString("fr-FR")} FCFA (-${discount}%)`;
    if (p === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${productUrl}`)}`, "_blank");
    else if (p === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(text)}`, "_blank", "width=640,height=480");
    else { navigator.clipboard.writeText(productUrl); toast({ title: "Lien copié !", duration: 1800 }); }
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAvail) return;
    setAdding(true);
    addItem(product, { quantity: 1 });
    toast({ title: "Ajouté au panier", description: product.name, duration: 2000 });
    await new Promise(r => setTimeout(r, 700));
    setAdding(false);
  };

  return (
    <motion.div
      variants={fadeUp}
      custom={index * 0.04}
      whileHover={{
        y: -4,
        boxShadow: `0 10px 32px rgba(247,148,29,0.22), 0 0 0 2px ${S.orange}`,
        transition: { duration: 0.2 }
      }}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col cursor-pointer"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Image */}
      <Link href={`/product/${product.slug ?? product.id}`} className="block relative bg-gray-50 aspect-square overflow-hidden">
        <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        {/* Badge promo bien visible */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 z-20">
            <PromoBadge value={discount} />
          </div>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWished(v => !v); }}
        >
          <Heart className="w-3.5 h-3.5 transition-colors duration-150"
            fill={wished ? S.orange : "none"} stroke={wished ? S.orange : "#9ca3af"} />
        </button>

        <img
          src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400"}
          alt={product.name} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {!isAvail && (
          <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>

      {/* Infos */}
      <div className="p-2.5 flex flex-col flex-1">
        <Link href={`/product/${product.slug ?? product.id}`} className="flex-1 block">
          <p className="text-xs text-gray-800 line-clamp-2 mb-1.5 leading-snug font-medium min-h-[2rem]">
            {product.name}
          </p>

          {rating > 0 && (
            <div className="flex items-center gap-0.5 mb-1.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-2.5 h-2.5"
                  fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                  stroke={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"} />
              ))}
              {reviews > 0 && <span className="text-[10px] text-gray-400 ml-0.5">({reviews})</span>}
            </div>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold" style={{ color: S.red }}>
              {final.toLocaleString("fr-FR")}
              <span className="text-[10px] font-normal text-gray-400 ml-0.5">FCFA</span>
            </span>
            {discount > 0 && (
              <span className="text-[10px] text-gray-400 line-through">{price.toLocaleString("fr-FR")}</span>
            )}
          </div>

          {/* Économie réalisée — uniquement si promo */}
          {saving > 0 && (
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              Économie : {saving.toLocaleString("fr-FR")} FCFA
            </p>
          )}

          {/* Badge stock réel */}
          {typeof product.stock === "number" && product.stock > 0 && (
            <div className="mt-1.5">
              {product.stock <= 5 ? (
                <div>
                  <div className="flex items-center justify-between text-[9px] mb-0.5">
                    <span className="text-gray-400">Stock</span>
                    <span className="font-bold" style={{ color: S.red }}>
                      Plus que {product.stock} dispo{product.stock > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%`, background: GRAD }} />
                  </div>
                </div>
              ) : product.stock <= 15 ? (
                <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  Stock limité · {product.stock} restants
                </span>
              ) : (
                <span className="inline-block text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ✓ En stock
                </span>
              )}
            </div>
          )}
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <button
            onClick={addToCart} disabled={!isAvail || adding}
            className="flex-1 h-8 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-all duration-150 disabled:opacity-50 active:scale-95"
            style={{ background: GRAD }}
          >
            {adding
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><ShoppingCart className="w-3 h-3" /> Ajouter</>
            }
          </button>

          <div className="relative" ref={shareRef}>
            <button onClick={() => setSharing(v => !v)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
              <Share2 className="w-3 h-3 text-gray-500" />
            </button>
            <AnimatePresence>
              {sharing && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 4 }} transition={{ duration: 0.14 }}
                  className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 min-w-[148px]"
                >
                  <button onClick={() => doShare("whatsapp")} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-green-50 text-xs">
                    <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp
                  </button>
                  <button onClick={() => doShare("facebook")} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-xs">
                    <FaFacebook className="w-3.5 h-3.5 text-[#1877F2]" /> Facebook
                  </button>
                  <button onClick={() => doShare("copy")} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-xs">
                    <Share2 className="w-3.5 h-3.5 text-gray-400" /> Copier
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── HERO SLIDER ─────────────────────────────────────────────────────────────
const HERO_THEMES = [
  { bg1: "#1A0000", bg2: "#3D0800", accent: S.orange,   badge: S.red,     label: "🔥 VENTE FLASH"  },
  { bg1: "#0D0000", bg2: "#2D0000", accent: "#FF7050",   badge: "#B01010", label: "⚡ TOP VENTE"    },
  { bg1: "#1A0500", bg2: "#400800", accent: "#FBBF24",   badge: S.red,     label: "👑 EXCLUSIVITÉ"  },
  { bg1: "#120000", bg2: "#350000", accent: S.orange,    badge: S.redDark, label: "🆕 NOUVEAU"       },
];

function HeroSlide({ product, theme, active }: {
  product: any; theme: typeof HERO_THEMES[0]; active: boolean;
}) {
  const disc  = Number(product.discountPercentage || product.discount || 0);
  const price = Number(product.price);
  const final = disc > 0 ? Math.round(price * (1 - disc / 100)) : price;

  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${theme.bg1}, ${theme.bg2})`, pointerEvents: active ? "auto" : "none" }}
    >
      {/* Halo lumineux droit — statique, pas d'animation en boucle */}
      <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 30%, ${theme.accent}20 0%, transparent 65%)` }} />

      {/* Grille perspective subtile */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${theme.accent} 1px, transparent 1px), linear-gradient(90deg, ${theme.accent} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          transform: "perspective(400px) rotateX(20deg) translateY(-20%)",
          transformOrigin: "top center",
        }} />

      {/* Contenu */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-10 gap-6">
        {/* Texte */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          <motion.span
            initial={{ x: -30, opacity: 0 }} animate={active ? { x: 0, opacity: 1 } : { x: -30, opacity: 0 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 140, damping: 18 }}
            className="inline-block px-3 py-1 rounded-full text-white text-[11px] font-extrabold mb-3"
            style={{ background: theme.badge }}>
            {theme.label}
          </motion.span>

          {/* Titre */}
          <div className="overflow-hidden mb-2">
            <motion.h1
              initial={{ y: 40 }} animate={active ? { y: 0 } : { y: 40 }}
              transition={{ delay: 0.14, type: "spring", stiffness: 110, damping: 20 }}
              className="text-xl md:text-[1.9rem] font-black text-white leading-tight line-clamp-2">
              {product.name}
            </motion.h1>
          </div>

          {/* Description */}
          {product.description && (
            <motion.p
              initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.24 }}
              className="text-white/55 text-xs md:text-sm line-clamp-2 max-w-[280px] mb-3">
              {product.description}
            </motion.p>
          )}

          {/* Prix */}
          <motion.div
            initial={{ y: 28, opacity: 0 }} animate={active ? { y: 0, opacity: 1 } : { y: 28, opacity: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex items-end flex-wrap gap-2 mb-5">
            <span className="text-3xl md:text-5xl font-black tabular-nums leading-none"
              style={{ color: theme.accent }}>
              {final.toLocaleString("fr-FR")}
            </span>
            <span className="text-white/40 text-sm pb-1">FCFA</span>
            {disc > 0 && (
              <div className="flex items-center gap-1.5 pb-1">
                <span className="text-white/35 line-through text-xs">{price.toLocaleString("fr-FR")}</span>
                <span className="px-2 py-0.5 rounded text-white text-[11px] font-black"
                  style={{ background: theme.badge }}>-{disc}%</span>
              </div>
            )}
          </motion.div>

          {/* Boutons */}
          <motion.div
            initial={{ y: 16, opacity: 0 }} animate={active ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
            transition={{ delay: 0.38, type: "spring" }}
            className="flex items-center gap-3">
            <Link href={`/product/${product.slug ?? product.id}`}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }}
                className="px-5 py-2.5 rounded-full font-extrabold text-sm text-white"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.badge})`,
                  boxShadow: `0 4px 18px ${theme.accent}40` }}>
                Voir le produit →
              </motion.button>
            </Link>
            <Link href="/products">
              <button className="px-4 py-2.5 rounded-full font-semibold text-xs text-white/60 border border-white/15 hover:border-white/40 hover:text-white transition-colors">
                Tout voir
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Image produit */}
        <motion.div
          initial={{ x: 50, opacity: 0 }} animate={active ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 90, damping: 22 }}
          className="hidden sm:block shrink-0 relative w-[195px] md:w-[250px] h-full">
          {/* Halo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-44 rounded-full"
              style={{ background: `radial-gradient(circle, ${theme.accent}25 0%, transparent 70%)` }} />
          </div>
          {/* Image avec flottement doux — seulement sur le slide actif */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={active ? { y: [0, -10, 0] } : { y: 0 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
            <img
              src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400"}
              alt={product.name}
              className="w-36 h-36 md:w-48 md:h-48 object-cover rounded-2xl"
              style={{ boxShadow: `0 20px 50px ${theme.accent}38` }}
            />
            {disc > 0 && (
              <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-[12px] shadow-lg"
                style={{ background: GRAD }}>
                -{disc}%
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── CARTES LATÉRALES HERO ────────────────────────────────────────────────────
const SIDE_PALS = [
  { from: "#1A0000", to: "#3D0800", accent: S.orange,   text: "#FFD4A8" },
  { from: "#200000", to: "#4A0A00", accent: "#FF8050",   text: "#FFCCBC" },
  { from: "#150000", to: "#350600", accent: "#FBAB40",   text: "#FFE0B2" },
];

function SideCard({ product, index }: { product: any; index: number }) {
  const disc  = Number(product.discountPercentage || product.discount || 0);
  const price = Number(product.price);
  const final = disc > 0 ? Math.round(price * (1 - disc / 100)) : price;
  const pal   = SIDE_PALS[index % SIDE_PALS.length];

  return (
    <Link href={`/product/${product.slug ?? product.id}`} className="flex-1 block">
      <motion.div
        whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.98 }}
        className="h-full rounded-xl overflow-hidden p-3 flex flex-col justify-between relative"
        style={{ background: `linear-gradient(145deg, ${pal.from}, ${pal.to})` }}
      >
        {/* Halo coin */}
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20"
          style={{ background: pal.accent }} />

        <div className="flex justify-end mb-2">
          <img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200"}
            alt={product.name} className="w-14 h-14 object-cover rounded-lg shadow-lg"
            style={{ boxShadow: `0 6px 16px ${pal.accent}30` }} />
        </div>
        <div>
          <p className="font-bold text-[11px] leading-snug line-clamp-2 mb-1" style={{ color: pal.text }}>
            {product.name}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-xs text-white">
              {final.toLocaleString("fr-FR")}<span className="text-[9px] opacity-60"> F</span>
            </span>
            {disc > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white" style={{ background: S.red }}>
                -{disc}%
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── MEGA HERO ────────────────────────────────────────────────────────────────
function MegaHero({ featured }: { featured: any[] }) {
  const [cur, setCur]       = useState(0);
  const [progress, setProgress] = useState(0);
  const DURATION = 5500;
  const slides = featured.slice(0, 4);
  const side   = featured.slice(4, 7);

  useEffect(() => {
    if (!slides.length) return;
    setProgress(0);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const pct = Math.min(((Date.now() - t0) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { setCur(c => (c + 1) % slides.length); clearInterval(iv); }
    }, 30);
    return () => clearInterval(iv);
  }, [cur, slides.length]);

  if (!slides.length) return null;

  return (
    <div className="mt-3 container mx-auto px-3 max-w-7xl">
      <div className="flex gap-2 h-[220px] sm:h-[272px] md:h-[310px]">

        {/* Slider */}
        <div className="relative flex-1 rounded-2xl overflow-hidden shadow-xl min-w-0">
          {slides.map((p, i) => (
            <HeroSlide key={p.id} product={p} theme={HERO_THEMES[i % HERO_THEMES.length]} active={i === cur} />
          ))}

          {/* Barre progression */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15 z-30">
            <div className="h-full" style={{ width: `${progress}%`, background: S.orange, transition: "none" }} />
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {slides.map((_, i) => (
              <motion.button key={i} onClick={() => setCur(i)}
                animate={i === cur
                  ? { width: 22, backgroundColor: S.orange }
                  : { width: 6, backgroundColor: "rgba(255,255,255,0.4)" }}
                className="h-1.5 rounded-full" transition={{ duration: 0.25 }} />
            ))}
          </div>

          {/* Flèches */}
          {[{ d: -1, s: "left-2", icon: ChevronLeft }, { d: 1, s: "right-2", icon: ChevronRight }].map(({ d, s, icon: Icon }) => (
            <button key={s}
              onClick={() => setCur(c => (c + d + slides.length) % slides.length)}
              className={`absolute ${s} top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors`}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Cartes latérales desktop */}
        {side.length > 0 && (
          <div className="hidden md:flex flex-col gap-2 w-[165px] shrink-0">
            {side.map((p, i) => <SideCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>

      {/* Strip mobile */}
      {side.length > 0 && (
        <div className="mt-2 flex gap-2 md:hidden overflow-x-auto scrollbar-hide pb-1">
          {side.map((p) => {
            const d  = Number(p.discountPercentage || p.discount || 0);
            const pr = Number(p.price);
            const fp = d > 0 ? Math.round(pr * (1 - d / 100)) : pr;
            return (
              <Link key={p.id} href={`/product/${p.slug ?? p.id}`}>
                <div className="shrink-0 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                  style={{ background: GRAD }}>
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0 shadow" />
                  <div>
                    <p className="text-white font-extrabold text-[11px] line-clamp-1 max-w-[90px]">{p.name}</p>
                    <p className="text-white/80 font-black text-xs mt-0.5">{fp.toLocaleString("fr-FR")} F</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── VENTES FLASH TIMER ───────────────────────────────────────────────────────
function FlashTimer() {
  const [t, setT] = useState({ h: 14, m: 37, s: 22 });
  useEffect(() => {
    const iv = setInterval(() => {
      setT(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) h = 23;
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1">
      {[t.h, t.m, t.s].map((val, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="text-white text-xs font-mono font-black px-1.5 py-0.5 rounded min-w-[24px] text-center"
            style={{ background: S.redDark }}>
            {pad(val)}
          </span>
          {i < 2 && <span className="text-white/60 font-bold text-xs">:</span>}
        </span>
      ))}
    </div>
  );
}

// ─── TRUST ITEM ───────────────────────────────────────────────────────────────
function TrustItem({ icon: Icon, label, sub, i }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      className="flex items-center gap-2.5 px-4 sm:px-5 py-3 shrink-0"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${S.red}12` }}>
        <Icon className="w-4 h-4" style={{ color: S.red }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">{label}</p>
        <p className="text-[10px] text-gray-500 whitespace-nowrap">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── PAGE HOME ────────────────────────────────────────────────────────────────
export default function Home() {
  const { data: products, isLoading } = useProducts();
  const { data: categories }          = useCategories();
  const { data: suppliers }           = useSuppliers();
  const { data: testimonialsRaw }     = useTestimonials();
  const cartItems  = useCart((s) => s.items);
  const cartCount  = cartItems.reduce((n: number, i: any) => n + i.quantity, 0);
  const [, setLocation] = useLocation();

  const active = products?.filter((p: any) => p.is_active !== false) || [];

  const promos = active.filter((p: any) => Number(p.discountPercentage || p.discount || 0) > 0);
  const flash  = promos.filter((p: any) => Number(p.discountPercentage || p.discount || 0) >= 20).slice(0, 8);

  const featured = [
    ...promos,
    ...active.filter((p: any) => p.isNew && !Number(p.discountPercentage || p.discount || 0)),
    ...active.filter((p: any) => !p.isNew && !Number(p.discountPercentage || p.discount || 0)),
  ].slice(0, 7);

  const bannerProds = [...active]
    .sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
    .slice(0, 12);

  const catSections = (categories as any[] | undefined)
    ?.map((cat: any) => ({
      id: cat.id, name: cat.name, description: cat.description,
      products: active.filter((p: any) => String(p.categoryId ?? p.category_id) === String(cat.id)).slice(0, 14),
    }))
    .filter((s: any) => s.products.length > 0) ?? [];

  const uncategorized = active.filter((p: any) => !p.categoryId && !p.category_id).slice(0, 12);

  const testimonials = (testimonialsRaw || []).map((t: any) => ({
    id: t.id, name: t.customer_name, location: t.customer_location,
    rating: t.rating, text: t.content,
    avatar: t.avatar_initials || t.customer_name.slice(0, 2).toUpperCase(),
  }));

  const [tIdx, setTIdx] = useState(0);
  const [tDir, setTDir] = useState(1);
  useEffect(() => {
    if (!testimonials.length) return;
    const iv = setInterval(() => { setTDir(1); setTIdx(i => (i + 1) % testimonials.length); }, 5500);
    return () => clearInterval(iv);
  }, [testimonials.length]);

  const [cartBounce, setCartBounce] = useState(false);
  useEffect(() => {
    if (cartCount > 0) { setCartBounce(true); setTimeout(() => setCartBounce(false), 500); }
  }, [cartCount]);

  const trustItems = [
    { icon: Truck,       label: "Livraison 24–72h",  sub: "Partout en CI"   },
    { icon: ShieldCheck, label: "Paiement sécurisé", sub: "Mobile Money"    },
    { icon: RefreshCw,   label: "Retour 14 jours",   sub: "Échange / remb." },
    { icon: Headphones,  label: "Support 7j/7",      sub: "Toujours joignable" },
  ];

  const buildCategoryHref = (category: any) => {
    return `/categories/${slugifyCategory(category?.slug || category?.name || category?.id)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] pt-14 sm:pt-16">

      {/* ① Bandeau défilant */}
      {bannerProds.length > 0 && <BannerPromoDefilant products={bannerProds} />}

      {/* ② Trust bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-3 max-w-7xl">
          <div className="flex items-stretch overflow-x-auto scrollbar-hide divide-x divide-gray-100">
            {trustItems.map(({ icon, label, sub }, i) => (
              <TrustItem key={label} icon={icon} label={label} sub={sub} i={i} />
            ))}
          </div>
        </div>
      </div>

      {/* ③ Hero slider */}
      <MegaHero featured={featured} />

      {/* ④ Ventes Flash — mise en avant premium */}
      {flash.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="bg-white border-b border-gray-200 py-3.5 mt-2"
        >
          <div className="container mx-auto px-3 max-w-7xl">
            {/* En-tête flash */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-1 h-5 rounded-full shrink-0" style={{ background: GRAD }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${S.red}15` }}>
                  <Zap className="w-4 h-4" style={{ color: S.red }} />
                </div>
                <span className="text-sm font-extrabold text-gray-900">Ventes Flash</span>
                {/* Badge LIMITÉ */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                  style={{ background: GRAD }}>
                  <Clock className="w-2.5 h-2.5" /> LIMITÉ
                </span>
                <span className="text-[11px] text-gray-500 hidden sm:inline">Termine dans :</span>
                <FlashTimer />
              </div>
              <Link href="/products?promo=1">
                <motion.div whileHover={{ x: 3 }}
                  className="flex items-center gap-0.5 text-xs font-bold cursor-pointer" style={{ color: S.red }}>
                  Voir plus <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
              </Link>
            </div>

            {/* Mini cartes flash */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
              {flash.map((p: any, idx: number) => {
                const d  = Number(p.discountPercentage || p.discount || 0);
                const pr = Number(p.price);
                const fp = Math.round(pr * (1 - d / 100));
                return (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
                  >
                    <Link href={`/product/${p.slug ?? p.id}`}
                      className="shrink-0 w-[90px] bg-white border border-gray-200 rounded-xl overflow-hidden block hover:border-red-300 transition-colors duration-200">
                      <div className="relative aspect-square bg-gray-50">
                        <div className="absolute top-1.5 left-1.5 z-10"><PromoBadge value={d} /></div>
                        <img src={p.image || ""} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-1.5">
                        <p className="text-[10px] text-gray-700 line-clamp-1 font-medium">{p.name}</p>
                        <p className="text-xs font-extrabold" style={{ color: S.red }}>
                          {fp.toLocaleString("fr-FR")}
                          <span className="text-[9px] font-normal text-gray-400"> F</span>
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ⑤ Marquee crédibilité */}
      <MarqueeCredibility />

      {/* ⑥ Sections catégories — Jumia premium + partage social */}
      {isLoading ? (
        <div className="mt-3 space-y-3 container mx-auto px-3 max-w-7xl">
          {[0, 1, 2].map(s => (
            <div key={s} className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="h-11 animate-pulse" style={{ background: GRAD, opacity: 0.7 }} />
              <div className="bg-white px-4 py-3 flex gap-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-[180px]">
                    <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                    <div className="p-2 space-y-2">
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                      <div className="h-7 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* 🏪 Boutiques sponsorisées */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Boutiques sponsorisées
            </h2>
            <Link href="/shops" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <SponsoredShops />
        </div>
      </section>

      <MemberBenefitsSection products={active} />

      {/* 🏪 Sections par Fournisseur - SISMA Style */}
      {Array.isArray(suppliers) && suppliers.length > 0 && products && products.length > 0 ? (
        suppliers.map((supplier: any, idx: number) => {
          const supplierProducts = products.filter((p: any) => 
            p.supplier_id === supplier.id || p.supplierId === supplier.id
          );
          if (supplierProducts.length === 0) return null;
          return (
            <SupplierSection 
              key={supplier.id} 
              supplier={supplier} 
              products={supplierProducts} 
              idx={idx} 
            />
          );
        })
      ) : null}

      {/* Catégories */}
      {(catSections.length > 0 || uncategorized.length > 0) && (
        <>
          {catSections.map((s: any, i: number) => (
            <CategorySection key={s.id} name={s.name} description={s.description}
              products={s.products} href={buildCategoryHref(s)} idx={i} />
          ))}
          {uncategorized.length > 0 && (
            <CategorySection name="Autres produits" products={uncategorized}
              href="/products" idx={catSections.length} />
          )}
        </>
      )}

      {active.length === 0 && catSections.length === 0 && uncategorized.length === 0 && !isLoading && (
        <div className="mt-4 text-center py-16 bg-white rounded-xl border border-gray-200 mx-3">
          <p className="text-base font-semibold text-gray-600">Aucun produit pour le moment.</p>
          <p className="text-sm text-gray-400 mt-1">Revenez bientôt !</p>
        </div>
      )}

      {/* ⑧ Témoignages */}
      {testimonials.length > 0 && (
        <section className="mt-4 bg-white border-t border-b border-gray-200">
          <div className="container mx-auto px-3 max-w-7xl py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full shrink-0" style={{ background: GRAD }} />
              <div>
                <h2 className="font-extrabold text-base text-gray-900">Avis clients</h2>
                <p className="text-[11px] text-gray-500">Ce que disent nos clients</p>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 max-w-3xl py-8">
            <div className="relative h-[270px] md:h-[250px]">
              <AnimatePresence mode="wait">
                {testimonials.map((t: any, i: number) => {
                  if (i !== tIdx) return null;
                  return (
                    <motion.div key={t.id}
                      initial={{ opacity: 0, x: tDir > 0 ? 40 : -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: tDir > 0 ? -40 : 40 }}
                      transition={{ duration: 0.32 }}
                      className="absolute inset-0 bg-white rounded-2xl p-5 md:p-7 shadow-md border border-gray-100 flex flex-col"
                    >
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_: any, ii: number) => (
                          <Star key={ii} className="w-3.5 h-3.5"
                            fill={ii < t.rating ? "#f59e0b" : "none"}
                            stroke={ii < t.rating ? "#f59e0b" : "#e5e7eb"} />
                        ))}
                      </div>
                      <Quote className="w-6 h-6 mb-2" style={{ color: `${S.red}20` }} />
                      <p className="text-gray-700 text-sm leading-relaxed flex-1 line-clamp-4">"{t.text}"</p>
                      <div className="flex items-center gap-3 pt-3 mt-3 border-t border-gray-100">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ background: GRAD }}>
                          {t.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                          <p className="text-gray-500 text-xs">{t.location}</p>
                        </div>
                        <span className="ml-auto text-[10px] text-emerald-600 font-semibold">✅ Achat vérifié</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {/* Dots témoignages */}
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_: any, i: number) => (
                <button key={i} onClick={() => { setTDir(i > tIdx ? 1 : -1); setTIdx(i); }}
                  className="rounded-full transition-all duration-200"
                  style={{ width: i === tIdx ? 22 : 7, height: 6, background: i === tIdx ? S.red : "#d1d5db" }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ⑨ Second marquee + social */}
      <div className="mt-3"><MarqueeCredibility /></div>
      <SocialSubscribe />

      {/* Panier flottant mobile */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={cartBounce ? { y: 0, opacity: 1, scale: [1, 1.12, 1] } : { y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setLocation("/cart")}
            className="fixed bottom-5 right-4 z-40 md:hidden flex items-center gap-2 text-white px-4 py-3 rounded-full shadow-xl font-bold text-sm"
            style={{ background: GRAD }}
          >
            <ShoppingCart className="w-4 h-4" />
            Panier · {cartCount}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
