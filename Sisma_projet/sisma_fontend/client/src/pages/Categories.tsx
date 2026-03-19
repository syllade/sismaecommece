import { useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Layers3, Package, Store, TrendingUp } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/use-products";
import { slugifyCategory } from "@/hooks/use-marketplace";

type CategoryTheme = {
  accent: string;
  soft: string;
  glow: string;
  eyebrow: string;
  description: string;
};

function normalizeCategoryName(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getCategoryTheme(name: string | null | undefined): CategoryTheme {
  const normalized = normalizeCategoryName(name);

  if (/(telephone|phone|smartphone|mobile)/.test(normalized)) {
    return {
      accent: "#2563eb",
      soft: "#eff6ff",
      glow: "rgba(37, 99, 235, 0.18)",
      eyebrow: "Mobile et connecte",
      description: "Smartphones, accessoires mobiles et boutiques specialistes.",
    };
  }

  if (/(electronique|ordinateur|informatique|audio|tv)/.test(normalized)) {
    return {
      accent: "#4f46e5",
      soft: "#eef2ff",
      glow: "rgba(79, 70, 229, 0.18)",
      eyebrow: "Tech et equipement",
      description: "Electronique du quotidien, multimedia et accessoires fiables.",
    };
  }

  if (/(beaute|cosmet|parfum|soin)/.test(normalized)) {
    return {
      accent: "#db2777",
      soft: "#fdf2f8",
      glow: "rgba(219, 39, 119, 0.16)",
      eyebrow: "Soin et beaute",
      description: "Produits de soin, beaute et bien-etre proposes par des boutiques verifiees.",
    };
  }

  if (/(deco|decoration|maison|home|meuble)/.test(normalized)) {
    return {
      accent: "#0f766e",
      soft: "#ecfeff",
      glow: "rgba(15, 118, 110, 0.16)",
      eyebrow: "Maison et deco",
      description: "Inspiration maison, decoration et objets du quotidien.",
    };
  }

  if (/(enfant|bebe|kids|kid|jouet)/.test(normalized)) {
    return {
      accent: "#7c3aed",
      soft: "#f5f3ff",
      glow: "rgba(124, 58, 237, 0.16)",
      eyebrow: "Enfant et famille",
      description: "Essentiels pour enfants, cadeaux et produits de famille.",
    };
  }

  if (/(chaussure|sneaker|sandale)/.test(normalized)) {
    return {
      accent: "#b45309",
      soft: "#fffbeb",
      glow: "rgba(180, 83, 9, 0.16)",
      eyebrow: "Chaussures et styles",
      description: "Baskets, sandales et chaussures de ville pour tous les usages.",
    };
  }

  if (/(mode|vetement|femme|homme)/.test(normalized)) {
    return {
      accent: "#c2410c",
      soft: "#fff7ed",
      glow: "rgba(194, 65, 12, 0.18)",
      eyebrow: "Mode et tendances",
      description: "Mode, accessoires et looks portes par des boutiques marketplace.",
    };
  }

  return {
    accent: "#9a3412",
    soft: "#fff7ed",
    glow: "rgba(154, 52, 18, 0.14)",
    eyebrow: "Univers marketplace",
    description: "Decouvrez les boutiques et produits disponibles dans cet univers SISMA.",
  };
}

function formatMetric(value: number) {
  return Number(value || 0).toLocaleString("fr-FR");
}

function CategoryCard({
  category,
  productsCount,
  suppliersCount,
  rank,
}: {
  category: any;
  productsCount: number;
  suppliersCount: number;
  rank: number;
}) {
  const categorySlug = slugifyCategory(category?.slug || category?.name || category?.id);
  const theme = getCategoryTheme(category?.name);
  const isActive = productsCount > 0 || suppliersCount > 0;
  const description =
    category?.description?.trim() || theme.description;

  return (
    <Link href={`/categories/${categorySlug}`} className="block h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ duration: 0.22 }}
        className="group relative h-full overflow-hidden rounded-[30px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(63,37,17,0.08)]"
      >
        <div
          className="absolute -right-10 top-0 h-32 w-32 rounded-full blur-3xl"
          style={{ background: theme.glow }}
        />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span
                className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ background: theme.soft, color: theme.accent }}
              >
                {theme.eyebrow}
              </span>
              <h2 className="mt-4 text-[29px] font-black leading-none tracking-[-0.03em] text-[#221914]">
                {category?.name || "Categorie SISMA"}
              </h2>
              <p className="mt-3 max-w-[18rem] text-sm leading-6 text-[#5f4b3d]">{description}</p>
            </div>

            <div
              className="shrink-0 rounded-[22px] px-3 py-2 text-right"
              style={{ background: theme.soft }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
                Rang
              </p>
              <p className="mt-1 text-lg font-black" style={{ color: theme.accent }}>
                #{rank}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: theme.soft, color: theme.accent }}
            >
              {isActive ? "Categorie active" : "Catalogue en cours"}
            </span>
            <span className="inline-flex rounded-full bg-[#f8f4ef] px-3 py-1.5 text-xs font-semibold text-[#7f6350]">
              {suppliersCount > 0 ? `${suppliersCount} boutiques actives` : "Boutiques a venir"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-[#f1e7de] bg-[#fcfaf7] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d7c63]">Produits</p>
              <p className="mt-2 text-2xl font-black text-[#231a15]">{formatMetric(productsCount)}</p>
            </div>
            <div className="rounded-[24px] border border-[#f1e7de] bg-[#fcfaf7] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d7c63]">Boutiques</p>
              <p className="mt-2 text-2xl font-black text-[#231a15]">{formatMetric(suppliersCount)}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#f1e7de] bg-[#fcfaf7] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d7c63]">Parcours SISMA</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#49392e]">
              {isActive
                ? "Entrez par les boutiques de cette categorie, puis explorez leurs produits."
                : "Cette categorie est prete a accueillir ses premieres boutiques et son catalogue."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: theme.accent }}>
              Explorer la categorie
            </span>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-1"
              style={{ background: theme.soft, color: theme.accent }}
            >
              <ChevronRight className="h-5 w-5" />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

export default function Categories() {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const categoriesWithMetrics = useMemo(() => {
    return (categories as any[])
      .map((category) => {
        const categoryProducts = (products as any[]).filter(
          (product) =>
            String(product?.categoryId ?? product?.category_id ?? product?.category?.id ?? "") === String(category?.id),
        );

        const suppliersCount = new Set(
          categoryProducts
            .map((product) =>
              String(product?.supplier_id ?? product?.supplierId ?? product?.supplier?.id ?? product?.supplier_name ?? ""),
            )
            .filter(Boolean),
        ).size;

        return {
          category,
          productsCount: categoryProducts.length,
          suppliersCount,
        };
      })
      .sort((left, right) => right.productsCount - left.productsCount || right.suppliersCount - left.suppliersCount);
  }, [categories, products]);

  const totalProducts = categoriesWithMetrics.reduce((total, entry) => total + entry.productsCount, 0);
  const totalSuppliers = new Set(
    (products as any[])
      .map((product) =>
        String(product?.supplier_id ?? product?.supplierId ?? product?.supplier?.id ?? product?.supplier_name ?? ""),
      )
      .filter(Boolean),
  ).size;

  const spotlightCategories = categoriesWithMetrics.filter((entry) => entry.productsCount > 0).slice(0, 4);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcf8f3_0%,#f7efe6_48%,#f9f4ee_100%)] pt-14 text-[#2c2119] sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[38px] border border-[#f0dfd0] bg-[linear-gradient(135deg,#fffdf9_0%,#fff2e5_50%,#ffe8d1_100%)] shadow-[0_30px_100px_rgba(93,51,16,0.08)]">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#f08b2f,transparent)]" />
          <div className="grid gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-10">
            <div>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#ad511d] shadow-sm">
                SISMA Marketplace
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.05] tracking-[-0.04em] text-[#211814] sm:text-5xl">
                Explorez les univers produits de la marketplace.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d4738] sm:text-base">
                Chaque categorie vous ouvre d’abord sur ses boutiques, puis sur leurs produits. Une navigation plus
                claire, plus generaliste et beaucoup plus proche d’une vraie marketplace multi-categories.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Categories", value: categoriesWithMetrics.length, icon: Layers3 },
                  { label: "Produits", value: totalProducts, icon: Package },
                  { label: "Boutiques", value: totalSuppliers, icon: Store },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e7] text-[#ad511d]">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d7c63]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#231a15]">{formatMetric(item.value)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-white/78 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a7b63]">
                    Categories en vue
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#241b16]">
                    Les univers les plus actifs
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1e7] text-[#ad511d]">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {spotlightCategories.length > 0 ? (
                  spotlightCategories.map((entry, index) => (
                    <Link
                      key={entry.category?.id ?? index}
                      href={`/categories/${slugifyCategory(entry.category?.slug || entry.category?.name || entry.category?.id)}`}
                      className="flex items-center justify-between gap-4 rounded-[24px] border border-[#f1e7de] bg-[#fcfaf7] px-4 py-4 transition-colors hover:border-[#e9c8ae] hover:bg-white"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-black text-[#231a15]">{entry.category?.name}</p>
                        <p className="mt-1 text-sm text-[#6a5545]">
                          {formatMetric(entry.productsCount)} produits · {formatMetric(entry.suppliersCount)} boutiques
                        </p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1e7] text-[#ad511d]">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[#e5cfbe] bg-[#fffaf5] px-4 py-8 text-center">
                    <p className="text-sm font-medium text-[#6a5545]">
                      Les categories vont apparaitre ici des que les premiers produits seront disponibles.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a7b63]">Page categories</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#241b16]">
                Tous les univers de la marketplace
              </h2>
            </div>
            <p className="text-sm text-[#6a5545]">
              Un acces plus lisible aux boutiques et aux produits, categorie par categorie.
            </p>
          </div>

          {categoriesLoading || productsLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-sm">
                  <div className="h-7 w-28 animate-pulse rounded-full bg-[#f4ede7]" />
                  <div className="mt-5 h-8 w-2/3 animate-pulse rounded-full bg-[#f4ede7]" />
                  <div className="mt-4 h-4 w-4/5 animate-pulse rounded-full bg-[#f4ede7]" />
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="h-24 animate-pulse rounded-[24px] bg-[#f4ede7]" />
                    <div className="h-24 animate-pulse rounded-[24px] bg-[#f4ede7]" />
                  </div>
                  <div className="mt-5 h-24 animate-pulse rounded-[24px] bg-[#f4ede7]" />
                </div>
              ))}
            </div>
          ) : categoriesWithMetrics.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-[#d8c0ad] bg-white/80 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0e6] text-[#ad511d]">
                <Layers3 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#241b16]">Aucune categorie disponible</h3>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {categoriesWithMetrics.map((entry, index) => (
                <motion.div
                  key={entry.category?.id ?? index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.24) }}
                >
                  <CategoryCard
                    category={entry.category}
                    productsCount={entry.productsCount}
                    suppliersCount={entry.suppliersCount}
                    rank={index + 1}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
