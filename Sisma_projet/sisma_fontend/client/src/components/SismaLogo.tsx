import { Link } from "wouter";
import { motion } from "framer-motion";

type SismaLogoVariant = "default" | "light" | "dark";
type SismaLogoSize = "sm" | "md" | "lg";
type SismaLogoAlign = "center" | "start";

interface SismaLogoProps {
  variant?: SismaLogoVariant;
  showSlogan?: boolean;
  className?: string;
  size?: SismaLogoSize;
  align?: SismaLogoAlign;
  href?: string;
}

const FRAME_CLASS: Record<SismaLogoSize, string> = {
  sm: "h-10 w-[116px] sm:h-11 sm:w-[132px]",
  md: "h-11 w-[138px] sm:h-[52px] sm:w-[154px]",
  lg: "h-14 w-[176px] sm:h-16 sm:w-[194px]",
};

const TAGLINE_COLOR: Record<SismaLogoVariant, string> = {
  default: "text-gray-500",
  light: "text-white/80",
  dark: "text-slate-500",
};

const ALIGN_CLASS: Record<SismaLogoAlign, string> = {
  center: "items-center text-center",
  start: "items-start text-left",
};

const LOGO_SRC: Record<SismaLogoVariant, string> = {
  default: "/logo%20png.png",
  light: "/logo-blanc.png",
  dark: "/logo-noir.png",
};

const BRAND_COPY = "Marketplace multi-categories · Votre satisfaction, notre priorite";

function getImageClass(variant: SismaLogoVariant) {
  const blend = variant === "default" ? "mix-blend-multiply" : "";
  return `pointer-events-none absolute left-1/2 top-1/2 w-[172%] max-w-none -translate-x-[51%] -translate-y-[49%] object-contain ${blend}`;
}

export function SismaLogo({
  variant = "default",
  showSlogan = true,
  className = "",
  size = "md",
  align = "center",
  href = "/",
}: SismaLogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex max-w-full flex-col gap-1 group ${ALIGN_CLASS[align]} ${className}`}
      aria-label="SISMA"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={`relative overflow-hidden rounded-2xl ${FRAME_CLASS[size]}`}
      >
        <img
          src={LOGO_SRC[variant]}
          alt="SISMA"
          className={getImageClass(variant)}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </motion.div>
      {showSlogan && (
        <motion.p
          className={`hidden max-w-[18rem] sm:block text-[10px] sm:text-xs font-medium tracking-[0.04em] ${TAGLINE_COLOR[variant]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {BRAND_COPY}
        </motion.p>
      )}
    </Link>
  );
}

export function FatShopLogo(props: SismaLogoProps) {
  return <SismaLogo {...props} />;
}
