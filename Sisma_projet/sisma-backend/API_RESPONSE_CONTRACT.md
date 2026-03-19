# API Response Contract (exemples)

## Success standard

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

## Error standard

```json
{
  "success": false,
  "message": "Acces refuse pour ce role",
  "error": {
    "code": "ROLE_FORBIDDEN",
    "status": 403,
    "details": {
      "required_roles": ["admin"],
      "current_role": "delivery"
    }
  }
}
```

## Erreur métier exemple

`POST /api/delivery/orders/{id}/delivered` sur commande déjà livrée:

```json
{
  "message": "Commande deja livree"
}
```

Statut HTTP: `409 Conflict`.
