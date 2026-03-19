import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  Zap, 
  Truck, 
  TrendingUp, 
  Shield, 
  Star, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Menu,
  X,
  ArrowRight,
  Mail,
  Instagram,
  Twitter
} from "lucide-react";
import {
  useSupplierRegisterMutation,
  useSupplierRequirements,
} from "@/hooks/use-supplier-registration";

/* ─── COLOR TOKENS (matching existing brand) ─── */
const C = {
  red: "#D81918",
  redDark: "#A80F0F",
  redLight: "#FFF0F0",
  orange: "#F7941D",
  orangeLight: "#FFFAF0",
  dark: "#1A1A1A",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray900: "#111827",
};

/* ─── CUSTOM ANIMATIONS ─── */
const scrollKeyframes = `
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-ticker {
    display: flex;
    width: 200%;
    animation: scroll 30s linear infinite;
  }
  @keyframes pulse-red {
    0% { box-shadow: 0 0 0 0 rgba(216, 25, 24, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(216, 25, 24, 0); }
    100% { box-shadow: 0 0 0 0 rgba(216, 25, 24, 0); }
  }
`;

/* ─── NAVIGATION ─── */
function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const navLinks = [
    { label: "Solutions", href: "#solutions" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "Logistique", href: "#logistique" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#D81918] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Sisma Pro</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-[#D81918] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => setLocation("/supplier-register")}
              className="bg-[#D81918] text-white px-6 py-3 rounded-full hover:bg-gray-900 transition-all shadow-lg shadow-red-200"
            >
              Devenir Fournisseur
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block py-2 text-gray-600 font-medium"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setLocation("/supplier-register");
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#D81918] text-white px-6 py-3 rounded-full font-bold text-center"
              >
                Devenir Fournisseur
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── HERO SECTION ─── */
function HeroSection() {
  const [, setLocation] = useLocation();

  return (
    <section className="relative pt-20 pb-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-red-50 text-[#D81918] text-xs font-bold uppercase tracking-widest mb-6 border border-red-100">
              L'excellence Ivoirienne en E-commerce
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-8 text-gray-900">
              La plateforme N°1 des{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D81918] to-[#F7941D]">
                Fournisseurs Professionnels
              </span>{" "}
              en CI
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
              Vendez vos produits à l'échelle nationale avec une infrastructure logistique de pointe, 
              une visibilité IA optimisée et des paiements sécurisés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setLocation("/supplier-register")}
                className="bg-[#D81918] text-white px-8 py-4 rounded-xl font-bold text-center hover:scale-105 transition-transform shadow-xl shadow-red-100"
              >
                Démarrer gratuitement
              </button>
              <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-center hover:bg-gray-50 transition-colors">
                Voir la Démo
              </button>
            </div>
            <div className="mt-8 flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>+2,500 Grossistes nous font confiance</span>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-30"></div>
            <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 transform rotate-2">
              {/* Dashboard Mockup */}
              <div className="bg-gray-900 rounded-2xl p-6 text-white">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Ventes Totales</p>
                    <h4 className="text-3xl font-bold">12,450,000 <span className="text-sm font-normal text-gray-400">FCFA</span></h4>
                  </div>
                  <div className="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-1 rounded">+14.2%</div>
                </div>
                <div className="h-32 flex items-end space-x-2">
                  {[25, 50, 35, 75, 60, 80, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#D81918] rounded-t"
                      style={{ height: `${h}%`, opacity: 0.4 + (i * 0.1) }}
                    ></div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-400">Commandes</p>
                    <p className="font-bold">1,240</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-400">Satisfaction</p>
                    <p className="font-bold">98.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── LIVE MARKET TICKER ─── */
function MarketTicker() {
  const tickerItems = [
    { text: "Commande reçue à Abidjan : 450,000 FCFA", type: "order" },
    { text: "Nouveau grossiste : Electra CI", type: "new" },
    { text: "Livraison effectuée : Korhogo", type: "delivery" },
    { text: "Vente Flash : Mode & Beauté", type: "flash" },
  ];

  return (
    <section className="bg-gray-900 py-6 overflow-hidden border-y border-white/10">
      <div className="animate-ticker">
        {/* First set */}
        <div className="flex items-center space-x-12 px-6 shrink-0">
          {tickerItems.map((item, i) => (
            <span key={`a-${i}`} className="flex items-center text-white/80 font-medium whitespace-nowrap">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
              {item.text}
            </span>
          ))}
        </div>
        {/* Duplicate for seamless loop */}
        <div className="flex items-center space-x-12 px-6 shrink-0">
          {tickerItems.map((item, i) => (
            <span key={`b-${i}`} className="flex items-center text-white/80 font-medium whitespace-nowrap">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── VALUE PROPOSITIONS ─── */
function ValuePropositions() {
  const features = [
    {
      icon: CreditCard,
      title: "Paiement Mobile Money",
      desc: "Encaissez instantanément via Orange, MTN, Moov et Wave. Une intégration fluide pour vos clients ivoiriens.",
      color: "red",
    },
    {
      icon: Zap,
      title: "IA & SEO Optimisé",
      desc: "Nos algorithmes IA optimisent vos fiches produits pour apparaître en tête des recherches Google et Sisma.",
      color: "orange",
    },
    {
      icon: Truck,
      title: "Logistique 14 Régions",
      desc: "Une couverture nationale complète. Nous gérons le stockage, l'emballage et l'expédition de vos colis.",
      color: "blue",
    },
  ];

  return (
    <section className="py-24 bg-gray-50" id="solutions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">
            Pourquoi choisir Sisma Pro ?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une suite d'outils complète conçue pour la croissance des entreprises locales.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#D81918] transition-colors ${
                  feature.color === "red"
                    ? "bg-red-50 text-[#D81918]"
                    : feature.color === "orange"
                    ? "bg-orange-50 text-[#F7941D]"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── DASHBOARD PREVIEW ─── */
function DashboardPreview() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                Gérez votre empire du bout des doigts.
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Un tableau de bord intuitif pour suivre vos ventes en temps réel, gérer vos stocks 
                et analyser vos performances financières avec une précision Fintech.
              </p>
              <ul className="space-y-4">
                {[
                  "Réconciliation automatique des paiements",
                  "Alertes de stock intelligent",
                  "Exportation comptable simplifiée",
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <div className="bg-green-500/20 p-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                      Ventes Totales
                    </p>
                    <h4 className="text-3xl font-bold">
                      12,450,000 <span className="text-sm font-normal text-slate-400">FCFA</span>
                    </h4>
                  </div>
                  <div className="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-1 rounded">
                    +14.2%
                  </div>
                </div>
                <div className="h-40 flex items-end space-x-2">
                  {[25, 50, 35, 75, 60, 80, 100].map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-[#D81918] rounded-t"
                      style={{ height: `${h}%`, opacity: 0.4 + (i * 0.1) }}
                    ></div>
                  ))}
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400">Commandes</p>
                    <p className="font-bold">1,240</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400">Satisfaction</p>
                    <p className="font-bold">98.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── MARKETING SUPPORT ─── */
function MarketingSupport() {
  const services = [
    {
      icon: Star,
      title: "Visibilité Prioritaire",
      desc: "Mise en avant VIP sur notre marketplace et réseaux sociaux pour maximiser votre portée.",
      color: "red",
    },
    {
      icon: Zap,
      title: "Campagnes SMS & Email",
      desc: "Touchez directement +100k acheteurs qualifiés en CI avec des messages personnalisés.",
      color: "orange",
    },
    {
      icon: TrendingUp,
      title: "Studio Photo & Branding",
      desc: "Optimisation professionnelle de l'image de marque et visuels haute définition de vos produits.",
      color: "red",
    },
    {
      icon: Shield,
      title: "Publicité Ciblée",
      desc: "Gestion experte de vos campagnes Meta & Google Ads pour un retour sur investissement garanti.",
      color: "orange",
    },
  ];

  return (
    <section className="py-24 bg-gray-100" id="tarifs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#D81918] font-bold uppercase tracking-widest text-xs">
            Accompagnement Marketing Stratégique
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-4 mb-4 text-gray-900">
            Propulsez votre marque avec Sisma Marketing
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#D81918] to-[#F7941D] mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:border-[#D81918]/30 transition-all hover:shadow-md"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                  service.color === "red"
                    ? "bg-red-50 text-[#D81918]"
                    : "bg-orange-50 text-[#F7941D]"
                }`}
              >
                <service.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-gray-900">{service.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials() {
  const testimonials = [
    {
      name: "Jean-Marc Koffi",
      role: "Koffi Boutique • Abidjan",
      text: "Depuis mon passage sur Sisma Pro, mes ventes ont bondi de 40%. Les outils d'IA pour optimiser mes fiches produits m'ont permis de toucher des clients à San Pédro et Korhogo que je n'aurais jamais pu atteindre seul. La logistique est d'une fluidité exemplaire.",
      type: "Fournisseur",
    },
    {
      name: "Sarah Diabaté",
      role: "Abidjan Tech • Plateau",
      text: "En tant qu'acheteur régulier pour ma chaîne de magasins, j'apprécie énormément la transparence des stocks et la rapidité des livraisons. Recevoir mes commandes tech en moins de 48h partout en CI est un atout stratégique pour mon business.",
      type: "Acheteur",
    },
    {
      name: "Ibrahim Traoré",
      role: "Traoré & Co • Yamoussoukro",
      text: "Le système de paiement Mobile Money intégré est une révolution. Fini les soucis de réconciliation manuelle. Sisma gère tout de A à Z, ce qui me libère un temps précieux pour me concentrer sur le sourcing de mes produits.",
      type: "Fournisseur",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900">
            Succès Partagés : Ils font grandir leur business avec Sisma
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Découvrez comment nos fournisseurs et acheteurs transforment le commerce en Côte d'Ivoire.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 py-10 border-y border-gray-100 bg-gray-50/50 rounded-3xl px-8">
          {[
            { value: "98%", label: "Satisfaction Client", color: "red" },
            { value: "+5,000", label: "Commerçants Actifs", color: "orange" },
            { value: "14", label: "Régions Couvertes", color: "red" },
            { value: "24/7", label: "Support Dédié", color: "orange" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className={`text-4xl font-black ${stat.color === "red" ? "text-[#D81918]" : "text-[#F7941D]"}`}>
                {stat.value}
              </p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col"
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-[#F7941D] fill-[#F7941D]" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-8 flex-grow italic">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                    t.type === "Fournisseur" ? "bg-red-50 text-[#D81918]" : "bg-orange-50 text-[#F7941D]"
                  }`}
                >
                  {t.type}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ SECTION ─── */
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Quel est le délai d'activation de mon compte ?",
      answer:
        "Bénéficiez d'une réactivité exceptionnelle : dès la soumission de vos documents (NIF, RCCM), nos experts procèdent à une vérification humaine rigoureuse en seulement 2 à 4 heures. Une fois validé, votre accès au Dashboard est immédiatement activé pour lancer vos premières ventes.",
    },
    {
      question: "Quels sont les frais de commission ?",
      answer:
        "Nous opérons sur un modèle transparent de 'Pas de vente, pas de frais'. Sisma prélève une commission unique de 8% uniquement sur vos transactions réussies. Ce tarif tout-en-un couvre les frais Mobile Money, votre visibilité marketing premium et l'accès illimité à nos outils d'analyse.",
    },
    {
      question: "Quels types de produits puis-je vendre ?",
      answer:
        "Sisma est le carrefour des opportunités. Nous accueillons une vaste gamme de produits neufs, allant de la High-Tech et l'Électronique à la Mode, la Beauté, ainsi que l'équipement de la Maison et la Construction, tant qu'ils respectent les normes ivoiriennes.",
    },
    {
      question: "Comment sont gérés les retours clients ?",
      answer:
        "Dormez sur vos deux oreilles : notre équipe logistique locale gère l'intégralité du processus. En cas de litige, nous assurons l'arbitrage, récupérons le produit et effectuons le remboursement client instantanément via Mobile Money, protégeant ainsi votre réputation.",
    },
  ];

  return (
    <section className="py-24 bg-white" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#F7941D] font-bold uppercase tracking-widest text-xs">Besoin d'aide ?</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-4 mb-4 text-gray-900">
            Questions Fréquentes
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#D81918] to-[#F7941D] mx-auto rounded-full"></div>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <span className="font-bold text-gray-800">{faq.question}</span>
                {openIndex === i ? (
                  <ChevronUp className="w-5 h-5 text-[#D81918]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6 bg-white"
                  >
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Encore des questions ?{" "}
            <a className="text-[#D81918] font-bold hover:underline" href="#">
              Contactez notre support 24/7
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── SUPPORT SECTION ─── */
function SupportSection() {
  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Besoin d'aide supplémentaire ?
          </h2>
          <p className="text-gray-600">
            Notre équipe est à votre disposition pour vous accompagner dans votre croissance.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Support Direct Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-[#D81918] rounded-2xl flex items-center justify-center mb-6">
              <Phone className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Support Direct</h3>
            <p className="text-gray-600 text-sm mb-6">
              Disponible 24h/24 et 7j/7 via WhatsApp ou téléphone pour toutes vos urgences opérationnelles.
            </p>
            <a
              className="inline-flex items-center space-x-2 text-[#D81918] font-bold hover:underline"
              href="tel:+2250700000000"
            >
              <Phone className="w-4 h-4" />
              <span>+225 07 00 00 00 00</span>
            </a>
          </div>

          {/* Centre d'Aide Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-50 text-[#F7941D] rounded-2xl flex items-center justify-center mb-6">
              <Mail className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Centre d'Aide</h3>
            <p className="text-gray-600 text-sm mb-6">
              Consultez notre base de connaissances détaillée pour trouver des réponses immédiates à vos questions techniques.
            </p>
            <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-[#D81918] transition-colors">
              Explorer la FAQ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  const footerLinks = {
    Produits: [
      { label: "Vente en Gros", href: "#" },
      { label: "Dashboard Fournisseur", href: "#" },
      { label: "API Intégration", href: "#" },
      { label: "Solutions de Paiement", href: "#" },
    ],
    Support: [
      { label: "Centre d'aide", href: "#" },
      { label: "Documentation NIF/RCCM", href: "#" },
      { label: "Contactez-nous", href: "#" },
      { label: "Statut Service", href: "#" },
    ],
    Légal: [
      { label: "Confidentialité", href: "#" },
      { label: "CGV Grossistes", href: "#" },
      { label: "Mentions Légales", href: "#" },
    ],
  };

  return (
    <footer className="bg-gray-900 pt-20 pb-10 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-[#D81918] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-white">Sisma Pro</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Propulser le commerce ivoirien vers de nouveaux sommets grâce à l'innovation technologique 
              et une logistique sans faille.
            </p>
            <div className="flex space-x-4">
              <a
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#D81918] transition-colors"
                href="#"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#D81918] transition-colors"
                href="#"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-bold mb-6">{title}</h4>
              <ul className="space-y-4 text-sm">
                {links.map((link) => (
                  <li key={link.label}>
                    <a className="hover:text-white transition-colors" href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>© 2023 Sisma Technologies. Tous droits réservés.</p>
          <p className="mt-4 md:mt-0 flex items-center">
            Made with <span className="text-red-500 mx-1">❤</span> in Abidjan
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── LIVE CHAT WIDGET ─── */
function LiveChatWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <button className="w-16 h-16 bg-[#D81918] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform animate-pulse hover:shadow-red-400/50 focus:outline-none">
        <MessageCircle className="text-3xl" />
      </button>
    </div>
  );
}

/* ─── MAIN LANDING PAGE ─── */
export default function Landing() {
  // Inject custom styles
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = scrollKeyframes;
    document.head.appendChild(style);
    return () => {
      try {
        document.head.removeChild(style);
      } catch (e) {
        // Element already removed
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navigation />
      <HeroSection />
      <MarketTicker />
      <ValuePropositions />
      <DashboardPreview />
      <MarketingSupport />
      <Testimonials />
      <FAQ />
      <SupportSection />
      <Footer />
      <LiveChatWidget />
    </div>
  );
}
