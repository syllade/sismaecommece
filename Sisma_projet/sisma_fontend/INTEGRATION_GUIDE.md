# 📋 SISMA - STRUCTURE FRONTEND & CONNEXION BACKEND

## 🏗️ ARCHITECTURE ACTUELLE

```
Fashop-E-commerce/
├── admin/client/src/           # Interface Admin (React + Vite)
│   ├── context/auth-context.tsx    # ✅ Auth Admin (apiConfig)
│   ├── lib/apiConfig.ts           # ✅ Config API
│   ├── hooks/
│   │   ├── use-v1-admin.ts         # ✅ Hooks Admin
│   │   ├── use-v1-supplier.ts     # ✅ Hooks Gestion Fournisseurs
│   │   └── use-driver-api.ts      # ✅ Hooks Gestion Livreurs
│   └── pages/
│       ├── super-admin-dashboard.tsx
│       ├── super-admin-suppliers.tsx
│       ├── super-admin-orders.tsx
│       └── driver/*.tsx
│
├── Fourniseurs/client/src/     # Interface Fournisseur (React + Vite)
│   ├── context/AuthContext.tsx     # ✅ Auth Fournisseur
│   ├── services/api.ts             # ✅ Axios interceptor
│   ├── hooks/use-v1-supplier.ts    # ✅ Hooks complets
│   └── pages/
│       ├── DashboardOverview.tsx   # ✅ Dashboard
│       ├── DashboardOrders.tsx     # ✅ Commandes
│       ├── DashboardProducts.tsx   # ✅ Produits
│       ├── supplier-register.tsx   # ✅ Inscription
│       └── Landing.tsx
│
├── client/src/                 # Interface Client (React + Vite)
│   ├── hooks/use-products.ts      # ⚠️ Partiellement connecté
│   ├── hooks/use-cart.ts           # ⚠️ Panier local
│   └── pages/
│       ├── Home.tsx
│       ├── Products.tsx
│       ├── ProductDetail.tsx
│       ├── Cart.tsx
│       ├── Checkout.tsx
│       └── Orders.tsx
│
└── Livreur/src/               # Interface Livreur (React + Vite)
    ├── contexts/AuthContext.tsx    # ⚠️ PROBLÈME: Supabase (doit être Laravel)
    └── pages/
        ├── LoginPage.tsx
        ├── DashboardPage.tsx
        └── ProfilePage.tsx
```

---

## 🔐 AUTHENTIFICATION - CONNEXION REQUISE

### Problème identifié
| Frontend | Status | Problème |
|----------|--------|----------|
| Admin | ✅ OK | Token: `admin_api_token` |
| Fournisseur | ✅ OK | Token: `fashop_supplier_token` |
| Client | ⚠️ Partiel | Pas de token, requêtes publiques |
| **Livreur** | ❌ ERREUR | Utilise Supabase au lieu de Laravel! |

### Solution Livreur
Le fichier [`Fashop-E-commerce/Livreur/src/contexts/AuthContext.tsx`](Fashop-E-commerce/Livreur/src/contexts/AuthContext.tsx) utilise Supabase. À remplacer par Laravel:

```typescript
// À IMPLEMENTER dans Livreur/src/contexts/AuthContext.tsx
const AUTH_TOKEN_KEY = "sisma_delivery_token";

const login = async (email: string, password: string) => {
  const response = await fetch("http://localhost:8000/api/v1/driver/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  setUser(data.user);
};
```

---

## 📡 ENDPOINTS PAR RÔLE

### 1. ADMIN (Super Admin)

| Fonctionnalité | Endpoint | Hook existant |
|-----------------|----------|----------------|
| Login | `POST /api/auth/login` | ✅ auth-context.tsx |
| Dashboard Stats | `GET /api/v1/admin/stats` | ✅ use-v1-admin.ts |
| Liste fournisseurs | `GET /api/v1/admin/suppliers` | ✅ use-v1-admin.ts |
| Approuver fournisseur | `POST /api/v1/admin/suppliers/{id}/approve` | ✅ use-v1-admin.ts |
| Rejeter fournisseur | `POST /api/v1/admin/suppliers/{id}/reject` | ✅ use-v1-admin.ts |
| Suspendre fournisseur | `POST /api/v1/admin/suppliers/{id}/suspend` | ✅ use-v1-admin.ts |
| Liste livreurs | `GET /api/v1/admin/drivers` | ✅ use-driver-api.ts |
| Créer livreur | `POST /api/v1/admin/drivers` | ✅ use-driver-api.ts |
| Toggle statut livreur | `POST /api/v1/admin/drivers/{id}/toggle-status` | ✅ use-driver-api.ts |
| **NOUVEAU** - Risk Dashboard | `GET /api/v1/admin/risk/dashboard` | ❌ À créer |
| **NOUVEAU** - Clients à risque | `GET /api/v1/admin/risk/clients` | ❌ À créer |
| **NOUVEAU** - Bannir client | `POST /api/v1/admin/risk/clients/{id}/ban` | ❌ À créer |
| **NOUVEAU** - Blacklist | `GET /api/v1/admin/risk/blacklist` | ❌ À créer |

