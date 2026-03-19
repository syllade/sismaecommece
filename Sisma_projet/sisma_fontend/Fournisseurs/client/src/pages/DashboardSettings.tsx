import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Lock, Store, User, Save, LogOut, Bell, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useSupplierProfile,
  useUpdateSupplierProfile,
  useSupplierNotificationSettings,
  useUpdateSupplierNotificationSettings,
  useSupplierDeliverySettings,
  useUpdateSupplierDeliverySettings,
} from "@/hooks/use-v1-supplier";

export default function DashboardSettings() {
  const { toast } = useToast();
  const { logout } = useAuth();

  const { data: profileData, isLoading: profileLoading } = useSupplierProfile();
  const { data: notificationData } = useSupplierNotificationSettings();
  const { data: deliveryData } = useSupplierDeliverySettings();

  const updateProfile = useUpdateSupplierProfile();
  const updateNotifications = useUpdateSupplierNotificationSettings();
  const updateDelivery = useUpdateSupplierDeliverySettings();

  const supplier = profileData?.supplier;

  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [enableNotifications, setEnableNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);

  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState("0");
  const [freeThreshold, setFreeThreshold] = useState("0");
  const [processingTime, setProcessingTime] = useState("24");
  const [allowPickup, setAllowPickup] = useState(false);

  useEffect(() => {
    if (!supplier) return;
    setStoreName(supplier.name || "");
    setPhone(supplier.phone || "");
    setAddress(supplier.address || "");
    setDescription(supplier.description || "");
  }, [supplier]);

  useEffect(() => {
    const settings = notificationData?.settings;
    if (!settings) return;
    setEnableNotifications(Boolean(Number(settings.notification_new_order ?? 1)));
    setEmailAlerts(Boolean(Number(settings.notification_email_enabled ?? 1)));
    setSmsAlerts(Boolean(Number(settings.notification_sms_enabled ?? 0)));
    setPushAlerts(Boolean(Number(settings.notification_push_enabled ?? 1)));
  }, [notificationData]);

  useEffect(() => {
    const settings = deliveryData?.settings;
    if (!settings) return;
    setDefaultDeliveryFee(String(settings.delivery_default_fee ?? 0));
    setFreeThreshold(String(settings.delivery_free_threshold ?? 0));
    setProcessingTime(String(settings.delivery_processing_time ?? 24));
    setAllowPickup(Boolean(Number(settings.delivery_self_pickup ?? 0)));
  }, [deliveryData]);

  const createdDate = useMemo(() => {
    if (!supplier?.created_at) return "-";
    return new Date(supplier.created_at).toLocaleDateString("fr-FR");
  }, [supplier?.created_at]);

  const handleUpdateProfile = () => {
    updateProfile.mutate({
      name: storeName,
      phone,
      address,
      description,
    });
  };

  const handleSaveNotifications = () => {
    updateNotifications.mutate({
      notification_new_order: enableNotifications,
      notification_email_enabled: emailAlerts,
      notification_sms_enabled: smsAlerts,
      notification_push_enabled: pushAlerts,
    });
  };

  const handleSaveDelivery = () => {
    updateDelivery.mutate({
      delivery_default_fee: Number(defaultDeliveryFee || 0),
      delivery_free_threshold: Number(freeThreshold || 0),
      delivery_processing_time: Number(processingTime || 24),
      delivery_self_pickup: allowPickup,
    });
  };

  const handlePasswordRedirect = () => {
    toast({
      title: "Info sécurité",
      description: "Le changement de mot de passe sera ajouté via endpoint dédié fournisseur.",
    });
  };

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres fournisseur</h1>
          <p className="text-gray-600 mt-1">Paramètres synchronisés avec l’API fournisseur v1.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="delivery">Livraison</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" /> Informations du Magasin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold mb-2 block">Nom du magasin</Label>
                    <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="font-semibold mb-2 block">Email</Label>
                    <Input type="email" value={supplier?.email || ""} disabled />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold mb-2 block">Téléphone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label className="font-semibold mb-2 block">Adresse</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label className="font-semibold mb-2 block">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateProfile.isPending}
                  className="gap-2 bg-[#D81918] text-white hover:bg-red-700"
                >
                  <Save className="w-4 h-4" />
                  {updateProfile.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" /> Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    Le backend expose la sécurité fournisseur (logs, trusted devices, 2FA). Le formulaire de changement
                    de mot de passe sera branché sur l’endpoint dédié dès activation.
                  </p>
                </div>
                <Button onClick={handlePasswordRedirect} className="gap-2 bg-[#D81918] text-white hover:bg-red-700">
                  <Lock className="w-4 h-4" />
                  Changer le mot de passe
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Préférences de notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  title="Nouvelles commandes"
                  subtitle="Recevoir les alertes commandes."
                  checked={enableNotifications}
                  onChange={setEnableNotifications}
                />
                <ToggleRow
                  title="Notifications Email"
                  subtitle="Activation des emails fournisseur."
                  checked={emailAlerts}
                  onChange={setEmailAlerts}
                />
                <ToggleRow
                  title="Notifications SMS"
                  subtitle="Activation des SMS fournisseur."
                  checked={smsAlerts}
                  onChange={setSmsAlerts}
                />
                <ToggleRow
                  title="Notifications Push"
                  subtitle="Activation des notifications push."
                  checked={pushAlerts}
                  onChange={setPushAlerts}
                />
                <Button
                  onClick={handleSaveNotifications}
                  disabled={updateNotifications.isPending}
                  className="w-full bg-[#D81918] text-white hover:bg-red-700"
                >
                  {updateNotifications.isPending ? "Enregistrement..." : "Enregistrer les préférences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Paramètres de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="font-semibold mb-2 block">Frais par défaut</Label>
                    <Input value={defaultDeliveryFee} onChange={(e) => setDefaultDeliveryFee(e.target.value)} />
                  </div>
                  <div>
                    <Label className="font-semibold mb-2 block">Seuil livraison gratuite</Label>
                    <Input value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} />
                  </div>
                  <div>
                    <Label className="font-semibold mb-2 block">Délai traitement (h)</Label>
                    <Input value={processingTime} onChange={(e) => setProcessingTime(e.target.value)} />
                  </div>
                </div>

                <ToggleRow
                  title="Retrait en magasin"
                  subtitle="Autoriser le retrait par le client."
                  checked={allowPickup}
                  onChange={setAllowPickup}
                />

                <Button
                  onClick={handleSaveDelivery}
                  disabled={updateDelivery.isPending}
                  className="w-full bg-[#D81918] text-white hover:bg-red-700"
                >
                  {updateDelivery.isPending ? "Enregistrement..." : "Enregistrer livraison"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <User className="w-5 h-5" /> Compte fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">ID fournisseur: {supplier?.id ?? "-"}</p>
                <p className="text-sm text-gray-700">Date d'inscription: {createdDate}</p>
                <Button onClick={() => logout()} variant="destructive" className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="border border-gray-200 p-4 rounded-lg flex items-center justify-between">
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 cursor-pointer"
      />
    </div>
  );
}
