import { Link } from "wouter";
import { Phone, MapPin, Globe, Truck, Lock, RefreshCw, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { SismaLogo } from "@/components/SismaLogo";

const BOTTOM_BENEFITS = [
  { title: "Partout en Côte d'Ivoire", sub: "Livraison nationale", icon: Truck },
  { title: "Paiement sécurisé", sub: "100% protégé", icon: Lock },
  { title: "Retours faciles", sub: "Satisfait ou remboursé", icon: RefreshCw },
  { title: "Service client", sub: "À votre écoute", icon: Headphones },
];

/** Pied de page FAT' SHOP : avantages, contact, logo, liens */
export function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Section avantages en bas de page */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8 md:py-10">
            {BOTTOM_BENEFITS.map(({ title, sub, icon: Icon }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-4 text-center sm:text-left"
              >
                <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#ae1bd8]" />
                </span>
                <div>
                  <p className="font-semibold text-white text-sm md:text-base">{title}</p>
                  <p className="text-white/70 text-xs mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 py-6 border-b border-white/10">
          <motion.a
            href="tel:+2250700000000"
            className="flex items-center gap-3 text-white group"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Phone className="w-5 h-5 text-white/90 flex-shrink-0 group-hover:text-[#cf046d] transition-colors" />
            <span className="text-sm md:text-base">Appel : +225 07 00 00 00 00</span>
          </motion.a>
          <motion.div
            className="flex items-center gap-3 text-white"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <MapPin className="w-5 h-5 text-white/90 flex-shrink-0" />
            <span className="text-sm md:text-base text-center md:text-left">
              123 Avenue Anywhere, Abidjan, Côte d&apos;Ivoire
            </span>
          </motion.div>
          <motion.a
            href="https://sisma.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-white group"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Globe className="w-5 h-5 text-white/90 flex-shrink-0 group-hover:text-[#cf046d] transition-colors" />
            <span className="text-sm md:text-base">sisma.com</span>
          </motion.a>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8">
          <SismaLogo variant="light" showSlogan={true} size="md" align="start" />
          <div className="flex items-center gap-6 text-white/80 text-sm">
            {[
              { href: "/", label: "Accueil" },
              { href: "/products", label: "Catalogue" },
              { href: "/cart", label: "Panier" },
              { href: "/contact", label: "Contact" },
            ].map(({ href, label }, i) => (
              <motion.span key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 * i }}>
                <Link href={href} className="hover:text-white hover:text-[#cf046d] transition-colors duration-300">
                  {label}
                </Link>
              </motion.span>
            ))}
          </div>
        </div>

        <motion.div
          className="mt-8 pt-6 border-t border-white/10 text-center text-white/50 text-xs"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          © {new Date().getFullYear()} SISMA Marketplace. Tous droits réservés.
        </motion.div>
      </div>
    </footer>
  );
}
