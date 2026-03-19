# 🧪 Test de connexion admin

## ✅ Configuration vérifiée

1. **Route API** : `POST /api/auth/login` ✅
2. **Contrôleur** : `AuthController@login` ✅
3. **Middleware CORS** : Configuré ✅
4. **Frontend** : Envoie vers `http://localhost:8000/api/auth/login` ✅

## 🔐 Identifiants de test

- **Email** : `admin@fashop.com`
- **Password** : `admin123`

## 📋 Étapes pour tester

### 1. Vérifier que l'admin existe

```bash
cd fashop-backend
php artisan tinker
```

Puis dans tinker :
```php
User::where('email', 'admin@fashop.com')->first();
```

Si l'admin n'existe pas :
```bash
php artisan db:seed --class=AdminUserSeeder
```

### 2. Tester avec curl

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@fashop.com","password":"admin123"}'
```

Réponse attendue :
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

### 3. Tester depuis le frontend

1. Ouvrir : http://localhost:5173/login
2. Entrer les identifiants
3. Vérifier la console du navigateur (F12)
4. Vérifier la réponse de l'API

## 🔍 Dépannage

### Erreur : "Les identifiants sont incorrects"
- Vérifier que l'admin existe dans la base de données
- Vérifier que le mot de passe est bien `admin123`

### Erreur CORS
- Redémarrer le serveur Laravel : `php artisan serve`
- Vérifier que le middleware CORS est dans `Kernel.php`

### Erreur : "Accès refusé. Droits administrateur requis"
- Vérifier que `role = 'admin'` dans la base de données

### Erreur 500
- Vérifier les logs : `storage/logs/laravel.log`
- Vérifier que la table `api_tokens` existe : `php artisan migrate`

## ✅ Succès

Si la connexion fonctionne :
- Vous recevrez un token
- Vous serez redirigé vers `/admin/dashboard`
- Le token sera stocké dans `localStorage`

