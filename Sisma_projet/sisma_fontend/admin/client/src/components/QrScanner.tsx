import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Camera, CheckCircle, XCircle, Loader2, Search, Package } from "lucide-react";

interface QrScannerProps {
  onSuccess?: (order: any) => void;
  onError?: (error: string) => void;
}

interface OrderInfo {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  status: string;
  total: number;
}

export function QrScanner({ onSuccess, onError }: QrScannerProps) {
  const [scannerMode, setScannerMode] = useState<"manual" | "camera">("manual");
  const [qrValue, setQrValue] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Validate QR mutation
  const validateQr = useMutation({
    mutationFn: async (qrCode: string) => {
      // Extract order ID from QR code
      const orderId = qrCode.match(/\d+/)?.[0] || qrCode;
      
      const res = await apiRequest("POST", `/api/v1/admin/orders/${orderId}/validate-qr`, {
        qr_code: qrCode,
      });
      return res;
    },
    onSuccess: (data) => {
      setOrderInfo(data.data?.order || null);
      setSuccess(true);
      setError(null);
      onSuccess?.(data.data);
    },
    onError: (err: any) => {
      const message = err.message || "QR code invalide ou commande non trouvée";
      setError(message);
      setOrderInfo(null);
      setSuccess(false);
      onError?.(message);
    },
  });

  // Manual validation
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrValue.trim()) return;
    
    setError(null);
    setOrderInfo(null);
    setSuccess(false);
    validateQr.mutate(qrValue.trim());
  };

  // Simulate camera scan (since actual camera requires permissions)
  const simulateScan = () => {
    // For demo purposes, we'll simulate a scan
    const demoQrCode = "ORDER-" + Math.floor(Math.random() * 1000);
    setQrValue(demoQrCode);
    validateQr.mutate(demoQrCode);
  };

  // Start camera (requires HTTPS or localhost)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Veuillez utiliser le mode manuel.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="w-5 h-5" />
          Scanner QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={scannerMode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setScannerMode("manual");
              stopCamera();
            }}
            className="flex-1"
          >
            <Search className="w-4 h-4 mr-2" />
            Saisie manuelle
          </Button>
          <Button
            variant={scannerMode === "camera" ? "default" : "outline"}
            size="sm"
            onClick={() => setScannerMode("camera")}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Caméra
          </Button>
        </div>

        {/* Manual Mode */}
        {scannerMode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Entrez le code QR ou l'ID de commande"
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={validateQr.isPending}>
                {validateQr.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Vérifier"
                )}
              </Button>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={simulateScan}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Simuler un scan (démo)
            </Button>
          </form>
        )}

        {/* Camera Mode */}
        {scannerMode === "camera" && (
          <div className="space-y-3">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                  <Button onClick={startCamera} variant="secondary">
                    <Camera className="w-4 h-4 mr-2" />
                    Activer la caméra
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Placez le code QR devant la caméra pour valider la livraison
            </p>
          </div>
        )}

        {/* Results */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Erreur</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {success && orderInfo && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Commande trouvée!</span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">N° Commande:</span>
                <span className="font-medium">{orderInfo.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{orderInfo.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Téléphone:</span>
                <span className="font-medium">{orderInfo.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Adresse:</span>
                <span className="font-medium">{orderInfo.customer_location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                  orderInfo.status === 'delivered' || orderInfo.status === 'livree'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {orderInfo.status}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-200">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-green-800">
                  {Number(orderInfo.total).toLocaleString("fr-FR")} FCA
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {success && orderInfo && (
          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={() => {
                // Could trigger delivery confirmation here
                alert("Confirmer la livraison?");
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              Confirmer livraison
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setQrValue("");
                setOrderInfo(null);
                setSuccess(false);
                setError(null);
              }}
            >
              Nouveau scan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
