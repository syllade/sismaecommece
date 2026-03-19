# 🔧 Correction du problème AdminUserSeeder

## Problème
```
[ReflectionException]
Class AdminUserSeeder does not exist
```

## Solution

Le fichier existe mais l'autoloader de Composer n'a pas été régénéré.

### Étape 1 : Régénérer l'autoloader

```bash
cd fashop-backend
composer dump-autoload
```

### Étape 2 : Exécuter le seeder

```bash
php artisan db:seed --class=AdminUserSeeder
```

## Alternative : Utiliser DatabaseSeeder

Si le problème persiste, vous pouvez utiliser :

```bash
php artisan db:seed
```

Cela exécutera tous les seeders, y compris AdminUserSeeder via DatabaseSeeder.

## Vérification

Après avoir exécuté le seeder, vérifiez que l'admin existe :

```bash
php artisan tinker
```

Puis dans tinker :
```php
User::where('email', 'admin@fashop.com')->first();
```

Vous devriez voir l'utilisateur admin avec `role = 'admin'`.

