# 👤 Créer l'admin - Version une ligne (PHP 5.5.12)

## ⚠️ Problème avec les tableaux multilignes dans Tinker

Dans PHP 5.5.12 avec Tinker, les tableaux multilignes peuvent causer des erreurs. Utilisez une syntaxe en une ligne.

## 📋 Solution : Code en une ligne

Dans Tinker, tapez :

```php
use App\User;
```

Puis :

```php
User::create(['name' => 'Admin', 'email' => 'admin@fashop.com', 'password' => bcrypt('admin123'), 'role' => 'admin', 'is_active' => true]);
```

## 📋 Alternative : Avec variable

```php
use App\User;

$data = ['name' => 'Admin', 'email' => 'admin@fashop.com', 'password' => bcrypt('admin123'), 'role' => 'admin', 'is_active' => true];
User::create($data);
```

## 📋 Alternative : Méthode updateOrCreate

```php
use App\User;

User::updateOrCreate(['email' => 'admin@fashop.com'], ['name' => 'Admin', 'password' => bcrypt('admin123'), 'role' => 'admin', 'is_active' => true]);
```

## ✅ Vérification

```php
User::where('email', 'admin@fashop.com')->first();
```

## 🔐 Identifiants

- Email : `admin@fashop.com`
- Password : `admin123`

