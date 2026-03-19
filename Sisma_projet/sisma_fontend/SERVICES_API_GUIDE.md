# 📡 Guide des Services API - Applications Frontend

Ce document décrit la structure des services API à créer pour chaque application frontend.

---

## 1. Application Admin (`admin/client`)

### 1.1 Services existants (✅)
- `api/auth.api.ts` - Authentification
- `api/orders.api.ts` - Commandes
- `api/products.api.ts` - Produits
- `api/vendors.api.ts` - Fournisseurs
- `api/deliveries.api.ts` - Livreurs
- `api/marketing.api.ts` - Marketing/Campagnes
- `api/stats.api.ts` - Statistiques

### 1.2 À ajouter
- `api/risk.api.ts` - Risk Management
- `api/notifications.api.ts` - Notifications
- `api/settings.api.ts` - Paramètres

---

## 2. Application Fournisseur (`Fourniseurs/client`)

### 2.1 Structure à créer

```
src/
├── services/
│   ├── api.ts          # Configuration centrale et interceptors
│   ├── auth.service.ts
│   ├── products.service.ts
│   ├── orders.service.ts
│   ├── dashboard.service.ts
│   ├── marketing.service.ts
│   ├── wallet.service.ts
│   └── settings.service.ts
```

### 2.2 Services à implémenter

#### auth.service.ts
```typescript
import { api } from './api';

export const supplierAuthService = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  
  register: (data: SupplierRegistrationData) =>
    api.post('/api/supplier/register', data),
  
  me: () => api.get('/api/auth/me'),
  
  logout: () => api.post('/api/auth/logout'),
};
```

#### products.service.ts
```typescript
import { api } from './api';

export const supplierProductsService = {
  list: (params?: { search?: string; category_id?: number; page?: number }) =>
    api.get('/api/v1/supplier/products', { params }),
  
  get: (id: number) => api.get(`/api/v1/supplier/products/${id}`),
  
  create: (data: CreateProductDTO) => 
    api.post('/api/v1/supplier/products', data),
  
  update: (id: number, data: UpdateProductDTO) =>
    api.put(`/api/v1/supplier/products/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/v1/supplier/products/${id}`),
  
  // Variantes
  addVariant: (productId: number, variant: VariantDTO) =>
    api.post(`/api/v1/supplier/products/${productId}/variants`, variant),
  
  // Import
  importBulk: (file: FormData) =>
    api.post('/api/v1/supplier/products/import', file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};
```

#### orders.service.ts
```typescript
import { api } from './api';

export const supplierOrdersService = {
  list: (params?: { status?: string; page?: number }) =>
    api.get('/api/v1/supplier/orders', { params }),
  
  get: (id: number) => api.get(`/api/v1/supplier/orders/${id}`),
  
  updateStatus: (id: number, status: string) =>
    api.put(`/api/v1/supplier/orders/${id}/status`, { status }),
  
  // Communication client
  sendMessage: (orderId: number, message: string) =>
    api.post(`/api/v1/supplier/orders/${orderId}/communicate`, { message }),
};
```

#### dashboard.service.ts
```typescript
import { api } from './api';

export const supplierDashboardService = {
  overview: () => api.get('/api/v1/supplier/dashboard/overview'),
  
  stats: () => api.get('/api/v1/supplier/dashboard/stats'),
  
  recentOrders: () => api.get('/api/v1/supplier/dashboard/recent-orders'),
  
  topProducts: () => api.get('/api/v1/supplier/dashboard/top-products'),
};
```

#### marketing.service.ts
```typescript
import { api } from './api';

export const supplierMarketingService = {
  campaigns: (params?: { status?: string }) =>
    api.get('/api/v1/supplier/marketing/campaigns', { params }),
  
  createCampaign: (data: CampaignDTO) =>
    api.post('/api/v1/supplier/marketing/campaigns', data),
  
  getCampaignStats: (id: number) =>
    api.get(`/api/v1/supplier/marketing/campaigns/${id}/stats`),
};
```

#### wallet.service.ts
```typescript
import { api } from './api';

export const supplierWalletService = {
  balance: () => api.get('/api/v1/supplier/wallet/balance'),
  
  transactions: (params?: { page?: number; type?: string }) =>
    api.get('/api/v1/supplier/wallet/transactions', { params }),
  
  commissions: () => api.get('/api/v1/supplier/wallet/commissions'),
};
```

---

## 3. Application Client (`client`)

### 3.1 Structure à créer

```
src/
├── lib/
│   ├── api.ts          # Configuration centrale
├── services/
│   ├── auth.service.ts
│   ├── products.service.ts
│   ├── cart.service.ts
│   ├── orders.service.ts
│   └── suppliers.service.ts
```

### 3.2 Services à implémenter

#### products.service.ts (Client)
```typescript
import { api } from '@/lib/api';

export const clientProductsService = {
  list: (params?: { 
    category_id?: number; 
    supplier_id?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort?: 'price_asc' | 'price_desc' | 'newest';
    page?: number;
  }) => api.get('/api/products', { params }),
  
  get: (slug: string) => api.get(`/api/products/${slug}`),
  
  // Variantes
  getVariants: (productId: number) => 
    api.get(`/api/products/${productId}/variants`),
  
  // Avis
  getReviews: (productId: number) =>
    api.get(`/api/v1/products/${productId}/reviews`),
  
  addReview: (productId: number, data: ReviewDTO) =>
    api.post(`/api/v1/products/${productId}/reviews`, data),
};
```

