# Security Hardening - ASHOP SISMA

## Protections actives

1. Auth token obligatoire:
- Middleware `auth.api` sur routes protégées.
- Vérification token en base + expiration (`api_tokens.expires_at`).

2. Contrôle d'accès RBAC:
- Middleware `role` (`admin`, `supplier`, `delivery`, `client`).
- Policies métier pour commandes (supplier/delivery/client scope).

3. Rate limiting:
- `POST /api/login` -> `throttle:10,1`
- `POST /api/auth/activate` -> `throttle:5,1`

4. Invalidation token logout:
- `POST /api/logout` supprime le token courant en base.

5. HTTPS prod:
- `AppServiceProvider` force HTTPS si `FORCE_HTTPS=true`.
- cookie session secure via `SESSION_SECURE_COOKIE=true`.

6. CORS durci en production:
- whitelist contrôlée via `CORS_ALLOWED_ORIGINS`.

7. Preuves de livraison protégées:
- upload possible dans `storage/app/private/delivery-proofs`.
- accès API contrôlé par rôle/policy via `GET /api/orders/{id}/proof-photo`.

8. Réponses d'erreur standardisées:
- shape unifiée `success=false`, `message`, `error.code`, `error.status`.

## CSRF

L'API utilise un schéma stateless `Bearer token` (pas de cookie session pour auth API),
donc CSRF n'est pas le vecteur principal sur ces endpoints.
Pour les routes web session/cookies, garder CSRF activé (middleware web).

## Variables .env sécurité recommandées

```env
APP_ENV=production
APP_DEBUG=false
FORCE_HTTPS=true
SESSION_SECURE_COOKIE=true
CORS_ALLOWED_ORIGINS=https://admin.ashop-sisma.com,https://supplier.ashop-sisma.com,https://delivery.ashop-sisma.com,https://ashop-sisma.com
```
