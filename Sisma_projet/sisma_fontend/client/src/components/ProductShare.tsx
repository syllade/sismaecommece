import { useState } from "react";
import { FaWhatsapp, FaFacebook, FaTwitter, FaLink, FaTimes } from "react-icons/fa";
import { Share2, Copy, Check } from "lucide-react";

interface ProductShareProps {
  product: {
    id: number;
    name: string;
    slug?: string;
    price: number;
    image?: string;
    description?: string;
  };
  supplier?: {
    name: string;
    slug?: string;
  };
}

export function ProductShare({ product, supplier }: ProductShareProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build share URLs
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://sisma.com";
  const productUrl = `${baseUrl}/products/${product.slug || product.id}`;
  const productTitle = `${product.name}${supplier ? ` - ${supplier.name}` : ""}`;
  const productPrice = `${product.price.toLocaleString("fr-FR")} FCA`;

  // Share text
  const shareText = `Découvrez ${product.name} à ${productPrice} sur SISMA!`;

  // Social share URLs
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + productUrl)}`;

  // Copy to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Open in new window
  const openShare = (url: string) => {
    window.open(url, "_blank", "width=600,height=400,noopener,noreferrer");
  };

  if (!showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
        aria-label="Partager ce produit"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Partager</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => setShowModal(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Partager ce produit</h3>
          <button
            onClick={() => setShowModal(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-5">
          <div className="w-14 h-14 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-200">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                Pas d'image
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{product.name}</p>
            <p className="text-sm text-primary font-semibold">
              {product.price.toLocaleString("fr-FR")} FCA
            </p>
            {supplier && (
              <p className="text-xs text-gray-500 truncate">{supplier.name}</p>
            )}
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {/* WhatsApp */}
          <button
            onClick={() => openShare(whatsappUrl)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          >
            <FaWhatsapp className="w-6 h-6 text-green-500" />
            <span className="text-xs text-gray-600">WhatsApp</span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => openShare(facebookUrl)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <FaFacebook className="w-6 h-6 text-blue-600" />
            <span className="text-xs text-gray-600">Facebook</span>
          </button>

          {/* Twitter */}
          <button
            onClick={() => openShare(twitterUrl)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors"
          >
            <FaTwitter className="w-6 h-6 text-sky-500" />
            <span className="text-xs text-gray-600">Twitter</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {copied ? (
              <Check className="w-6 h-6 text-green-500" />
            ) : (
              <Copy className="w-6 h-6 text-gray-600" />
            )}
            <span className="text-xs text-gray-600">{copied ? "Copié!" : "Copier"}</span>
          </button>
        </div>

        {/* Link Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={productUrl}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            {copied ? "Copié!" : "Copier"}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-4 text-xs text-center text-gray-500">
          Partagez ce produit avec vos amis et votre famille!
        </p>
      </div>
    </div>
  );
}

// Compact version for inline use
export function ShareButton({ product, supplier }: ProductShareProps) {
  const [showShare, setShowShare] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowShare(true)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Partager"
      >
        <Share2 className="w-5 h-5 text-gray-500" />
      </button>
      {showShare && (
        <ProductShare 
          product={product} 
          supplier={supplier}
        />
      )}
    </>
  );
}
