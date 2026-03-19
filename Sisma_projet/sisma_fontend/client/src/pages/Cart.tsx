import { useCart, getCartItemKey, type CartItem } from "@/hooks/use-cart";
import { Link, useLocation } from "wouter";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Tag,
} from "lucide-react";

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [, setLocation] = useLocation();

  // ── Panier vide ──────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-14 sm:pt-16 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-md border border-gray-200 p-10 flex flex-col items-center max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 mb-5">
            <ShoppingBag className="w-9 h-9 text-gray-300" />
          </div>
          <h1 className="text-lg font-extrabold text-gray-900 mb-2">Votre panier est vide</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Découvrez nos produits et trouvez votre bonheur parmi notre sélection.
          </p>
          <Link href="/products">
            <button className="h-11 px-8 rounded bg-[#f57224] hover:bg-[#e56614] text-white font-bold text-sm transition-colors">
              Commencer mes achats
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-14 sm:pt-16 pb-20">

      {/* ── Fil d'Ariane ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-3 max-w-5xl py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#f57224] transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-800 font-medium">Mon Panier</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 max-w-5xl pt-4">

        {/* ── Titre ── */}
        <div className="bg-white border border-gray-200 rounded-md mb-4">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-1 h-6 rounded-full bg-[#f57224] shrink-0" />
            <div>
              <h1 className="text-base font-extrabold text-gray-900">
                Mon Panier{" "}
                <span className="text-[#f57224]">({items.length} article{items.length > 1 ? "s" : ""})</span>
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Vérifiez vos articles avant de commander</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">

          {/* ── Liste articles (2/3) ── */}
          <div className="lg:col-span-2 space-y-2">

            {/* Header liste */}
            <div className="hidden sm:flex items-center gap-3 bg-white border border-gray-200 rounded-md px-4 py-2.5">
              <span className="w-1 h-4 rounded-full bg-[#f57224] shrink-0" />
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-1">Produit</p>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide w-24 text-center">Quantité</p>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide w-24 text-right">Prix</p>
              <div className="w-8" />
            </div>

            {items.map((item: CartItem) => (
              <div
                key={getCartItemKey(item)}
                className="bg-white border border-gray-200 rounded-md flex gap-3 p-3 sm:p-4 items-center hover:border-gray-300 transition-colors"
              >
                {/* Image */}
                <Link href={`/product/${(item as any).slug ?? item.id}`}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-100 rounded overflow-hidden shrink-0 cursor-pointer">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400"}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${(item as any).slug ?? item.id}`}>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 hover:text-[#f57224] transition-colors cursor-pointer">
                      {item.name}
                    </h3>
                  </Link>
                  {(item.color || item.size) && (
                    <p className="text-[10px] text-gray-500 mb-1.5">
                      {[item.color, item.size].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {/* Prix unitaire (mobile) */}
                  <p className="text-sm font-bold text-[#f57224] sm:hidden">
                    {item.price.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>

                {/* Quantité */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.color, item.size)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded transition-colors text-gray-600 hover:text-gray-900"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.color, item.size)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded transition-colors text-gray-600 hover:text-gray-900"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Prix total (desktop) */}
                <p className="hidden sm:block w-24 text-right text-sm font-bold text-gray-900 shrink-0">
                  {(item.price * item.quantity).toLocaleString("fr-FR")}
                  <span className="text-[10px] font-normal ml-0.5">F</span>
                </p>

                {/* Supprimer */}
                <button
                  onClick={() => removeItem(item.id, item.color, item.size)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Retirer du panier"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Continuer les achats */}
            <div className="pt-1">
              <Link href="/products">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-[#f57224] hover:underline transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  Continuer mes achats
                </button>
              </Link>
            </div>
          </div>

          {/* ── Résumé commande (1/3, sticky) ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 sm:top-24 space-y-3">

              {/* Récapitulatif */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                  <span className="w-1 h-5 rounded-full bg-[#f57224] shrink-0" />
                  <span className="text-sm font-bold text-gray-900">Récapitulatif</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Sous-total ({items.length} article{items.length > 1 ? "s" : ""})</span>
                    <span className="font-semibold text-gray-800">
                      {total().toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 items-center">
                    <span>Livraison</span>
                    <span className="text-[10px] bg-[#3bb77e]/10 text-[#3bb77e] px-2 py-0.5 rounded font-bold border border-[#3bb77e]/20">
                      Calculé à l'étape suivante
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-xl font-extrabold text-[#f57224]">
                      {total().toLocaleString("fr-FR")}
                      <span className="text-sm font-bold ml-1">FCFA</span>
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => setLocation("/checkout")}
                    className="w-full h-11 rounded bg-[#f57224] hover:bg-[#e56614] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#f57224]/20"
                  >
                    Commander
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-gray-400 mt-2.5">
                    Paiement à la livraison disponible
                  </p>
                </div>
              </div>

              {/* Trust mini */}
              <div className="bg-white border border-gray-200 rounded-md p-3 space-y-2">
                {[
                  { icon: ShieldCheck, text: "Paiement sécurisé à la livraison" },
                  { icon: Truck, text: "Livraison 24–72h partout en CI" },
                  { icon: RotateCcw, text: "Retour & échange sous 14 jours" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon className="w-3.5 h-3.5 text-[#f57224] shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}