#### cart.service.ts
```typescript
import { api } from '@/lib/api';

export const cartService = {
  // Le panier est géré localement + sync avec API
  
  createOrder: (orderData: CreateOrderDTO) =>
    api.post('/api/orders', orderData),
  
  validatePromo: (code: string, orderTotal: number) =>
    api.post('/api/v1/promotions/validate', { code, total: orderTotal }),
  
  calculateDelivery: (params: { commune: string; total: number }) =>
    api.get('/api/delivery-fees/calculate', { params }),
};
```

#### orders.service.ts (Client)
```typescript
import { api } from '@/lib/api';

export const clientOrdersService = {
  list: () => api.get('/api/client/orders'),
  
  get: (id: number) => api.get(`/api/client/orders/${id}`),
  
  cancel: (id: number, reason: string) =>
    api.post(`/api/client/orders/${id}/cancel`, { reason }),
};
```

---

## 4. Application Livreur (`Livreur`)

### 4.1 Structure existante

L'application livreur est partiellement implémentée avec les pages:
- DriverDashboard.tsx
- DriverDeliveries.tsx
- DriverLogin.tsx
- DriverProfile.tsx
- DriverScanQr.tsx

### 4.2 Services à implémenter

```typescript
// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor pour le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('driver_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const driverAuthService = {
  login: (credentials: { phone: string; password: string }) =>
    api.post('/api/v1/driver/login', credentials),
  
  me: () => api.get('/api/v1/driver/me'),
  
  logout: () => api.post('/api/v1/driver/logout'),
};

export const driverDeliveryService = {
  list: (status?: string) => 
    api.get('/api/v1/driver/deliveries', { params: { status } }),
  
  get: (id: number) => api.get(`/api/v1/driver/deliveries/${id}`),
  
  accept: (id: number) => api.post(`/api/v1/driver/deliveries/${id}/accept`),
  
  pickup: (id: number) => api.post(`/api/v1/driver/deliveries/${id}/pickup`),
  
  complete: (id: number, data?: { photo?: string; notes?: string }) =>
    api.post(`/api/v1/driver/deliveries/${id}/complete`, data),
  
  fail: (id: number, reason: string) =>
    api.post(`/api/v1/driver/deliveries/${id}/fail`, { reason }),
};

export const driverQrService = {
  getQrData: (deliveryId: number) =>
    api.get(`/api/v1/driver/deliveries/${deliveryId}/qr-data`),
  
  scanQr: (deliveryId: number, qrData: string) =>
    api.post(`/api/v1/driver/deliveries/${deliveryId}/scan-qr`, { qr_data: qrData }),
  
  confirmManual: (deliveryId: number, code: string) =>
    api.post(`/api/v1/driver/deliveries/${deliveryId}/confirm-manual`, { code }),
};

export const driverPaymentService = {
  confirmPayment: (deliveryId: number, amount: number) =>
    api.post(`/api/v1/driver/deliveries/${deliveryId}/confirm-payment`, { amount }),
  
  getStatus: (deliveryId: number) =>
    api.get(`/api/v1/driver/deliveries/${deliveryId}/payment-status`),
};

export const driverStatsService = {
  get: () => api.get('/api/v1/driver/stats'),
  
  weekly: () => api.get('/api/v1/driver/stats/weekly'),
};

export const driverProfileService = {
  get: () => api.get('/api/v1/driver/profile'),
  
  update: (data: { name?: string; phone?: string; vehicle_type?: string }) =>
    api.put('/api/v1/driver/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/api/v1/driver/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
};
```

---

## 5. Configuration API Commune

### 5.1 Configuration de base

```typescript
// lib/api.ts ou services/api.ts
import axios, { AxiosError } from 'axios';

// URL de base
const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:8000/api';

// Instance axios
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 5.2 Types partagés

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
```

---

## 6. Intégration avec React Query

### 6.1 Configuration du QueryClient

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 6.2 Exemple d'utilisation dans un composant

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierProductsService } from '@/services/products.service';

export function ProductsPage() {
  const queryClient = useQueryClient();
  
  // Liste des produits
  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier-products'],
    queryFn: () => supplierProductsService.list(),
  });
  
  // Mutation pour créer un produit
  const createMutation = useMutation({
    mutationFn: supplierProductsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast.success('Produit créé avec succès');
    },
  });
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {data?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 7. Checklist d'implémentation

### Admin
- [x] auth.api.ts
- [x] orders.api.ts
- [x] products.api.ts
- [x] vendors.api.ts
- [x] deliveries.api.ts
- [x] marketing.api.ts
- [x] stats.api.ts
- [ ] risk.api.ts (à créer)
- [ ] notifications.api.ts (à créer)

### Fournisseur
- [ ] auth.service.ts (à créer)
- [ ] products.service.ts (à créer)
- [ ] orders.service.ts (à créer)
- [ ] dashboard.service.ts (à créer)
- [ ] marketing.service.ts (à créer)
- [ ] wallet.service.ts (à créer)
- [ ] settings.service.ts (à créer)

### Client
- [ ] auth.service.ts (à créer)
- [ ] products.service.ts (à créer)
- [ ] cart.service.ts (à créer)
- [ ] orders.service.ts (à créer)
- [ ] suppliers.service.ts (à créer)

### Livreur
- [ ] api.ts avec interceptors (à créer)
- [ ] driverAuthService (à créer)
- [ ] driverDeliveryService (à créer)
- [ ] driverQrService (à créer)
- [ ] driverPaymentService (à créer)
- [ ] driverStatsService (à créer)
- [ ] driverProfileService (à créer)

---

*Document généré le 2026-03-09*
