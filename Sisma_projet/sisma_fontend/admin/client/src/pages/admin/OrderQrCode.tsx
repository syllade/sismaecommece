import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { QrCode, Search, Check, X, RefreshCw, Camera, CameraOff } from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders, buildApiUrl } from "@/lib/apiConfig";

interface OrderQR {
  order_id: number;
  order_number: string;
  qr_code: string;
  qr_code_image: string;
  qr_code_security: string;
  status: string;
}

export default function OrderQrCodePage() {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string>("");
  const [qrData, setQrData] = useState<string>("");

  // Get QR code for order
  const { data: qrDataResponse, isLoading: isLoadingQR, refetch: refetchQR } = useQuery<{
    success: boolean;
    data: OrderQR;
  }>({
    queryKey: ["order-qr", orderId],
    queryFn: async () => {
      if (!orderId) return { success: false, data: null as any };
      const response = await fetch(buildApiUrl(`/api/v1/admin/orders/${orderId}/qr`), {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    enabled: !!orderId,
  });

  // Regenerate QR code
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(buildApiUrl(`/api/v1/admin/orders/${orderId}/regenerate-qr`), {
        method: "POST",
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "QR Code régénéré",
          description: "Un nouveau QR code a été généré",
        });
        refetchQR();
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive",
        });
      }
    },
  });

  // Validate QR manually
  const validateMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(buildApiUrl(`/api/v1/admin/orders/${orderId}/validate-qr`), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ security_code: code }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Validation réussie",
          description: "La commande a été livrée",
        });
        refetchQR();
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive",
        });
      }
    },
  });

  const order = qrDataResponse?.data;

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-full">
            <QrCode className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">QR Code des Commandes</h1>
            <p className="text-gray-500">Générer et valider les QR codes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Order */}
          <Card>
            <CardHeader>
              <CardTitle>Rechercher une Commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="ID de la commande..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
                <Button onClick={() => refetchQR()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {order && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Commande #{order.order_number}</p>
                      <Badge
                        variant={order.status === "delivered" ? "default" : "secondary"}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateMutation.mutate()}
                      disabled={regenerateMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Régénérer
                    </Button>
                  </div>

                  <div className="border p-4 rounded-lg text-center">
                    {order.qr_code_image ? (
                      <img
                        src={order.qr_code_image}
                        alt="QR Code"
                        className="mx-auto w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">Scannez pour valider</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Code de sécurité</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Entrez le code de sécurité..."
                        value={qrData}
                        onChange={(e) => setQrData(e.target.value)}
                      />
                      <Button
                        onClick={() => validateMutation.mutate(qrData)}
                        disabled={!qrData || validateMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Valider
                      </Button>
                    </div>
                  </div>

                  {order.qr_code_security && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Code de sécurité:</p>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded block mt-1">
                        {order.qr_code_security}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {!order && !isLoadingQR && orderId && (
                <div className="text-center py-4 text-gray-500">
                  Commande non trouvée
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Comment utiliser</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Rechercher la commande</h3>
                    <p className="text-sm text-gray-500">
                      Entrez l'ID ou le numéro de commande
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Camera className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Scanner le QR Code</h3>
                    <p className="text-sm text-gray-500">
                      Le livreur scanne le QR code avec son téléphone
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Confirmer la livraison</h3>
                    <p className="text-sm text-gray-500">
                      La livraison est confirmée automatiquement
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <X className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Validation manuelle</h3>
                    <p className="text-sm text-gray-500">
                      Entrez le code de sécurité si le scan échoue
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800">Important</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Chaque QR code contient un code de sécurité unique. Une fois utilisé,
                  il ne peut plus être réutilisé. Cela empêche les livraisons frauduleuses.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
