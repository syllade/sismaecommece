import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Share2, Star, CheckCircle, Package } from "lucide-react";
import { FaWhatsapp, FaFacebook } from "react-icons/fa";
import { type Supplier, getSupplierInitials, getSupplierGradient } from "@/hooks/use-suppliers";
import { Loader } from "./Loader";

// SISMA Palette
const S = {
  red: "#D81918",
  redDark: "#A01010",
  orange: "#F7941D",
  orangeAlt: "#E8820A",
};

const GRAD = `linear-gradient(135deg, ${S.red}, ${S.orange})`;

// Supplier themes - variations of the SISMA gradient
const SUPPLIER_THEMES = [
  { from: "#D81918", to: "#F7941D" },
  { from: "#F7941D", to: "#D81918" },
  { from: "#22c55e", to: "#14b8a6" },
  { from: "#3b82f6", to: "#8b5cf6" },
  { from: "#ec4899", to: "#f97316" },
  { from: "#8b5cf6", to: "#3b82f6" },
  { from: "#14b8a6", to: "#22c55e" },
  { from: "#f97316", to: "#ec4899" },
];

interface SupplierSectionProps {
  supplier: Supplier;
  products: any[];
  idx: number;
}

export function SupplierSection({ supplier, products, idx }: SupplierSectionProps) {
  const theme = SUPPLIER_THEMES[idx % SUPPLIER_THEMES.length];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 8);
    setCanR(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
  }, []);

  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 200, behavior: "smooth" });

  useEffect(() => {
    check();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", check);
      return () => el.removeEventListener("scroll", check);
    }
  }, [check]);

  useEffect(() => {
    if (!shareOpen) return;
    const h = (e: MouseEvent) => {
      if (!shareRef.current?.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [shareOpen]);

  const shopPath = `/shop/${supplier.id}`;
  const storeUrl = typeof window !== "undefined" ? `${window.location.origin}${shopPath}` : shopPath;
  const shareText = `Découvrez la boutique "${supplier.name}" sur Sisma Shop ! ${supplier.totalProducts || 0} produits disponibles 👉`;

  const shareFn = (platform: "whatsapp" | "facebook" | "copy") => {
    setShareOpen(false);
    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${storeUrl}`)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank", "width=640,height=480");
    } else {
      navigator.clipboard.writeText(storeUrl);
    }
  };

  if (products.length === 0) return null;

  const initials = getSupplierInitials(supplier.name);
  const avatarGradient = getSupplierGradient(supplier.name);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 container mx-auto px-3 max-w-7xl"
    >
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {/* Header with gradient */}
        <div className="relative" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
          {/* Texture */}
          <div 
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "14px 14px" }}
          />
          {/* Decorative halo */}
          <div 
            className="absolute right-0 top-0 w-32 h-full rounded-l-full opacity-10"
            style={{ background: "radial-gradient(circle at right, white, transparent)" }}
          />

          <div className="relative z-10 flex items-center justify-between px-5 py-3 gap-3">
            {/* Supplier info */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo/Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white/30">
                {supplier.logo ? (
                  <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: avatarGradient }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-[15px] text-white tracking-wide leading-none truncate">
                    {supplier.name}
                  </h2>
                  {supplier.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                      <CheckCircle className="w-3 h-3" />
                      Fournisseur vérifié
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white/75 text-[11px]">
                    {supplier.totalProducts || 0} produits
                  </span>
                  {supplier.rating && (
                    <>
                      <span className="text-white/40">•</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        <span className="text-white/75 text-[11px]">{supplier.rating}</span>
                      </div>
                    </>
                  )}
                  {supplier.deliveryDays && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-white/75 text-[11px]">{supplier.deliveryDays}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Share button */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShareOpen(!shareOpen)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Partager"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>
                
                {shareOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[160px] z-50"
                  >
                    <button
                      onClick={() => shareFn("whatsapp")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaWhatsapp className="w-4 h-4 text-green-500" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => shareFn("facebook")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaFacebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </button>
                    <button
                      onClick={() => shareFn("copy")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4 text-gray-500" />
                      Copier le lien
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Visit store button */}
              <Link
                href={shopPath}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-gray-900 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Voir boutique
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Products scroll */}
        <div className="bg-white p-3">
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
            style={{ scrollBehavior: "smooth" }}
          >
            {/* Navigation buttons */}
            {canL && (
              <button
                onClick={() => scroll(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50"
                style={{ marginLeft: "-0.5rem" }}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}

            {products.slice(0, 10).map((product: any, i: number) => (
              <Link
                key={product.id || i}
                href={`/product/${product.slug}`}
                className="flex-shrink-0 w-36 group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs font-bold text-red-600 mt-1">
                  {Number(product.price).toLocaleString("fr-FR")} ₵
                </p>
              </Link>
            ))}

            {/* Empty state - no products */}
            {products.length === 0 && (
              <div className="flex-shrink-0 w-full py-8 flex flex-col items-center justify-center text-gray-400">
                <Package className="w-10 h-10 mb-2" />
                <span className="text-sm">Aucun produit disponible</span>
              </div>
            )}

            {/* See all products link */}
            <Link
              href={shopPath}
              className="flex-shrink-0 w-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-400 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-orange-500 mb-1" />
              <span className="text-xs font-medium text-gray-500">Voir tout</span>
            </Link>

            {canR && (
              <button
                onClick={() => scroll(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50"
                style={{ marginRight: "-0.5rem" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// Mini card for supplier list
export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const initials = getSupplierInitials(supplier.name);
  const avatarGradient = getSupplierGradient(supplier.name);

  return (
    <Link href={`/shop/${supplier.id}`} className="block">
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-gray-100">
            {supplier.logo ? (
              <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center font-bold text-lg text-white"
                style={{ background: avatarGradient }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{supplier.name}</h3>
              {supplier.isVerified && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
            </div>
            <p className="text-sm text-gray-500 truncate">{supplier.totalProducts || 0} produits</p>
            {supplier.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600">{supplier.rating}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
