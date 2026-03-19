import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SuperKpiCardTone = "red" | "orange" | "slate";

const toneClasses: Record<SuperKpiCardTone, string> = {
  red: "from-sisma-red/10 to-white text-sisma-red border-sisma-red/30",
  orange: "from-sisma-orange/10 to-white text-sisma-orange border-sisma-orange/30",
  slate: "from-slate-100 to-white text-slate-700 border-slate-200",
};

interface SuperKpiCardProps {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: SuperKpiCardTone;
}

export function SuperKpiCard({ title, value, hint, icon: Icon, tone = "slate" }: SuperKpiCardProps) {
  return (
    <Card className={cn("border bg-gradient-to-br", toneClasses[tone])}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-3xl font-outfit font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
        <div className="rounded-xl bg-white p-2.5 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
