import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiConfig";

type SupplierRow = {
  id: number;
  name: string;
};

type ProductRow = {
  id: number;
  supplierId: number;
  name: string;
  description: string | null;
  category: string;
  price: string | number;
  image: string;
  isActive: boolean | null;
};

type ProductFormState = {
  supplierId: string;
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
  isActive: boolean;
};

const EMPTY_FORM: ProductFormState = {
  supplierId: "",
  name: "",
  description: "",
  category: "",
  price: "",
  image: "",
  isActive: true,
};

export default function AdminProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [search, setSearch] = useState("");

  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiRequest<ProductRow[]>("/api/admin/products"),
  });

  const suppliersQuery = useQuery({
    queryKey: ["admin", "suppliers", "products"],
    queryFn: () => apiRequest<SupplierRow[]>("/api/admin/suppliers"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.supplierId || !form.name.trim() || !form.category.trim() || !form.price || !form.image.trim()) {
        throw new Error("Supplier, nom, categorie, prix et image sont obligatoires.");
      }

      const payload = {
        supplier_id: Number(form.supplierId),
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim(),
        price: Number(form.price),
        image: form.image.trim(),
        is_active: form.isActive,
      };

      if (editingId) {
        return apiRequest(`/api/admin/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      return apiRequest("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setForm(EMPTY_FORM);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast({ title: editingId ? "Produit mis a jour" : "Produit cree" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Action impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: number) => apiRequest(`/api/admin/products/${productId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast({ title: "Produit supprime" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    },
  });

  const products = productsQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        String(product.id).includes(q)
      );
    });
  }, [products, search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync();
  };

  const startEdit = (product: ProductRow) => {
    setEditingId(product.id);
    setForm({
      supplierId: String(product.supplierId),
      name: product.name,
      description: product.description ?? "",
      category: product.category,
      price: String(product.price),
      image: product.image,
      isActive: product.isActive !== false,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-slate-900">Gestion Produits</h1>
          <p className="text-sm text-slate-500">Creation, modification et suppression directes dans ta base existante.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-outfit text-lg">{editingId ? `Modifier produit #${editingId}` : "Ajouter un produit"}</CardTitle>
          </CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                Aucun fournisseur trouve. Cree au moins un fournisseur pour pouvoir ajouter des produits.
              </p>
            ) : (
              <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
                <select
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  value={form.supplierId}
                  onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))}
                  required
                >
                  <option value="">Selectionner fournisseur</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Nom produit"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <Input
                  placeholder="Categorie"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  required
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Prix"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  required
                />
                <Input
                  placeholder="URL image"
                  value={form.image}
                  onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                  required
                />
                <Input
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
                <label className="col-span-1 flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Produit actif
                </label>
                <div className="col-span-1 flex gap-2 md:col-span-2">
                  <Button type="submit" className="bg-sisma-red hover:bg-sisma-red/90" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Enregistrement..." : editingId ? "Mettre a jour" : "Ajouter"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setForm(EMPTY_FORM);
                      }}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Catalogue produits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Rechercher par ID, nom, categorie"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {productsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Chargement des produits...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun produit trouve.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-2 py-2 w-16">Image</th>
                      <th className="px-2 py-2">ID</th>
                      <th className="px-2 py-2">Nom</th>
                      <th className="px-2 py-2">Categorie</th>
                      <th className="px-2 py-2">Prix</th>
                      <th className="px-2 py-2">Actif</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-2 py-2">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="h-12 w-12 object-cover rounded-lg border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                              <span className="text-slate-400 text-xs">-</span>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">#{product.id}</td>
                        <td className="px-2 py-2 font-medium text-slate-900">{product.name}</td>
                        <td className="px-2 py-2">{product.category}</td>
                        <td className="px-2 py-2">{Number(product.price).toLocaleString("fr-FR")} FCFA</td>
                        <td className="px-2 py-2">
                          {product.isActive === false ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Non</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Oui</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(product)}>
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700"
                              onClick={() => deleteMutation.mutate(product.id)}
                              disabled={deleteMutation.isPending}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
