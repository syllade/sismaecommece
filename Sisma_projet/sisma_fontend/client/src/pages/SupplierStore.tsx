import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useSupplier, useSupplierProducts, useSuppliers, getSupplierGradient, getSupplierInitials } from "@/hooks/use-suppliers";
import {
  getProductCategoryLabel,
  getProductCreatedAt,
  getProductFinalPrice,
  getProductPopularityScore,
  getProductPrice,
  useShopDetails,
} from "@/hooks/use-marketplace";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { hasRequiredVariants } from "@/data/variants";

type SortMode = "popular" | "newest" | "price_asc" | "price_desc";

function isRecent(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= 14 * 24 * 60 * 60 * 1000;
}

function StoreProductCard({ product, compact = false }: { product: any; compact?: boolean }) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [adding, setAdding] = useState(false);
  const price = getProductPrice(product);
  const finalPrice = getProductFinalPrice(product);
  const rating = Number(product.rating ?? product.averageRating ?? 0);
  const discount = Number(product.discount ?? product.discountPercentage ?? 0);
  const needsVariants = hasRequiredVariants(product as { colors?: string[]; sizes?: string[] });

  const handleAddToCart = async () => {
    setAdding(true);
    addItem(product, { quantity: 1 });
    toast({ title: "Ajouté au panier", description: product.name, duration: 1600 });
    await new Promise((resolve) => setTimeout(resolve, 350));
    setAdding(false);
  };

  const handleBuyNow = () => {
    if (needsVariants) {
      setLocation(`/product/${product.slug ?? product.id}`);
      return;
    }
    setLocation(`/checkout?direct=1&productId=${product.id}`);
  };

  return (
    <article
      className={`group overflow-hidden rounded-[24px] border border-[#ecd7c7] bg-white shadow-sm ${
        compact ? "w-[235px] shrink-0" : ""
      }`}
    >
      <Link href={`/product/${product.slug ?? product.id}`} className="block">
        <div className="relative aspect-[4/4.3] overflow-hidden bg-[#f4ece4]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#b08a70]">
              <Package className="h-8 w-8" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {discount > 0 && (
              <span className="rounded-full bg-[#a74212] px-2.5 py-1 text-[11px] font-bold text-white">
                -{discount}%
              </span>
            )}
            {isRecent(getProductCreatedAt(product)) && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#7e3d15]">
                Nouveau
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a17b61]">
          {getProductCategoryLabel(product)}
        </p>
        <Link href={`/product/${product.slug ?? product.id}`}>
          <h3 className="mt-1 line-clamp-2 text-base font-black leading-snug text-[#2b2119] transition-colors group-hover:text-[#a74212]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-black text-[#a74212]">{finalPrice.toLocaleString("fr-FR")} F</p>
            {discount > 0 && (
              <p className="text-xs text-[#aa8c78] line-through">{price.toLocaleString("fr-FR")} F</p>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 text-sm text-[#6b5240]">
            <Star className="h-4 w-4 fill-[#f4b43d] text-[#f4b43d]" />
            {rating > 0 ? rating.toFixed(1) : "Sans note"}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="rounded-full border border-[#e8d5c6] px-4 py-2.5 text-sm font-semibold text-[#624b3b] hover:bg-[#fff7f0]"
          >
            {adding ? "Ajout..." : "Ajouter"}
          </button>
          <button
            onClick={handleBuyNow}
            className="rounded-full bg-[#2b2119] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#453327]"
          >
            {needsVariants ? "Options" : "Acheter"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function SupplierStore() {
  const [, paramsShop] = useRoute("/shop/:id");
  const identifier = paramsShop?.id ?? "";
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const resolvedSupplier = useMemo(
    () =>
      (suppliers as any[]).find(
        (supplier) => String(supplier?.id) === String(identifier) || String(supplier?.slug) === String(identifier),
      ) ?? null,
    [identifier, suppliers],
  );
  const lookupKey =
    resolvedSupplier?.slug ||
    (/^\d+$/.test(String(identifier)) ? "" : identifier);
  const { data: supplierResponse, isLoading: supplierLoading } = useSupplier(lookupKey);
  const supplier = (supplierResponse as any)?.data ?? supplierResponse ?? null;
  const { data: shopPayload, isLoading: shopLoading } = useShopDetails(lookupKey);
  const shop = shopPayload?.shop ?? null;
  const reviews = shopPayload?.testimonials ?? [];
  const supplierId = Number(supplier?.id ?? shop?.id ?? resolvedSupplier?.id ?? 0);
  const { data: supplierProductsResponse, isLoading: productsLoading } = useSupplierProducts(supplierId);
  const { data: catalogueProducts = [] } = useProducts();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortMode>("popular");
  const [priceCap, setPriceCap] = useState(0);

  const allSupplierProducts = useMemo(() => {
    const sourceProducts = Array.isArray(supplierProductsResponse) ? supplierProductsResponse : [];
    const catalogueById = new Map((catalogueProducts as any[]).map((product) => [String(product.id), product]));

    return sourceProducts.map((product: any) => {
      const catalogue = catalogueById.get(String(product.id)) ?? {};
      return {
        ...catalogue,
        ...product,
        category_name: product.category_name ?? catalogue.category?.name,
        category_id: product.category_id ?? catalogue.category?.id,
        image: product.image ?? catalogue.image,
        discount: product.discount ?? catalogue.discount ?? catalogue.discountPercentage,
        rating: catalogue.rating ?? catalogue.averageRating,
        reviews_count: catalogue.reviews_count ?? catalogue.reviewCount,
        created_at: product.created_at ?? catalogue.created_at ?? catalogue.createdAt,
      };
    });
  }, [catalogueProducts, supplierProductsResponse]);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; cover?: string }>();
    allSupplierProducts.forEach((product) => {
      const id = String(product.category_id ?? product.category?.id ?? "other");
      const current = map.get(id) ?? { id, name: getProductCategoryLabel(product), count: 0, cover: product.image };
      current.count += 1;
      current.cover = current.cover ?? product.image;
      map.set(id, current);
    });
    return Array.from(map.values());
  }, [allSupplierProducts]);

  const maxPrice = useMemo(
    () => allSupplierProducts.reduce((highest, product) => Math.max(highest, getProductPrice(product)), 0),
    [allSupplierProducts],
  );

  useEffect(() => {
    if (maxPrice > 0) {
      setPriceCap((current) => (current === 0 || current > maxPrice ? maxPrice : current));
    }
  }, [maxPrice]);

  const sortedProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = allSupplierProducts.filter((product) => {
      const categoryId = String(product.category_id ?? product.category?.id ?? "other");
      const matchesCategory = selectedCategory === "all" || selectedCategory === categoryId;
      const matchesPrice = getProductPrice(product) <= (priceCap || maxPrice || getProductPrice(product));
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${getProductCategoryLabel(product)}`.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesPrice && matchesSearch;
    });

    return filtered.sort((left, right) => {
      if (sortBy === "price_asc") return getProductPrice(left) - getProductPrice(right);
      if (sortBy === "price_desc") return getProductPrice(right) - getProductPrice(left);
      if (sortBy === "newest") {
        return new Date(getProductCreatedAt(right)).getTime() - new Date(getProductCreatedAt(left)).getTime();
      }
      return getProductPopularityScore(right) - getProductPopularityScore(left);
    });
  }, [allSupplierProducts, maxPrice, priceCap, search, selectedCategory, sortBy]);

  const groupedProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; products: any[] }>();
    sortedProducts.forEach((product) => {
      const id = String(product.category_id ?? product.category?.id ?? "other");
      const current = map.get(id) ?? { id, name: getProductCategoryLabel(product), products: [] };
      current.products.push(product);
      map.set(id, current);
    });
    return Array.from(map.values());
  }, [sortedProducts]);

  const topProducts = useMemo(
    () => [...allSupplierProducts].sort((a, b) => getProductPopularityScore(b) - getProductPopularityScore(a)).slice(0, 8),
    [allSupplierProducts],
  );
  const newProducts = useMemo(
    () =>
      [...allSupplierProducts]
        .sort((a, b) => new Date(getProductCreatedAt(b)).getTime() - new Date(getProductCreatedAt(a)).getTime())
        .slice(0, 8),
    [allSupplierProducts],
  );

  if (suppliersLoading || supplierLoading || shopLoading || (supplierId > 0 && productsLoading)) {
    return <div className="min-h-screen bg-[#f6f1eb] pt-14 sm:pt-16" />;
  }

  if (!supplier && !shop) {
    return (
      <div className="min-h-screen bg-[#f6f1eb] pt-14 sm:pt-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#a74212] shadow-sm"><Store className="h-10 w-10" /></div>
          <h1 className="mt-6 text-3xl font-black text-[#2b2119]">Boutique introuvable</h1>
          <Link href="/shops" className="mt-8 rounded-full bg-[#2b2119] px-5 py-3 text-sm font-semibold text-white">Retour aux boutiques</Link>
        </div>
      </div>
    );
  }

  const storeName = supplier?.name ?? shop?.name ?? "Boutique SISMA";
  const storeDescription = supplier?.description ?? "Une boutique fournisseur SISMA avec une identité claire et une sélection organisée par catégories.";
  const storeBanner = supplier?.banner ?? supplier?.cover_image ?? "";
  const storeLogo = supplier?.logo ?? shop?.logo;
  const storeAddress = supplier?.address ?? shop?.address ?? "Marketplace Afrique de l'Ouest";
  const storePhone = supplier?.phone ?? shop?.phone;
  const storeEmail = supplier?.email ?? shop?.email;
  const storeRating = Number(shop?.avg_rating ?? 0);
  const storeReviewCount = Number(shop?.ratings_count ?? 0);
  const initials = getSupplierInitials(storeName);
  const avatarGradient = getSupplierGradient(storeName);
  const shopPath = `/shop/${supplierId || resolvedSupplier?.id || identifier}`;
  const storeUrl = typeof window !== "undefined" ? `${window.location.origin}${shopPath}` : shopPath;

  return (
    <div className="min-h-screen bg-[#f6f1eb] pt-14 sm:pt-16">
      <section className="relative">
        <div className="h-[300px] sm:h-[360px] lg:h-[420px]">
          {storeBanner ? <img src={storeBanner} alt={storeName} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-[#2b2119] via-[#8b3612] to-[#f08d2f]" />}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,17,12,0.3)_0%,rgba(23,17,12,0.78)_100%)]" />
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/shops" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur"><ArrowLeft className="h-4 w-4" />Retour</Link>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(storeUrl)} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur"><Copy className="h-4 w-4" />Copier</button>
            <button onClick={() => navigator.clipboard.writeText(storeUrl)} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur"><Share2 className="h-4 w-4" />Partager</button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[34px] border border-white/60 bg-white/92 p-6 shadow-[0_30px_90px_rgba(53,30,17,0.14)] backdrop-blur lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-[#efd7c5] bg-[#f6f1eb]">
                    {storeLogo ? <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white" style={{ background: avatarGradient }}>{initials}</div>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-black text-[#2b2119] sm:text-4xl">{storeName}</h1>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3ea] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#a74312]"><CheckCircle2 className="h-4 w-4" />Boutique fournisseur</span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b5240] sm:text-base">{storeDescription}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#6b5240]">
                      <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 fill-[#f7b33d] text-[#f7b33d]" />{storeRating > 0 ? storeRating.toFixed(1) : "Nouvelle boutique"} · {storeReviewCount} avis</span>
                      <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#a74312]" />{storeAddress}</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[{ label: "Produits", value: allSupplierProducts.length }, { label: "Catégories", value: categories.length }, { label: "Avis", value: storeReviewCount }].map((item) => (
                    <div key={item.label} className="rounded-[24px] bg-[#faf4ef] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d7b63]">{item.label}</p>
                      <p className="mt-2 text-2xl font-black text-[#2b2119]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-40 sm:px-6 lg:px-8 lg:pt-44">
        <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="rounded-[30px] border border-[#edd9ca] bg-white/88 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d7b63]">Header boutique</p>
            <h2 className="mt-1 text-2xl font-black text-[#2b2119]">Une vraie identité de boutique, pensée pour inspirer confiance</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b5240]">Bannière, note client, description et organisation par catégories: la visite devient plus rassurante et plus claire.</p>
          </div>
          <aside className="rounded-[30px] border border-[#edd9ca] bg-white/88 p-5 shadow-sm">
            <div className="space-y-4">
              <div className="rounded-[24px] bg-[#faf4ef] p-4"><div className="flex items-center gap-2"><Star className="h-5 w-5 fill-[#f4b43d] text-[#f4b43d]" /><span className="text-lg font-black text-[#2b2119]">{storeRating > 0 ? storeRating.toFixed(1) : "0.0"}</span></div><p className="mt-1 text-sm text-[#6b5240]">Note client moyenne après livraison</p></div>
              <div className="space-y-3 rounded-[24px] border border-[#f0dfd1] bg-[#fffaf5] p-4">
                <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0e6] text-[#a74312]"><Truck className="h-4 w-4" /></div><div><p className="font-bold text-[#2b2119]">Navigation fluide</p><p className="text-sm leading-6 text-[#6b5240]">Top produits, nouveautés et catalogue filtré dans une même boutique.</p></div></div>
                <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ecfff2] text-[#2f8a4d]"><ShieldCheck className="h-4 w-4" /></div><div><p className="font-bold text-[#2b2119]">Confiance renforcée</p><p className="text-sm leading-6 text-[#6b5240]">Le client voit la boutique avant de choisir ses produits.</p></div></div>
              </div>
              {storePhone && <a href={`https://wa.me/${storePhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${storeName}, je viens de votre boutique SISMA.\n${storeUrl}`)}`} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f9d55] px-4 py-3 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" />WhatsApp boutique</a>}
              {storeEmail && <a href={`mailto:${storeEmail}`} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e8d6c8] bg-white px-4 py-3 text-sm font-semibold text-[#6b5240]"><Mail className="h-4 w-4" />Contacter par email</a>}
            </div>
          </aside>
        </section>

        {topProducts.length > 0 && <section id="top-produits" className="mt-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d7b63]">Top produits</p><h2 className="mt-1 text-2xl font-black text-[#2b2119]">Les indispensables de la boutique</h2><div className="mt-5 flex gap-4 overflow-x-auto pb-2">{topProducts.map((product) => <StoreProductCard key={`top-${product.id}`} product={product} compact />)}</div></section>}

        {newProducts.length > 0 && <section id="nouveaux-produits" className="mt-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d7b63]">Nouveaux produits</p><h2 className="mt-1 text-2xl font-black text-[#2b2119]">Les dernières nouveautés</h2><div className="mt-5 flex gap-4 overflow-x-auto pb-2">{newProducts.map((product) => <StoreProductCard key={`new-${product.id}`} product={product} compact />)}</div></section>}

        {categories.length > 0 && <section id="categories" className="mt-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d7b63]">Catégories</p><h2 className="mt-1 text-2xl font-black text-[#2b2119]">Choisissez un univers de boutique</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{categories.map((category) => <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`overflow-hidden rounded-[28px] border text-left ${selectedCategory === category.id ? "border-[#ad4212] bg-[#2b2119] text-white" : "border-[#edd9ca] bg-white"}`}><div className="relative aspect-[1.5/1] overflow-hidden bg-[#f4ece4]">{category.cover ? <img src={category.cover} alt={category.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[#ad8a73]"><Package className="h-8 w-8" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" /><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#6b5240]">{category.count} produits</span></div><div className="p-4"><p className="text-lg font-black">{category.name}</p><p className={`mt-1 text-sm ${selectedCategory === category.id ? "text-white/70" : "text-[#6b5240]"}`}>Voir l'assortiment</p></div></button>)}</div></section>}

        <section id="catalogue" className="mt-10 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-[#edd9ca] bg-white/88 p-5 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d7b63]">Filtres</p>
            <h2 className="mt-1 text-2xl font-black text-[#2b2119]">Prix, popularité, nouveautés</h2>
            <div className="mt-5 space-y-5">
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9d7b63]">Recherche</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aa8d78]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom produit ou catégorie" className="h-12 w-full rounded-full border border-[#ecd7c8] bg-[#fffaf5] pl-10 pr-4 text-sm text-[#2b2119] outline-none" /></div></div>
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9d7b63]">Prix maximum</label><div className="rounded-[22px] bg-[#faf4ef] p-4"><div className="flex items-center justify-between text-sm text-[#6b5240]"><span>0 F</span><span className="font-bold text-[#a74212]">{priceCap.toLocaleString("fr-FR")} F</span></div><input type="range" min={0} max={Math.max(maxPrice, 1)} step={500} value={priceCap} onChange={(event) => setPriceCap(Number(event.target.value))} className="mt-3 w-full accent-[#ad4212]" /></div></div>
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9d7b63]">Tri</label><div className="grid gap-2">{[{ value: "popular", label: "Popularité", icon: TrendingUp }, { value: "newest", label: "Nouveautés", icon: Sparkles }, { value: "price_asc", label: "Prix croissant", icon: ArrowLeft }, { value: "price_desc", label: "Prix décroissant", icon: ArrowLeft }].map((option) => <button key={option.value} onClick={() => setSortBy(option.value as SortMode)} className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold ${sortBy === option.value ? "bg-[#2b2119] text-white" : "bg-[#fff7f1] text-[#6b5240]"}`}><option.icon className="h-4 w-4" />{option.label}</button>)}</div></div>
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9d7b63]">Catégories</label><div className="flex flex-wrap gap-2"><button onClick={() => setSelectedCategory("all")} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedCategory === "all" ? "bg-[#ad4212] text-white" : "bg-[#fff7f1] text-[#6b5240]"}`}>Tout</button>{categories.map((category) => <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedCategory === category.id ? "bg-[#ad4212] text-white" : "bg-[#fff7f1] text-[#6b5240]"}`}>{category.name}</button>)}</div></div>
            </div>
          </aside>

          <div className="space-y-8">
            <div className="rounded-[30px] border border-[#edd9ca] bg-white/88 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d7b63]">Catalogue filtré</p><h2 className="mt-1 text-2xl font-black text-[#2b2119]">Produits classés par catégorie</h2><p className="mt-2 text-sm leading-6 text-[#6b5240]">Le client garde la main sur le prix, la popularité et les nouveautés tout en restant dans l'identité de la boutique.</p></div>
            {groupedProducts.length === 0 ? <div className="rounded-[30px] border border-dashed border-[#dcc3b0] bg-white/80 px-6 py-14 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff2e8] text-[#ad4212]"><Search className="h-8 w-8" /></div><h3 className="mt-4 text-xl font-black text-[#2b2119]">Aucun produit ne correspond aux filtres</h3></div> : groupedProducts.map((group, index) => <motion.section key={group.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.18) }} className="rounded-[30px] border border-[#edd9ca] bg-white/88 p-5 shadow-sm"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d7b63]">Catégorie</p><h3 className="mt-1 text-2xl font-black text-[#2b2119]">{group.name}</h3></div><span className="rounded-full bg-[#faf4ef] px-4 py-2 text-sm font-semibold text-[#6b5240]">{group.products.length} produits</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{group.products.map((product) => <StoreProductCard key={product.id} product={product} />)}</div></motion.section>)}
          </div>
        </section>

        {reviews.length > 0 && <section className="mt-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d7b63]">Avis clients</p><h2 className="mt-1 text-2xl font-black text-[#2b2119]">Retours après livraison</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{reviews.slice(0, 3).map((review: any) => <div key={review.id} className="rounded-[24px] border border-[#eedccd] bg-white p-4 shadow-sm"><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="h-3.5 w-3.5" fill={value <= Math.round(Number(review.rating ?? 0)) ? "#f7b33d" : "none"} stroke={value <= Math.round(Number(review.rating ?? 0)) ? "#f7b33d" : "#e5d7cb"} />)}</div><p className="mt-3 line-clamp-4 text-sm leading-6 text-[#553f31]">{review.comment || "Avis client disponible après livraison."}</p><div className="mt-4 border-t border-[#f4e7dd] pt-3"><p className="text-sm font-bold text-[#2b2119]">{review.user_name || "Client vérifié"}</p></div></div>)}</div></section>}
      </main>
    </div>
  );
}
