import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Camera, CameraOff, Check, X, Package, MapPin, Phone, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders, buildApiUrl } from "@/lib/apiConfig";

interface DeliveryOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  quartier?: string;
  status: string;
  qr_code?: string;
  qr_code_security?: string;
}

export default function DriverScanQrPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [orderId, setOrderId] = useState<string>("");
  const [scannedData, setScannedData] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Get current delivery
  const { data: deliveriesData, refetch: refetchDeliveries } = useQuery<{
    success: boolean;
    data: DeliveryOrder[];
  }>({
    queryKey: ["driver-deliveries"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/v1/driver/deliveries"), {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    refetchInterval: 30000,
  });

  const deliveries = deliveriesData?.data ?? [];

  // Get order QR data
  const { data: orderData, isLoading: isLoadingOrder } = useQuery<{
    success: boolean;
    data: DeliveryOrder;
  }>({
    queryKey: ["driver-order-qr", orderId],
    queryFn: async () => {
      if (!orderId) return { success: false, data: null as any };
      const response = await fetch(buildApiUrl(`/api/v1/driver/deliveries/${orderId}/qr-data`), {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    enabled: !!orderId,
  });

  // Scan QR mutation
  const scanMutation = useMutation({
    mutationFn: async ({ orderId, qrData }: { orderId: number; qrData: string }) => {
      const response = await fetch(buildApiUrl(`/api/v1/driver/deliveries/${orderId}/scan-qr`), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ qr_data: qrData }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Livraison confirmée!",
          description: `Commande ${data.data.order_number} livrée`,
        });
        setOrderId("");
        setScannedData("");
        refetchDeliveries();
      } else {
        toast({
          title: "Erreur",
          description: data.message,
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

  // Manual confirm mutation
  const manualMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason: string }) => {
      const response = await fetch(buildApiUrl(`v1/driver/deliveries/${orderId}/confirm-manual`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Livraison confirmée!",
          description: `Commande livrée manuellement`,
        });
        setOrderId("");
        refetchDeliveries();
      } else {
        toast({
          title: "Erreur",
          description: data.message,
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

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode("camera");
    } catch (err) {
      toast({
        title: "Erreur caméra",
        description: "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setMode("manual");
  };

  // Handle manual scan (simulated - in real app use a QR library)
  const handleManualScan = () => {
    if (!scannedData || !orderId) return;
    scanMutation.mutate({ orderId: parseInt(orderId), qrData: scannedData });
  };

  const order = orderData?.data;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Scanner QR Code</h1>
          <Badge variant="outline">{deliveries.length} livraison(s)</Badge>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            onClick={stopCamera}
            className="flex-1"
          >
            Manuel
          </Button>
          <Button
            variant={mode === "camera" ? "default" : "outline"}
            onClick={startCamera}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Caméra
          </Button>
        </div>

        {/* Camera Mode */}
        {mode === "camera" && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg" />
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                Positionnez le QR code dans le cadre
              </p>
              <Button variant="destructive" className="w-full mt-4" onClick={stopCamera}>
                <CameraOff className="h-4 w-4 mr-2" />
                Fermer la caméra
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Mode */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Confirmer la livraison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Selection */}
            <div>
              <label className="text-sm font-medium">Sélectionner une commande</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {deliveries.map((delivery) => (
                  <option key={delivery.id} value={delivery.id}>
                    {delivery.order_number} - {delivery.customer_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Details */}
            {order && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{order.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {order.customer_location}
                    {order.quartier && `, ${order.quartier}`}
                  </span>
                </div>
              </div>
            )}

            {/* QR Data Input */}
            <div>
              <label className="text-sm font-medium">Données QR Code</label>
              <Input
                placeholder="Entrez les données du QR code..."
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleManualScan}
                disabled={!orderId || !scannedData || scanMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmer (QR)
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const reason = prompt("Motif de confirmation manuelle:");
                  if (reason) {
                    manualMutation.mutate({ orderId: parseInt(orderId), reason });
                  }
                }}
                disabled={!orderId || manualMutation.isPending}
              >
                Manuel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Livraisons en cours</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune livraison en cours</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{delivery.order_number}</p>
                      <p className="text-sm text-gray-500">{delivery.customer_name}</p>
                    </div>
                    <Badge
                      variant={
                        delivery.status === "delivered"
                          ? "default"
                          : delivery.status === "out_for_delivery"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {delivery.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
