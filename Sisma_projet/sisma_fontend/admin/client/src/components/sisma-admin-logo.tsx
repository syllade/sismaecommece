import { Link } from "wouter";

type LogoVariant = "default" | "light" | "dark";
type LogoSize = "sm" | "md";

interface SismaAdminLogoProps {
  title?: string;
  subtitle?: string;
  className?: string;
  href?: string;
  size?: LogoSize;
  variant?: LogoVariant;
}

const FRAME_CLASS: Record<LogoSize, string> = {
  sm: "h-10 w-[116px]",
  md: "h-11 w-[138px]",
};

const LOGO_SRC: Record<LogoVariant, string> = {
  default: "/logo%20png.png",
  light: "/logo-blanc.png",
  dark: "/logo-noir.png",
};

const TEXT_COLOR: Record<LogoVariant, { title: string; subtitle: string }> = {
  default: { title: "text-slate-900", subtitle: "text-slate-500" },
  light: { title: "text-white", subtitle: "text-white/75" },
  dark: { title: "text-slate-900", subtitle: "text-slate-500" },
};

function getImageClass(variant: LogoVariant) {
  const blend = variant === "default" ? "mix-blend-multiply" : "";
  return `pointer-events-none absolute left-1/2 top-1/2 w-[172%] max-w-none -translate-x-[51%] -translate-y-[49%] object-contain ${blend}`;
}

export function SismaAdminLogo({
  title,
  subtitle,
  className = "",
  href = "/admin/dashboard",
  size = "md",
  variant = "default",
}: SismaAdminLogoProps) {
  const colors = TEXT_COLOR[variant];

  return (
    <Link href={href} className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <span className={`relative overflow-hidden rounded-2xl ${FRAME_CLASS[size]}`}>
        <img
          src={LOGO_SRC[variant]}
          alt="SISMA"
          className={getImageClass(variant)}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </span>
      {title && <span className={`text-[13px] font-semibold leading-tight ${colors.title}`}>{title}</span>}
      {subtitle && <span className={`text-[11px] leading-tight ${colors.subtitle}`}>{subtitle}</span>}
    </Link>
  );
}
