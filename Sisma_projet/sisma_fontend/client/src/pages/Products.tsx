/**
 * ProductsPage.tsx — Catalogue UI style "grille + filtres" (inspiré UI fournie)
 * FIXED: 4 cartes par ligne sur desktop, structure fidèle à l'image
 */

import { useProducts, useCategories } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ProductShopLink } from "@/components/ProductShopLink";
import { Link, useLocation } from "wouter";
import {
  Search,
  ShoppingCart,
  X,
  Star,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Heart,
} from "lucide-react";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { hasRequiredVariants } from "@/data/variants";
import {
  motion,
  AnimatePresence,
  useInView,
  animate as fmAnimate,
  useMotionValue,
  useTransform,
} from "framer-motion";

// ─── URL helpers ──────────────────────────────────────────────────────────────
function getSearchParams() {
  if (typeof window === "undefined") return { search: "", category: "", promo: false };
  const p = new URLSearchParams(window.location.search);
  return { search: p.get("search") ?? "", category: p.get("category") ?? "", promo: p.get("promo") === "1" };
}
function setSearchParams(search: string, category: string, promo: boolean) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (promo) params.set("promo", "1");
  const qs = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}
function updateSEO(search: string, categoryName: string, promo: boolean) {
  let title = "Catalogue Produits | SISMA Marketplace – Prix en FCFA, livraison Côte d'Ivoire";
  if (search) title = `${search} – Acheter en ligne en CI | SISMA Marketplace`;
  else if (categoryName) title = `${categoryName} pas cher en Côte d'Ivoire | SISMA Marketplace`;
  else if (promo) title = "Promotions & Réductions | SISMA Marketplace – Offres limitées";
  document.title = title;
}

