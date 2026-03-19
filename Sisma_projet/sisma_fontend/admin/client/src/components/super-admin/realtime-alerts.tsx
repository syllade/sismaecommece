import { AlertTriangle, Bell, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RealtimeAlert } from "@/types/super-admin";

interface RealtimeAlertsProps {
  alerts: RealtimeAlert[];
}

function levelIcon(level: RealtimeAlert["level"]) {
  if (level === "critical") return <Siren className="h-4 w-4 text-red-600" />;
  if (level === "warning") return <AlertTriangle className="h-4 w-4 text-sisma-orange" />;
  return <Bell className="h-4 w-4 text-sisma-red" />;
}

function levelLabel(level: RealtimeAlert["level"]) {
  if (level === "critical") return "Critique";
  if (level === "warning") return "Attention";
  return "Info";
}

function levelClass(level: RealtimeAlert["level"]) {
  if (level === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (level === "warning") return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function RealtimeAlerts({ alerts }: RealtimeAlertsProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="font-outfit text-lg text-slate-900">Notifications Temps Reel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Aucun signal actif.
          </p>
        )}
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {levelIcon(alert.level)}
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                </div>
                <p className="text-xs text-slate-500">{alert.description}</p>
              </div>
              <Badge className={levelClass(alert.level)}>{levelLabel(alert.level)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
