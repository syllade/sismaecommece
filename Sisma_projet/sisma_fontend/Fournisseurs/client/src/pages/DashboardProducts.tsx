import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Plus, Search, MoreHorizontal, Upload, Image as ImageIcon, FileUp, Copy, Trash2 } from "lucide-react";
import { useProducts, useCreateProduct } from "@/hooks/use-products";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";

export default function DashboardProducts() {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create product form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bulletPoints, setBulletPoints] = useState<string[]>([""]);
  const [metaDescription, setMetaDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isVariable, setIsVariable] = useState(false);
  
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiProductName, setAiProductName] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiTone, setAiTone] = useState<"luxe" | "technique" | "amical">("luxe");
  const [aiLength, setAiLength] = useState<"court" | "moyen" | "long">("moyen");

  // Import
  const [importFile, setImportFile] = useState<File | null>(null);

  const visionMutation = useMutation({
    mutationFn: async (data: any) => {
      const toneMap: Record<string, string> = {
        luxe: "professional",
        technique: "formal",
        amical: "friendly",
      };
      const lengthMap: Record<string, string> = {
        court: "short",
        moyen: "medium",
        long: "long",
      };

      const payload = {
        product_name: data.product_name,
        keywords: data.keywords || [],
        tone: toneMap[data.tone] || "professional",
        length: lengthMap[data.length] || "medium",
        language: "fr",
      };

      const res = await api.post("/v1/supplier/ai/generate-description", payload);
      return res.data;
    },
    onSuccess: (data) => {
      const generatedDescription = String(data?.description || "");
      const productName = aiProductName.trim() || title.trim();
      if (productName) setTitle(productName);
      setDescription(generatedDescription);

      const bullets = generatedDescription
        .split(/[.!?]\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 20)
        .slice(0, 4);
      setBulletPoints(bullets.length > 0 ? bullets : [""]);
      setMetaDescription(generatedDescription.slice(0, 155));

      toast({
        title: "Succès",
        description: "Contenu IA généré avec succès!",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAiImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un titre de produit",
        variant: "destructive",
      });
      return;
    }

    // get supplierId from stored user if available
    const raw = localStorage.getItem("sisma_supplier_user") || localStorage.getItem("fashop_supplier_user");
    let supplierId = 0;
    try { supplierId = raw ? JSON.parse(raw).supplierId || JSON.parse(raw).id || 0 : 0; } catch { supplierId = 0; }

    createProduct.mutate({
      supplierId,
      title,
      description,
      bulletPoints: bulletPoints.filter((b) => b.trim() !== ""),
      metaDescription,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      isVariable,
      status: "draft",
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: "Succès",
          description: "Produit créé avec succès!",
        });
      }
    });
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setBulletPoints([""]); setMetaDescription("");
    setPrice(""); setStock(""); setIsVariable(false);
    setAiImage(null); setAiKeywords(""); setAiProductName("");
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(p => 
        (p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter);
    }

    return result;
  }, [products, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'published': return 'bg-green-100 text-green-700';
      case 'archived': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'pending': return 'En validation';
      case 'published': return 'Publié';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 h-full">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catalogue de Produits</h1>
            <p className="text-gray-600 mt-1">Gérez vos produits simples et variables</p>
          </div>
          <div className="flex gap-3 flex-col sm:flex-row">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-gray-300">
                  <FileUp className="w-4 h-4" /> Importer en Masse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Importer des Produits en Masse</DialogTitle>
                  <DialogDescription>
                    Uploadez un fichier CSV/XLS contenant vos produits et un ZIP avec les images
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                    <Input 
                      type="file" 
                      accept=".csv,.xlsx,.xls,.zip" 
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="import-file"
                    />
                    <Label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Cliquez pour sélectionner un fichier</p>
                      <p className="text-sm text-gray-600">ou glissez-déposez un fichier</p>
                    </Label>
                  </div>
                  {importFile && (
                    <p className="text-sm text-accent">Fichier sélectionné: {importFile.name}</p>
                  )}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Format attendu:</strong> Les colonnes doivent être: titre, description, prix, stock, couleurs, tailles
                    </p>
                  </div>
                  <Button className="w-full bg-[#D81918] text-white hover:bg-red-700" disabled={!importFile}>
                    Importer les Produits
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D81918] text-white hover:bg-red-700 gap-2">
                  <Plus className="w-4 h-4" /> Ajouter un Produit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un Nouveau Produit</DialogTitle>
                  <DialogDescription>Utilisez notre assistant IA pour générer du contenu SEO optimal à partir d'une image.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Création Manuelle</TabsTrigger>
                    <TabsTrigger value="ai">Avec Assistant IA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="font-semibold mb-2">Titre du Produit</Label>
                        <Input 
                          placeholder="Ex: T-Shirt Premium en Coton" 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold mb-2">Prix (€)</Label>
                          <Input 
                            placeholder="29.99" 
                            type="number" 
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="font-semibold mb-2">Stock</Label>
                          <Input 
                            placeholder="100" 
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold mb-2">Description Longue</Label>
                      <Textarea 
                        placeholder="Décrivez votre produit en détail..." 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label className="font-semibold mb-2">Points Clés (Avantages)</Label>
                      {bulletPoints.map((point, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <Input 
                            placeholder={`Point ${idx + 1}`}
                            value={point}
                            onChange={(e) => {
                              const newPoints = [...bulletPoints];
                              newPoints[idx] = e.target.value;
                              setBulletPoints(newPoints);
                            }}
                          />
                          {bulletPoints.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setBulletPoints(bulletPoints.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setBulletPoints([...bulletPoints, ""])}
                        className="mt-2"
                      >
                        + Ajouter un point
                      </Button>
                    </div>

                    <div>
                      <Label className="font-semibold mb-2">Méta Description (SEO)</Label>
                      <Textarea 
                        placeholder="Brève description pour les moteurs de recherche (155 caractères max)" 
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value.slice(0, 155))}
                        rows={2}
                        maxLength={155}
                      />
                      <p className="text-xs text-gray-500 mt-1">{metaDescription.length}/155 caractères</p>
                    </div>

                    <div className="flex items-center gap-2 border border-gray-200 p-3 rounded-lg">
                      <input 
                        type="checkbox" 
                        id="var-manual" 
                        checked={isVariable}
                        onChange={(e) => setIsVariable(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="var-manual" className="cursor-pointer font-medium">
                        Produit Variable (plusieurs couleurs/tailles)
                      </Label>
                    </div>

                    <Button 
                      onClick={handleCreate} 
                      className="w-full bg-[#D81918] text-white hover:bg-red-700 h-12 font-semibold"
                      disabled={createProduct.isPending}
                    >
                      {createProduct.isPending ? "Création en cours..." : "Créer le Produit"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="ai" className="grid lg:grid-cols-2 gap-8 mt-4">
                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center min-h-80">
                        {aiImage ? (
                          <div>
                            <img src={aiImage} className="max-h-64 rounded-lg shadow-sm mb-4" />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setAiImage(null)}
                            >
                              Changer d'image
                            </Button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                            <input type="file" id="product-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <Label htmlFor="product-img" className="cursor-pointer text-[#D81918] font-semibold hover:underline text-lg">
                              Télécharger une Image
                            </Label>
                            <p className="text-sm text-gray-600 mt-2">JPG, PNG - Max 5MB</p>
                          </>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="font-semibold mb-2 block">Nom du produit</Label>
                          <Input
                            placeholder="Ex: T-shirt premium coton"
                            value={aiProductName}
                            onChange={(e) => setAiProductName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="font-semibold mb-2 block">Mots-clés SEO</Label>
                          <Input 
                            placeholder="Ex: coton, premium, confortable" 
                            value={aiKeywords}
                            onChange={(e) => setAiKeywords(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold mb-2 block">Ton</Label>
                            <Select value={aiTone} onValueChange={(v) => setAiTone(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="luxe">Luxe</SelectItem>
                                <SelectItem value="technique">Technique</SelectItem>
                                <SelectItem value="amical">Amical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="font-semibold mb-2 block">Longueur</Label>
                            <Select value={aiLength} onValueChange={(v) => setAiLength(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="court">Court</SelectItem>
                                <SelectItem value="moyen">Moyen</SelectItem>
                                <SelectItem value="long">Long</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button 
                          onClick={() =>
                            visionMutation.mutate({
                              product_name: aiProductName || title || "Produit",
                              keywords: aiKeywords
                                .split(",")
                                .map((k: string) => k.trim())
                                .filter(Boolean),
                              tone: aiTone,
                              length: aiLength,
                              image: aiImage,
                            })
                          }
                          disabled={(!aiImage && !aiKeywords.trim()) || !aiProductName.trim() || visionMutation.isPending}
                          className="w-full bg-[#D81918] text-white hover:bg-red-700 h-12 font-semibold"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {visionMutation.isPending ? "Génération en cours..." : "Générer le Contenu"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="font-semibold mb-2 block">Titre (Généré)</Label>
                        <Input 
                          placeholder="Le titre sera généré par l'IA..." 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={!title}
                        />
                      </div>

                      <div>
                        <Label className="font-semibold mb-2 block">Description</Label>
                        <Textarea 
                          placeholder="Sera remplie automatiquement..." 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={6}
                        />
                      </div>

                      <div>
                        <Label className="font-semibold mb-2 block">Méta Description</Label>
                        <Textarea 
                          placeholder="Sera généré automatiquement..." 
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value.slice(0, 155))}
                          rows={2}
                          maxLength={155}
                        />
                        <p className="text-xs text-gray-500 mt-1">{metaDescription.length}/155</p>
                      </div>

                      <Button 
                        onClick={handleCreate} 
                        className="w-full bg-[#D81918] text-white hover:bg-red-700 h-12 font-semibold"
                        disabled={createProduct.isPending || !title}
                      >
                        {createProduct.isPending ? "Création..." : "Créer le Produit"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 bg-white p-4 rounded-xl border border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher un produit..." 
              className="pl-10 border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En validation</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
          <Table>
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">Produit</TableHead>
                <TableHead className="font-semibold text-gray-700">Prix</TableHead>
                <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                <TableHead className="font-semibold text-gray-700">Créé</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    Chargement des produits...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map(p => (
                  <TableRow key={p.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="font-semibold text-gray-900">{p.title || '-'}</TableCell>
                    <TableCell className="text-gray-700">${(p.price || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={p.stock && p.stock > 10 ? "default" : "destructive"}>
                        {p.stock || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(p.status)}>
                        {getStatusLabel(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy", { locale: fr }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-gray-600">
          Affichage de {filteredProducts.length} sur {products.length} produit(s)
        </p>
      </div>
    </DashboardLayout>
  );
}
