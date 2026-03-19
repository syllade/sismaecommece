/**
 * SISMA - Category Marketplace Page
 * Design moderne style marketplace avec hero, boutiques, produits
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  TrendingUp,
  Truck,
  Heart,
  LayoutGrid,
  Layers3,
} from "lucide-react";
import { useCategories, useProducts } from "@/hooks/use-products";
import { getSupplierGradient, getSupplierInitials, useSuppliers } from "@/hooks/use-suppliers";
import type { Product } from "@shared/schema";
import {
  getProductCategoryLabel,
  getProductCreatedAt,
  getProductPopularityScore,
  getProductSupplierId,
  getProductSupplierName,
  slugifyCategory,
} from "@/hooks/use-marketplace";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

type SortMode = "rating" | "sales" | "popularity" | "newest";

type SupplierEntry = {
  id: number | string;
  slug: string;
  name: string;
  logo?: string;
  banner?: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  popularity: number;
  products: any[];
};

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatPrice(value: number): string {
  return `${Number(value || 0).toLocaleString("fr-FR")} €`;
}

function parseTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getProductSales(product: any): number {
  const value = Number(product?.sales_count ?? product?.sales ?? product?.popularity ?? product?.views ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getProductPrice(product: any): number {
  const price = Number(product?.price ?? product?.salePrice ?? 0);
  return Number.isFinite(price) ? price : 0;
}

function getCategoryNarrative(category: any) {
  const name = String(category?.name ?? "").toLowerCase();
  const narratives: Record<string, { headline: string; body: string }> = {
    mode: { headline: "Élégance & Style", body: "Découvrez les meilleures collections de nos boutiques partenaires. Qualité premium et livraison multi-fournisseurs." },
    technologie: { headline: "Tech & Innovation", body: "Comparez les boutiques spécialisées en smartphones, accessoires et technologies du quotidien." },
    beaute: { headline: "Beauté & Bien-être", body: "Des boutiques confiance et des produits de beauté choisis pour le quotidien comme pour les occasions." },
    maison: { headline: "Déco & Interior", body: "Amenagez votre intérieur avec des boutiques inspirées et des articles adaptés à tous les styles." },
  };

  for (const [key, narrative] of Object.entries(narratives)) {
    if (name.includes(key)) return narrative;
  }

  return {
    headline: category?.name || "Catégorie SISMA",
    body: category?.description || "Rejoignez notre marketplace et descubrez des produits de qualite de nos boutiques partenaires.",
  };
}

// Composant: Carte Boutique
function ShopCard({ supplier, index }: { supplier: SupplierEntry; index: number }) {
  const previewProducts = supplier.products.slice(0, 3);
  const gradient = getSupplierGradient(supplier.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-2xl transition-all"
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl p-2 ${gradient}`}>
              {supplier.logo ? (
                <img src={supplier.logo} alt={supplier.name} className="h-full w-full rounded-lg object-contain" />
              ) : (
                <span className="text-xl font-black text-white">{getSupplierInitials(supplier.name)}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">{supplier.name}</h3>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-xs font-bold">{supplier.rating.toFixed(1)} ({supplier.reviewCount} avis)</span>
              </div>
            </div>
          </div>
          {index === 0 && (
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">PRO</span>
          )}
          {index === 1 && (
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">Top Seller</span>
          )}
        </div>

        {/* Mini grille produits */}
        <div className="grid grid-cols-3 gap-2">
          {previewProducts.map((product: any, i: number) => (
            <div key={product?.id || i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
              {product?.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  <Package className="h-6 w-6" />
                </div>
              )}
            </div>
          ))}
          {supplier.products.length > 3 && (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
              <span className="absolute text-white text-xs font-bold">+{supplier.products.length - 3}</span>
            </div>
          )}
        </div>

        <Link
          href={`/shop/${supplier.slug || supplier.id}`}
          className="mt-6 block w-full rounded-xl bg-slate-100 dark:bg-slate-700 py-3 text-center font-bold text-sm text-slate-900 dark:text-white transition-all group-hover:bg-primary group-hover:text-white"
        >
          Visiter la boutique
        </Link>
      </div>
    </motion.div>
  );
}

