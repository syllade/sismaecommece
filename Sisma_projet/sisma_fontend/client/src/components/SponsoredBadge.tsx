import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SponsoredBadgeProps {
  className?: string;
  tone?: "light" | "solid";
  label?: string;
}

export function SponsoredBadge({ className, tone = "light", label = "Sponsorisé" }: SponsoredBadgeProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5 tracking-wide";
  const toneClass =
    tone === "solid"
      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
      : "bg-white/90 text-orange-700 border border-orange-200 shadow-sm backdrop-blur";

  return (
    <span className={cn(base, toneClass, className)}>
      <Star className="h-3 w-3 fill-current" />
      <span>{label}</span>
    </span>
  );
}
