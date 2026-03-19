import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { returnsApi, type AdminReturn } from "@/api/returns.api";
import { 
  RotateCcw, Search, Filter, CheckCircle, XCircle, DollarSign,
  Package, User, Store, Calendar, MoreHorizontal, Eye, RefreshCw,
  Loader2, Download
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvé" },
  { value: "rejected", label: "Rejeté" },
  { value: "refunded", label: "Remboursé" },
  { value: "completed", label: "Terminé" },
];

const REASON_LABELS: Record<string, string> = {
  defective_product: "Produit défectueux",
  wrong_item: "Mauvais article reçu",
  not_as_described: "Non conforme à la description",
  size_issue: "Problème de taille",
  quality_issue: "Problème de qualité",
  changed_mind: "Changement d'avis",
  other: "Autre",
};

function formatStatus(status: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
    refunded: "secondary",
    completed: "outline",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Rejeté",
    refunded: "Remboursé",
    completed: "Terminé",
  };
  return { label: labels[status] || status, variant: variants[status] || "secondary" };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return "-";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(value);
}

export default function AdminReturnsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState<AdminReturn | null>(null);

  // Fetch returns
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ["admin", "returns", statusFilter, search, page],
    queryFn: async () => {
      const result = await returnsApi.list({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
        page,
        per_page: 20,
      });
      return result;
    },
  });

  const returns = returnsData?.data || [];
  const meta = returnsData?.meta;

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, refundAmount }: { id: number; refundAmount?: number }) =>
      returnsApi.approve(id, { refund_amount: refundAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "returns"] });
      toast({ title: "Retour approuvé", description: "La demande de retour a été approuvée" });
      setSelectedReturn(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'approuver le retour", variant: "destructive" as any });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      returnsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "returns"] });
      toast({ title: "Retour rejeté", description: "La demande de retour a été rejetée" });
      setSelectedReturn(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de rejeter le retour", variant: "destructive" as any });
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: (id: number) => returnsApi.refund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "returns"] });
      toast({ title: "Remboursement effectué", description: "Le remboursement a été traité" });
      setSelectedReturn(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de traiter le remboursement", variant: "destructive" as any });
    },
  });

  const handleApprove = (returnItem: AdminReturn) => {
    const amount = prompt("Montant du remboursement (laisser vide pour montant auto):");
    approveMutation.mutate({ 
      id: returnItem.id, 
      refundAmount: amount ? parseFloat(amount) : undefined 
    });
  };

  const handleReject = (returnItem: AdminReturn) => {
    const reason = prompt("Motif du rejet:");
    if (reason) {
      rejectMutation.mutate({ id: returnItem.id, reason });
    }
  };

  const handleRefund = (returnItem: AdminReturn) => {
    if (confirm("Confirmer le remboursement?")) {
      refundMutation.mutate(returnItem.id);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Retours</h1>
            <p className="text-gray-500">Gérez les demandes de retour produits</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Export CSV
                const csvContent = [
                  ['ID', 'Commande', 'Client', 'Produit', 'Motif', 'Statut', 'Date'].join(','),
                  ...returns.map(r => [
                    r.id,
                    r.order_id,
                    r.customer_name,
                    r.product_name,
                    REASON_LABELS[r.reason] || r.reason,
                    r.status,
                    r.created_at
                  ].join(','))
                ].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `retours_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                toast({ title: "Export CSV", description: "Le fichier CSV a été téléchargé" });
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {returns.filter(r => r.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Approuvés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {returns.filter(r => r.status === "approved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Remboursés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {returns.filter(r => r.status === "refunded").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Rejetés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {returns.filter(r => r.status === "rejected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par commande, client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <RotateCcw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune demande de retour trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((item) => {
                  const statusInfo = formatStatus(item.status);
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Return Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">Retour #{item.id}</span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Commande #{item.order_id}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.order?.customer_name || "Client"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {item.supplier?.name || "Fournisseur"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm font-medium">Motif: </span>
                          <span className="text-sm text-gray-600">
                            {REASON_LABELS[item.reason] || item.reason}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {item.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(item)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(item)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeter
                            </Button>
                          </>
                        )}
                        {item.status === "approved" && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleRefund(item)}
                            disabled={refundMutation.isPending}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Rembourser
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReturn(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Précédent
                </Button>
                <span className="flex items-center text-sm text-gray-500">
                  Page {page} sur {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSelectedReturn(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Détails du retour #{selectedReturn.id}</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <Badge variant={formatStatus(selectedReturn.status).variant}>
                      {formatStatus(selectedReturn.status).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Montant</p>
                    <p className="font-semibold">{formatCurrency(selectedReturn.refund_amount)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Motif</p>
                  <p>{REASON_LABELS[selectedReturn.reason] || selectedReturn.reason}</p>
                </div>

                {selectedReturn.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p>{selectedReturn.description}</p>
                  </div>
                )}

                {selectedReturn.admin_notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes admin</p>
                    <p>{selectedReturn.admin_notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Commande</p>
                  <p>#{selectedReturn.order_id} - {selectedReturn.order?.customer_name}</p>
                  <p className="text-sm text-gray-500">
                    Total: {formatCurrency(selectedReturn.order?.total)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Créé le</p>
                  <p>{formatDate(selectedReturn.created_at)}</p>
                </div>

                {selectedReturn.processed_at && (
                  <div>
                    <p className="text-sm text-gray-500">Traité le</p>
                    <p>{formatDate(selectedReturn.processed_at)}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button 
                  className="flex-1" 
                  onClick={() => setSelectedReturn(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
