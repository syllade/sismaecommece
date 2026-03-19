# API Tests - ASHOP SISMA

## 1) Postman collection

Collection fournie:

- `fashop-backend/testing/postman/ASHOP_SISMA_API_RBAC.postman_collection.json`

Elle couvre:

- login par rôle (`admin`, `supplier`, `delivery`, `client`)
- endpoints par rôle
- tests négatifs obligatoires:
  - supplier vers commande d'un autre fournisseur -> `403`
  - delivery vers route admin -> `403`
  - client update commande admin -> `403`
  - token invalide/expiré -> `401`

### Exécution avec Postman UI

1. Importer la collection JSON.
2. Remplir les variables de collection (`base_url`, credentials, IDs).
3. Exécuter la collection complète.

### Exécution CLI (newman)

```bash
npm install -g newman
newman run fashop-backend/testing/postman/ASHOP_SISMA_API_RBAC.postman_collection.json
```

## 2) Équivalent cURL rapide

### Login admin

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@fashop.com\",\"password\":\"admin123\"}"
```

### Negative: delivery -> admin route (403)

```bash
curl -X GET http://localhost:8000/api/admin/orders \
  -H "Authorization: Bearer <DELIVERY_TOKEN>"
```

### Negative: supplier -> autre commande fournisseur (403)

```bash
curl -X POST http://localhost:8000/api/supplier/orders/<FORBIDDEN_ORDER_ID>/status \
  -H "Authorization: Bearer <SUPPLIER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"prepared\"}"
```

### Negative: token expiré/invalide (401)

```bash
curl -X GET http://localhost:8000/api/me \
  -H "Authorization: Bearer invalid_or_expired_token"
```

## 3) Pré-requis de données

Avant exécution, prévoir en base:

- 1 utilisateur par rôle actif (`admin/supplier/delivery/client`)
- 1 livreur existant (`delivery_persons.id`)
- quelques commandes et order_items
- au moins une commande appartenant à un autre fournisseur pour le test `403`.
