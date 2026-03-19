# 📋 GUIDE COMPLET - FONCTIONNALITÉS BACKEND À CONNECTER

Ce document liste toutes les fonctionnalités backend avec leurs endpoints, pour que tu puisses développer le frontend.

---

# 🔐 1. AUTHENTIFICATION

## 1.1 Login (Tous les rôles)

### Admin
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "user": {...}, "token": "..." }
```

### Fournisseur  
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "user": {...}, "token": "..." }
```

### Livreur
```
POST /api/v1/driver/login
Body: { "email": "...", "password": "..." }
Response: { "user": {...}, "token": "..." }
```

### Client
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "user": {...}, "token": "..." }
```

## 1.2 Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer {token}
Response: { "message": "Déconnexion réussie" }
```

## 1.3 Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer {token}
Response: { "id": 1, "name": "...", "email": "...", "role": "..." }
```

## 1.4 Inscription Fournisseur (NOUVEAU)
```
POST /api/supplier/register
Body: {
  "first_name": "...",
  "last_name": "...",
  "email": "...",           // UNIQUE
  "phone": "...",           // UNIQUE
  "password": "...",
  "password_confirmation": "...",
  "company_name": "...",    // UNIQUE
  "company_rccm": "...",
  "company_nif": "...",
  "address": "...",
  "city": "...",
  "country": "...",
  "description": "...",
  "logo": File,
  "id_document": File,
  "business_document": File
}
Response: {
  "success": true,
  "message": "Inscription réussie...",
  "data": { "supplier": {...}, "user": {...} }
}
```

---

# 📦 2. PRODUITS

## 2.1 Liste produits (Public)
```
GET /api/products
Query: ?page=1&per_page=20&search=...&category_id=...
Response: { "data": [...], "meta": {...} }
```

## 2.2 Détail produit
```
GET /api/products/{slug}
Response: { "id": 1, "name": "...", "price": ..., "images": [...], ... }
```

## 2.3 Produits fournisseur
```
GET /api/v1/supplier/products
Headers: Authorization: Bearer {token}
Query: ?page=1&per_page=20&status=active&search=...
Response: { "data": [...], "meta": {...} }
```

## 2.4 Créer produit (Fournisseur)
```
POST /api/v1/supplier/products
Headers: Authorization: Bearer {token}
Body: {
  "name": "...",
  "description": "...",
  "price": 10000,
  "compare_price": 15000,
  "stock": 50,
  "category_id": 1,
  "images": [File, File, ...],
  // Champs dynamiques selon catégorie
  "brand": "Samsung",
  "color": "Noir"
}
Response: { "success": true, "data": {...} }
```

## 2.5 Mettre à jour produit
```
PUT /api/v1/supplier/products/{id}
Headers: Authorization: Bearer {token}
Body: { "name": "...", "price": 12000, "stock": 30 }
Response: { "success": true, "data": {...} }
```

## 2.6 Supprimer produit
```
DELETE /api/v1/supplier/products/{id}
Headers: Authorization: Bearer {token}
Response: { "success": true, "message": "Produit supprimé" }
```

## 2.7 Import massif produits
```
POST /api/v1/supplier/products/import
Headers: Authorization: Bearer {token}
Body: FormData with "file" (CSV/Excel)
Response: { "success": true, "job_id": "...", "message": "Import en cours" }
```

---

# 🏷️ 3. CATÉGORIES

## 3.1 Liste catégories
```
GET /api/categories
Response: { "data": [{ "id": 1, "name": "Vêtements", "slug": "vetements", ... }] }
```

## 3.2 Schéma catégorie (Champs dynamiques)
```
GET /api/categories/{id}/schema
Response: {
  "category": { "id": 1, "name": "Électronique" },
  "fields": [
    { "name": "brand", "type": "select", "label": "Marque", "required": true, "options": ["Samsung", "Apple"] },
    { "name": "warranty", "type": "number", "label": "Garantie (mois)", "required": false },
    { "name": "color", "type": "text", "label": "Couleur" }
  ]
}
```

## 3.3 Créer catégorie (Admin)
```
POST /api/v1/admin/categories
Headers: Authorization: Bearer {token} (role: admin)
Body: {
  "name": "...",
  "slug": "...",
  "description": "...",
  "parent_id": null,
  "is_active": true
}
Response: { "success": true, "data": {...} }
```

---

# 🛒 4. COMMANDES

## 4.1 Créer commande (Client)
```
POST /api/orders
Body: {
  "items": [
    { "product_id": 1, "quantity": 2, "price": 10000 },
    { "product_id": 2, "quantity": 1, "price": 5000 }
  ],
  "customer_name": "...",
  "customer_phone": "...",
  "customer_address": "...",
  "commune": "...",
  "payment_method": "cash_on_delivery" | "mobile_money"
}
Response: { "success": true, "order_id": 123, "total": 25000 }
```

## 4.2 Liste commandes (Fournisseur)
```
GET /api/v1/supplier/orders
Headers: Authorization: Bearer {token}
Query: ?page=1&status=pending&search=...
Response: { "data": [...], "meta": {...} }
```

## 4.3 Détail commande
```
GET /api/v1/supplier/orders/{id}
Response: {
  "id": 123,
  "order_number": "CMD-2024-001",
  "customer_name": "...",
  "customer_phone": "...",
  "customer_address": "...",
  "items": [...],
  "subtotal": 25000,
  "delivery_fee": 2000,
  "total": 27000,
  "status": "pending",
  "payment_status": "pending"
}
```

## 4.4 Mettre à jour statut commande
```
PUT /api/v1/supplier/orders/{id}/status
Body: { "status": "processing" | "shipped" | "delivered" | "cancelled" }
Response: { "success": true, "data": {...} }
```

## 4.5 Assigner livreur (Admin)
```
POST /api/v1/admin/orders/{id}/assign-driver
Body: { "driver_id": 5 }
Response: { "success": true }
```

## 4.6 Statut livraison (Livreur)
```
POST /api/v1/driver/deliveries/{id}/accept
POST /api/v1/driver/deliveries/{id}/pickup
POST /api/v1/driver/deliveries/{id}/complete
POST /api/v1/driver/deliveries/{id}/fail
```

---

# 📊 5. DASHBOARD

## 5.1 Stats Admin
```
GET /api/v1/admin/stats
Response: {
  "total_orders": 150,
  "total_revenue": 15000000,
  "total_suppliers": 25,
  "total_drivers": 10,
  "orders_today": 12,
  "revenue_today": 450000
}
```

## 5.2 Stats Fournisseur
```
GET /api/v1/supplier/dashboard
Response: {
  "revenue": { "today": 50000, "week": 350000, "month": 1200000 },
  "orders": { "pending": 5, "total": 45, "completed": 38 },
  "products": { "active": 120, "out_of_stock": 3 },
  "analytics": { "conversion_rate": 3.2, "average_basket": 25000 }
}
```

## 5.3 Stats Livreur
```
GET /api/v1/driver/stats
Response: {
  "deliveries_today": 8,
  "completed": 6,
  "failed": 0,
  "earnings": 15000,
  "rating": 4.5
}
```

---

# 💰 6. MARKETING & CPC

## 6.1 Liste campagnes
```
GET /api/v1/supplier/campaigns
Response: { "data": [...] }
```

## 6.2 Créer campagne
```
POST /api/v1/supplier/campaigns
Body: {
  "name": "Promo été",
  "type": "cpc",
  "budget": 100000,
  "daily_budget": 10000,
  "keywords": ["smartphone", "téléphone"],
  "target_url": "https://..."
}
Response: { "success": true, "campaign_id": 1 }
```

## 6.3 Stats campagne
```
GET /api/v1/supplier/campaigns/{id}/stats
Response: {
  "clicks": 1250,
  "impressions": 50000,
  "ctr": 2.5,
  "spend": 45000,
  "conversions": 15
}
```

## 6.4 Solde advertising
```
GET /api/v1/supplier/advertising/balance
Response: { "balance": 50000 }
```

## 6.5 Déposer fonds
```
POST /api/v1/supplier/advertising/deposit
Body: { "amount": 100000 }
Response: { "success": true, "new_balance": 150000 }
```

---

# 🤖 7. IA & DESCRIPTION PRODUIT

## 7.1 Générer description
```
POST /api/v1/supplier/ai/generate-description
Body: {
  "product_name": "iPhone 15 Pro",
  "category": "Électronique",
  "keywords": ["smartphone", "Apple", "premium"],
  "tone": "professionnel",
  "language": "fr"
}
Response: { "description": "L'iPhone 15 Pro..." }
```

## 7.2 Améliorer description
```
POST /api/v1/supplier/ai/improve
Body: { "description": "...", "improvement_type": "more_professional" }
Response: { "description": "..." }
```

## 7.3 Traduire description
```
POST /api/v1/supplier/ai/translate
Body: { "description": "...", "target_language": "en" }
Response: { "description": "..." }
```

---

# 👥 8. GESTION FOURNISSEURS (ADMIN)

## 8.1 Liste fournisseurs
```
GET /api/v1/admin/suppliers
Query: ?status=all&search=...&page=1
Response: { "data": [...], "meta": {...} }
```

## 8.2 Détail fournisseur
```
GET /api/v1/admin/suppliers/{id}
Response: { "id": 1, "name": "...", "email": "...", "status": "approved", ... }
```

## 8.3 Approuver fournisseur
```
POST /api/v1/admin/suppliers/{id}/approve
Response: { "success": true }
```

## 8.4 Rejeter fournisseur
```
POST /api/v1/admin/suppliers/{id}/reject
Body: { "reason": "Documents invalides" }
Response: { "success": true }
```

## 8.5 Suspendre/Bannir fournisseur
```
POST /api/v1/admin/suppliers/{id}/suspend
Body: { "reason": "...", "permanent": true }
Response: { "success": true }
```

## 8.6 Reset mot de passe
```
POST /api/v1/admin/suppliers/{id}/reset-password
Response: { "success": true, "message": "Email envoyé" }
```

---

# 🚚 9. GESTION LIVREURS (ADMIN)

## 9.1 Liste livreurs
```
GET /api/v1/admin/drivers
Query: ?status=active&search=...&zone=...
Response: { "data": [...], "meta": {...} }
```

## 9.2 Créer livreur
```
POST /api/v1/admin/drivers
Body: {
  "name": "...",
  "email": "...",
  "phone": "...",
  "zone": "Abidjan Nord"
}
Response: { "success": true, "driver": {...}, "activation_link": "..." }
```

## 9.3 Toggle statut
```
POST /api/v1/admin/drivers/{id}/toggle-status
Response: { "success": true, "is_active": false }
```

---

# ⚠️ 10. GESTION RISQUES (ADMIN)

## 10.1 Dashboard risques
```
GET /api/v1/admin/risk/dashboard
Response: {
  "clients": { "at_risk": 5, "warning": 3, "red_zone": 2, "banned": 1 },
  "suppliers": { "at_risk": 3, "warning": 2, "red_zone": 1, "suspended": 1 },
  "security": { "unresolved_events": 10, "blacklisted_count": 5 }
}
```

## 10.2 Clients à risque
```
GET /api/v1/admin/risk/clients
Query: ?risk_level=warning&sort_by=cancellation_count&sort_order=desc
Response: {
  "data": [
    { "id": 1, "name": "...", "risk_level": "red_zone", "cancellation_count": 5, "risk_score": 50 }
  ],
  "summary": { "total_at_risk": 5, "warning_count": 3, "red_zone_count": 2 }
}
```

## 10.3 Fournisseurs à risque
```
GET /api/v1/admin/risk/suppliers
Response: { "data": [...], "summary": {...} }
```

## 10.4 Bannir client définitivement
```
POST /api/v1/admin/risk/clients/{id}/ban
Body: { "reason": "Fraude confirmée" }
Response: { "success": true, "message": "Client banni définitivement" }
```

## 10.5 Suspendre client
```
POST /api/v1/admin/risk/clients/{id}/suspend
Body: { "reason": "Comportement abusif" }
Response: { "success": true, "message": "Client suspendu" }
```

## 10.6 Événements sécurité
```
GET /api/v1/admin/risk/security-events
Query: ?event_type=login_failed&resolved=false
Response: { "data": [...] }
```

## 10.7 Blacklist
```
GET /api/v1/admin/risk/blacklist
POST /api/v1/admin/risk/blacklist/add
Body: { "type": "email", "value": "test@fake.com", "reason": "Spam" }
```

---

# 📝 11. PARAMÈTRES

## 11.1 Paramètres généraux (Admin)
```
GET /api/v1/admin/settings
PUT /api/v1/admin/settings
Body: { "site_name": "...", "commission_rate": 10, ... }
```

## 11.2 Paramètres fournisseur
```
GET /api/v1/supplier/settings
PUT /api/v1/supplier/settings/profile
Body: { "name": "...", "description": "...", "logo": File }
```

## 11.3 Zones livraison (Admin)
```
GET /api/v1/admin/settings/delivery-zones
POST /api/v1/admin/settings/delivery-zones
Body: { "name": "Abidjan", "base_fee": 2000, "free_threshold": 50000 }
```

---

# 📧 12. NOTIFICATIONS

## 12.1 Notifications admin
```
GET /api/v1/admin/notifications
GET /api/v1/admin/notifications/unread-count
PUT /api/v1/admin/notifications/{id}/read
```

## 12.2 Notifications commande (Fournisseur)
```
GET /api/v1/supplier/orders/{id}/notifications
POST /api/v1/supplier/orders/{id}/send-whatsapp
POST /api/v1/supplier/orders/{id}/send-email
```

---

# 🧾 13. FACTURES

## 13.1 Générer facture
```
GET /api/v1/supplier/orders/{id}/invoice-html
GET /api/v1/supplier/orders/{id}/print
```

## 13.2 Liste factures (Admin)
```
GET /api/v1/admin/invoices
```

---

# 📌 14. PROFIL & COMPTE

## 14.1 Profil livreur
```
GET /api/v1/driver/profile
PUT /api/v1/driver/profile
Body: { "name": "...", "phone": "...", "vehicle_type": "moto" }
```

## 14.2 Changer mot de passe
```
PUT /api/v1/driver/change-password
Body: { "current_password": "...", "password": "...", "password_confirmation": "..." }
```

---

# 🔔 15. ERROR HANDLING

## Codes de réponse standard

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Bad Request |
| 401 | Non authentifié |
| 403 | Accès refusé (rôle) |
| 404 | Non trouvé |
| 422 | Validation échouée |
| 429 | Rate limit |
| 500 | Erreur serveur |

## Format erreur 422
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": {
    "email": ["L'email est déjà utilisé"],
    "phone": ["Le téléphone est requis"]
  }
}
```

---

# 📱 16. CONNEXION FRONTEND

## Headers requis
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

## Token storage
- Admin: localStorage.getItem('sisma_admin_token')
- Fournisseur: localStorage.getItem('sisma_supplier_token')  
- Livreur: localStorage.getItem('sisma_delivery_token')
- Client: localStorage.getItem('sisma_client_token')

## Intercepteur 401
Si 401 → logout → redirect vers login du rôle

---

Ce document est complet. Chaque endpoint est prêt à être consommé par le frontend.