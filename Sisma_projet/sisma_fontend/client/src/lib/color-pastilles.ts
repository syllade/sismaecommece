/**
 * Couleurs pour les pastilles de sélection (page produit).
 * Clé = nom de la couleur (insensible à la casse), valeur = classe bg ou hex pour pastille.
 */
export const COLOR_PASTILLE: Record<string, string> = {
  noir: "#1f2937",
  blanc: "#f8fafc",
  gris: "#64748b",
  bleu: "#3b82f6",
  rouge: "#ef4444",
  vert: "#22c55e",
  jaune: "#eab308",
  orange: "#f97316",
  rose: "#ec4899",
  marron: "#78350f",
  beige: "#d6d3d1",
  multicouleur: "linear-gradient(135deg, #ec4899 0%, #6366f1 50%, #22c55e 100%)",
};

export function getColorPastille(name: string): string | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return COLOR_PASTILLE[key] ?? null;
}
