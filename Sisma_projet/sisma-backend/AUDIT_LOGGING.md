# Audit & Journalisation

## Événements journalisés

- Auth:
  - `auth.login.success`
  - `auth.login.failed`
  - `auth.logout`
  - `auth.activate.success`
  - `auth.activate.failed`

- Actions admin sensibles:
  - `admin.order.status_update`
  - `admin.order.bulk_assign`
  - `admin.order.assign_delivery`
  - `admin.supplier.create/update/delete/bulk_status`
  - `admin.delivery_person.create/update/delete`

- Opérations métier:
  - `supplier.order.status_update`
  - `supplier.order.bulk_status_update`
  - `delivery.order.accept/refuse/delivered`
  - `order.proof_photo.read`

## Format log structuré (fichier)

Exemple:

```json
{
  "message": "AUDIT",
  "context": {
    "event": "audit",
    "action": "admin.order.bulk_assign",
    "status": "success",
    "user_id": 1,
    "role": "admin",
    "entity_type": "order",
    "entity_id": null,
    "ip": "127.0.0.1",
    "meta": {
      "requested_count": 10,
      "updated_count": 9
    }
  }
}
```

## Table optionnelle `audit_logs`

Migration ajoutée:

- `2026_02_24_000010_create_audit_logs_table.php`

Colonnes principales:

- `user_id`, `role`, `action`, `entity_type`, `entity_id`
- `status`, `ip_address`, `user_agent`, `metadata`
- `created_at`, `updated_at`

## Requêtes utiles

```sql
-- 20 dernières actions admin
SELECT * FROM audit_logs
WHERE role = 'admin'
ORDER BY created_at DESC
LIMIT 20;

-- actions sur une commande donnée
SELECT * FROM audit_logs
WHERE entity_type = 'order' AND entity_id = 123
ORDER BY created_at ASC;
```
