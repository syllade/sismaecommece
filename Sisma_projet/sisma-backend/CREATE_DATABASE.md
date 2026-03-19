# Guide de création de la base de données Fashop

## Option 1: Créer la base de données via MySQL (Recommandé)

### Étape 1: Accéder à MySQL

**Via ligne de commande:**
```bash
mysql -u root -p
```

**Via phpMyAdmin:**
- Ouvrez http://localhost/phpmyadmin
- Connectez-vous avec vos identifiants MySQL

### Étape 2: Créer la base de données

**Via ligne de commande MySQL:**
```sql
CREATE DATABASE fashop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Via phpMyAdmin:**
1. Cliquez sur "Nouvelle base de données"
2. Nom: `fashop_db`
3. Interclassement: `utf8mb4_unicode_ci`
4. Cliquez sur "Créer"

### Étape 3: Configurer le fichier .env

Ouvrez le fichier `.env` dans le dossier `fashop-backend` et modifiez ces lignes:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fashop_db
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe_mysql
```

**Remplacez:**
- `DB_DATABASE` par le nom de votre base de données (ex: `fashop_db`)
- `DB_USERNAME` par votre nom d'utilisateur MySQL (généralement `root`)
- `DB_PASSWORD` par votre mot de passe MySQL

### Étape 4: Générer la clé d'application

```bash
php artisan key:generate
```

### Étape 5: Exécuter les migrations

```bash
php artisan migrate
```

Cela créera toutes les tables dans votre base de données.

---

## Option 2: Créer la base de données via script SQL

1. Ouvrez le fichier `database/create_database.sql`
2. Exécutez-le dans votre client MySQL
3. Suivez les étapes 3, 4 et 5 ci-dessus

---

## Option 3: Utiliser PostgreSQL

Si vous préférez PostgreSQL, modifiez le `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fashop_db
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
```

Puis créez la base de données:
```sql
CREATE DATABASE fashop_db;
```

---

## Vérification

Après avoir exécuté les migrations, vous devriez avoir ces tables:
- ✅ users
- ✅ categories
- ✅ products
- ✅ orders
- ✅ order_items
- ✅ testimonials
- ✅ settings
- ✅ password_resets

---

## Créer un utilisateur admin

Après les migrations, créez un utilisateur admin:

```bash
php artisan tinker
```

Puis dans tinker:
```php
use App\User;
User::create([
    'name' => 'Admin',
    'email' => 'admin@fashop.com',
    'password' => bcrypt('admin123'),
    'role' => 'admin',
    'is_active' => true
]);
```

Ou créez un seeder (voir `database/seeds/AdminUserSeeder.php`)

---

## Problèmes courants

### Erreur: "Access denied for user"
- Vérifiez vos identifiants dans le fichier `.env`
- Assurez-vous que MySQL est démarré

### Erreur: "Unknown database"
- Créez d'abord la base de données manuellement
- Vérifiez le nom dans `.env`

### Erreur: "Class 'PDO' not found"
- Installez l'extension PHP PDO: `sudo apt-get install php-mysql` (Linux)
- Activez l'extension dans `php.ini`

