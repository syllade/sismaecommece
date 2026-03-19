import { useState } from 'react';
import { useRiskDashboard, useRiskClients, useRiskSuppliers, useSecurityEvents, useBlacklist, useBanClient, useSuspendClient, useSuspendSupplier, useAddToBlacklist, useRemoveFromBlacklist } from '../hooks/use-admin-risk';
import { AlertTriangle, Shield, Users, Package, Ban, Clock, Eye, Trash2, Plus, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

type TabType = 'dashboard' | 'clients' | 'suppliers' | 'security' | 'blacklist';

export default function AdminRiskPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Risques</h1>
          <p className="text-gray-600">Surveillance et gestion des utilisateurs à risque</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Shield },
            { id: 'clients', label: 'Clients à risque', icon: Users },
            { id: 'suppliers', label: 'Fournisseurs', icon: Package },
            { id: 'security', label: 'Sécurité', icon: AlertTriangle },
            { id: 'blacklist', label: 'Blacklist', icon: Ban },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && <RiskDashboardOverview />}
      {activeTab === 'clients' && <RiskClientsList />}
      {activeTab === 'suppliers' && <RiskSuppliersList />}
      {activeTab === 'security' && <SecurityEventsList />}
      {activeTab === 'blacklist' && <BlacklistManager />}
    </div>
  );
}

// ============ Dashboard Overview ============

