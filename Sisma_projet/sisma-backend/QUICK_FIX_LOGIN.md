# 🔧 Correction rapide erreur 500 - Login

## ✅ Corrections effectuées

1. **Vérification sécurisée des propriétés** - Utilise `property_exists()` au lieu de `isset()`
2. **Gestion robuste du token** - Fallback si `createApiToken()` échoue
3. **Logs détaillés** - Affiche le fichier et la ligne de l'erreur

## 🔍 Pour voir l'erreur exacte

### Option 1 : Activer le debug
Dans `.env` :
```
APP_DEBUG=true
```

### Option 2 : Vérifier les logs
```bash
tail -f storage/logs/laravel.log
```

### Option 3 : Exécuter le script de diagnostic
```bash
php check-admin.php
```

## ✅ Vérifications nécessaires

1. **Migrations exécutées** :
   ```bash
   php artisan migrate
   ```

2. **Admin existe** :
   ```bash
   php artisan tinker
   ```
   ```php
   use App\User;
   $admin = User::where('email', 'admin@fashop.com')->first();
   $admin; // Doit afficher l'admin
   ```

3. **Colonnes role et is_active existent** :
   ```php
   $admin->role; // Doit être 'admin'
   $admin->is_active; // Doit être 1 ou true
   ```

## 🚀 Test

Après vérifications, testez la connexion. Si l'erreur persiste, activez `APP_DEBUG=true` pour voir l'erreur exacte.

