# 👤 Créer l'admin dans Tinker - Guide étape par étape

## 📋 Étapes à suivre dans Tinker

### Étape 1 : Ouvrir Tinker
```bash
php artisan tinker
```

### Étape 2 : Importer la classe User
```php
use App\User;
```

**Important** : Vous devez faire cette commande AVANT d'utiliser User.

### Étape 3 : Vérifier si l'admin existe déjà
```php
$existing = User::where('email', 'admin@fashop.com')->first();
```

Si ça retourne `null`, l'admin n'existe pas.

### Étape 4 : Créer l'admin
```php
$admin = User::create([
    'name' => 'Admin',
    'email' => 'admin@fashop.com',
    'password' => bcrypt('admin123'),
    'role' => 'admin',
    'is_active' => true,
]);
```

### Étape 5 : Vérifier la création
```php
echo "Admin créé!\n";
echo "Email: " . $admin->email . "\n";
echo "Role: " . $admin->role . "\n";
```

### Étape 6 : Vérifier à nouveau
```php
User::where('email', 'admin@fashop.com')->first();
```

Vous devriez voir l'utilisateur admin.

## 🔄 Code complet (copier-coller)

```php
use App\User;

$existing = User::where('email', 'admin@fashop.com')->first();

if ($existing) {
    echo "L'admin existe deja!\n";
    echo "Email: " . $existing->email . "\n";
    echo "Role: " . $existing->role . "\n";
} else {
    $admin = User::create([
        'name' => 'Admin',
        'email' => 'admin@fashop.com',
        'password' => bcrypt('admin123'),
        'role' => 'admin',
        'is_active' => true,
    ]);
    
    echo "Admin cree avec succes!\n";
    echo "Email: " . $admin->email . "\n";
    echo "Password: admin123\n";
    echo "Role: " . $admin->role . "\n";
}
```

## 🔐 Identifiants

- **Email** : `admin@fashop.com`
- **Password** : `admin123`

## ⚠️ Important

1. **Toujours commencer par** `use App\User;`
2. **Ensuite** vous pouvez utiliser `User::` directement
3. **Ne pas utiliser** `\App\User::` avec le backslash

