# 👤 Créer l'admin avec Tinker

## 📋 Étapes

### 1. Ouvrir Tinker
```bash
php artisan tinker
```

### 2. Copier-coller ce code dans Tinker :

```php
use App\User;

// Vérifier si l'admin existe déjà
$existingAdmin = User::where('email', 'admin@fashop.com')->first();

if ($existingAdmin) {
    echo "L'admin existe déjà!\n";
    echo "Email: " . $existingAdmin->email . "\n";
    echo "Role: " . $existingAdmin->role . "\n";
} else {
    // Créer l'admin
    $admin = User::create([
        'name' => 'Admin',
        'email' => 'admin@fashop.com',
        'password' => bcrypt('admin123'),
        'role' => 'admin',
        'is_active' => true,
    ]);
    
    echo "Admin créé avec succès!\n";
    echo "Email: " . $admin->email . "\n";
    echo "Password: admin123\n";
}
```

### 3. Vérifier que l'admin existe

```php
$admin = User::where('email', 'admin@fashop.com')->first();
$admin;
```

Vous devriez voir les informations de l'admin.

### 4. Vérifier le rôle

```php
$admin = User::where('email', 'admin@fashop.com')->first();
$admin->role;
```

Devrait afficher : `"admin"`

### 5. Quitter Tinker

```php
exit
```

ou appuyez sur `Ctrl+C`

## 🔐 Identifiants

- **Email** : `admin@fashop.com`
- **Password** : `admin123`

## ⚠️ Important

Changez le mot de passe après la première connexion !

