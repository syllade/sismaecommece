import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search, ChevronDown, ShoppingCart, Truck, CreditCard,
  RefreshCw, ShieldCheck, MessageCircle, Package, Star,
  Headphones, Zap, ArrowRight, CheckCircle, HelpCircle,
  Clock, Phone,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "wouter";

// ─── DONNÉES ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "commande",
    label: "Commandes",
    icon: ShoppingCart,
    color: "#f57224",
    glow: "#f5722430",
    count: 5,
  },
  {
    id: "livraison",
    label: "Livraison",
    icon: Truck,
    color: "#3bb77e",
    glow: "#3bb77e30",
    count: 4,
  },
  {
    id: "paiement",
    label: "Paiement",
    icon: CreditCard,
    color: "#6c63ff",
    glow: "#6c63ff30",
    count: 4,
  },
  {
    id: "retour",
    label: "Retours",
    icon: RefreshCw,
    color: "#ef4444",
    glow: "#ef444430",
    count: 3,
  },
  {
    id: "compte",
    label: "Mon compte",
    icon: ShieldCheck,
    color: "#f59e0b",
    glow: "#f59e0b30",
    count: 3,
  },
  {
    id: "produit",
    label: "Produits",
    icon: Package,
    color: "#0ea5e9",
    glow: "#0ea5e930",
    count: 3,
  },
];

