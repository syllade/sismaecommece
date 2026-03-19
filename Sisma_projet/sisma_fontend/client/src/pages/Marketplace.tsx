import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Package,
  Search,
  Star,
  Store,
  TrendingUp,
} from "lucide-react";
import {
  getProductCategoryLabel,
  getSupplierPopularityScore,
  getSupplierProductCount,
  getSupplierRating,
  getSupplierReviewCount,
  getSupplierSalesCount,
  useMarketplaceSuppliers,
  type MarketplaceSupplier,
} from "@/hooks/use-marketplace";
import { getSupplierGradient, getSupplierInitials } from "@/hooks/use-suppliers";

type SortMode = "rating" | "sales" | "popularity";

function MarketplaceSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-sm"
        >
          <div className="h-40 animate-pulse bg-gradient-to-br from-[#2a211c] via-[#8f3713] to-[#f28c28]" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-[#f4ede7]" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#f4ede7]" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((__, imageIndex) => (
                <div
                  key={imageIndex}
                  className="aspect-square animate-pulse rounded-2xl bg-[#f4ede7]"
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopCard({ supplier }: { supplier: MarketplaceSupplier }) {
  const rating = getSupplierRating(supplier);
  const reviewCount = getSupplierReviewCount(supplier);
  const productCount = getSupplierProductCount(supplier);
  const salesCount = getSupplierSalesCount(supplier);
  const previewProducts = (supplier.products ?? []).slice(0, 3);
  const categoryLabels = Array.from(
    new Set((supplier.products ?? []).map((product) => getProductCategoryLabel(product)).filter(Boolean)),
  ).slice(0, 3);
  const initials = getSupplierInitials(supplier.name);
  const avatarGradient = getSupplierGradient(supplier.name);

  return (
    <Link href={`/shop/${supplier.id}`} className="block h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ duration: 0.2 }}
        className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(63,37,17,0.08)] backdrop-blur"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#241d19] via-[#8d3714] to-[#f08b2f] p-5 text-white">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 30%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.2), transparent 18%)",
            }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/30 bg-white/10">
                {supplier.logo ? (
                  <img
                    src={supplier.logo}
                    alt={supplier.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-xl font-black text-white"
                    style={{ background: avatarGradient }}
                  >
                    {initials}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                  Boutique fournisseur
                </p>
                <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight">
                  {supplier.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-[#ffd66b] text-[#ffd66b]" />
                    {rating > 0 ? rating.toFixed(1) : "Nouveau"}
                  </span>
                  <span>{reviewCount} avis</span>
                </div>
              </div>
            </div>

            <div className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {productCount} produits
            </div>
          </div>

          {categoryLabels.length > 0 && (
            <div className="relative mt-5 flex flex-wrap gap-2">
              {categoryLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="grid grid-cols-3 gap-2">
            {previewProducts.length > 0 ? (
              previewProducts.map((product) => (
                <div
                  key={product.id}
                  className="aspect-square overflow-hidden rounded-2xl bg-[#f4ede7]"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#ad7b56]">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex aspect-square items-center justify-center rounded-2xl bg-[#f4ede7] text-[#ad7b56]"
                >
                  <Store className="h-6 w-6" />
                </div>
              ))
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] bg-[#faf4ef] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b7a61]">
                Ventes
              </p>
              <p className="mt-1 text-lg font-black text-[#2b2119]">{salesCount}</p>
            </div>
            <div className="rounded-[18px] bg-[#faf4ef] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b7a61]">
                Popularité
              </p>
              <p className="mt-1 text-lg font-black text-[#2b2119]">
                {Math.round(getSupplierPopularityScore(supplier))}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a61]">
                Boutique
              </p>
              <p className="mt-1 text-sm text-[#4b3628]">
                Produits classés par catégorie dans la boutique
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-[#a64112]">
              Voir la boutique
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("rating");

  const { data: suppliers = [], isLoading } = useMarketplaceSuppliers();

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const visibleSuppliers = suppliers.filter((supplier) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        supplier.name,
        supplier.address,
        ...(supplier.products ?? []).flatMap((product) => [product.name, getProductCategoryLabel(product)]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });

    return [...visibleSuppliers].sort((left, right) => {
      if (sortBy === "sales") {
        return getSupplierSalesCount(right) - getSupplierSalesCount(left);
      }

      if (sortBy === "popularity") {
        return getSupplierPopularityScore(right) - getSupplierPopularityScore(left);
      }

      const ratingDelta = getSupplierRating(right) - getSupplierRating(left);
      if (ratingDelta !== 0) {
        return ratingDelta;
      }

      return getSupplierSalesCount(right) - getSupplierSalesCount(left);
    });
  }, [search, sortBy, suppliers]);

  const stats = useMemo(() => {
    const products = suppliers.reduce((total, supplier) => total + getSupplierProductCount(supplier), 0);
    const sales = suppliers.reduce((total, supplier) => total + getSupplierSalesCount(supplier), 0);
    const averageRating =
      suppliers.length > 0
        ? suppliers.reduce((total, supplier) => total + getSupplierRating(supplier), 0) / suppliers.length
        : 0;

    return {
      suppliers: suppliers.length,
      products,
      sales,
      averageRating,
    };
  }, [suppliers]);

  return (
    <div className="min-h-screen bg-[#f7f1ea] pt-14 text-[#2c2119] sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[36px] border border-[#f0dfd0] bg-[linear-gradient(135deg,#fffaf5_0%,#f4e2d2_45%,#fbeee3_100%)] shadow-[0_30px_100px_rgba(93,51,16,0.08)]">
          <div className="grid gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-10">
            <div>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#ad511d] shadow-sm">
                Page boutiques
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-[#251b16] sm:text-4xl">
                Toutes les boutiques de la marketplace SISMA.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d4738] sm:text-base">
                Comme sur Amazon, Jumia ou Alibaba, vous pouvez comparer les fournisseurs par note, nombre de ventes
                et popularité, puis entrer dans leur boutique dédiée.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Boutiques", value: stats.suppliers },
                  { label: "Produits", value: stats.products },
                  { label: "Ventes", value: stats.sales },
                  { label: "Note moyenne", value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/80 bg-white/75 p-4 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a7b63]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#1f1712]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 self-start">
              {[
                {
                  icon: Star,
                  title: "Tri par note",
                  body: "Identifiez rapidement les vendeurs les mieux notés par les clients.",
                },
                {
                  icon: TrendingUp,
                  title: "Tri par ventes",
                  body: "Repérez les boutiques qui performent déjà sur la marketplace.",
                },
                {
                  icon: Store,
                  title: "Tri par popularité",
                  body: "Mettez en avant les fournisseurs les plus visibles et attractifs.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e7] text-[#ad511d]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[#2b2119]">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#5d4738]">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-[#ecd8c8] bg-white/85 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a28770]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une boutique, une spécialité, une catégorie..."
                className="h-12 w-full rounded-full border border-[#ead8cb] bg-[#fffaf5] pl-11 pr-4 text-sm text-[#2c2119] outline-none transition-colors placeholder:text-[#a28770] focus:border-[#c7682f]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "rating", label: "Note", icon: Star },
                { value: "sales", label: "Ventes", icon: TrendingUp },
                { value: "popularity", label: "Popularité", icon: ArrowRight },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortMode)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    sortBy === option.value
                      ? "bg-[#2d2119] text-white"
                      : "bg-[#fff4ec] text-[#74492d] hover:bg-[#ffe7d3]"
                  }`}
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a7b63]">
                Liste fournisseurs
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#241b16]">
                {filteredSuppliers.length} boutique{filteredSuppliers.length > 1 ? "s" : ""} à découvrir
              </h2>
            </div>
            <Link
              href="/categories"
              className="hidden items-center gap-1 text-sm font-semibold text-[#a64112] hover:text-[#8e3609] sm:inline-flex"
            >
              Explorer les catégories
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <MarketplaceSkeleton />
          ) : filteredSuppliers.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-[#d8c0ad] bg-white/80 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0e6] text-[#ad511d]">
                <Store className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#241b16]">
                Aucune boutique ne correspond à votre recherche
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6a5140]">
                Essayez un autre mot-clé pour retrouver un fournisseur ou passez par les catégories.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSuppliers.map((supplier, index) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.24) }}
                >
                  <ShopCard supplier={supplier} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