// Composant: Carte Produit
function ProductCard({ product, supplier, index }: { product: any; supplier: SupplierEntry; index: number }) {
  const { addItem, items } = useCart();
  const { toast } = useToast();
  const price = getProductPrice(product);
  const oldPrice = product?.compareAtPrice || product?.originalPrice;
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const isInCart = items.some((item) => item.id === product?.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // Transform product to match Product interface expected by cart
    const productForCart = {
      id: Number(product?.id),
      categoryId: Number(product?.categoryId || product?.category_id || 1),
      name: product?.name || "Produit",
      description: product?.description || null,
      price: price,
      commissionRate: product?.commissionRate || product?.commission_rate || null,
      image: product?.image || null,
      isActive: true,
      createdAt: new Date(),
    };
    addItem(productForCart, { quantity: 1 });
    toast({ title: "Ajouté au panier", description: `${product?.name} a été ajouté` });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl transition-all"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {product?.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-slate-100 flex items-center justify-center">
            <Package className="h-12 w-12 text-slate-400" />
          </div>
        )}

        {/* Bouton favoris */}
        <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full text-slate-900 dark:text-white hover:text-primary transition-colors">
          <Heart className="h-5 w-5" />
        </button>

        {/* Badge promo */}
        {discount > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-lg">
              -{discount}%
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Nom boutique */}
        <div className="mb-2 flex items-center gap-2">
          {supplier.logo && (
            <img src={supplier.logo} alt={supplier.name} className="h-5 w-5 rounded-md object-cover" />
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {supplier.name}
          </span>
        </div>

        {/* Nom produit */}
        <h3 className="mb-1 font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
          {product?.name || "Produit SISMA"}
        </h3>

        {/* Ventes */}
        <p className="mb-3 text-xs text-slate-500">{getProductSales(product)} ventes cette semaine</p>

        {/* Prix et panier */}
        <div className="flex items-center justify-between gap-4 mt-auto">
          <div>
            {oldPrice && oldPrice > price && (
              <p className="text-[10px] text-slate-400 line-through">{formatPrice(oldPrice)}</p>
            )}
            <p className="text-lg font-black text-primary">{formatPrice(price)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isInCart}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              isInCart
                ? "bg-green-100 text-green-600"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Composant: Filtres et Tri
function FilterSection({
  sortBy,
  setSortBy,
  search,
  setSearch,
}: {
  sortBy: SortMode;
  setSortBy: (s: SortMode) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const sortOptions: { value: SortMode; label: string; icon: React.ReactNode }[] = [
    { value: "popularity", label: "Popularité", icon: <Star className="h-4 w-4" /> },
    { value: "sales", label: "Ventes", icon: <TrendingUp className="h-4 w-4" /> },
    { value: "rating", label: "Note", icon: <BadgeCheck className="h-4 w-4" /> },
    { value: "newest", label: "Nouveautés", icon: <Clock3 className="h-4 w-4" /> },
  ];

  return (
    <section className="mb-12 sticky top-20 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm py-4 rounded-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Tri */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mr-2">Trier par :</span>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                sortBy === option.value
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="w-full md:w-72">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer dans la catégorie..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary text-sm"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Composant: Section Confiance
function TrustSection() {
  const trustFeatures = [
    { icon: Truck, title: "Livraison Multi-fournisseurs", description: "Un seul panier pour toutes vos boutiques préférées." },
    { icon: CreditCard, title: "Paiement Sécurisé", description: "Solutions de paiement 100% cryptées et garanties." },
    { icon: ShieldCheck, title: "Boutiques Vérifiées", description: "Les meilleures boutiques de la catégorie sont mises en avant." },
    { icon: Clock3, title: "Suivi de Commande", description: "Suivez vos achats et l'état de livraison depuis votre espace." },
  ];

  return (
    <section className="mt-24 p-8 md:p-12 bg-primary/5 rounded-[40px] border border-primary/10 flex flex-col md:flex-row items-center gap-12">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-4xl text-primary" />
          <h2 className="text-3xl font-black">Achetez en toute confiance</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {trustFeatures.map((feature, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold mb-1">{feature.title}</h4>
                <p className="text-sm text-slate-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Page principale
export default function CategoryMarketplace() {
  const [, params] = useRoute("/categories/:category");
  const categoryParam = params?.category ?? "";
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("popularity");

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const currentCategory = useMemo(() => {
    return (categories as any[]).find((category) => {
      const categorySlug = slugifyCategory(category?.slug || category?.name || category?.id);
      return categorySlug === slugifyCategory(categoryParam) || String(category?.id) === String(categoryParam);
    });
  }, [categories, categoryParam]);

  const categoryId = currentCategory?.id ? String(currentCategory.id) : undefined;
  const { data: products = [], isLoading: productsLoading } = useProducts(undefined, categoryId);
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();

  const supplierEntries = useMemo(() => {
    const suppliersById = new Map(
      (suppliers as any[]).map((supplier) => [String(supplier?.id ?? supplier?.slug), supplier]),
    );
    const normalizedSearch = search.trim().toLowerCase();
    const map = new Map<string, SupplierEntry>();

    (products as any[]).forEach((product) => {
      const supplierKey = getProductSupplierId(product);
      if (!supplierKey) return;

      const supplierRecord = suppliersById.get(supplierKey);

      const current: SupplierEntry = map.get(supplierKey) ?? {
        id: supplierRecord?.id ?? product?.supplier_id ?? supplierKey,
        slug: supplierRecord?.slug ?? "",
        name: supplierRecord?.name ?? getProductSupplierName(product) ?? "Boutique partenaire",
        logo: supplierRecord?.logo,
        banner: supplierRecord?.banner,
        rating: Number(supplierRecord?.rating ?? supplierRecord?.avg_rating ?? 4.5),
        reviewCount: Number(supplierRecord?.reviews_count ?? 0),
        totalSales: 0,
        popularity: 0,
        products: [],
      };

      current.totalSales += getProductSales(product);
      current.popularity += getProductPopularityScore(product);
      current.products.push(product);
      map.set(supplierKey, current);
    });

    return Array.from(map.values()).filter((entry) => {
      if (!normalizedSearch) return true;
      const searchable = `${entry.name} ${entry.products.map((p) => p?.name || "").join(" ")}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [products, search, suppliers]);

  const featuredShops = supplierEntries.slice(0, 3);

  const recommendedProducts = useMemo(() => {
    return supplierEntries
      .flatMap((supplier) => supplier.products.map((product) => ({ product, supplier })))
      .sort((left, right) => {
        if (sortBy === "sales") return getProductSales(right.product) - getProductSales(left.product);
        if (sortBy === "popularity") return getProductPopularityScore(right.product) - getProductPopularityScore(left.product);
        if (sortBy === "newest") return parseTimestamp(getProductCreatedAt(right.product)) - parseTimestamp(getProductCreatedAt(left.product));
        return (right.product?.rating ?? 0) - (left.product?.rating ?? 0);
      });
  }, [sortBy, supplierEntries]);

  const hero = getCategoryNarrative(currentCategory);
  const heroImage = recommendedProducts[0]?.product?.image || currentCategory?.image;

  // Stats
  const totalBoutiques = supplierEntries.length;
  const totalProduits = products.length;

  if (!categoriesLoading && !currentCategory && categoryParam) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark pt-14">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <Store className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-3xl font-black">Catégorie introuvable</h1>
          <Link href="/categories" className="mt-8 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Retour aux catégories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 text-primary">
                <LayoutGrid className="text-3xl font-bold" />
                <h2 className="text-2xl font-black tracking-tighter">SISMA</h2>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/shops" className="text-sm font-semibold hover:text-primary transition-colors">Boutiques</Link>
                <Link href="/categories" className="text-sm font-semibold text-primary">Produits</Link>
                <Link href="/products?promo=1" className="text-sm font-semibold hover:text-primary transition-colors">Promos</Link>
              </nav>
            </div>
            <div className="flex flex-1 justify-end items-center gap-4 max-w-xl ml-8">
              <div className="relative w-full hidden sm:block">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2 border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Rechercher un produit, une marque..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-2">
                <Link href="/cart" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 transition-colors relative">
                  <ShoppingCart className="h-5 w-5" />
                </Link>
                <Link href="/login" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 transition-colors">
                  <Star className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl mb-12 min-h-[400px] flex items-end">
          <div className="absolute inset-0 z-0">
            {heroImage ? (
              <img src={heroImage} alt={currentCategory?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#2b160f] via-[#7b2f10] to-[#ec5b13]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent" />
          </div>
          <div className="relative z-10 p-8 md:p-12 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <nav className="flex items-center gap-2 text-primary/80 text-sm font-bold mb-4">
                <Link href="/">Marketplace</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-white">{currentCategory?.name || "Catégorie"}</span>
              </nav>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                {hero.headline}
              </h1>
              <p className="text-slate-200 text-lg max-w-lg">{hero.body}</p>
            </div>
            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[140px]">
                <p className="text-slate-300 text-xs font-bold uppercase tracking-wider">Boutiques</p>
                <p className="text-white text-3xl font-black">{totalBoutiques}</p>
                <p className="text-green-400 text-xs font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +12%
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[140px]">
                <p className="text-slate-300 text-xs font-bold uppercase tracking-wider">Produits</p>
                <p className="text-white text-3xl font-black">{totalProduits}+</p>
                <p className="text-green-400 text-xs font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +5%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filtres */}
        <FilterSection sortBy={sortBy} setSortBy={setSortBy} search={search} setSearch={setSearch} />

        {/* Boutiques à la une */}
        {featuredShops.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl font-black">Boutiques à la une</h2>
              </div>
              <Link href="/shops" className="text-primary font-bold flex items-center gap-1 hover:underline">
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredShops.map((supplier, i) => (
                <ShopCard key={supplier.id} supplier={supplier} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Produits recommandés */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <span className="w-2 h-8 bg-primary rounded-full" />
            <h2 className="text-2xl font-black">Produits recommandés</h2>
          </div>

          {productsLoading || suppliersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-slate-200 rounded-2xl mb-4" />
                  <div className="h-4 bg-slate-200 rounded mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : recommendedProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold">Aucun produit dans cette catégorie</h3>
              <p className="text-slate-500 mt-2">Revenez bientôt pour découvrir nos produits</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.slice(0, 12).map(({ product, supplier }, i) => (
                <ProductCard key={product?.id || i} product={product} supplier={supplier} index={i} />
              ))}
            </div>
          )}

          {recommendedProducts.length > 12 && (
            <div className="mt-12 flex justify-center">
              <button className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all rounded-2xl font-black text-sm flex items-center gap-2">
                Voir plus de produits
              </button>
            </div>
          )}
        </section>

        {/* Section Confiance */}
        <TrustSection />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-primary mb-6">
                <LayoutGrid className="text-3xl font-bold" />
                <h2 className="text-2xl font-black tracking-tighter">SISMA</h2>
              </div>
              <p className="text-slate-500 max-w-xs mb-8">
                La destination mode multi-fournisseurs n°1. Qualité, style et confiance réunis sur une seule plateforme.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Plateforme</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><Link href="/about" className="hover:text-primary transition-colors">Comment ça marche</Link></li>
                <li><Link href="/supplier/register" className="hover:text-primary transition-colors">Vendre sur SISMA</Link></li>
                <li><Link href="/shops" className="hover:text-primary transition-colors">Boutiques</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Aide</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><Link href="/support" className="hover:text-primary transition-colors">Support 24/7</Link></li>
                <li><Link href="/shipping" className="hover:text-primary transition-colors">Livraison & Retours</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Légal</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Conditions</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs">
            © 2024 SISMA Marketplace. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