function RiskDashboardOverview() {
  const { data: dashboard, isLoading, refetch } = useRiskDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const stats = dashboard || {
    clients: { at_risk: 0, warning: 0, red_zone: 0, banned: 0 },
    suppliers: { at_risk: 0, warning: 0, red_zone: 0, suspended: 0 },
    security: { unresolved_events: 0, blacklisted_count: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clients Risk */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Clients à risque</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Zone rouge</span>
              <span className="font-bold text-red-600">{stats.clients.red_zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avertissement</span>
              <span className="font-bold text-yellow-600">{stats.clients.warning}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bannis</span>
              <span className="font-bold text-gray-900">{stats.clients.banned}</span>
            </div>
          </div>
        </div>

        {/* Suppliers Risk */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Fournisseurs à risque</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Zone rouge</span>
              <span className="font-bold text-red-600">{stats.suppliers.red_zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avertissement</span>
              <span className="font-bold text-yellow-600">{stats.suppliers.warning}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Suspendus</span>
              <span className="font-bold text-gray-900">{stats.suppliers.suspended}</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Sécurité</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Événements non résolus</span>
              <span className="font-bold text-red-600">{stats.security.unresolved_events}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blacklistés</span>
              <span className="font-bold text-gray-900">{stats.security.blacklisted_count}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => refetch()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        <RefreshCw className="w-4 h-4" />
        Actualiser
      </button>
    </div>
  );
}

// ============ Clients List ============

function RiskClientsList() {
  const [riskFilter, setRiskFilter] = useState<string>('');
  const { data, isLoading, refetch } = useRiskClients({ risk_level: riskFilter || undefined });
  const banMutation = useBanClient();
  const suspendMutation = useSuspendClient();

  const handleBan = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir bannir ce client définitivement?')) {
      await banMutation.mutateAsync({ id, reason: 'Banni par admin' });
    }
  };

  const handleSuspend = async (id: number) => {
    await suspendMutation.mutateAsync({ id, reason: 'Suspendu par admin', duration_days: 30 });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
  }

  const clients = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Tous les niveaux</option>
          <option value="red_zone">Zone rouge</option>
          <option value="warning">Avertissement</option>
          <option value="normal">Normal</option>
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau risque</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annulations</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{client.phone}</td>
                <td className="px-4 py-3">
                  <RiskBadge level={client.risk_level} />
                </td>
                <td className="px-4 py-3">{client.cancellation_count}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${client.risk_score > 50 ? 'text-red-600' : client.risk_score > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {client.risk_score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {!client.banned_at && (
                      <button
                        onClick={() => handleBan(client.id)}
                        disabled={banMutation.isPending}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Bannir"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    {!client.suspended_at && (
                      <button
                        onClick={() => handleSuspend(client.id)}
                        disabled={suspendMutation.isPending}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Suspendre"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Aucun client à risque
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Suppliers List ============

function RiskSuppliersList() {
  const [riskFilter, setRiskFilter] = useState<string>('');
  const { data, isLoading, refetch } = useRiskSuppliers({ risk_level: riskFilter || undefined });
  const suspendMutation = useSuspendSupplier();

  const handleSuspend = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir suspendre ce fournisseur?')) {
      await suspendMutation.mutateAsync({ id, reason: 'Suspendu par admin', permanent: false });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
  }

  const suppliers = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Tous les niveaux</option>
          <option value="red_zone">Zone rouge</option>
          <option value="warning">Avertissement</option>
          <option value="normal">Normal</option>
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau risque</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-gray-500">{supplier.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{supplier.company_name}</td>
                <td className="px-4 py-3">
                  <RiskBadge level={supplier.risk_level} />
                </td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${supplier.risk_score > 50 ? 'text-red-600' : supplier.risk_score > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {supplier.risk_score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {supplier.suspended_at ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Suspendu</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Actif</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {!supplier.suspended_at && (
                      <button
                        onClick={() => handleSuspend(supplier.id)}
                        disabled={suspendMutation.isPending}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Suspendre"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Aucun fournisseur à risque
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Security Events ============

function SecurityEventsList() {
  const [resolvedFilter, setResolvedFilter] = useState<boolean | undefined>(undefined);
  const { data, isLoading, refetch } = useSecurityEvents({ resolved: resolvedFilter });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
  }

  const events = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={String(resolvedFilter)}
          onChange={(e) => setResolvedFilter(e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="undefined">Tous</option>
          <option value="false">Non résolus</option>
          <option value="true">Résolus</option>
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className={`bg-white rounded-lg shadow-sm border p-4 ${event.resolved ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${event.resolved ? 'bg-green-100' : 'bg-red-100'}`}>
                  {event.resolved ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <p className="font-medium">{event.event_type}</p>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    IP: {event.ip_address} • {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {event.resolved ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Résolu</span>
              ) : (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Non résolu</span>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">Aucun événement de sécurité</div>
        )}
      </div>
    </div>
  );
}

// ============ Blacklist Manager ============

function BlacklistManager() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const { data, isLoading, refetch } = useBlacklist({ type: typeFilter || undefined });
  const addMutation = useAddToBlacklist();
  const removeMutation = useRemoveFromBlacklist();

  const [newEntry, setNewEntry] = useState({ type: 'email' as const, value: '', reason: '' });

  const handleAdd = async () => {
    if (!newEntry.value || !newEntry.reason) return;
    await addMutation.mutateAsync(newEntry);
    setNewEntry({ type: 'email', value: '', reason: '' });
  };

  const handleRemove = async (id: number) => {
    if (window.confirm('Retirer de la blacklist?')) {
      await removeMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
  }

  const entries = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Add New Entry */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-medium mb-4">Ajouter à la blacklist</h3>
        <div className="flex gap-4">
          <select
            value={newEntry.type}
            onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as any })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="email">Email</option>
            <option value="phone">Téléphone</option>
            <option value="ip">Adresse IP</option>
            <option value="device">Appareil</option>
          </select>
          <input
            type="text"
            placeholder="Valeur"
            value={newEntry.value}
            onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Raison"
            value={newEntry.reason}
            onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Tous les types</option>
          <option value="email">Email</option>
          <option value="phone">Téléphone</option>
          <option value="ip">IP</option>
          <option value="device">Appareil</option>
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Blacklist Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">
                    {entry.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{entry.value}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{entry.reason}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(entry.id)}
                    disabled={removeMutation.isPending}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Retirer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Aucun élément blacklisté
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Helper Components ============

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    red_zone: { bg: 'bg-red-100', text: 'text-red-700', label: 'Zone rouge' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Avertissement' },
    normal: { bg: 'bg-green-100', text: 'text-green-700', label: 'Normal' },
  };

  const style = config[level] || config.normal;

  return (
    <span className={`px-2 py-1 ${style.bg} ${style.text} text-xs rounded-full font-medium`}>
      {style.label}
    </span>
  );
}
