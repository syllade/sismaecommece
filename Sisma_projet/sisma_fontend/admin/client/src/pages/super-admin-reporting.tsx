import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileDown } from "lucide-react";
import { statsApi } from "@/api/stats.api";
import { Layout } from "@/components/layout";
import { SuperPageHeader } from "@/components/super-admin/super-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function getDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const format = (date: Date) => date.toISOString().slice(0, 10);
  return { from: format(from), to: format(to) };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SuperAdminReportingPage() {
  const { toast } = useToast();
  const { from, to } = getDateRange();

  const ordersReportQuery = useQuery({
    queryKey: ["super-admin", "reports", "orders", from, to],
    queryFn: () => statsApi.getOrdersReport(from, to),
    refetchInterval: 120000,
  });

  const suppliersReportQuery = useQuery({
    queryKey: ["super-admin", "reports", "suppliers", from, to],
    queryFn: () => statsApi.getSuppliersReport(from, to),
    refetchInterval: 120000,
  });

  const topProductsQuery = useQuery({
    queryKey: ["super-admin", "reports", "top-products", from, to],
    queryFn: () => statsApi.getTopProductsReport(10, from, to),
    refetchInterval: 120000,
  });

  const exportCsvMutation = useMutation({
    mutationFn: async () => {
      const blob = await statsApi.exportOrdersCsv(from, to);
      downloadBlob(blob, `sisma-report-orders-${from}-to-${to}.csv`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Export CSV impossible";
      toast({ title: "Export echoue", description: message, variant: "destructive" });
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const blob = await statsApi.exportOrdersPdf(from, to);
      downloadBlob(blob, `sisma-report-orders-${from}-to-${to}.pdf`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Export PDF impossible";
      toast({ title: "Export echoue", description: message, variant: "destructive" });
    },
  });

  const ordersPerDay = useMemo(() => {
    const rows = ordersReportQuery.data?.daily ?? [];
    return rows.map((item) => ({
      date: item.date,
      total: item.orders,
      label: formatDateLabel(item.date),
    }));
  }, [ordersReportQuery.data]);

  const revenueBySupplier = useMemo(
    () =>
      (suppliersReportQuery.data ?? [])
        .map((supplier) => ({
          supplier: supplier.name,
          total: supplier.revenue,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
    [suppliersReportQuery.data],
  );

  const summary = ordersReportQuery.data?.summary;

  return (
    <Layout>
      <div className="space-y-6">
        <SuperPageHeader
          title="Statistiques & Reporting"
          subtitle="KPI metier, suivi ventes et exports operables pour pilotage quotidien."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total commandes (30j)</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-outfit font-bold text-slate-900">{summary?.total_orders ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CA total (30j)</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-outfit font-bold text-slate-900">
              {(summary?.total_revenue ?? 0).toLocaleString("fr-FR")} FCFA
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top produits (entries)</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-outfit font-bold text-slate-900">
              {(topProductsQuery.data ?? []).length}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Commandes / jour</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#D81918" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">CA par fournisseur</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySupplier}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="supplier" hide />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString("fr-FR")} FCFA`} />
                  <Bar dataKey="total" fill="#F7941D" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Top produits vendus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(topProductsQuery.data ?? []).length === 0 && <p className="text-sm text-slate-500">Aucune donnee produit disponible.</p>}
            {(topProductsQuery.data ?? []).map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.quantity_sold} ventes</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button className="bg-sisma-red hover:bg-sisma-red/90" onClick={() => exportCsvMutation.mutate()} disabled={exportCsvMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportPdfMutation.mutate()} disabled={exportPdfMutation.isPending}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
    </Layout>
  );
}

