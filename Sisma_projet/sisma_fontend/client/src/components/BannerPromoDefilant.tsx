import { Link } from "wouter";
import { Zap, Tag, ChevronRight } from "lucide-react";

// ─── Palette ────────────────────────────────────────────────────────────
const S = {
  red: "#D81918",
  orange: "#F7941D",
};

// Image de fond
const BG_IMAGE =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1920";

interface Product {
  id: string | number;
  name: string;
  image?: string;
  price: number | string;
  discountPercentage?: number;
  discount?: number;
  slug?: string;
}

interface Props {
  products: Product[];
}

export function BannerPromoDefilant({ products }: Props) {
  if (!products || products.length === 0) return null;

  const promos = products.filter(
    (p) => Number(p.discountPercentage || p.discount || 0) > 0
  );

  const items = promos.length ? promos : products;
  const doubled = [...items, ...items, ...items];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "120px" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            105deg,
            rgba(26,0,0,0.94),
            rgba(216,25,24,0.85),
            rgba(26,0,0,0.94)
          )`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">

        {/* Label */}
        <div className="hidden sm:flex flex-col justify-center items-center px-4 border-r border-white/10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-br from-red-600 to-orange-400">
            <Zap className="w-3 h-3 text-white" />
            <span className="text-white text-[11px] font-black">PROMOS</span>
          </div>
          <span className="text-white/40 text-[9px] mt-1 tracking-widest">
            DU MOMENT
          </span>
        </div>

        {/* Marquee */}
        <div className="relative flex-1 overflow-hidden h-full">
          <div className="flex items-center h-full gap-3 marquee-track">
            {doubled.map((product, i) => {
              const discount = Number(
                product.discountPercentage || product.discount || 0
              );
              const price = Number(product.price);
              const finalPrice =
                discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

              return (
                <Link
                  key={`${product.id}-${i}`}
                  href={`/product/${product.slug ?? product.id}`}
                >
                  <div className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 hover:bg-orange-400/20 hover:border-orange-400/50 transition-all cursor-pointer shrink-0">
                    <img
                      src={
                        product.image ??
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=80"
                      }
                      className="w-10 h-10 rounded-lg object-cover"
                    />

                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-semibold truncate max-w-[120px]">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-orange-300 font-black text-xs">
                          {finalPrice.toLocaleString("fr-FR")} FCFA
                        </span>
                        {discount > 0 && (
                          <span className="text-[9px] px-1 rounded bg-gradient-to-br from-red-600 to-orange-400 text-white font-black">
                            -{discount}%
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-3 h-3 text-orange-400 opacity-0 group-hover:opacity-100" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Link href="/products?promo=1">
          <div className="hidden md:flex items-center gap-1 mx-3 px-4 py-2 rounded-full bg-gradient-to-br from-red-600 to-orange-400 text-white text-[11px] font-black cursor-pointer hover:scale-105 transition">
            <Tag className="w-3 h-3" />
            Voir tout
          </div>
        </Link>
      </div>

      <style>{`
        .marquee-track {
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}