import { useRef, useState } from 'react';
import { Camera, Check, Edit3, X } from 'lucide-react';
import type { Delivery } from '../types/delivery';

type DeliveryProofPayload = {
  photo_base64: string;
  signature_base64: string;
  gps_lat: number;
  gps_lng: number;
  notes?: string;
};

interface DeliveryProofModalProps {
  delivery: Delivery;
  onClose: () => void;
  onSuccess: (proof: DeliveryProofPayload) => void;
}

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 0, lng: 0 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve({ lat: 0, lng: 0 }),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

export default function DeliveryProofModal({ delivery, onClose, onSuccess }: DeliveryProofModalProps) {
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!signature) {
      window.alert('La signature est obligatoire.');
      return;
    }
    setLoading(true);
    const gps = await getCurrentPosition();
    onSuccess({
      photo_base64: photoPreview || '',
      signature_base64: signature,
      gps_lat: gps.lat,
      gps_lng: gps.lng,
      notes,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#D81918] to-[#F7941D] p-6 text-white">
          <div>
            <h2 className="text-2xl font-bold">Preuve de livraison</h2>
            <p className="text-sm text-white/90">Commande #{delivery.order_id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Informations client</h3>
            <p className="text-sm text-gray-700">{delivery.customer_name}</p>
            <p className="text-sm text-gray-600">{delivery.customer_address}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Photo de livraison (optionnel)</label>
            <div className="space-y-3">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="h-48 w-full rounded-lg object-cover" />
                  <button
                    onClick={() => setPhotoPreview(null)}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 p-8 hover:border-[#D81918]"
                >
                  <Camera className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-600">Cliquer pour ajouter une photo</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Signature du destinataire *</label>
            <div className="space-y-2">
              <div className="overflow-hidden rounded-lg border-2 border-gray-300 bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full touch-none cursor-crosshair"
                />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={clearSignature} className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                  Effacer
                </button>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Edit3 className="h-4 w-4" />
                  Signez dans le cadre
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#D81918] focus:outline-none focus:ring-2 focus:ring-[#D81918]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !signature}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#D81918] to-[#F7941D] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Envoi...' : <><Check className="h-5 w-5" /> Confirmer la livraison</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