### 2. FOURNISSEUR

| Fonctionnalité | Endpoint | Hook existant |
|-----------------|----------|----------------|
| Inscription | `POST /api/supplier/register` | ✅ supplier-register.tsx |
| Login | `POST /api/auth/login` | ✅ AuthContext.tsx |
| Dashboard | `GET /api/v1/supplier/dashboard` | ✅ use-v1-supplier.ts |
| Produits | `GET /api/v1/supplier/products` | ✅ use-v1-supplier.ts |
| Créer produit | `POST /api/v1/supplier/products` | ✅ use-v1-supplier.ts |
| Modifier produit | `PUT /api/v1/supplier/products/{id}` | ✅ use-v1-supplier.ts |
| Supprimer produit | `DELETE /api/v1/supplier/products/{id}` | ✅ use-v1-supplier.ts |
| Import massif | `POST /api/v1/supplier/products/import` | ❌ À connecter |
| Commandes | `GET /api/v1/supplier/orders` | ✅ use-v1-supplier.ts |
| Mettre à jour statut | `PUT /api/v1/supplier/orders/{id}/status` | ✅ use-v1-supplier.ts |
| Envoyer WhatsApp | `POST /api/v1/supplier/orders/{id}/send-whatsapp` | ✅ use-v1-supplier.ts |
| Envoyer Email | `POST /api/v1/supplier/orders/{id}/send-email` | ✅ use-v1-supplier.ts |
| Facture HTML | `GET /api/v1/supplier/orders/{id}/invoice-html` | ✅ use-v1-supplier.ts |
| Campagnes | `GET /api/v1/supplier/campaigns` | ❌ À connecter |
| Créer campagne | `POST /api/v1/supplier/campaigns` | ❌ À connecter |
| Solde advertising | `GET /api/v1/supplier/advertising/balance` | ❌ À connecter |
| IA Description | `POST /api/v1/supplier/ai/generate-description` | ✅ use-v1-supplier.ts |
| Schéma catégorie | `GET /api/categories/{id}/schema` | ❌ À connecter |

### 3. LIVREUR

| Fonctionnalité | Endpoint | Actuel | À faire |
|----------------|----------|--------|---------|
| Login | `POST /api/v1/driver/login` | ❌ Supabase | ✅ Réécrire |
| Dashboard | `GET /api/v1/driver/stats` | ❌ Supabase | ✅ Réécrire |
| Liste livraisons | `GET /api/v1/driver/deliveries` | ❌ Supabase | ✅ Réécrire |
| Accepter livraison | `POST /api/v1/driver/deliveries/{id}/accept` | ❌ Supabase | ✅ Réécrire |
| Pickup | `POST /api/v1/driver/deliveries/{id}/pickup` | ❌ Supabase | ✅ Réécrire |
| Complete | `POST /api/v1/driver/deliveries/{id}/complete` | ❌ Supabase | ✅ Réécrire |
| Fail | `POST /api/v1/driver/deliveries/{id}/fail` | ❌ Supabase | ✅ Réécrire |
| Profil | `GET/PUT /api/v1/driver/profile` | ❌ Supabase | ✅ Réécrire |

### 4. CLIENT (Public)

| Fonctionnalité | Endpoint | Actuel |
|----------------|----------|--------|
| Liste produits | `GET /api/products` | ✅ use-products.ts |
| Détail produit | `GET /api/products/{slug}` | ✅ use-products.ts |
| Catégories | `GET /api/categories` | ✅ use-products.ts |
| Créer commande | `POST /api/orders` | ⚠️ Partiel |
| Historique commandes | `GET /api/client/orders` | ❌ À connecter |
| Login/Register | `POST /api/auth/login` | ❌ À connecter |

---

## 🎯 FONCTIONNALITÉS MANQUANTES PAR FRONTEND

### Admin - À ajouter

