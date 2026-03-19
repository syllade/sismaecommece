# Performance & Stabilité - Checklist

## Validations effectuées

1. Pagination systématique:
- `GET /api/admin/orders` (page/per_page déjà en place)
- `GET /api/supplier/orders` (page/per_page)
- `GET /api/delivery/orders` (ajout page/per_page)
- `GET /api/client/orders` (page/per_page)

2. Réduction N+1:
- récupération batch des `order_items` via `getItemsByOrderIds()` (delivery/client/supplier).
- requêtes de produits batchées côté supplier pour filtrage de visibilité.

3. Limitation volumétrie:
- bornes `per_page` (max 100) sur endpoints paginés.

4. Polling front:
- conservation du comportement existant, mais erreurs non-retry agressif.

## Points à surveiller en production

1. Index SQL recommandés:
- `orders(customer_user_id, created_at)`
- `orders(delivery_person_id, created_at)`
- `orders(status, created_at)`
- `order_items(order_id)`
- `products(supplier_id)`
- `api_tokens(token, expires_at)`

2. Requêtes lourdes:
- endpoint admin orders avec enrichissement (sur gros volume > 100k commandes).
- analytics agrégées (prévoir cache court TTL).

3. Cache conseillé:
- KPI dashboard (15-30s)
- lists fournisseurs/livreurs peu volatiles (30-60s)

4. Jobs asynchrones:
- envoi email invitation et notifications -> queue worker recommandé.

5. Observabilité DB:
- slow query log activé
- alerte sur p95 latence API > 500ms.
