import { Link } from "wouter";
import { ShoppingCart, Heart, Eye, Star } from "lucide-react";

interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  compare_price?: number;
  image?: string;
  images?: string[];
  rating?: number;
  review_count?: number;
  supplier_name?: string;
  category_name?: string;
  is_new?: boolean;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onAddToWishlist }: ProductCardProps) {
  const imageUrl = product.image || product.images?.[0] || "/placeholder.png";
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  return (
    <div className="product-card group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Link href={`/products/${product.slug || product.id}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_new && (
            <span className="badge badge-new">Nouveau</span>
          )}
          {hasDiscount && (
            <span className="badge badge-sale">-{discountPercent}%</span>
          )}
        </div>

        {/* Quick Actions - Appears on hover */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onAddToWishlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToWishlist(product);
              }}
              className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Ajouter à la wishlist"
            >
              <Heart className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <Link
            href={`/products/${product.slug || product.id}`}
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Voir le produit"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </Link>
        </div>

        {/* Add to Cart Button - Mobile & Desktop */}
        {onAddToCart && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product);
            }}
            className="absolute bottom-3 left-3 right-3 bg-sisma-red text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-sisma-redHover translate-y-2 group-hover:translate-y-0"
          >
            <ShoppingCart className="w-4 h-4" />
            Ajouter au panier
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
        )}

        {/* Name */}
        <Link href={`/products/${product.slug || product.id}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] hover:text-sisma-red transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(product.rating!)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.review_count || 0})
            </span>
          </div>
        )}

        {/* Supplier */}
        {product.supplier_name && (
          <p className="text-xs text-gray-500 mt-1">{product.supplier_name}</p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-bold text-sisma-red">
            {product.price.toLocaleString("fr-FR")} €
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {product.compare_price?.toLocaleString("fr-FR")} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
