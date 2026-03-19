import { Link, useLocation } from "wouter";
import { Menu, X, Truck, ShoppingCart, Search, ChevronDown, Share2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { motion, AnimatePresence } from "framer-motion";
import { SismaLogo } from "@/components/SismaLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [location, setLocation] = useLocation();
  const cartItems = useCart((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/categories", label: "Catégories" },
    { href: "/shops", label: "Boutiques" },
      
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (headerSearch.trim()) params.set("search", headerSearch.trim());
    setLocation(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b-2 border-[#D81918]">

      {/* ── Barre supérieure SISMA ── */}
      <div className="bg-gradient-to-r from-[#D81918] to-[#F7941D] hidden sm:block">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-9">
          <div className="flex items-center gap-2 text-white text-xs font-medium">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Livraison partout en Côte d'Ivoire · 24–72h · Satisfait ou remboursé</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Réseaux sociaux */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-white/90 hover:text-white text-xs font-medium transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  Réseaux
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <FaFacebookF className="w-3.5 h-3.5 text-[#1877F2]" /> Facebook
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" /> Instagram
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <FaYoutube className="w-3.5 h-3.5 text-[#FF0000]" /> YouTube
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Barre principale — tout sur une seule ligne ── */}
      <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4 h-14 sm:h-16 px-3 sm:px-6 flex-nowrap">

        {/* Logo */}
        <SismaLogo
          variant="default"
          showSlogan={false}
          size="sm"
          align="start"
          className="flex-shrink-0"
        />

        {/* Navigation desktop intégrée à la ligne principale */}
        <nav className="hidden md:flex items-center gap-1 shrink-0 whitespace-nowrap">
          {navLinks.map((link) => {
            const isActive =
              location === link.href ||
              (link.href === "/categories" && location.startsWith("/categories")) ||
              (link.href === "/shops" && (location.startsWith("/shops") || location.startsWith("/shop")));

            return (
              <Link key={link.href} href={link.href}>
                <span
                  className={`block px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-orange-50 text-[#f57224]"
                      : "text-gray-600 hover:text-[#f57224] hover:bg-orange-50/70"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Barre de recherche centrale — style Jumia */}
        <form
          onSubmit={handleSearch}
          className="flex-1 min-w-0 flex items-center"
        >
          <div className="flex w-full h-10 rounded overflow-hidden border border-gray-300 focus-within:border-[#f57224] focus-within:ring-1 focus-within:ring-[#f57224] transition-all">
            <input
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Rechercher un produit, une marque..."
              className="flex-1 px-4 text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="px-4 bg-[#f57224] hover:bg-[#e56614] text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Panier */}
        <Link
          href="/cart"
          className="relative flex items-center gap-2 h-10 px-3 rounded border border-gray-200 hover:border-[#f57224] bg-white hover:bg-orange-50 text-gray-700 hover:text-[#f57224] transition-all shrink-0"
          title="Panier"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-semibold">Panier</span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-[#f57224] text-white rounded-full">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        {/* Burger mobile */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          aria-label="Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Menu mobile ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden shadow-lg"
          >
            <div className="px-4 py-3 space-y-1">
              {/* Recherche mobile */}
              <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex h-9 rounded overflow-hidden border border-gray-300 focus-within:border-[#D81918]">
                  <input
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="flex-1 px-3 text-sm outline-none"
                  />
                  <button type="submit" className="px-4 bg-[#D81918] text-white hover:bg-[#c01616] transition-colors">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Liens nav */}
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-red-50 text-[#D81918] border-l-4 border-[#D81918]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Réseaux + livraison (mobile) */}
              <div className="pt-3 mt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Truck className="w-3.5 h-3.5 text-[#f57224]" />
                  Livraison partout en Côte d'Ivoire
                </div>
                <div className="flex items-center gap-3">
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center hover:bg-[#1877F2]/20 transition-colors">
                    <FaFacebookF className="w-3.5 h-3.5 text-[#1877F2]" />
                  </a>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#E4405F]/10 flex items-center justify-center hover:bg-[#E4405F]/20 transition-colors">
                    <FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" />
                  </a>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center hover:bg-[#25D366]/20 transition-colors">
                    <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
                  </a>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#FF0000]/10 flex items-center justify-center hover:bg-[#FF0000]/20 transition-colors">
                    <FaYoutube className="w-3.5 h-3.5 text-[#FF0000]" />
                  </a>
                  
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
