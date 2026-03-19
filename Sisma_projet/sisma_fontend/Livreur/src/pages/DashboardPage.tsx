import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDriverStats, useDriverDeliveries, useAcceptDelivery, usePickupDelivery, useCompleteDelivery, useFailDelivery } from '../hooks/use-delivery-api';
import type { Delivery } from '../types/delivery';
import { Package, TrendingUp, CheckCircle, XCircle, MapPin, Phone, Navigation, Loader2, User } from 'lucide-react';
import DeliveryProofModal from '../components/DeliveryProofModal';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // API Hooks
  const { data: statsData, isLoading: statsLoading } = useDriverStats();
  const { data: deliveriesData, isLoading: deliveriesLoading } = useDriverDeliveries();
  
  // Mutations
  const acceptMutation = useAcceptDelivery();
  const pickupMutation = usePickupDelivery();
  const completeMutation = useCompleteDelivery();
  const failMutation = useFailDelivery();

  // Local state
  const [selectedDeliveries, setSelectedDeliveries] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filter deliveries by status
  const deliveries = deliveriesData?.filter(d => 
    filterStatus === 'all' ? true : d.status === filterStatus
  ) || [];

  // Stats from API
  const stats = statsData || {
    deliveries_today: 0,
    completed: 0,
    failed: 0,
    earnings: 0,
    rating: 0
  };

  const handleSelectDelivery = (id: number) => {
    const newSelected = new Set(selectedDeliveries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDeliveries(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDeliveries.size === deliveries.length) {
      setSelectedDeliveries(new Set());
    } else {
      setSelectedDeliveries(new Set(deliveries.map(d => d.id)));
    }
  };

  const handleAccept = async (deliveryId: number) => {
    setActionLoading(deliveryId);
    try {
      await acceptMutation.mutateAsync(deliveryId);
    } catch (error) {
      console.error('Error accepting delivery:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickup = async (deliveryId: number) => {
    setActionLoading(deliveryId);
    try {
      await pickupMutation.mutateAsync(deliveryId);
    } catch (error) {
      console.error('Error picking up delivery:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (deliveryId: number) => {
    setSelectedDelivery(deliveries.find(d => d.id === deliveryId) || null);
    setProofModalOpen(true);
  };

  const handleConfirmComplete = async (proof: { photo_base64: string; signature_base64: string; gps_lat: number; gps_lng: number; notes?: string }) => {
    if (!selectedDelivery) return;
    
    setActionLoading(selectedDelivery.id);
    try {
      await completeMutation.mutateAsync({ deliveryId: selectedDelivery.id, proof });
      setProofModalOpen(false);
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Error completing delivery:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFail = async (deliveryId: number, reason: string) => {
    setActionLoading(deliveryId);
    try {
      await failMutation.mutateAsync({ deliveryId, reason });
    } catch (error) {
      console.error('Error marking delivery as failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepté' },
      picked_up: { color: 'bg-indigo-100 text-indigo-800', label: 'Collecté' },
      in_transit: { color: 'bg-purple-100 text-purple-800', label: 'En livraison' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Livré' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Échoué' },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getActionButtons = (delivery: Delivery) => {
    const isPending = delivery.status === 'pending';
    const isAccepted = delivery.status === 'accepted';
    const isPickedUp = delivery.status === 'picked_up' || delivery.status === 'in_transit';
    const isLoading = actionLoading === delivery.id;

    return (
      <div className="flex gap-2">
        {isPending && (
          <button
            onClick={() => handleAccept(delivery.id)}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accepter'}
          </button>
        )}
        {isAccepted && (
          <button
            onClick={() => handlePickup(delivery.id)}
            disabled={isLoading}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Collecter'}
          </button>
        )}
        {isPickedUp && (
          <>
            <button
              onClick={() => handleComplete(delivery.id)}
              disabled={isLoading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Livrer'}
            </button>
            <button
              onClick={() => handleFail(delivery.id, 'Client absent')}
              disabled={isLoading}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              Échec
            </button>
          </>
        )}
      </div>
    );
  };

  if (statsLoading || deliveriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Bienvenue, {user?.name || 'Livreur'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Note: {stats.rating.toFixed(1)}/5</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aujourd'hui</p>
              <p className="text-xl font-bold">{stats.deliveries_today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Livrés</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Échoués</p>
              <p className="text-xl font-bold">{stats.failed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Gains</p>
              <p className="text-xl font-bold">{stats.earnings.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Tous' : status === 'picked_up' ? 'Collectés' : 
             status === 'in_transit' ? 'En livraison' : status}
          </button>
        ))}
      </div>

      {/* Select All */}
      {deliveries.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedDeliveries.size === deliveries.length && deliveries.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">
            Sélectionner tout ({selectedDeliveries.size}/{deliveries.length})
          </span>
        </div>
      )}

      {/* Deliveries List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {deliveries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune livraison trouvée</p>
          </div>
        ) : (
          <div className="divide-y">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedDeliveries.has(delivery.id)}
                    onChange={() => handleSelectDelivery(delivery.id)}
                    className="mt-2 w-4 h-4 rounded border-gray-300"
                  />

                  {/* Delivery Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{delivery.order_number}</span>
                      {getStatusBadge(delivery.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{delivery.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${delivery.customer_phone}`} className="text-blue-600 hover:underline">
                          {delivery.customer_phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="w-4 h-4" />
                        <span>{delivery.customer_address}</span>
                      </div>
                      {delivery.commune && (
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4" />
                          <span>{delivery.commune}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {getActionButtons(delivery)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Proof Modal */}
      {proofModalOpen && selectedDelivery && (
        <DeliveryProofModal
          delivery={selectedDelivery}
          onClose={() => {
            setProofModalOpen(false);
            setSelectedDelivery(null);
          }}
          onSuccess={handleConfirmComplete}
        />
      )}
    </div>
  );
}
