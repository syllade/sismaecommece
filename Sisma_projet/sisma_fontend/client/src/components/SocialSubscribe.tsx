import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { motion } from "framer-motion";

const networks = [
  { name: "Facebook", icon: FaFacebookF, href: "#", color: "hover:bg-[#1877F2] hover:text-white", bg: "bg-[#1877F2]/10 text-[#1877F2]" },
  { name: "Instagram", icon: FaInstagram, href: "#", color: "hover:bg-[#E4405F] hover:text-white", bg: "bg-[#E4405F]/10 text-[#E4405F]" },
  { name: "Twitter", icon: FaTwitter, href: "#", color: "hover:bg-[#1DA1F2] hover:text-white", bg: "bg-[#1DA1F2]/10 text-[#1DA1F2]" },
  { name: "WhatsApp", icon: FaWhatsapp, href: "#", color: "hover:bg-[#25D366] hover:text-white", bg: "bg-[#25D366]/10 text-[#25D366]" },
  { name: "YouTube", icon: FaYoutube, href: "#", color: "hover:bg-[#FF0000] hover:text-white", bg: "bg-[#FF0000]/10 text-[#FF0000]" },
];

/** Bloc Abonnez-vous sur nos différents réseaux avec icônes animées */
export function SocialSubscribe() {
  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center">
        <motion.h2
          className="font-display font-bold text-xl md:text-2xl text-gray-900 mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Abonnez-vous sur nos réseaux sociaux
        </motion.h2>
        <p className="text-gray-600 text-sm md:text-base mb-8 max-w-xl mx-auto">
          Suivez-nous pour ne rien manquer de nos offres, nouveautés et actualités.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {networks.map(({ name, icon: Icon, href, color, bg }, index) => (
            <motion.a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.15, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} ${color} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ae1bd8] focus:ring-offset-2`}
              aria-label={name}
              title={name}
            >
              <Icon className="w-5 h-5" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
