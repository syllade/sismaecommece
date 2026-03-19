# 🔧 Commandes Tinker pour créer l'admin

## ⚠️ Problème avec PHP 5.5.12

Dans PHP 5.5.12, certaines syntaxes peuvent causer des erreurs. Utilisez ces commandes :

## 📋 Méthode 1 : Avec use (Recommandé)

```php
use App\User;

User::where('email', 'admin@fashop.com')->first();
```

## 📋 Méthode 2 : Créer l'admin directement

```php
use App\User;

$admin = User::create([
    'name' => 'Admin',
    'email' => 'admin@fashop.com',
    'password' => bcrypt('admin123'),
    'role' => 'admin',
    'is_active' => true,
]);

echo "Admin créé!\n";
```

## 📋 Méthode 3 : Vérifier si existe, puis créer

```php
use App\User;

$existing = User::where('email', 'admin@fashop.com')->first();

if ($existing) {
    echo "Admin existe déjà\n";
    $existing;
} else {
    $admin = User::create([
        'name' => 'Admin',
        'email' => 'admin@fashop.com',
        'password' => bcrypt('admin123'),
        'role' => 'admin',
        'is_active' => true,
    ]);
    echo "Admin créé!\n";
    $admin;
}
```

## 📋 Méthode 4 : Sans use (si use ne fonctionne pas)

```php
$user = new App\User();
$admin = $user->where('email', 'admin@fashop.com')->first();
$admin;
```

## ✅ Vérification après création

```php
use App\User;

$admin = User::where('email', 'admin@fashop.com')->first();
$admin->name;
$admin->email;
$admin->role;
```

## 🔐 Identifiants

- Email : `admin@fashop.com`
- Password : `admin123`

