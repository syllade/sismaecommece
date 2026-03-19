/** Bandeau défilant orienté business / crédibilité - animation infinie fluide */

const ITEMS = [
  "✓ Paiement 100% sécurisé",
  "✓ Livraison rapide partout en Côte d'Ivoire",
  "✓ Satisfait ou remboursé",
  "✓ Service client à votre écoute",
  "✓ +5000 clients nous font confiance",
  "✓ Produits de qualité garantie",
  "✓ Commandez en toute sérénité",
  "✓ FAT' SHOP – Votre satisfaction, notre priorité",
];

function Strip() {
  return (
    <div className="flex items-center gap-10 shrink-0 px-4">
      {ITEMS.map((text, i) => (
        <span
          key={i}
          className="whitespace-nowrap text-sm font-semibold text-gray-700 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ae1bd8] shrink-0" />
          {text}
        </span>
      ))}
    </div>
  );
}

export function MarqueeCredibility() {
  return (
    <section
      className="py-3 bg-gradient-to-r from-[#ae1bd8]/10 via-white to-[#cf046d]/10 border-y border-[#ae1bd8]/20 overflow-hidden"
      aria-label="Messages de confiance"
    >
      <div className="flex w-max animate-marquee-credibility">
        <Strip />
        <Strip />
      </div>
    </section>
  );
}