const FAQ_ITEMS = [
  // Commandes
  {
    id: 1, cat: "commande",
    q: "Comment passer une commande sur FAT' SHOP ?",
    a: "C'est simple ! Ajoutez vos articles au panier, cliquez sur « Panier », renseignez vos informations de livraison, choisissez votre mode de paiement (Mobile Money, espèces, virement), puis validez. Vous recevrez une confirmation immédiatement.",
  },
  {
    id: 2, cat: "commande",
    q: "Puis-je modifier ou annuler ma commande après validation ?",
    a: "Oui, dans les 2 heures suivant la commande vous pouvez nous contacter via WhatsApp pour toute modification ou annulation. Passé ce délai, si la commande est déjà en préparation, nous ferons notre possible mais sans garantie.",
  },
  {
    id: 3, cat: "commande",
    q: "Comment suivre l'état de ma commande ?",
    a: "Dès la confirmation, vous recevez un numéro de suivi par SMS ou WhatsApp. Vous pouvez aussi consulter votre compte FAT' SHOP, section « Mes commandes », pour voir le statut en temps réel.",
  },
  {
    id: 4, cat: "commande",
    q: "Puis-je commander plusieurs articles en une seule fois ?",
    a: "Absolument ! Ajoutez autant de produits que vous souhaitez au panier avant de finaliser. Si vos articles viennent de vendeurs différents, ils peuvent arriver en plusieurs colis.",
  },
  {
    id: 5, cat: "commande",
    q: "Que se passe-t-il si mon article est en rupture de stock ?",
    a: "Nous vous prévenons par SMS ou WhatsApp dès que possible. Vous êtes alors libre d'attendre le réapprovisionnement, de choisir un article similaire, ou d'être remboursé intégralement.",
  },
  // Livraison
  {
    id: 6, cat: "livraison",
    q: "Quels sont les délais de livraison ?",
    a: "La livraison standard est effectuée sous 24 à 72h en Côte d'Ivoire. Pour Abidjan et ses communes, comptez souvent moins de 24h. Pour l'intérieur du pays, le délai peut aller jusqu'à 5 jours selon la zone.",
  },
  {
    id: 7, cat: "livraison",
    q: "La livraison est-elle gratuite ?",
    a: "La livraison est gratuite pour toute commande supérieure à 10 000 FCFA à Abidjan. En dessous de ce montant ou pour les autres villes, des frais de livraison s'appliquent et sont clairement indiqués avant la validation.",
  },
  {
    id: 8, cat: "livraison",
    q: "Livrez-vous dans toute la Côte d'Ivoire ?",
    a: "Oui ! Nous livrons dans toutes les villes de Côte d'Ivoire grâce à nos partenaires logistiques. Certaines zones très éloignées peuvent nécessiter un délai supplémentaire.",
  },
  {
    id: 9, cat: "livraison",
    q: "Que faire si je ne suis pas disponible lors de la livraison ?",
    a: "Notre livreur vous contactera avant d'arriver. En cas d'absence, vous pouvez désigner une personne de confiance pour réceptionner le colis, ou reporter la livraison gratuitement une fois.",
  },
  // Paiement
  {
    id: 10, cat: "paiement",
    q: "Quels modes de paiement acceptez-vous ?",
    a: "Nous acceptons : Orange Money, Wave, MTN Mobile Money, paiement à la livraison (espèces), virement bancaire et carte bancaire (Visa/Mastercard via notre interface sécurisée).",
  },
  {
    id: 11, cat: "paiement",
    q: "Le paiement en ligne est-il sécurisé ?",
    a: "Oui, à 100%. Toutes vos transactions sont chiffrées SSL. Nous ne stockons jamais vos informations bancaires. Notre passerelle de paiement est certifiée PCI-DSS.",
  },
  {
    id: 12, cat: "paiement",
    q: "Puis-je payer en plusieurs fois ?",
    a: "Oui ! Pour les commandes supérieures à 50 000 FCFA, nous proposons un paiement en 2 ou 3 fois sans frais. Contactez-nous via WhatsApp pour en bénéficier.",
  },
  {
    id: 13, cat: "paiement",
    q: "Que faire si mon paiement échoue ?",
    a: "Vérifiez d'abord que votre compte Mobile Money est suffisamment approvisionné. Si le problème persiste, essayez un autre mode de paiement ou contactez notre support. Votre panier est sauvegardé 24h.",
  },
  // Retours
  {
    id: 14, cat: "retour",
    q: "Quelle est votre politique de retour ?",
    a: "Vous disposez de 14 jours après réception pour retourner un article en bon état, dans son emballage d'origine. Les articles en promotion ou personnalisés ne sont pas éligibles au retour sauf défaut.",
  },
  {
    id: 15, cat: "retour",
    q: "Comment initier un retour ?",
    a: "Contactez notre service client via WhatsApp ou email avec votre numéro de commande et la raison du retour. Nous vous enverrons une étiquette de retour et organiserons la collecte gratuitement si le retour est dû à une erreur de notre part.",
  },
  {
    id: 16, cat: "retour",
    q: "Dans quel délai suis-je remboursé ?",
    a: "Après réception et vérification de l'article retourné (2-3 jours ouvrés), le remboursement est effectué sous 5 à 7 jours ouvrés sur le même moyen de paiement utilisé lors de l'achat.",
  },
  // Compte
  {
    id: 17, cat: "compte",
    q: "Comment créer un compte FAT' SHOP ?",
    a: "Cliquez sur « Se connecter » puis « Créer un compte ». Renseignez votre nom, email et numéro de téléphone. Un code de vérification vous sera envoyé par SMS pour activer votre compte.",
  },
  {
    id: 18, cat: "compte",
    q: "J'ai oublié mon mot de passe, que faire ?",
    a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Entrez votre email ou numéro de téléphone. Vous recevrez un lien de réinitialisation valable 30 minutes.",
  },
  {
    id: 19, cat: "compte",
    q: "Puis-je commander sans créer de compte ?",
    a: "Oui ! Vous pouvez commander en tant qu'invité. Cependant, créer un compte vous permet de suivre vos commandes, accéder à votre historique, et bénéficier de nos offres membres exclusives.",
  },
  // Produits
  {
    id: 20, cat: "produit",
    q: "Les produits sont-ils authentiques et de qualité ?",
    a: "Absolument. Nous sélectionnons soigneusement chaque produit et travaillons uniquement avec des fournisseurs vérifiés. Tous nos articles passent par un contrôle qualité avant expédition.",
  },
  {
    id: 21, cat: "produit",
    q: "Comment savoir si un produit est disponible en stock ?",
    a: "La disponibilité est indiquée sur chaque fiche produit. La barre de stock en bas de la carte vous donne une indication visuelle. Si un article est épuisé, vous pouvez activer une alerte pour être prévenu dès son retour.",
  },
  {
    id: 22, cat: "produit",
    q: "Les photos des produits sont-elles fidèles à la réalité ?",
    a: "Nous faisons de notre mieux pour que les photos reflètent fidèlement le produit réel. De légères différences de couleur peuvent exister selon l'écran. En cas de doute, contactez-nous pour plus de détails.",
  },
];

