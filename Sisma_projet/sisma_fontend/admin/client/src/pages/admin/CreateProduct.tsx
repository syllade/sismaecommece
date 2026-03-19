import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Package, Plus, Save, Image, DollarSign, Warehouse, Tag, Store } from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders, buildApiUrl } from "@/lib/apiConfig";

export default function CreateProductPage() {
  const { toast } = useToast();
  const [supplierId, setSupplierId] = useState<string>("");
  const [productData, setProductData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    compare_price: "",
    discount: "0",
    stock: "0",
    category_id: "",
    image: "",
    images: "",
    is_active: true,
  });

  // Fetch active suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-active"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/v1/admin/suppliers?is_active=1&per_page=100"), {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/categories"));
      return response.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...productData,
        supplier_id: parseInt(supplierId),
        price: parseFloat(productData.price),
        compare_price: productData.compare_price ? parseFloat(productData.compare_price) : null,
        discount: parseFloat(productData.discount),
        stock: parseInt(productData.stock),
        category_id: productData.category_id ? parseInt(productData.category_id) : null,
        images: productData.images ? JSON.stringify(productData.images.split(",").map((i) => i.trim())) : "[]",
      };

      const response = await fetch(buildApiUrl("/api/v1/admin/products"), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Produit créé",
          description: "Le produit a été créé avec succès",
        });
        // Reset form
        setProductData({
          name: "",
          slug: "",
          description: "",
          price: "",
          compare_price: "",
          discount: "0",
          stock: "0",
          category_id: "",
          image: "",
          images: "",
          is_active: true,
        });
        setSupplierId("");
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la création",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setProductData({ ...productData, slug });
  };

  const suppliers = suppliersData?.data ?? [];
  const categories = categoriesData?.data ?? [];

  const isValid =
    supplierId &&
    productData.name &&
    productData.price;

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-full">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Créer un Produit</h1>
            <p className="text-gray-500">Ajouter un produit pour un fournisseur</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={productData.name}
                    onChange={(e) => {
                      setProductData({ ...productData, name: e.target.value });
                      generateSlug(e.target.value);
                    }}
                    placeholder="Nom du produit"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={productData.slug}
                    onChange={(e) => setProductData({ ...productData, slug: e.target.value })}
                    placeholder="nom-du-produit"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productData.description}
                    onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                    placeholder="Description du produit..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={productData.category_id}
                    onValueChange={(value) => setProductData({ ...productData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tarification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={productData.price}
                      onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="compare_price">Prix comparaison</Label>
                    <Input
                      id="compare_price"
                      type="number"
                      value={productData.compare_price}
                      onChange={(e) => setProductData({ ...productData, compare_price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="discount">Remise (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={productData.discount}
                    onChange={(e) => setProductData({ ...productData, discount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="stock">Quantité en stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={productData.stock}
                    onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image">Image principale (URL)</Label>
                  <Input
                    id="image"
                    value={productData.image}
                    onChange={(e) => setProductData({ ...productData, image: e.target.value })}
                    placeholder="https://..."
                  />
                  {productData.image && (
                    <img
                      src={productData.image}
                      alt="Preview"
                      className="mt-2 w-full h-40 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="images">Images supplémentaires ( URLs séparées par virgule)</Label>
                  <Textarea
                    id="images"
                    value={productData.images}
                    onChange={(e) => setProductData({ ...productData, images: e.target.value })}
                    placeholder="https://..., https://..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={productData.is_active ? "true" : "false"}
                  onValueChange={(value) =>
                    setProductData({ ...productData, is_active: value === "true" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              disabled={!isValid || createProductMutation.isPending}
              onClick={() => createProductMutation.mutate()}
            >
              {createProductMutation.isPending ? (
                <span className="animate-pulse">Création...</span>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Créer le produit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
