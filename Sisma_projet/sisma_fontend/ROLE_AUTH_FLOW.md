# ASHOP SISMA - Flux Auth & Commandes

## Auth token + redirection rôle

- `POST /api/login` (alias de `/api/auth/login`)
- `POST /api/logout` (auth requis)
- `GET /api/me` (auth requis)
- Réponse login inclut:
  - `token`
  - `user.role` (`admin|supplier|delivery|client`)
  - `redirect_path` (`/admin/dashboard|/supplier/dashboard|/delivery/dashboard|/account`)

## Activation compte invité

- `GET /api/auth/activation/{token}` vérifie le lien
- `POST /api/auth/activate`
  - body: `token`, `password`, `password_confirmation`
  - active le compte et renvoie un token + `redirect_path`

## Endpoints commandes par rôle

- Admin (`role:admin`)
  - `GET /api/admin/orders`
  - `POST /api/admin/orders/bulk-assign`

- Supplier (`role:supplier`)
  - `GET /api/supplier/orders`
  - `POST /api/supplier/orders/{id}/status` (`accepted|prepared`)
  - `POST /api/supplier/orders/bulk-status`

- Delivery (`role:delivery`)
  - `GET /api/delivery/orders`
  - `POST /api/delivery/orders/{id}/accept`
  - `POST /api/delivery/orders/{id}/refuse`
  - `POST /api/delivery/orders/{id}/delivered` (preuve photo/signature)

- Client (`role:client`)
  - `GET /api/client/orders`
  - `GET /api/client/orders/{id}`
  - `POST /api/client/orders` (création liée à `customer_user_id`)

## Contrôles sécurité

- Middleware `auth.api` + middleware `role`.
- Policy d'accès commande:
  - fournisseur: uniquement commandes contenant ses produits,
  - livreur: uniquement commandes assignées,
  - client: uniquement ses commandes (`customer_user_id`).

## Workflow commande cible

1. Client crée commande (`pending`, `supplier_status=pending`, `delivery_status=pending`).
2. Fournisseur passe à `accepted` puis `prepared` (status global `processing`).
3. Admin/Supplier assigne livreur.
4. Livreur `accept` puis `delivered` avec preuve.
5. Client voit la commande finalisée dans `/api/client/orders`.
