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
import { reviewsApi, type Review } from "@/api/reviews.api";
import { 
  Star, Search, Filter, CheckCircle, Trash2, Package, Store,
  MessageSquare, Loader2, StarHalf
} from "lucide-react";

const RATING_LABELS = ["1 étoile", "2 étoiles", "3 étoiles", "4 étoiles", "5 étoiles"];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : star - 0.5 <= rating 
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "supplier">("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["admin", "reviews", typeFilter, ratingFilter, search, page],
    queryFn: async () => {
      const result = await reviewsApi.list({
        type: typeFilter !== "all" ? typeFilter : undefined,
        min_rating: ratingFilter !== "all" ? parseInt(ratingFilter) : undefined,
        search: search || undefined,
        page,
        per_page: 20,
      });
      return result;
    },
  });

  const reviews = reviewsData?.data || [];
  const meta = reviewsData?.meta;

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast({ title: "Avis vérifié", description: "L'avis a été marqué comme vérifié" });
      setSelectedReview(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de vérifier l'avis", variant: "destructive" as any });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast({ title: "Avis supprimé", description: "L'avis a été supprimé avec succès" });
      setSelectedReview(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'avis", variant: "destructive" as any });
    },
  });

  const handleVerify = (review: Review) => {
    if (confirm("Confirmer la vérification de cet avis?")) {
      verifyMutation.mutate(review.id);
    }
  };

  const handleDelete = (review: Review) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet avis?")) {
      deleteMutation.mutate(review.id);
    }
  };

  // Calculate stats
  const stats = {
    total: reviews.length,
    avgRating: reviews.length > 0 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
      : 0,
    verified: reviews.filter(r => r.is_verified).length,
    fiveStars: reviews.filter(r => r.rating === 5).length,
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Avis</h1>
            <p className="text-gray-500">Modérez les avis clients sur les produits et fournisseurs</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total avis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Note moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Vérifiés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">5 étoiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.fiveStars}</div>
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
                  placeholder="Rechercher par client, commentaire..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="product">Produits</SelectItem>
                    <SelectItem value="supplier">Fournisseurs</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Note" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes notes</SelectItem>
                    <SelectItem value="5">5 étoiles</SelectItem>
                    <SelectItem value="4">4+ étoiles</SelectItem>
                    <SelectItem value="3">3+ étoiles</SelectItem>
                    <SelectItem value="2">2+ étoiles</SelectItem>
                    <SelectItem value="1">1+ étoile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun avis trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col md:flex-row md:items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Review Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Avis #{review.id}</span>
                        {review.is_verified ? (
                          <Badge variant="success" className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Vérifié
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Non vérifié</Badge>
                        )}
                        {review.product_id && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Produit
                          </Badge>
                        )}
                        {review.supplier_id && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            Fournisseur
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <StarRating rating={review.rating} />
                        <span>par {review.user_name || "Anonyme"}</span>
                        <span>{formatDate(review.created_at)}</span>
                      </div>

                      {review.product && (
                        <p className="text-sm text-gray-600 mb-1">
                          Produit: <span className="font-medium">{review.product.name}</span>
                        </p>
                      )}
                      {review.supplier && (
                        <p className="text-sm text-gray-600 mb-1">
                          Fournisseur: <span className="font-medium">{review.supplier.name}</span>
                        </p>
                      )}
                      
                      {review.comment && (
                        <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg">
                          "{review.comment}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!review.is_verified && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerify(review)}
                          disabled={verifyMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Vérifier
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(review)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
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
    </Layout>
  );
}
