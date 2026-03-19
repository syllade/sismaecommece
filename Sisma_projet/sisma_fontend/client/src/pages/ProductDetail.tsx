import { useProduct, useProducts } from "@/hooks/use-products";
import { useRoute, Link } from "wouter";
import {
  Loader2, ArrowLeft, ShoppingBag, Truck, Share2,
  Star, Heart, Check, Package, RotateCcw, Zap,
  Circle, ChevronRight, ChevronLeft, ShieldCheck,
  ZoomIn, X, Maximize2,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { slugifyCategory } from "@/hooks/use-marketplace";
import { recordViewedProduct } from "@/lib/client-account";
import { ProductShopLink } from "@/components/ProductShopLink";
import { FaWhatsapp, FaFacebook } from "react-icons/fa";
import { useState, useEffect, useRef, useCallback } from "react";
import { normalizeVariants, type ProductWithVariants } from "@/data/variants";
import { motion, AnimatePresence } from "framer-motion";
import { getColorPastille } from "@/lib/color-pastilles";

// ─── PALETTE SISMA ─────────────────────────────────────────────────────────────
const S = {
  red:     "#D81918",
  redDark: "#A01010",
  orange:  "#F7941D",
};

// ─── GALERIE D'IMAGES ─────────────────────────────────────────────────────────
function ProductGallery({
  images,
  productName,
  hasDiscount,
  discount,
}: {
  images: string[];
  productName: string;
  hasDiscount: boolean;
  discount: number;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  // Navigation galerie
  const prev = useCallback(() => setActiveIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActiveIdx(i => (i + 1) % images.length), [images.length]);

  // Navigation lightbox
  const lbPrev = () => setLightboxIdx(i => (i - 1 + images.length) % images.length);
  const lbNext = () => setLightboxIdx(i => (i + 1) % images.length);

  // Fermeture lightbox au clavier
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") lbPrev();
      if (e.key === "ArrowRight") lbNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  // Swipe mobile sur la galerie principale
  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStart.current = null;
  };

  // Zoom à la souris sur l'image principale
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current || !zoomed) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Image principale */}
        <div
          ref={imgRef}
          className="relative bg-white rounded-xl border border-gray-200 overflow-hidden"
          style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
          onClick={() => {
            if (!zoomed) { setLightboxIdx(activeIdx); setLightbox(true); }
            setZoomed(false);
          }}
        >
          {/* Aspect ratio 1:1 */}
          <div className="aspect-square overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIdx}
                src={images[activeIdx]}
                alt={`${productName} - photo ${activeIdx + 1}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={zoomed ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: "scale(2.2)",
                  transition: "transform-origin 0s",
                } : { transform: "scale(1)", transition: "transform 0.3s" }}
              />
            </AnimatePresence>

            {/* Badge promo */}
            {hasDiscount && (
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded text-sm font-black text-white shadow-md"
                style={{ background: S.red }}>
                -{discount}%
              </div>
            )}

            {/* Bouton zoom / agrandir */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(activeIdx); setLightbox(true); }}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              title="Agrandir"
            >
              <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
            </button>

            {/* Flèches navigation (si plusieurs images) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}

            {/* Indicateur numéro photo */}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {activeIdx + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* Barre de miniatures */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                  i === activeIdx
                    ? "border-red-600 shadow-md"
                    : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                }`}
                style={{ borderColor: i === activeIdx ? S.red : undefined }}
              >
                <img src={img} alt={`${productName} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Dots sur mobile si < 6 images */}
        {images.length > 1 && images.length <= 8 && (
          <div className="flex justify-center gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className="rounded-full transition-all duration-200"
                style={{ width: i === activeIdx ? 20 : 6, height: 6,
                  background: i === activeIdx ? S.red : "#d1d5db" }} />
            ))}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
            onClick={() => setLightbox(false)}
          >
            {/* Header lightbox */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
              <span className="text-white/70 text-sm font-medium">
                {lightboxIdx + 1} / {images.length}
              </span>
              <p className="text-white text-sm font-semibold truncate max-w-[200px]">{productName}</p>
              <button onClick={() => setLightbox(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Image centrale */}
            <div className="flex-1 flex items-center justify-center relative px-12 min-h-0"
              onClick={e => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIdx}
                  src={images[lightboxIdx]}
                  alt={`${productName} ${lightboxIdx + 1}`}
                  className="max-w-full max-h-full object-contain rounded-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{ maxHeight: "calc(100vh - 160px)" }}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button onClick={lbPrev}
                    className="absolute left-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button onClick={lbNext}
                    className="absolute right-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Miniatures lightbox */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide shrink-0"
                onClick={e => e.stopPropagation()}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setLightboxIdx(i)}
                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === lightboxIdx ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                    }`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── BOUTON FACEBOOK SHARE ────────────────────────────────────────────────────
function FacebookShareButton({ url, text, full = false }: { url: string; text: string; full?: boolean }) {
  const handleFbShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(fbUrl, "_blank", "width=640,height=480,scrollbars=yes");
  };

  if (full) {
    return (
      <button
        onClick={handleFbShare}
        className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border-2 border-[#1877F2] bg-[#1877F2]/5 hover:bg-[#1877F2] text-[#1877F2] hover:text-white text-xs font-bold transition-all duration-200"
      >
        <FaFacebook className="w-4 h-4" />
        Partager sur Facebook
      </button>
    );
  }

  return (
    <button
      onClick={handleFbShare}
      title="Partager sur Facebook"
      className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg border-2 border-[#1877F2] bg-[#1877F2]/5 hover:bg-[#1877F2] text-[#1877F2] hover:text-white text-xs font-bold transition-all duration-200"
    >
      <FaFacebook className="w-4 h-4" />
      <span className="hidden sm:inline">Facebook</span>
    </button>
  );
}

// ─── CARTE PRODUIT SIMILAIRE ──────────────────────────────────────────────────
function SimilarCard({ product }: { product: any }) {
  const discount = Number(product.discountPercentage || product.discount || 0);
  const price = Number(product.price);
  const final = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const rating = Number(product.rating || product.averageRating || 0);

  return (
    <Link href={`/product/${product.slug ?? product.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 group cursor-pointer">
        <div className="relative bg-gray-50 aspect-square overflow-hidden">
          {discount > 0 && (
            <span className="absolute top-1.5 left-1.5 z-10 text-white text-[10px] font-black px-1.5 py-0.5 rounded"
              style={{ background: S.red }}>
              -{discount}%
            </span>
          )}
          <img
            src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400"}
            alt={product.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-2.5">
          <p className="text-xs text-gray-800 line-clamp-2 mb-1.5 leading-snug font-medium min-h-[2rem]">
            {product.name}
          </p>
          <ProductShopLink
            product={product}
            className="mb-1 text-[10px] text-gray-500 hover:text-[#D81918]"
          />
          {rating > 0 && (
            <div className="flex items-center gap-0.5 mb-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-2.5 h-2.5"
                  fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                  stroke={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"} />
              ))}
            </div>
          )}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm font-extrabold text-gray-900">
              {final.toLocaleString("fr-FR")}
              <span className="text-[10px] font-normal text-gray-500"> FCFA</span>
            </span>
            {discount > 0 && (
              <span className="text-[10px] text-gray-400 line-through">{price.toLocaleString("fr-FR")}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── PAGE DETAIL PRODUIT ──────────────────────────────────────────────────────
export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug || "";
  const { data: product, isLoading, error } = useProduct(slug);
  const { data: allProducts } = useProducts();
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [wished, setWished] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "livraison">("description");

  useEffect(() => {
    if (!product) return;
    recordViewedProduct(product as any);
  }, [product]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: S.red }} />
      </div>
    );

  if (error || !product)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 px-4 bg-[#f5f5f5]">
        Produit introuvable
      </div>
    );

  const productWithVariants = product as ProductWithVariants;
  const productColors = normalizeVariants(productWithVariants?.colors);
  const productSizes  = normalizeVariants(productWithVariants?.sizes);
  const hasColors = productColors.length > 0;
  const hasSizes  = productSizes.length > 0;
  const needsColor = hasColors && !selectedColor;
  const needsSize  = hasSizes  && !selectedSize;
  const canBuy = !needsColor && !needsSize;

  const missingMessage =
    needsColor && needsSize ? "Choisissez une couleur et une taille" :
    needsColor ? "Choisissez une couleur" :
    needsSize  ? "Choisissez une taille"  : null;

  const discount       = Number((product as any).discount || (product as any).discountPercentage || 0);
  const hasDiscount    = discount > 0;
  const price          = Number(product.price);
  const discountedPrice= hasDiscount ? Math.round(price * (1 - discount / 100)) : price;
  const inStock        = (product as any).stock === undefined || (product as any).stock > 0;
  const rating         = Number((product as any).rating || (product as any).averageRating || 0);
  const reviewCount    = Number((product as any).reviewCount || (product as any).reviews_count || 0);
  const reviews        = Array.isArray((product as any).reviews) ? (product as any).reviews : [];
  const visibleReviews = reviews.slice(0, 3);

  // Images : tableau ou image unique
  const images: string[] =
    Array.isArray((product as any).images) && (product as any).images.length > 0
      ? (product as any).images
      : [product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"];

  const shareUrl  = typeof window !== "undefined"
    ? `${window.location.origin}/product/${(product as any).slug ?? product.id}`
    : "";
  const shareText = `Découvrez ${product.name} sur Sisma Shop — ${discountedPrice.toLocaleString("fr-FR")} FCFA${hasDiscount ? ` (-${discount}%)` : ""}`;

  const checkoutUrl = `/checkout?direct=1&productId=${product.id}&qty=${quantity}${selectedColor ? `&color=${encodeURIComponent(selectedColor)}` : ""}${selectedSize ? `&size=${encodeURIComponent(selectedSize)}` : ""}`;

  const similarProducts = allProducts
    ?.filter((p: any) =>
      (p.categoryId ?? p.category?.id) === (product.categoryId ?? (product as any).category?.id) &&
      p.id !== product.id
    )
    ?.slice(0, 8) ?? [];

  const handleAddToCart = () => {
    if (!canBuy) return;
    addItem(product, { color: selectedColor ?? undefined, size: selectedSize ?? undefined, quantity });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
    toast({ title: "Ajouté au panier", description: `${quantity} × ${product.name}`, duration: 2500 });
  };

  const handleWhatsAppShare = () => {
    const wa = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(wa, "_blank");
  };

  const scrollToOptions = () =>
    document.getElementById("product-options")?.scrollIntoView({ behavior: "smooth", block: "center" });

  // Stagger animation
  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } };
  const item    = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-28 md:pb-12">

      {/* ── Fil d'Ariane ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-6 max-w-7xl py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:underline transition-colors" style={{ color: "inherit" }}>Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/products" className="hover:underline" style={{ color: "inherit" }}>Catalogue</Link>
            {(product as any).category?.name && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link
                  href={`/categories/${slugifyCategory(
                    (product as any).category?.slug ||
                      (product as any).category?.name ||
                      (product as any).category?.id,
                  )}`}
                  className="hover:underline"
                  style={{ color: "inherit" }}
                >
                  {(product as any).category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-800 font-medium truncate max-w-[160px] sm:max-w-xs">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 max-w-7xl pt-4 md:pt-6">

        {/* Retour mobile */}
        <Link href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4 transition-colors md:hidden">
          <ArrowLeft className="w-4 h-4" /> Retour au catalogue
        </Link>

        {/* ── Layout principal ── */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-4">

          {/* ── GALERIE ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ProductGallery
              images={images}
              productName={product.name}
              hasDiscount={hasDiscount}
              discount={discount}
            />

            {/* Partage social sous la galerie — desktop */}
            <div className="hidden md:flex items-center gap-2 mt-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-xs font-semibold text-gray-500 mr-1">Partager :</span>
              {/* Facebook */}
              <FacebookShareButton url={shareUrl} text={shareText} />
              {/* WhatsApp */}
              <button onClick={handleWhatsAppShare}
                className="flex items-center gap-1.5 h-10 px-3 rounded-lg border-2 border-[#25D366] bg-[#25D366]/5 hover:bg-[#25D366] text-[#25D366] hover:text-white text-xs font-bold transition-all duration-200">
                <FaWhatsapp className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              {/* Copier lien */}
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); toast({ title: "Lien copié !", duration: 2000 }); }}
                className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors">
                <Share2 className="w-3.5 h-3.5" />
                Copier
              </button>
            </div>
          </motion.div>

          {/* ── DÉTAILS PRODUIT ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col gap-0"
          >
            {/* Bloc principal infos */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 mb-3">

              {/* Titre + wishlist */}
              <motion.div variants={item} className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight flex-1">
                  {product.name}
                </h1>
                <button
                  onClick={() => setWished(v => !v)}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center shrink-0 hover:border-red-300 transition-colors"
                >
                  <Heart className="w-4 h-4 transition-colors"
                    fill={wished ? S.red : "none"} stroke={wished ? S.red : "#9ca3af"} />
                </button>
              </motion.div>

              {/* Avis + stock */}
              <motion.div variants={item} className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                {rating > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-3.5 h-3.5"
                          fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                          stroke={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs">{rating.toFixed(1)}</span>
                    {reviewCount > 0 && <span className="text-gray-400 text-xs">· {reviewCount} avis</span>}
                  </div>
                ) : null}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: inStock ? "#dcfce7" : "#fee2e2",
                    color: inStock ? "#16a34a" : "#dc2626",
                  }}>
                  {inStock ? "✓ En stock" : "Rupture"}
                </span>
              </motion.div>

              {/* Prix */}
              <motion.div variants={item} className="mb-4 pb-4 border-b border-gray-100">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-black" style={{ color: S.red }}>
                    {discountedPrice.toLocaleString("fr-FR")}
                    <span className="text-lg font-bold ml-1.5 text-gray-700">FCFA</span>
                  </span>
                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <span className="text-base text-gray-400 line-through">
                        {price.toLocaleString("fr-FR")} FCFA
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-black text-white"
                        style={{ background: S.red }}>
                        -{discount}% · Offre limitée
                      </span>
                    </div>
                  )}
                </div>
                {/* Économie réalisée */}
                {hasDiscount && (
                  <p className="text-xs font-semibold text-green-600 mt-1.5">
                    Vous économisez {(price - discountedPrice).toLocaleString("fr-FR")} FCFA
                  </p>
                )}
              </motion.div>

              {/* Variantes couleur */}
              {hasColors && (
                <motion.div variants={item} className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Couleur {selectedColor && <span className="normal-case text-gray-500 font-normal">— {selectedColor}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {productColors.map((c) => {
                      const hex = getColorPastille(c);
                      const isSelected = selectedColor === c;
                      return (
                        <motion.button key={c} type="button" whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedColor(isSelected ? null : c)}
                          className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all ${
                            isSelected ? "text-white" : "border-gray-200 hover:border-gray-400 bg-white text-gray-700"
                          }`}
                          style={isSelected ? { borderColor: S.red, background: S.red } : {}}>
                          {hex && (
                            <span className="w-3.5 h-3.5 rounded-full border border-white/50 shrink-0"
                              style={{ background: hex, boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }} />
                          )}
                          {c}
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Variantes taille */}
              {hasSizes && (
                <motion.div variants={item} className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Taille {selectedSize && <span className="normal-case text-gray-500 font-normal">— {selectedSize}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2" id="product-options">
                    {productSizes.map((s) => {
                      const isSel = selectedSize === s;
                      return (
                        <motion.button key={s} type="button" whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSize(isSel ? null : s)}
                          className={`min-w-[2.8rem] h-10 px-3 rounded-lg border-2 text-xs font-bold transition-all ${
                            isSel ? "text-white" : "border-gray-200 hover:border-gray-400 bg-white text-gray-700"
                          }`}
                          style={isSel ? { borderColor: S.red, background: S.red } : {}}>
                          {s}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Message variante manquante */}
              {missingMessage && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-amber-700 text-xs font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-3">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  {missingMessage}
                </motion.p>
              )}

              {!hasColors && !hasSizes && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 mb-3">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  Option standard — prêt à commander
                </div>
              )}

              {/* Quantité */}
              <motion.div variants={item} className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Quantité
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors text-lg">
                      −
                    </button>
                    <span className="w-12 text-center text-base font-bold text-gray-900 border-x-2 border-gray-200 h-10 flex items-center justify-center">
                      {quantity}
                    </span>
                    <button onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors text-lg">
                      +
                    </button>
                  </div>
                  {quantity > 1 && (
                    <span className="text-sm text-gray-500">
                      = <strong className="text-gray-800">{(discountedPrice * quantity).toLocaleString("fr-FR")} FCFA</strong>
                    </span>
                  )}
                </div>
              </motion.div>

              {/* ── CTAs PRINCIPAUX ── */}
              <motion.div variants={item} className="space-y-2.5">

                {/* 1. Acheter maintenant — CTA principal */}
                {canBuy ? (
                  <Link href={checkoutUrl}>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-13 py-3.5 text-base font-black rounded-xl flex items-center justify-center gap-2.5 text-white shadow-lg transition-all"
                      style={{ background: `linear-gradient(135deg, ${S.red}, ${S.orange})`,
                        boxShadow: `0 4px 20px ${S.red}35` }}>
                      <Zap className="w-5 h-5" />
                      Acheter maintenant
                    </motion.button>
                  </Link>
                ) : (
                  <button onClick={scrollToOptions}
                    className="w-full py-3.5 text-base font-black rounded-xl flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white transition-colors">
                    <Package className="w-5 h-5" />
                    Choisir les options
                  </button>
                )}

                {/* 2. Ajouter au panier */}
                <motion.button
                  whileTap={canBuy ? { scale: 0.98 } : {}}
                  onClick={handleAddToCart}
                  disabled={!canBuy}
                  className={`w-full py-3 text-sm font-bold rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                    canBuy
                      ? "border-gray-800 text-gray-800 bg-white hover:bg-gray-50"
                      : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                  }`}>
                  <AnimatePresence mode="wait">
                    {addedFeedback ? (
                      <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" /> Ajouté au panier !
                      </motion.span>
                    ) : (
                      <motion.span key="cart" className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Ajouter au panier
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* 3. Partage rapide mobile */}
                <div className="flex gap-2 md:hidden">
                  <FacebookShareButton url={shareUrl} text={shareText} full />
                  <button onClick={handleWhatsAppShare}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border-2 border-[#25D366] bg-[#25D366]/5 hover:bg-[#25D366] text-[#25D366] hover:text-white text-xs font-bold transition-all duration-200">
                    <FaWhatsapp className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </motion.div>
            </div>

            {/* ── Infos livraison / garanties ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${S.red}15` }}>
                    <Truck className="w-4 h-4" style={{ color: S.red }} />
                  </div>
                  <p className="text-[11px] font-bold text-gray-800">Livraison</p>
                  <p className="text-[10px] text-gray-500 leading-tight">Partout en CI · 24–72h</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-800">Paiement</p>
                  <p className="text-[10px] text-gray-500 leading-tight">Mobile Money sécurisé</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-800">Retours</p>
                  <p className="text-[10px] text-gray-500 leading-tight">14 jours · Échange gratuit</p>
                </div>
              </div>
            </div>

            {/* ── Onglets description / livraison ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {(["description", "livraison"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${
                      activeTab === tab
                        ? "border-b-2 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    style={{ borderBottomColor: activeTab === tab ? S.red : "transparent" }}>
                    {tab === "description" ? "Description" : "Livraison & retours"}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === "description" ? (
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {product.description
                      ? <p>{product.description}</p>
                      : <p className="text-gray-400 italic">Aucune description disponible pour ce produit.</p>
                    }
                    {/* Caractéristiques si disponibles */}
                    {(product as any).features && Array.isArray((product as any).features) && (
                      <ul className="mt-3 space-y-1.5">
                        {(product as any).features.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-gray-600">
                    <div className="flex items-start gap-3">
                      <Truck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: S.red }} />
                      <div>
                        <p className="font-bold text-gray-800 mb-0.5">Délai de livraison</p>
                        <p>Livraison sous 24 à 72h après validation de la commande. Livraison sur tout le territoire de Côte d'Ivoire.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RotateCcw className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-800 mb-0.5">Politique de retour</p>
                        <p>Retours acceptés sous 14 jours. Échange ou remboursement selon disponibilité. Produit non utilisé et dans son emballage d'origine.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-800 mb-0.5">Garantie produit</p>
                        <p>Tous nos produits sont vérifiés avant expédition. En cas de produit défectueux, nous prenons en charge le remplacement.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── AVIS CLIENTS ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <h3 className="font-semibold text-gray-900">Avis clients</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <div className="text-3xl font-black text-gray-900">
                {rating > 0 ? rating.toFixed(1) : "—"}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3.5 h-3.5"
                    fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
                    stroke={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"} />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reviewCount > 0 ? `${reviewCount} avis` : "Aucun avis pour le moment"}
              </p>
            </div>
            <div className="sm:col-span-2 space-y-3">
              {visibleReviews.length > 0 ? (
                visibleReviews.map((review: any, idx: number) => {
                  const author =
                    review.customer_name ||
                    review.author ||
                    review.user?.name ||
                    "Client vérifié";
                  const content =
                    review.comment ||
                    review.content ||
                    review.text ||
                    "Avis client.";
                  const reviewRating = Number(review.rating || rating || 0);
                  return (
                    <div key={`${author}-${idx}`} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className="w-3 h-3"
                            fill={i <= Math.round(reviewRating) ? "#f59e0b" : "none"}
                            stroke={i <= Math.round(reviewRating) ? "#f59e0b" : "#e5e7eb"} />
                        ))}
                        <span className="text-xs text-gray-400 ml-2">{author}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{content}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  Soyez le premier à laisser un avis sur ce produit.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PRODUITS SIMILAIRES ── */}
        {similarProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-2"
          >
            {/* Header section */}
            <div className="bg-white border border-gray-200 rounded-xl mb-3">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-5 rounded-full shrink-0"
                    style={{ background: `linear-gradient(to bottom, ${S.red}, ${S.orange})` }} />
                  <span className="text-sm font-bold text-gray-900">Vous aimerez aussi</span>
                </div>
                <Link href="/products">
                  <div className="flex items-center gap-0.5 text-xs font-bold cursor-pointer hover:underline"
                    style={{ color: S.red }}>
                    Voir plus <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {similarProducts.map((p: any, i: number) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}>
                  <SimilarCard product={p} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* ── BARRE STICKY MOBILE ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Prix */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-base font-black" style={{ color: S.red }}>
            {discountedPrice.toLocaleString("fr-FR")} FCFA
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-400 line-through">{price.toLocaleString("fr-FR")} FCFA</span>
              <span className="text-[10px] text-white font-black px-1.5 py-0.5 rounded ml-auto"
                style={{ background: S.red }}>-{discount}%</span>
            </>
          )}
        </div>

        {/* Boutons */}
        <div className="flex gap-2">
          {/* Panier */}
          <button onClick={handleAddToCart} disabled={!canBuy}
            className="flex-none w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-gray-400 transition-colors">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
          </button>

          {/* Acheter */}
          {canBuy ? (
            <Link href={checkoutUrl} className="flex-1">
              <button className="w-full h-12 rounded-xl font-black text-base flex items-center justify-center gap-2 text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${S.red}, ${S.orange})` }}>
                <Zap className="w-4 h-4" />
                Acheter
              </button>
            </Link>
          ) : (
            <button onClick={scrollToOptions}
              className="flex-1 h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-amber-500 text-white">
              <Package className="w-4 h-4" />
              Choisir options
            </button>
          )}

          {/* Facebook direct */}
          <button onClick={() => {
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
            window.open(fbUrl, "_blank", "width=640,height=480");
          }}
            className="flex-none w-12 h-12 rounded-xl border-2 border-[#1877F2] bg-[#1877F2]/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors"
            style={{ color: "#1877F2" }}>
            <FaFacebook className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
