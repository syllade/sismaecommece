import { Button } from "@/components/ui/button";

interface SuperPageHeaderProps {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function SuperPageHeader({ title, subtitle, ctaLabel, onCtaClick }: SuperPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-outfit text-3xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {ctaLabel && onCtaClick && (
        <Button className="bg-sisma-red hover:bg-sisma-red/90" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
