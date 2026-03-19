import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Trophy, Star, Package, MapPin, TrendingUp } from "lucide-react";
import { buildApiUrl } from "@/lib/apiConfig";

interface TopShop {
  id: number;
  name: string;
  slug: string;
  logo: string;
  address: string;
  products_count: number;
  total_sales: number;
  revenue: number;
  avg_rating: number;
  ratings_count: number;
  rank: number;
  score: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function TopShopsPage() {
  const [period, setPeriod] = useState("all");

  const { data, isLoading } = useQuery<{ success: boolean; data: TopShop[]; meta: any }>({
    queryKey: ["top-shops", period],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`v1/shops/top?period=${period}&limit=20`));
      return response.json();
    },
  });

  const shops = data?.data ?? [];

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900";
    if (rank === 2) return "bg-gray-300 text-gray-800";
    if (rank === 3) return "bg-amber-600 text-white";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-10 w-10" />
            <h1 className="text-3xl font-bold">Top Boutiques</h1>
          </div>
          <p className="text-white/80">
            Découvrez les meilleures boutiques de la marketplace
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {["day", "week", "month", "year", "all"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                period === p
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p === "day" && "Aujourd'hui"}
              {p === "week" && "Semaine"}
              {p === "month" && "Mois"}
              {p === "year" && "Année"}
              {p === "all" && "Tout"}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Aucune boutique pour cette période</p>
          </div>
        ) : (
          /* Shops Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop, index) => (
              <motion.div
                key={shop.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={index * 0.1}
              >
                <Link href={`/shop/${shop.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Rank Badge */}
                    <div className="relative">
                      <div
                        className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankStyle(
                          shop.rank
                        )}`}
                      >
                        {shop.rank}
                      </div>
                      {shop.logo ? (
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{shop.name}</h3>
                      {shop.address && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                          <MapPin className="h-3 w-3" />
                          {shop.address}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <Package className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                          <p className="text-sm font-medium">{shop.products_count}</p>
                          <p className="text-xs text-gray-500">Produits</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <TrendingUp className="h-4 w-4 mx-auto text-green-500 mb-1" />
                          <p className="text-sm font-medium">{shop.total_sales}</p>
                          <p className="text-xs text-gray-500">Ventes</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <Star className="h-4 w-4 mx-auto text-yellow-500 fill-yellow-500 mb-1" />
                          <p className="text-sm font-medium">
                            {shop.avg_rating ? shop.avg_rating.toFixed(1) : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">Note</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Score</span>
                        <span className="text-lg font-bold text-red-600">{shop.score}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
