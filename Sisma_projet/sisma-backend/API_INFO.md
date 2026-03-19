# 📡 API Fashop - Informations

## 🌐 Accès

- **Base URL** : `http://localhost:8000`
- **API Base URL** : `http://localhost:8000/api`
- **Page d'accueil** : `http://localhost:8000/` (affiche les endpoints disponibles)

## 🔐 Authentification

L'API utilise un système de tokens Bearer.

### Connexion
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@fashop.com",
  "password": "admin123"
}
```

Réponse :
```json
{
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@fashop.com",
    "role": "admin"
  },
  "token": "abc123...",
  "token_type": "Bearer"
}
```

### Utiliser le token
```bash
GET /api/auth/me
Authorization: Bearer {token}
```

## 📋 Endpoints disponibles

### 🔓 Publiques (sans authentification)

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/products` - Liste des produits
- `GET /api/products/{slug}` - Détails produit
- `GET /api/categories` - Liste des catégories
- `GET /api/testimonials` - Liste des témoignages
- `GET /api/settings` - Paramètres
- `POST /api/orders` - Créer une commande

### 🔒 Protégées (authentification requise)

- `GET /api/auth/me` - Utilisateur connecté
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh` - Rafraîchir token

### 👑 Admin (auth + admin)

- `GET /api/admin/products` - Liste produits (admin)
- `POST /api/admin/products` - Créer produit
- `PUT /api/admin/products/{id}` - Modifier produit
- `DELETE /api/admin/products/{id}` - Supprimer produit
- `GET /api/admin/categories` - Liste catégories (admin)
- `GET /api/admin/orders` - Liste commandes
- `GET /api/admin/analytics/dashboard` - Statistiques dashboard
- Etc.

## 🧪 Test rapide

```bash
# Test de connexion
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fashop.com","password":"admin123"}'

# Test de la page d'accueil
curl http://localhost:8000/
```

## ✅ Statut

Le serveur est opérationnel si vous voyez la page d'accueil avec les endpoints listés.

