import { useEffect, useState } from 'react';
import { useLocation, useLocation as useRouterLocation } from 'wouter';
import { useDriverDeliveries, useDriverAuth } from '@/hooks/use-driver-api';

export default function DriverDeliveries() {
  const [, setLocation] = useLocation();
  const [location] = useRouterLocation();
  const { getDeliveries, updateStatus } = useDriverDeliveries();
  const { logout } = useDriverAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    loadDeliveries();
  }, [filter]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const response = await getDeliveries({ status: filter });
      setDeliveries(response.data);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/driver/login');
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await updateStatus(id, newStatus);
      loadDeliveries();
    } catch (error) {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === deliveries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deliveries.map(d => d.id));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      exception: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Mes Livraisons</h1>
          <button
            onClick={handleLogout}
            className="bg-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-800"
          >
            Déconnexion
          </button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex mt-3 overflow-x-auto gap-2 pb-1">
          {['all', 'pending', 'in_transit', 'delivered', 'completed', 'exception'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                filter === status 
                  ? 'bg-white text-blue-600 font-medium' 
                  : 'bg-blue-700 text-blue-100'
              }`}
            >
              {status === 'all' ? 'Tous' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-600 text-white p-3 flex items-center justify-between sticky top-24 z-10">
          <span>{selectedIds.length} sélectionné(s)</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate(selectedIds[0], 'in_transit')}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm"
            >
              Mettre en transit
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Deliveries List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucune livraison trouvée
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className={`bg-white rounded-lg shadow p-4 ${
                  selectedIds.includes(delivery.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(delivery.id)}
                    onChange={() => toggleSelect(delivery.id)}
                    className="mt-2 h-5 w-5 text-blue-600 rounded"
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{delivery.client_name}</p>
                        <p className="text-sm text-gray-600">{delivery.client_phone}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.delivery_status)}`}>
                        {delivery.delivery_status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-2">
                      📍 {delivery.client_address}
                    </p>

                    {delivery.delivery_notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        📝 {delivery.delivery_notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>📦 #{delivery.order_number}</span>
                      <span>🕐 {delivery.scheduled_date} {delivery.scheduled_time}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {delivery.delivery_status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          Prendre en charge
                        </button>
                      )}
                      {delivery.delivery_status === 'in_transit' && (
                        <button
                          onClick={() => setLocation(`/driver/deliveries/${delivery.id}/complete`)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          Livrer
                        </button>
                      )}
                      {['pending', 'processing', 'in_transit'].includes(delivery.delivery_status) && (
                        <button
                          onClick={() => handleStatusUpdate(delivery.id, 'exception')}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm"
                        >
                          Exception
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 md:hidden">
        <button onClick={() => setLocation('/driver/dashboard')} className="text-gray-600 flex flex-col items-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Accueil</span>
        </button>
        <button onClick={() => setLocation('/driver/deliveries')} className="text-blue-600 flex flex-col items-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs">Livraisons</span>
        </button>
        <button onClick={() => setLocation('/driver/profile')} className="text-gray-600 flex flex-col items-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs">Profil</span>
        </button>
      </nav>
    </div>
  );
}