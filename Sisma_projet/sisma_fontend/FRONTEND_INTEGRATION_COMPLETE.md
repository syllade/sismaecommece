# 🏗️ GUIDE D'INTÉGRATION COMPLÈTE DU FRONTEND SISMA

Ce document explique comment connecter tous les fichiers créés pour avoir un frontend fonctionnel à 100%.

---

## 📁 STRUCTURE FINALE

```
Fashop-E-commerce/
├── admin/client/src/
│   ├── App.tsx                          # Routes + Auth
│   ├── context/auth-context.tsx         # Auth Admin ✅
│   ├── hooks/
│   │   ├── use-v1-admin.ts              # Hooks Admin existants
│   │   ├── use-v1-supplier.ts          # Gestion fournisseurs
│   │   ├── use-driver-api.ts            # Gestion livreurs
│   │   └── use-admin-risk.ts            # NOUVEAU - Risk Management
│   └── pages/
│       ├── admin-login.tsx              # ✅
│       ├── super-admin-dashboard.tsx    # ✅
│       ├── super-admin-suppliers.tsx    # ✅
│       ├── super-admin-orders.tsx       # ✅
│       ├── super-admin-drivers.tsx      # ✅
│       └── admin-risk.tsx               # NOUVEAU
│
├── Fourniseurs/client/src/
│   ├── App.tsx                          # Routes + Auth
│   ├── context/AuthContext.tsx         # Auth Fournisseur ✅
│   ├── hooks/
│   │   ├── use-v1-supplier.ts          # Dashboard + Produits + Commandes
│   │   ├── use-supplier-marketing.ts   # NOUVEAU - Campagnes CPC
│   │   └── use-category-schema.ts       # NOUVEAU - Schéma catégories
│   └── pages/
│       ├── login.tsx                    # ✅
│       ├── supplier-register.tsx        # ✅
│       ├── DashboardOverview.tsx        # ✅
│       ├── DashboardProducts.tsx        # ✅
│       ├── DashboardOrders.tsx          # ✅
│       └── DashboardSettings.tsx        # ✅
│
├── client/src/
│   ├── App.tsx                          # Routes + Auth
│   ├── context/ClientAuthContext.tsx    # NOUVEAU - Auth Client
│   ├── hooks/
│   │   ├── use-products.ts              # Catalogue produits
│   │   ├── use-cart.ts                  # Panier
│   │   └── use-client-api.ts            # NOUVEAU - Commandes client
│   └── pages/
│       ├── Home.tsx                     # ✅
│       ├── Products.tsx                 # ✅
│       ├── ProductDetail.tsx            # ✅
│       ├── Cart.tsx                     # ✅
│       ├── Checkout.tsx                 # ✅
│       └── Orders.tsx                   # ✅
│
└── Livreur/src/
    ├── App.tsx                          # Routes + Auth
    ├── contexts/AuthContext.tsx         # CORRIGÉ - Laravel
    ├── hooks/
    │   └── use-delivery-api.ts          # NOUVEAU - API livraison
    └── pages/
        ├── LoginPage.tsx                # ✅
        ├── DashboardPage.tsx             # ✅ CORRIGÉ
        └── ProfilePage.tsx              # ✅
```

---

## 🔌 CONNEXION DES ROUTES

### 1. Admin - App.tsx

```typescript
// admin/client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import AdminLogin from './pages/admin-login';
import SuperAdminDashboard from './pages/super-admin-dashboard';
import SuperAdminSuppliers from './pages/super-admin-suppliers';
import SuperAdminOrders from './pages/super-admin-orders';
import SuperAdminDrivers from './pages/super-admin-drivers'; // ou le nom correct
import AdminRisk from './pages/admin-risk'; // NOUVEAU
import ProtectedRoute from './components/protected-route';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Protected - Admin Only */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="suppliers" element={<SuperAdminSuppliers />} />
            <Route path="orders" element={<SuperAdminOrders />} />
            <Route path="drivers" element={<SuperAdminDrivers />} />
            <Route path="risk" element={<AdminRisk />} /> {/* NOUVEAU */}
            {/* Ajouter les autres routes ici */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 2. Fournisseur - App.tsx

```typescript
// Fournisseurs/client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/login';
import SupplierRegister from './pages/supplier-register';
import DashboardOverview from './pages/DashboardOverview';
import DashboardProducts from './pages/DashboardProducts';
import DashboardOrders from './pages/DashboardOrders';
import DashboardSettings from './pages/DashboardSettings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SupplierRegister />} />
          
          {/* Protected - Supplier Only */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['supplier']} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="products" element={<DashboardProducts />} />
            <Route path="orders" element={<DashboardOrders />} />
            <Route path="settings" element={<DashboardSettings />} />
            {/* Ajouter les routes marketing ici */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 3. Client - App.tsx

```typescript
// client/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/ClientAuthContext';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          
          {/* Requires Auth */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          
          {/* Login/Register - à créer */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 4. Livreur - App.tsx

```typescript
// Livreur/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected - Driver Only */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['delivery']} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## 🔐 PROTECTED ROUTE - EXEMPLE

### Admin Protected Route

```typescript
// admin/client/src/components/protected-route.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  const userRole = user.role?.toLowerCase();
  const isAllowed = allowedRoles.some(role => 
    userRole === role.toLowerCase()
  );

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes
  return <Outlet />;
}
```

### Fournisseur Protected Route

```typescript
// Fournisseurs/client/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading, token } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

---

## 🎯 UTILISATION DES HOOKS DANS LES PAGES

### Exemple: Dashboard Admin

```typescript
// admin/client/src/pages/super-admin-dashboard.tsx
import { useAdminStats } from '../hooks/use-v1-admin';
import { useRiskDashboard } from '../hooks/use-admin-risk'; // NOUVEAU

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: riskData } = useRiskDashboard(); // NOUVEAU

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1>Dashboard</h1>
      
      {/* Stats existants */}
      <div className="grid grid-cols-4 gap-4">
        <div>Commandes: {stats?.total_orders}</div>
        <div>Revenus: {stats?.total_revenue}</div>
        <div>Fournisseurs: {stats?.total_suppliers}</div>
        <div>Livreurs: {stats?.total_drivers}</div>
      </div>

      {/* NOUVEAU - Risk Overview */}
      <div className="mt-8">
        <h2>Gestion des Risques</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>Clients à risque: {riskData?.clients.at_risk}</div>
          <div>Fournisseurs à risque: {riskData?.suppliers.at_risk}</div>
          <div>Événements sécurité: {riskData?.security.unresolved_events}</div>
        </div>
      </div>
    </div>
  );
}
```

### Exemple: Dashboard Fournisseur

```typescript
// Fournisseurs/client/src/pages/DashboardOverview.tsx
import { useSupplierDashboard, useSupplierRevenue, useTopProducts } from '../hooks/use-v1-supplier';
import { useCampaigns, useAdvertisingBalance } from '../hooks/use-supplier-marketing'; // NOUVEAU