```typescript
// hooks/use-admin-risk.ts - NOUVEAU
export function useRiskDashboard() {
  return useQuery({
    queryKey: ['admin-risk-dashboard'],
    queryFn: () => apiRequest('/api/v1/admin/risk/dashboard'),
  });
}

export function useRiskClients(params?: { risk_level?: string }) {
  return useQuery({
    queryKey: ['admin-risk-clients', params],
    queryFn: () => apiRequest(`/api/v1/admin/risk/clients?${new URLSearchParams(params)}`),
  });
}

export function useBanClient() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest(`/api/v1/admin/risk/clients/${id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  });
}
```

### Fournisseur - À connecter

```typescript
// hooks/use-supplier-marketing.ts - NOUVEAU
export function useCampaigns() {
  return useQuery({
    queryKey: ['supplier-campaigns'],
    queryFn: () => fetchApi('/campaigns'),
  });
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: (data) => fetchApi('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  });
}

export function useAdvertisingBalance() {
  return useQuery({
    queryKey: ['supplier-advertising-balance'],
    queryFn: () => fetchApi('/advertising/balance'),
  });
}

// hooks/use-category-schema.ts - NOUVEAU
export function useCategorySchema(categoryId: number) {
  return useQuery({
    queryKey: ['category-schema', categoryId],
    queryFn: () => fetch(`/api/categories/${categoryId}/schema`).then(r => r.json()),
    enabled: !!categoryId,
  });
}
```

### Livreur - À réécrire complètement

Le fichier [`Fashop-E-commerce/Livreur/src/contexts/AuthContext.tsx`](Fashop-E-commerce/Livreur/src/contexts/AuthContext.tsx) doit être complètement réécrit pour utiliser Laravel au lieu de Supabase.

### Client - À connecter

```typescript
// hooks/use-client-auth.ts - NOUVEAU
const CLIENT_TOKEN_KEY = "sisma_client_token";

export function useClientLogin() {
  return useMutation({
    mutationFn: ({ email, password }) =>
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json()),
  });
}

export function useClientOrders() {
  return useQuery({
    queryKey: ['client-orders'],
    queryFn: () => {
      const token = localStorage.getItem(CLIENT_TOKEN_KEY);
      return fetch('/api/client/orders', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
    },
  });
}
```

---

## 🔧 CONFIGURATION API

### Variables d'environnement à configurer

```bash
# admin/client/.env
VITE_API_BASE_URL=http://localhost:8000/api

# Fournisseurs/client/.env  
VITE_API_URL=http://localhost:8000/api

# client/.env
VITE_API_URL=http://localhost:8000/api

# Livreur/.env
VITE_API_URL=http://localhost:8000/api
```

---

## 📝 CHECKLIST INTÉGRATION

### Phase 1: Authentification
- [ ] Admin - Login existant ✅
- [ ] Fournisseur - Login existant ✅
- [ ] **Livreur - Réécrire avec Laravel** ❌
- [ ] Client - Créer login/register ❌

### Phase 2: Dashboard
- [ ] Admin Stats - Existant ✅
- [ ] Fournisseur Dashboard - Existant ✅
- [ ] **Livreur Dashboard - Réécrire** ❌

### Phase 3: Produits
- [ ] Fournisseur Produits - Existant ✅
- [ ] **Schéma dynamique catégories - À connecter** ❌
- [ ] Import massif - À connecter ❌

### Phase 4: Commandes
- [ ] Fournisseur Commandes - Existant ✅
- [ ] Client Checkout - Partiel ⚠️
- [ ] **Livreur Livraisons - Réécrire** ❌

### Phase 5: Marketing
- [ ] **Campagnes CPC - À connecter** ❌
- [ ] **Solde advertising - À connecter** ❌
- [ ] IA Description - Existant ✅

### Phase 6: Administration Système
- [ ] **Risk Dashboard - À créer** ❌
- [ ] Gestion blacklist - À créer ❌
- [ ] Paramètres zones - À créer ❌

---

## 🗂️ STRUCTURE RECOMMANDÉE POUR CHAQUE FRONTEND

### Template standard

```
frontend-role/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx      # Auth + Intercepteur 401
│   ├── lib/
│   │   └── apiConfig.ts         # URL + Headers
│   ├── hooks/
│   │   ├── use-auth.ts          # Login/Logout/Register
│   │   ├── use-dashboard.ts    # Stats
│   │   ├── use-crud.ts          # CRUD generique
│   │   └── use-*.ts             # Features
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── ui/                  # Composants partagés
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── types/
│   │   └── index.ts             # Types TS
│   └── App.tsx                  # Routes + Guards
```

---

## ⚠️ RÈGLES DE SÉCURITÉ

### 1. Stockage Token
```typescript
// Admin
localStorage.setItem('admin_api_token', token);

// Fournisseur  
localStorage.setItem('fashop_supplier_token', token);

// Livreur (NOUVEAU)
localStorage.setItem('sisma_delivery_token', token);

// Client (NOUVEAU)
localStorage.setItem('sisma_client_token', token);
```

### 2. Intercepteurtypescript
// Partout - 401
``` En cas de 401
if (response.status === 401) {
  localStorage.removeItem(tokenKey);
  window.location.href = '/login';
}
```

### 3. Route Guards
```typescript
// Admin ne peut pas accéder à Supplier
if (user.role !== 'admin' && user.role !== 'super_admin') {
  return <Navigate to="/login" />;
}
```

---

## 📞 PROCHAINES ÉTAPES

1. **Corriger Livreur** - Réécrire AuthContext pour Laravel
2. **Connecter Client** - Créer auth + orders
3. **Dashboard Risk Admin** - Créer page + hooks
4. **Marketing Fournisseur** - Connecter campagnes
5. **Schéma Catégories** - Connecter formulaire dynamique
6. **Import Massif** - Connecter upload CSV

---

Ce document est la référence pour l'intégration complète frontend-backend SISMA.