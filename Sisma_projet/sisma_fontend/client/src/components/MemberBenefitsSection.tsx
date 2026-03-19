import { useMemo } from "react";
import { Link } from "wouter";
import { Bell, ChevronRight, ShieldCheck, Sparkles, Tag, Zap } from "lucide-react";
import { useAuth } from "@/context/ClientAuthContext";
import {
  deriveMemberDeals,
  derivePersonalizedRecommendations,
  getMemberProfile,
  hasPostOrderSignal,
} from "@/lib/client-account";

interface MemberBenefitsSectionProps {
  products: any[];
}

function ProductTeaserCard({
  product,
  badge,
  accent,
}: {
  product: any;
  badge: string;
  accent: "orange" | "red";
}) {
  const discount = Number(product?.discountPercentage ?? product?.discount ?? 0);
  const price = Number(product?.price ?? 0);
  const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const image =
    product?.image ||
    (Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : "");

  return (
    <Link
      href={`/product/${product?.slug ?? product?.id}`}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#f57224]/40 hover:shadow-md transition-all"
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={product?.name || "Produit SISMA"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">SISMA</div>
        )}
      </div>
      <div className="p-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            accent === "orange"
              ? "bg-orange-50 text-[#f57224]"
              : "bg-red-50 text-red-600"
          }`}
        >
          {badge}
        </span>
        <h3 className="mt-3 text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {product?.name || "Produit SISMA"}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {discountedPrice.toLocaleString("fr-FR")} FCFA
            </p>
            {discount > 0 && (
              <p className="text-xs text-gray-400 line-through">{price.toLocaleString("fr-FR")} FCFA</p>
            )}
          </div>
          <span className="text-xs font-semibold text-[#f57224] group-hover:translate-x-1 transition-transform">
            Voir
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MemberBenefitsSection({ products }: MemberBenefitsSectionProps) {
  const { token, user } = useAuth();
  const memberProfile = useMemo(() => getMemberProfile(), [token, user?.id]);

  const recommendations = useMemo(() => {
    const personalized = derivePersonalizedRecommendations(products, 4);
    return personalized.length > 0 ? personalized : products.slice(0, 4);
  }, [products]);

  const memberDeals = useMemo(() => {
    const deals = deriveMemberDeals(products, 4);
    if (deals.length > 0) return deals;
    return [...products]
      .sort((left, right) => Number(left?.price ?? 0) - Number(right?.price ?? 0))
      .slice(0, 4);
  }, [products]);

  if (!products.length) return null;

  if (!token) {
    if (!hasPostOrderSignal()) return null;

    return (
      <section className="py-8 bg-white border-y border-gray-200">
        <div className="container mx-auto px-3 max-w-7xl">
          <div className="rounded-[28px] border border-orange-200 bg-gradient-to-r from-red-50 via-orange-50 to-white p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#f57224]">
                  <Sparkles className="w-4 h-4" />
                  Après votre première commande
                </div>
                <h2 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">
                  Créez votre compte SISMA et gardez l’élan d’achat.
                </h2>
                <p className="mt-3 text-sm md:text-base text-gray-600 max-w-2xl">
                  Activez le suivi des commandes, les notifications utiles, le remplissage automatique et l’accès aux
                  sélections prix doux pensées pour vous.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/account?mode=register&source=post-order"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#f57224] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e56614] transition-colors"
                  >
                    Créer mon compte
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-[#f57224]/30 hover:text-[#f57224] transition-colors"
                  >
                    Suivre mes commandes
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Suivi rassurant",
                    text: "Toutes vos commandes dans le même espace.",
                  },
                  {
                    icon: Bell,
                    title: "Notifications utiles",
                    text: "Livraison, validation et retours sans friction.",
                  },
                  {
                    icon: Tag,
                    title: "Prix plus doux",
                    text: "Accès aux meilleures offres membres et recos ciblées.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl bg-white/90 border border-white px-4 py-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#f57224]" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!recommendations.length && !memberDeals.length) return null;

  return (
    <section className="py-8 bg-white border-y border-gray-200">
      <div className="container mx-auto px-3 max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#f57224]">
              <Zap className="w-4 h-4" />
              Avantages membre actifs
            </div>
            <h2 className="mt-3 text-2xl font-bold text-gray-900">
              Bonjour {memberProfile?.name || user?.name}, votre espace SISMA travaille pour vous.
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Des recommandations basées sur votre parcours et une sélection de produits plus abordables pour accélérer
              vos prochains achats.
            </p>
          </div>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#f57224] hover:text-[#e56614]"
          >
            Gérer mon compte
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recommandés pour vous</h3>
                <p className="text-sm text-gray-500">Basé sur vos vues et commandes récentes.</p>
              </div>
              <Sparkles className="w-5 h-5 text-[#f57224]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.map((product) => (
                <ProductTeaserCard
                  key={`rec-${product?.id}`}
                  product={product}
                  badge="Sélection personnalisée"
                  accent="orange"
                />
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Offres membres</h3>
                <p className="text-sm text-gray-500">Les produits les plus accessibles du moment.</p>
              </div>
              <Tag className="w-5 h-5 text-[#f57224]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {memberDeals.map((product) => (
                <ProductTeaserCard
                  key={`deal-${product?.id}`}
                  product={product}
                  badge="Prix doux membre"
                  accent="red"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