export default function DashboardOverview() {
  const { data: dashboard, isLoading } = useSupplierDashboard();
  const { data: revenueData } = useSupplierRevenue('day', 30);
  const { data: topProducts } = useTopProducts(5, 30);
  
  // NOUVEAU - Marketing
  const { data: campaigns } = useCampaigns();
  const { data: balance } = useAdvertisingBalance();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1>Mon Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div>Revenus aujourd'hui: {dashboard?.revenue.today}</div>
        <div>Commandes en attente: {dashboard?.orders.pending}</div>
        <div>Produits actifs: {dashboard?.products.active}</div>
        <div>Produits rupture: {dashboard?.products.out_of_stock}</div>
      </div>

      {/* NOUVEAU - Marketing */}
      <div className="mt-8">
        <h2>Marketing CPC</h2>
        <div>Solde advertising: {balance?.balance} CFA</div>
        <div>Campagnes actives: {campaigns?.data.filter(c => c.status === 'active').length}</div>
      </div>
    </div>
  );
}
```

### Exemple: Livraisons Livreur

```typescript
// Livreur/src/pages/DashboardPage.tsx
import { useDriverStats, useDriverDeliveries, useAcceptDelivery, usePickupDelivery, useCompleteDelivery, useFailDelivery } from '../hooks/use-delivery-api';

export default function DashboardPage() {
  const { data: stats } = useDriverStats();
  const { data: deliveries } = useDriverDeliveries();
  const acceptMutation = useAcceptDelivery();
  const pickupMutation = usePickupDelivery();
  const completeMutation = useCompleteDelivery();
  const failMutation = useFailDelivery();

  const handleAccept = async (id: number) => {
    await acceptMutation.mutateAsync(id);
  };

  const handlePickup = async (id: number) => {
    await pickupMutation.mutateAsync(id);
  };

  const handleComplete = async (id: number) => {
    await completeMutation.mutateAsync(id);
  };

  const handleFail = async (id: number, reason: string) => {
    await failMutation.mutateAsync({ deliveryId: id, reason });
  };

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div>Aujourd'hui: {stats?.deliveries_today}</div>
        <div>Livrés: {stats?.completed}</div>
        <div>Échoués: {stats?.failed}</div>
        <div>Gains: {stats?.earnings} CFA</div>
      </div>

      {/* Deliveries List */}
      <div className="mt-6">
        {deliveries?.map(delivery => (
          <div key={delivery.id} className="border p-4 mb-2">
            <div>{delivery.order_number}</div>
            <div>{delivery.customer_name}</div>
            <div>{delivery.customer_address}</div>
            <div className="mt-2">
              {delivery.status === 'pending' && (
                <button onClick={() => handleAccept(delivery.id)}>Accepter</button>
              )}
              {delivery.status === 'accepted' && (
                <button onClick={() => handlePickup(delivery.id)}>Collecter</button>
              )}
              {(delivery.status === 'picked_up' || delivery.status === 'in_transit') && (
                <>
                  <button onClick={() => handleComplete(delivery.id)}>Livrer</button>
                  <button onClick={() => handleFail(delivery.id, 'Client absent')}>Échec</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔧 CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

### admin/client/.env
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

### Fournisseurs/client/.env
```bash
VITE_API_URL=http://localhost:8000/api
```

### client/.env
```bash
VITE_API_URL=http://localhost:8000/api
```

### Livreur/.env
```bash
VITE_API_URL=http://localhost:8000/api
```

---

## ✅ CHECKLIST FINAL

- [ ] Admin - Routes configurées
- [ ] Admin - AuthContext intégré
- [ ] Admin - Hooks risk connectés
- [ ] Fournisseur - Routes configurées
- [ ] Fournisseur - AuthContext intégré
- [ ] Fournisseur - Hooks marketing connectés
- [ ] Fournisseur - Hooks catégories connectés
- [ ] Client - Routes configurées
- [ ] Client - AuthContext intégré
- [ ] Client - Commandes connectés
- [ ] Livreur - Routes configurées
- [ ] Livreur - AuthContext corrigé Laravel
- [ ] Livreur - Livraisons connectées
- [ ] Variables d'environnement configurées

---

## 🚀 DÉMARRAGE

```bash
# Backend Laravel
cd fashop-backend
php artisan serve

# Admin
cd admin/client
npm run dev

# Fournisseur
cd Fournisseurs/client
npm run dev

# Client
cd client
npm run dev

# Livreur
cd Livreur
npm run dev
```

Ce guide couvre l'intégration complète de tous les fichiers créés.