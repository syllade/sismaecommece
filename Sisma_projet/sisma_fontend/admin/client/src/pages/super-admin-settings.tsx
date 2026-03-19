import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";
import { statsApi } from "@/api/stats.api";
import { Layout } from "@/components/layout";
import { SuperPageHeader } from "@/components/super-admin/super-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSuperAdminDashboardData } from "@/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";

type SupplierCommissionMap = Record<number, string>;

export default function SuperAdminSettingsPage() {
  const { toast } = useToast();
  const { suppliers } = useSuperAdminDashboardData();
  const [globalCommission, setGlobalCommission] = useState("10");
  const [supplierCommissions, setSupplierCommissions] = useState<SupplierCommissionMap>({});
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePrice, setNewZonePrice] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<{id: number; name: string; description: string} | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const commissionsQuery = useQuery({
    queryKey: ["super-admin", "settings", "commissions"],
    queryFn: () => statsApi.getAdminCommissions(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["super-admin", "settings", "categories"],
    queryFn: () => statsApi.getAdminCategories(),
  });

  const zonesQuery = useQuery({
    queryKey: ["super-admin", "settings", "delivery-zones"],
    queryFn: () => statsApi.getAdminDeliveryZones(),
  });

  useEffect(() => {
    if (!commissionsQuery.data) return;
    setGlobalCommission(String(commissionsQuery.data.global_commission ?? 10));
    const map: SupplierCommissionMap = {};
    for (const supplierCommission of commissionsQuery.data.supplier_commissions ?? []) {
      map[supplierCommission.supplier_id] = String(supplierCommission.rate ?? 0);
    }
    setSupplierCommissions((previous) => ({ ...previous, ...map }));
  }, [commissionsQuery.data]);

  useEffect(() => {
    if (suppliers.length === 0) return;
    setSupplierCommissions((previous) => {
      const next: SupplierCommissionMap = { ...previous };
      for (const supplier of suppliers) {
        if (!next[supplier.id]) {
          next[supplier.id] = globalCommission;
        }
      }
      return next;
    });
  }, [globalCommission, suppliers]);

  const createZoneMutation = useMutation({
    mutationFn: async () => {
      const name = newZoneName.trim();
      const price = Number(newZonePrice);
      if (!name || !Number.isFinite(price)) {
        throw new Error("Nom et prix de zone sont obligatoires.");
      }
      await statsApi.createAdminDeliveryZone({ name, price });
    },
    onSuccess: async () => {
      setNewZoneName("");
      setNewZonePrice("");
      await zonesQuery.refetch();
      toast({ title: "Zone ajoutee" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Ajout impossible", description: message, variant: "destructive" });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (zoneId: number) => {
      await statsApi.deleteAdminDeliveryZone(zoneId);
    },
    onSuccess: async () => {
      await zonesQuery.refetch();
      toast({ title: "Zone supprimee" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Suppression impossible", description: message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const name = newCategoryName.trim();
      if (!name) throw new Error("Le nom de la categorie est obligatoire.");
      await statsApi.createAdminCategory({ name, description: newCategoryDescription.trim() || undefined });
    },
    onSuccess: async () => {
      setNewCategoryName("");
      setNewCategoryDescription("");
      await categoriesQuery.refetch();
      toast({ title: "Categorie ajoutee" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Ajout impossible", description: message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: number; name: string; description?: string }) => {
      await statsApi.updateAdminCategory(id, { name, description });
    },
    onSuccess: async () => {
      setEditingCategory(null);
      await categoriesQuery.refetch();
      toast({ title: "Categorie mise a jour" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Mise a jour impossible", description: message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      await statsApi.deleteAdminCategory(categoryId);
    },
    onSuccess: async () => {
      await categoriesQuery.refetch();
      toast({ title: "Categorie supprimee" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Suppression impossible", description: message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedGlobal = Number(globalCommission);
      if (!Number.isFinite(parsedGlobal)) {
        throw new Error("Commission globale invalide.");
      }

      await statsApi.updateGlobalCommission(parsedGlobal);

      const updates = Object.entries(supplierCommissions)
        .filter(([, rate]) => Number.isFinite(Number(rate)))
        .map(([supplierId, rate]) => statsApi.updateSupplierCommission(Number(supplierId), Number(rate)));
      await Promise.all(updates);

      await statsApi.updateAdminSettings({
        notification_email_enabled: emailNotifications ? "1" : "0",
        notification_push_enabled: pushNotifications ? "1" : "0",
      });
    },
    onSuccess: async () => {
      await commissionsQuery.refetch();
      toast({ title: "Parametres sauvegardes" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Sauvegarde impossible", description: message, variant: "destructive" });
    },
  });

  const supplierRows = useMemo(() => suppliers.slice(0, 20), [suppliers]);
  const zones = zonesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        <SuperPageHeader
          title="Parametres Globaux"
          subtitle="Commissions, categories, zones de livraison et canaux de notification."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Commissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Commission globale (%)</Label>
                <Input type="number" value={globalCommission} onChange={(event) => setGlobalCommission(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Par fournisseur</Label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {supplierRows.map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-700">{supplier.name}</p>
                      <Input
                        type="number"
                        value={supplierCommissions[supplier.id] ?? globalCommission}
                        onChange={(event) =>
                          setSupplierCommissions((previous) => ({
                            ...previous,
                            [supplier.id]: event.target.value,
                          }))
                        }
                        className="h-8 w-24"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Categories produits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Input 
                  placeholder="Nom de categorie" 
                  value={newCategoryName} 
                  onChange={(event) => setNewCategoryName(event.target.value)} 
                />
                <Input 
                  placeholder="Description (optionnel)" 
                  value={newCategoryDescription} 
                  onChange={(event) => setNewCategoryDescription(event.target.value)} 
                />
                <Button variant="outline" onClick={() => createCategoryMutation.mutate()} disabled={createCategoryMutation.isPending}>
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.length === 0 && <p className="text-sm text-slate-500">Aucune categorie detectee.</p>}
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    {editingCategory?.id === category.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input 
                          value={editingCategory.name} 
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="h-8"
                        />
                        <Button size="sm" onClick={() => updateCategoryMutation.mutate({
                          id: category.id,
                          name: editingCategory.name,
                          description: editingCategory.description || undefined
                        })} disabled={updateCategoryMutation.isPending}>
                          Sauver
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-slate-700 font-medium">{category.name}</p>
                          {category.description && <p className="text-xs text-slate-500">{category.description}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingCategory({
                            id: category.id,
                            name: category.name,
                            description: category.description || ""
                          })}>
                            Modifier
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteCategoryMutation.mutate(category.id)} disabled={deleteCategoryMutation.isPending}>
                            Supprimer
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Zones de livraison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Input placeholder="Nom de zone" value={newZoneName} onChange={(event) => setNewZoneName(event.target.value)} />
                <Input placeholder="Prix (FCFA)" type="number" value={newZonePrice} onChange={(event) => setNewZonePrice(event.target.value)} />
                <Button variant="outline" onClick={() => createZoneMutation.mutate()} disabled={createZoneMutation.isPending}>
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm text-slate-700">{zone.name}</p>
                      <p className="text-xs text-slate-500">{Number(zone.price).toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteZoneMutation.mutate(zone.id)} disabled={deleteZoneMutation.isPending}>
                      Supprimer
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-xs text-slate-500">Alerte inscriptions, retards, incidents.</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">Push</p>
                  <p className="text-xs text-slate-500">Alertes temps reel sur operations critiques.</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button className="bg-sisma-red hover:bg-sisma-red/90" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les parametres
          </Button>
        </div>
      </div>
    </Layout>
  );
}
