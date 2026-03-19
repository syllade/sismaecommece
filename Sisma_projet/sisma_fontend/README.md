# ASHOP SISMA - README Technique

## 1. Architecture globale

- `fashop-backend/` : API Laravel (auth token + RBAC + logique métier commandes).
- `Fashop-E-commerce/admin/` : SPA React Admin.
- `Fashop-E-commerce/Fourniseurs/` : SPA React Fournisseur.
- `Fashop-E-commerce/Livreur/` : SPA React Livreur.
- `Fashop-E-commerce/client/` : SPA React Client.

## 2. Rôles & permissions

- `admin`:
  - accès global (orders/suppliers/delivery/analytics/settings)
  - bulk assign commandes
  - création et activation fournisseur/livreur (invitation email)

- `supplier`:
  - accès uniquement aux commandes contenant ses produits
  - update statut fournisseur (`accepted`, `prepared`)
  - bulk update fournisseur

- `delivery`:
  - accès uniquement commandes assignées
  - accepter/refuser/livrer
  - preuve livraison (photo + signature)

- `client`:
  - accès uniquement à ses commandes (`customer_user_id`)
  - création commande client authentifié

## 3. Flow commande complet

1. Client crée commande -> `status=pending`, `supplier_status=pending`, `delivery_status=pending`.
2. Fournisseur accepte/prépare.
3. Admin (ou fournisseur autorisé) assigne livreur.
4. Livreur accepte puis marque livrée avec preuve.
5. Client consulte la commande finalisée.

## 4. Setup local

### Backend

```bash
cd fashop-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

### Front admin

```bash
cd Fashop-E-commerce/admin
npm install
npm run dev
```

Répéter pour `client/`, `Fourniseurs/`, `Livreur/` selon besoins.

## 5. Variables .env nécessaires

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fashop
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS=no-reply@ashop-sisma.local
MAIL_FROM_NAME="ASHOP SISMA"

FORCE_HTTPS=false
SESSION_SECURE_COOKIE=false
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 6. Tests, sécurité, perf

- tests API:
  - `fashop-backend/testing/README_API_TESTS.md`
  - `fashop-backend/testing/postman/ASHOP_SISMA_API_RBAC.postman_collection.json`

- sécurité:
  - `fashop-backend/SECURITY_HARDENING.md`
  - `fashop-backend/AUDIT_LOGGING.md`

- performance:
  - `fashop-backend/PERFORMANCE_CHECKLIST.md`

- flow auth/roles:
  - `Fashop-E-commerce/ROLE_AUTH_FLOW.md`
