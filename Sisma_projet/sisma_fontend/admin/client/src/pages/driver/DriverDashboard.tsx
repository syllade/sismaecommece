import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useDriverStats, useDriverDeliveries, useDriverAuth } from '@/hooks/use-driver-api';

export default function DriverDashboard() {
  const [, setLocation] = useLocation();
  const { getStats } = useDriverStats();
  const { getDeliveries } = useDriverDeliveries();
  const { logout } = useDriverAuth();
  const [stats, setStats] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, deliveriesRes] = await Promise.all([
        getStats(),
        getDeliveries({ status: 'pending' }),
      ]);
      setStats(statsRes.data);
      setDeliveries(deliveriesRes.data.slice(0, 5)); // Show only first 5
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Dashboard Livreur</h1>
          <button
            onClick={handleLogout}
            className="bg-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-800"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Aujourd'hui</p>
          <p className="text-3xl font-bold text-green-600">{stats?.today?.completed || 0}</p>
          <p className="text-xs text-gray-500">livraisons effectuées</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">En attente</p>
          <p className="text-3xl font-bold text-orange-500">{stats?.today?.pending || 0}</p>
          <p className="text-xs text-gray-500">livraisons en cours</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Cette semaine</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.weekly?.completed || 0}</p>
          <p className="text-xs text-gray-500">livraisons effectuées</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Exceptions</p>
          <p className="text-3xl font-bold text-red-500">{stats?.today?.exceptions || 0}</p>
          <p className="text-xs text-gray-500">problèmes aujourd'hui</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 grid grid-cols-3 gap-4">
        <button
          onClick={() => setLocation('/driver/deliveries')}
          className="bg-blue-600 text-white py-4 rounded-lg shadow hover:bg-blue-700 flex flex-col items-center"
        >
          <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-medium">Livraisons</span>
        </button>
        <button
          onClick={() => setLocation('/driver/profile')}
          className="bg-green-600 text-white py-4 rounded-lg shadow hover:bg-green-700 flex flex-col items-center"
        >
          <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-medium">Profil</span>
        </button>
        <button
          onClick={() => setLocation('/driver/stats')}
          className="bg-purple-600 text-white py-4 rounded-lg shadow hover:bg-purple-700 flex flex-col items-center"
        >
          <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium">Stats</span>
        </button>
      </div>

      {/* Recent Deliveries */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">Livraisons en attente</h2>
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucune livraison en attente
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery: any) => (
              <div
                key={delivery.id}
                onClick={() => setLocation(`/driver/deliveries/${delivery.id}`)}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{delivery.client_name}</p>
                    <p className="text-sm text-gray-600">{delivery.client_address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {delivery.scheduled_date} {delivery.scheduled_time}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    delivery.delivery_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    delivery.delivery_status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {delivery.delivery_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {deliveries.length > 0 && (
          <button
            onClick={() => setLocation('/driver/deliveries')}
            className="w-full mt-4 text-center text-blue-600 font-medium"
          >
            Voir toutes les livraisons →
          </button>
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 md:hidden">
        <button onClick={() => setLocation('/driver/dashboard')} className="text-blue-600 flex flex-col items-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Accueil</span>
        </button>
        <button onClick={() => setLocation('/driver/deliveries')} className="text-gray-600 flex flex-col items-center">
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