// ─── SHIMMER BADGE ────────────────────────────────────────────────────────────
function ShimmerBadge({ text, color = "#f97316" }: { text: string; color?: string }) {
  return (
    <div className="relative overflow-hidden rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: color }}>
      {text}
      <motion.div
        className="absolute inset-0 skew-x-12"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)", width: "40%" }}
        animate={{ x: ["-100%", "260%"] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── ANIMATED PRODUCT COUNT ───────────────────────────────────────────────────
function AnimatedCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("fr-FR"));
  useEffect(() => {
    if (inView) fmAnimate(mv, value, { duration: 1.2, ease: "easeOut" });
  }, [inView, value, mv]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function CatalogueProductCard({ product, index }: { product: any; index: number }) {
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState(false);
  const [, setLocation] = useLocation();
  const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });

  const discount = product.discountPercentage || product.discount || 0;
  const hasDiscount = discount > 0;
  const price = Number(product.price);
  const discountedPrice = hasDiscount ? Math.round(price * (1 - discount / 100)) : price;

  const rating = Number(product.rating || product.averageRating || 0);
  const reviewCount = Number(product.reviewCount || product.reviews_count || 0);
  const isNew = useMemo(() => index % 6 === 0, [index]);
  const stockPct = useMemo(() => Math.floor(Math.random() * 50 + 20), []);
  const stockLow = stockPct < 35;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, { quantity: 1 });
    toast({ title: "Ajouté au panier", description: product.name, duration: 2000 });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsVariants) {
      setLocation(`/product/${product.slug ?? product.id}`);
      return;
    }
    setLocation(`/checkout?direct=1&productId=${product.id}`);
    toast({ title: "Achat rapide", description: product.name, duration: 2000 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
    >
      {/* ── Image ── */}
      <Link href={`/product/${product.slug ?? product.id}`} className="block">
        <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: "75%" /* ratio 4/3 */ }}>
          <div className="absolute inset-0">
            {/* Badges top-left */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
              {hasDiscount && <ShimmerBadge text="PROMO" />}
              {isNew && !hasDiscount && <ShimmerBadge text="NOUVEAU" color="#3b82f6" />}
            </div>

            {/* Wishlist top-right */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWishlist((v) => !v); }}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            >
              <Heart className={`w-4 h-4 ${wishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
            </button>

            <img
              src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
        </div>
      </Link>

      {/* ── Infos ── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Catégorie + Note */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wide mb-1">
          <span className="truncate pr-2">{product.category?.name ?? "Catalogue"}</span>
          {rating > 0 ? (
            <span className="flex items-center gap-1 text-gray-700 normal-case shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              {reviewCount > 0 && <span className="text-[10px] text-gray-400">({reviewCount})</span>}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 normal-case">Sans avis</span>
          )}
        </div>

        {/* Nom */}
        <Link href={`/product/${product.slug ?? product.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem] hover:text-[#f97316] transition-colors">
            {product.name}
          </h3>
        </Link>
        <ProductShopLink
          product={product}
          showIcon
          className="mt-1 text-xs text-gray-500 hover:text-[#f97316]"
        />

        {/* Prix */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-[#f97316]">
            {discountedPrice.toLocaleString("fr-FR")} FCFA
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {price.toLocaleString("fr-FR")}
            </span>
          )}
        </div>

        {/* Barre de stock */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span className="uppercase tracking-wide">Stock restant</span>
            <span className={`font-bold uppercase ${stockLow ? "text-[#f97316]" : "text-[#22c55e]"}`}>
              {stockLow ? "Stock limité" : "Stock ok"}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${stockLow ? "bg-[#f97316]" : "bg-[#22c55e]"}`}
              style={{ width: `${stockPct}%` }}
            />
          </div>
        </div>

        {/* Boutons */}
        <button
          onClick={handleAddToCart}
          className="mt-4 w-full h-9 rounded-xl bg-[#f97316] text-white text-xs font-bold hover:bg-[#fb923c] active:scale-[0.98] transition-all flex items-center justify-center gap-1"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Ajouter au panier
        </button>
        {needsVariants ? (
          <Link
            href={`/product/${product.slug ?? product.id}`}
            className="mt-2 w-full h-9 rounded-xl border border-[#f97316] text-[#f97316] text-xs font-bold flex items-center justify-center hover:bg-[#f97316]/10 transition-colors"
          >
            Choisir options
          </Link>
        ) : (
          <button
            onClick={handleBuyNow}
            className="mt-2 w-full h-9 rounded-xl bg-[#f97316] text-white text-xs font-bold hover:bg-[#fb923c] active:scale-[0.98] transition-all flex items-center justify-center gap-1"
          >
            <Zap className="w-3.5 h-3.5" />
            Acheter maintenant
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function CardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
      animate={{ opacity: [0.4, 0.75, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.08 }}
    >
      <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200" style={{ paddingBottom: "75%" }} />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-8 bg-gray-100 rounded-xl" />
      </div>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function Products() {
  const init = getSearchParams();
  const [searchInput, setSearchInput] = useState(init.search);
  const [selectedCategory, setSelectedCategory] = useState(init.category);
  const [onSaleOnly, setOnSaleOnly] = useState(init.promo);
  const [visibleCount, setVisibleCount] = useState(18);
  const [priceMax, setPriceMax] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loaderRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 350);
  const { data: products, isLoading } = useProducts(debouncedSearch, selectedCategory, onSaleOnly);
  const { data: categories } = useCategories();
  const items = useCart((s) => s.items);
  const cartCount = items.reduce((n: number, i: any) => n + i.quantity, 0);
  const [, setLocation] = useLocation();

  const allProducts = products ?? [];
  const maxPrice = useMemo(
    () => allProducts.reduce((m: number, p: any) => Math.max(m, Number(p.price) || 0), 0),
    [allProducts]
  );
  const hasFreeShipping = useMemo(
    () => allProducts.some((p: any) => Boolean(p.freeShipping)),
    [allProducts]
  );

  useEffect(() => {
    if (maxPrice > 0) setPriceMax((prev) => (prev === 0 || prev > maxPrice ? maxPrice : prev));
  }, [maxPrice]);

  useEffect(() => {
    setSearchParams(debouncedSearch, selectedCategory, onSaleOnly);
    const catName = (categories as any[])?.find((c: any) => String(c.id) === selectedCategory)?.name ?? "";
    updateSEO(debouncedSearch, catName, onSaleOnly);
  }, [debouncedSearch, selectedCategory, onSaleOnly, categories]);

  const categoryCounts = useMemo(() => {
    const map = new Map<number, number>();
    allProducts.forEach((p: any) => {
      map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    });
    return map;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p: any) => {
      const priceOk = Number(p.price) <= (priceMax || maxPrice || Number(p.price));
      const stockOk = !inStockOnly || Boolean(p.isActive);
      const shippingOk = !freeShippingOnly || Boolean(p.freeShipping);
      return priceOk && stockOk && shippingOk;
    });
  }, [allProducts, priceMax, maxPrice, inStockOnly, freeShippingOnly]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        list.sort((a, b) => (b.discountPercentage || b.discount || 0) - (a.discountPercentage || a.discount || 0));
        break;
    }
    return list;
  }, [filteredProducts, sortBy]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore) setVisibleCount(n => n + 18); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  useEffect(() => {
    setVisibleCount(18);
  }, [selectedCategory, debouncedSearch, onSaleOnly, priceMax, inStockOnly, freeShippingOnly, sortBy]);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setSelectedCategory("");
    setOnSaleOnly(false);
    setPriceMax(maxPrice);
    setInStockOnly(false);
    setFreeShippingOnly(false);
    setVisibleCount(18);
  }, [maxPrice]);

  const activeCategoryName = (categories as any[])?.find(
    (c: any) => String(c.id) === selectedCategory
  )?.name ?? "";

  // ── FIX: 4 colonnes sur desktop ─────────────────────────────────────────────
  // La zone main fait lg:col-span-9 sur 12 colonnes (~75% du container).
  // On démarre à 1 col mobile → 2 col sm → 3 col md → 4 col xl
  // (xl = 1280px correspond à la taille où 4 cols tiennent dans 75% du max-1440px)
  const gridClass =
    viewMode === "list"
      ? "grid-cols-1"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="min-h-screen bg-[#f6f7fb] pt-14 sm:pt-16">
      <div className="container mx-auto px-4 max-w-[1440px] py-6">

        {/* ── Layout: sidebar + contenu côte à côte sur desktop ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Sidebar Filtres ── */}
          <aside className="w-full lg:w-[240px] lg:shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-20">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
                <SlidersHorizontal className="w-4 h-4 text-[#f97316]" />
                Filtres Avancés
              </div>

              <div className="space-y-4">
                {/* Catégories */}
                <div className="bg-[#f7f8fb] rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-widest">Catégories</p>
                  <div className="space-y-1">
                    <button
                      onClick={handleReset}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        !selectedCategory ? "bg-[#fff1e7] text-[#f97316]" : "text-gray-700 hover:bg-white"
                      }`}
                    >
                      <span>Tout</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${!selectedCategory ? "bg-[#f97316] text-white" : "bg-gray-200 text-gray-500"}`}>
                        {allProducts.length.toLocaleString("fr-FR")}
                      </span>
                    </button>
                    {(categories as any[])?.map((cat: any) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(prev => prev === String(cat.id) ? "" : String(cat.id))}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedCategory === String(cat.id)
                            ? "bg-[#fff1e7] text-[#f97316]"
                            : "text-gray-700 hover:bg-white"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${selectedCategory === String(cat.id) ? "bg-[#f97316] text-white" : "bg-gray-200 text-gray-500"}`}>
                          {(categoryCounts.get(cat.id) || 0).toLocaleString("fr-FR")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prix */}
                <div className="bg-[#f7f8fb] rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-widest">Prix</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                    <span>0 FCFA</span>
                    <span className="font-bold text-[#f97316]">{priceMax.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(maxPrice, 1)}
                    step={500}
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-[#f97316]"
                  />
                </div>

                {/* Disponibilité */}
                <div className="bg-[#f7f8fb] rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-widest">Disponibilité</p>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="accent-[#f97316]"
                    />
                    En stock
                  </label>
                  <label className={`mt-2 flex items-center gap-2 text-xs cursor-pointer ${hasFreeShipping ? "text-gray-700" : "text-gray-400"}`}>
                    <input
                      type="checkbox"
                      checked={freeShippingOnly}
                      onChange={(e) => setFreeShippingOnly(e.target.checked)}
                      className="accent-[#f97316]"
                      disabled={!hasFreeShipping}
                    />
                    Livraison gratuite
                  </label>
                </div>
              </div>

              <button
                onClick={() => setVisibleCount(18)}
                className="mt-4 w-full h-10 rounded-xl bg-[#f97316] text-white text-xs font-bold hover:bg-[#fb923c] transition-colors shadow-md shadow-orange-100"
              >
                Appliquer les filtres
              </button>
            </div>
          </aside>

          {/* ── Contenu principal ── */}
          <main className="flex-1 min-w-0">

            {/* Barre titre + tri + recherche */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Nos Produits</h1>
                  <p className="text-sm text-[#f97316] font-semibold mt-0.5">
                    <AnimatedCount value={sortedProducts.length} /> produits trouvés
                    {activeCategoryName && <> · <span className="text-gray-500 font-semibold">{activeCategoryName}</span></>}
                    {onSaleOnly && <> · <span className="text-[#f97316] font-semibold">Promotions</span></>}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Tri */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none h-9 pr-8 pl-3 text-xs font-semibold border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer"
                    >
                      <option value="popular">Trier par : Popularité</option>
                      <option value="price_asc">Prix : bas → élevé</option>
                      <option value="price_desc">Prix : élevé → bas</option>
                      <option value="newest">Nouveautés</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Vue grille / liste */}
                  <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`h-9 w-9 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-[#f97316] text-white" : "text-gray-400 hover:bg-gray-50"}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`h-9 w-9 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-[#f97316] text-white" : "text-gray-400 hover:bg-gray-50"}`}
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recherche + filtres rapides */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Rechercher un produit, une marque..."
                    className="w-full h-10 pl-9 pr-9 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#f97316] transition-colors"
                  />
                  <AnimatePresence>
                    {searchInput && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setSearchInput("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {(selectedCategory || debouncedSearch || onSaleOnly || inStockOnly || freeShippingOnly) && (
                  <button
                    onClick={handleReset}
                    className="h-10 px-3 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-[#f97316] hover:text-[#f97316] transition-colors"
                  >
                    Effacer filtres
                  </button>
                )}

                <button
                  onClick={() => setOnSaleOnly((v) => !v)}
                  className={`h-10 px-4 rounded-lg text-xs font-semibold border transition-colors ${
                    onSaleOnly
                      ? "bg-[#f97316] text-white border-[#f97316]"
                      : "border-gray-200 text-gray-600 hover:border-[#f97316] hover:text-[#f97316]"
                  }`}
                >
                  Promotions
                </button>
              </div>
            </div>

            {/* Grille produits */}
            {isLoading ? (
              <div className={`grid ${gridClass} gap-4`}>
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} index={i} />)}
              </div>
            ) : sortedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white rounded-2xl border border-gray-200"
              >
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="font-bold text-gray-900 mb-1">Aucun produit trouvé</h3>
                <p className="text-sm text-gray-500 mb-6">Essayez d'autres mots-clés ou une autre catégorie.</p>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f97316] text-white text-sm font-bold hover:bg-[#fb923c] transition-colors"
                >
                  Voir tous les produits
                </button>
              </motion.div>
            ) : (
              <>
                <div className={`grid ${gridClass} gap-4`}>
                  <AnimatePresence>
                    {visibleProducts.map((product: any, i: number) => (
                      <CatalogueProductCard key={product.id} product={product} index={i} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="py-8 flex justify-center">
                  {hasMore ? (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="flex items-center gap-2 text-xs text-gray-400"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full"
                      />
                      Chargement...
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-400"
                    >
                      — Fin du catalogue ({sortedProducts.length} produits) —
                    </motion.p>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Floating cart (mobile uniquement) ── */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setLocation("/cart")}
            className="fixed bottom-6 right-4 z-40 md:hidden flex items-center gap-2 bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white px-4 py-3 rounded-full shadow-2xl font-bold text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Panier · {cartCount}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