// ─── COMPOSANT ACCORDÉON ─────────────────────────────────────────────────────
function AccordionItem({ item, index, isOpen, onToggle }: {
  item: typeof FAQ_ITEMS[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const cat = CATEGORIES.find(c => c.id === item.cat)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 120 }}
      className="border border-gray-100 rounded-2xl overflow-hidden bg-white"
      style={{
        boxShadow: isOpen ? `0 4px 24px ${cat.glow}` : "0 1px 4px rgba(0,0,0,0.05)",
        borderColor: isOpen ? cat.color + "40" : undefined,
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left group"
      >
        {/* Icône catégorie */}
        <motion.div
          animate={isOpen ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cat.glow, color: cat.color }}
        >
          <cat.icon className="w-4 h-4" />
        </motion.div>

        <span className="flex-1 text-sm font-bold text-gray-800 group-hover:text-gray-900 leading-snug pr-2">
          {item.q}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="shrink-0"
          style={{ color: isOpen ? cat.color : "#9ca3af" }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 pb-5 pl-16">
              {/* Ligne accent */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="h-px mb-3 origin-left rounded-full"
                style={{ background: `linear-gradient(90deg, ${cat.color}, transparent)` }}
              />
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              {/* CheckCircle finale */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1.5 mt-3"
              >
                <CheckCircle className="w-3.5 h-3.5" style={{ color: cat.color }} />
                <span className="text-[11px] font-semibold" style={{ color: cat.color }}>
                  Cette réponse vous a aidé ?
                </span>
                <div className="flex gap-1 ml-1">
                  {["👍", "👎"].map(e => (
                    <motion.button
                      key={e}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.8 }}
                      className="text-sm"
                    >
                      {e}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CARTE CATÉGORIE ─────────────────────────────────────────────────────────
function CategoryCard({ cat, isActive, onClick, index }: {
  cat: typeof CATEGORIES[0];
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, type: "spring" }}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden"
      style={{
        borderColor: isActive ? cat.color : "transparent",
        background: isActive
          ? `linear-gradient(145deg, ${cat.glow}, ${cat.glow}80)`
          : "white",
        boxShadow: isActive ? `0 4px 20px ${cat.glow}` : "0 1px 6px rgba(0,0,0,0.06)",
      }}
    >
      {/* Halo */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: `radial-gradient(circle at center, ${cat.glow}, transparent)` }}
        />
      )}
      {/* Icône */}
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
        className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
        style={{ background: cat.glow, color: cat.color }}
      >
        <cat.icon className="w-5 h-5" />
      </motion.div>
      <span
        className="text-xs font-extrabold relative z-10"
        style={{ color: isActive ? cat.color : "#374151" }}
      >
        {cat.label}
      </span>
      {/* Count badge */}
      <motion.span
        animate={isActive ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full relative z-10"
        style={{
          background: isActive ? cat.color : "#f3f4f6",
          color: isActive ? "white" : "#6b7280",
        }}
      >
        {cat.count} questions
      </motion.span>
    </motion.button>
  );
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const stats = [
    { icon: Clock, label: "Réponse en", value: "< 2h", color: "#f57224" },
    { icon: Star, label: "Satisfaction client", value: "98%", color: "#f59e0b" },
    { icon: Headphones, label: "Support disponible", value: "7j/7", color: "#3bb77e" },
    { icon: Zap, label: "Questions résolues", value: "+5 000", color: "#6c63ff" },
  ];
  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, type: "spring" }}
          className="bg-white rounded-2xl p-4 text-center border border-gray-100 relative overflow-hidden"
          style={{ boxShadow: `0 2px 12px ${s.color}15` }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{ background: `radial-gradient(circle at center, ${s.color}08, transparent)` }}
          />
          <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
          <p
            className="text-xl font-black tabular-nums"
            style={{ color: s.color }}
          >
            {s.value}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── PAGE AIDE ────────────────────────────────────────────────────────────────
export default function Help() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    let list = FAQ_ITEMS;
    if (activeCat) list = list.filter(f => f.cat === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCat, search]);

  const handleCatClick = (id: string) => {
    setActiveCat(prev => prev === id ? null : id);
    setOpenId(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] pt-14 sm:pt-16 pb-20">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f0c00] via-[#1a1000] to-[#0f0c00] pt-12 pb-16 px-4">
        {/* BG grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(#f57224 0.5px, transparent 0.5px), linear-gradient(90deg, #f57224 0.5px, transparent 0.5px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Orbe gauche */}
        <motion.div
          className="absolute -left-20 top-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, #f5722420, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        {/* Orbe droite */}
        <motion.div
          className="absolute -right-10 bottom-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, #f5722415, transparent 70%)" }}
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        <div className="container mx-auto max-w-3xl relative z-10 text-center">
          {/* Icon pulsant */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 relative"
            style={{
              background: "linear-gradient(135deg, #f57224, #ff9a3c)",
              boxShadow: "0 8px 32px #f5722450",
            }}
          >
            <HelpCircle className="w-8 h-8 text-white" />
            {/* Pulse */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[#f57224]"
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="text-3xl md:text-5xl font-black text-white leading-tight mb-3"
          >
            Centre d'<span style={{ color: "#f57224" }}>Aide</span>
          </motion.h1>
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-white/50 text-sm md:text-base mb-8"
          >
            Trouvez rapidement une réponse à toutes vos questions
          </motion.p>

          {/* ── BARRE DE RECHERCHE ── */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: "spring" }}
            className="relative max-w-xl mx-auto"
          >
            <motion.div
              animate={searchFocused
                ? { boxShadow: "0 0 0 3px #f5722440, 0 8px 32px #f5722425" }
                : { boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }
              }
              className="flex items-center bg-white rounded-2xl overflow-hidden"
            >
              <motion.div
                animate={searchFocused ? { color: "#f57224", scale: 1.1 } : { color: "#9ca3af", scale: 1 }}
                className="pl-4 pr-3 shrink-0"
              >
                <Search className="w-5 h-5" />
              </motion.div>
              <input
                type="text"
                placeholder="Rechercher une question…"
                value={search}
                onChange={e => { setSearch(e.target.value); setOpenId(null); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 py-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent font-medium"
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={() => setSearch("")}
                    className="px-4 text-gray-400 hover:text-gray-600 transition-colors text-lg font-bold"
                  >
                    ×
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Suggestions sous la barre */}
            <AnimatePresence>
              {searchFocused && !search && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden"
                >
                  {["livraison gratuite", "remboursement", "Mobile Money", "délai de livraison"].map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSearch(s)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-orange-50 text-left text-sm text-gray-700 transition-colors"
                    >
                      <Search className="w-3 h-3 text-gray-400 shrink-0" />
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="container mx-auto px-3 max-w-4xl">

        {/* Stats */}
        <StatsBar />

        {/* ── CATÉGORIES ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.span
              className="w-1 h-5 rounded-full bg-[#f57224] shrink-0"
              animate={{ scaleY: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <h2 className="text-sm font-extrabold text-gray-800">Parcourir par catégorie</h2>
            {activeCat && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setActiveCat(null)}
                className="ml-auto text-[11px] font-bold text-[#f57224] hover:underline"
              >
                Tout afficher
              </motion.button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIES.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                isActive={activeCat === cat.id}
                onClick={() => handleCatClick(cat.id)}
                index={i}
              />
            ))}
          </div>
        </motion.div>

        {/* ── FAQ LISTE ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.span
                className="w-1 h-5 rounded-full bg-[#f57224] shrink-0"
                animate={{ scaleY: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <h2 className="text-sm font-extrabold text-gray-800">
                {search
                  ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} pour "${search}"`
                  : activeCat
                    ? `${CATEGORIES.find(c => c.id === activeCat)?.label}`
                    : "Questions fréquentes"}
              </h2>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">{filtered.length} questions</span>
          </div>

          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-10 text-center border border-gray-100"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-3"
                >
                  🔍
                </motion.div>
                <p className="text-gray-600 font-semibold text-sm mb-1">Aucune question trouvée</p>
                <p className="text-gray-400 text-xs">
                  Essayez d'autres mots-clés ou contactez-nous directement
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                {filtered.map((item, i) => (
                  <AccordionItem
                    key={item.id}
                    item={item}
                    index={i}
                    isOpen={openId === item.id}
                    onToggle={() => setOpenId(prev => prev === item.id ? null : item.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── BLOC "ENCORE UNE QUESTION ?" ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden p-8 md:p-10 text-center"
          style={{
            background: "linear-gradient(135deg, #0f0c00, #1f1400, #0f0c00)",
          }}
        >
          {/* Orbes BG */}
          <motion.div
            className="absolute -top-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, #f5722420, transparent)" }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, #f5722415, transparent)" }}
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(#f57224 0.5px, transparent 0.5px), linear-gradient(90deg, #f57224 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-4xl mb-4"
            >
              💬
            </motion.div>
            <h3 className="text-xl md:text-2xl font-black text-white mb-2">
              Vous n'avez pas trouvé votre réponse ?
            </h3>
            <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">
              Notre équipe est disponible 7j/7 pour vous aider. Choisissez le canal qui vous convient le mieux.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* WhatsApp CTA */}
              <motion.a
                href="https://wa.me/VOTRE_NUMERO?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20avec%20ma%20commande"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-extrabold text-sm text-white relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #25D366, #128C7E)",
                  boxShadow: "0 8px 24px #25D36640",
                }}
              >
                <FaWhatsapp className="w-5 h-5" />
                Écrire sur WhatsApp
                <motion.div
                  className="absolute inset-0 bg-white/15 skew-x-12"
                  animate={{ x: ["-120%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.a>

              {/* Email / Contact */}
              <Link href="/contact">
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-extrabold text-sm text-white border border-white/20 cursor-pointer hover:border-[#f57224]/60 hover:bg-white/5 transition-all"
                >
                  <MessageCircle className="w-5 h-5 text-[#f57224]" />
                  Nous contacter
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>

              {/* Téléphone */}
              <motion.a
                href="tel:+225XXXXXXXXX"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-extrabold text-sm text-white border border-white/20 hover:border-[#f57224]/60 hover:bg-white/5 transition-all"
              >
                <Phone className="w-5 h-5 text-[#f57224]" />
                Nous appeler
              </motion.a>
            </div>

            {/* Temps de réponse */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-6 flex items-center justify-center gap-2"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-[#3bb77e]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-white/40 text-xs font-medium">
                Temps de réponse moyen : moins de 2 heures
              </span>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}