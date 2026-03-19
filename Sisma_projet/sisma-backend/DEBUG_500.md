# 🔧 Débogage erreur 500 - Login

## ❌ Erreur
```
POST http://localhost:8000/api/auth/login
[HTTP/1.1 500 Internal Server Error]
```

## 🔍 Causes possibles

1. **Table api_tokens n'existe pas** - Les migrations n'ont pas été exécutées
2. **Modèle ApiToken** - Problème de référence
3. **Admin n'existe pas** - L'utilisateur admin n'a pas été créé

## ✅ Solutions

### 1. Vérifier les migrations

```bash
php artisan migrate
```

Assurez-vous que la table `api_tokens` existe.

### 2. Vérifier que l'admin existe

```bash
php artisan tinker
```

Puis :
```php
use App\User;
User::where('email', 'admin@fashop.com')->first();
```

Si null, créez l'admin :
```php
User::create(['name' => 'Admin', 'email' => 'admin@fashop.com', 'password' => bcrypt('admin123'), 'role' => 'admin', 'is_active' => true]);
```

### 3. Vérifier les logs

Les logs sont dans : `storage/logs/laravel.log`

```bash
tail -f storage/logs/laravel.log
```

### 4. Activer le mode debug

Dans `.env` :
```
APP_DEBUG=true
```

Cela affichera l'erreur exacte.

## 🧪 Test rapide

Testez avec curl pour voir l'erreur exacte :

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fashop.com","password":"admin123"}'
```

