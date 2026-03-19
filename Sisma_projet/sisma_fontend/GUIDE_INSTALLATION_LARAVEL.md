# 🚀 Guide d'Installation - Backend Laravel pour Fashop

## 📋 Prérequis

Pour créer le backend Laravel, vous devez installer :

1. **PHP 8.1 ou supérieur**
2. **Composer** (gestionnaire de dépendances PHP)
3. **MySQL/PostgreSQL** (base de données)
4. **Laravel** (framework PHP)

---

## 🪟 Installation sur Windows

### Option 1 : Laragon (RECOMMANDÉ - Plus simple)

**Laragon** est un environnement de développement tout-en-un pour Windows.

#### Étapes :

1. **Télécharger Laragon**
   - Aller sur : https://laragon.org/download/
   - Télécharger la version "Full" (inclut PHP, MySQL, Composer, etc.)

2. **Installer Laragon**
   - Exécuter l'installateur
   - Suivre les instructions
   - Laragon installe automatiquement :
     * PHP 8.2
     * MySQL
     * Composer
     * Git
     * Node.js (optionnel)

3. **Vérifier l'installation**
   - Ouvrir Laragon
   - Cliquer sur "Start All"
   - Ouvrir un terminal dans Laragon
   - Taper : `php -v` (doit afficher la version PHP)
   - Taper : `composer -V` (doit afficher la version Composer)

4. **Créer le projet Laravel**
   ```bash
   cd C:\Users\ACER\Desktop\Fashop-E-commerce
   composer create-project laravel/laravel server
   ```

---

### Option 2 : Installation manuelle

#### 1. Installer PHP

**Méthode A : Via XAMPP**
1. Télécharger XAMPP : https://www.apachefriends.org/
2. Installer XAMPP
3. Ajouter PHP au PATH :
   - Copier le chemin : `C:\xampp\php`
   - Ajouter aux variables d'environnement Windows

**Méthode B : Via php.net**
1. Télécharger PHP : https://windows.php.net/download/
2. Extraire dans `C:\php`
3. Ajouter `C:\php` au PATH Windows

#### 2. Installer Composer

1. Télécharger Composer : https://getcomposer.org/download/
2. Télécharger `Composer-Setup.exe`
3. Exécuter l'installateur
4. Vérifier : `composer -V`

#### 3. Installer MySQL

1. Télécharger MySQL : https://dev.mysql.com/downloads/installer/
2. Installer MySQL Community Server
3. Noter le mot de passe root

---

## 🎯 Créer le projet Laravel

Une fois PHP et Composer installés :

```bash
# Naviguer vers le dossier du projet
cd C:\Users\ACER\Desktop\Fashop-E-commerce\Fashop-E-commerce

# Créer le projet Laravel dans un dossier "server"
composer create-project laravel/laravel server

# Ou si vous préférez un autre nom
composer create-project laravel/laravel backend
```

---

## 📦 Configuration du projet Laravel

### 1. Configuration de la base de données

Éditer `.env` dans le dossier `server/` :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fashop_db
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe
```

### 2. Créer la base de données

```sql
CREATE DATABASE fashop_db;
```

### 3. Créer les migrations

Créer les migrations basées sur `shared/schema.ts` :

```bash
cd server
php artisan make:migration create_categories_table
php artisan make:migration create_products_table
php artisan make:migration create_orders_table
php artisan make:migration create_order_items_table
php artisan make:migration create_site_settings_table
php artisan make:migration create_testimonials_table
```

### 4. Exécuter les migrations

```bash
php artisan migrate
```

---

## 🔌 Créer les API Endpoints

### Contrôleurs

```bash
php artisan make:controller Api/ProductController --api
php artisan make:controller Api/CategoryController --api
php artisan make:controller Api/OrderController --api
php artisan make:controller Api/TestimonialController --api
php artisan make:controller Api/SettingController --api
php artisan make:controller Api/AnalyticsController
```

### Routes API

Dans `routes/api.php` :

```php
Route::prefix('api')->group(function () {
    Route::apiResource('products', ProductController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('testimonials', TestimonialController::class);
    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings/{key}', [SettingController::class, 'update']);
    Route::get('analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('analytics/sales', [AnalyticsController::class, 'sales']);
});
```

---

## 🔐 Authentification Admin

### Option 1 : Sanctum (Laravel)

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### Option 2 : Simple Auth

Créer un système d'authentification simple avec sessions.

---

## 🚀 Démarrer le serveur Laravel

```bash
cd server
php artisan serve
```

Le serveur sera accessible sur : `http://localhost:8000`

---

## 📝 Notes importantes

1. **CORS** : Configurer CORS pour permettre les requêtes depuis le frontend React
   - Dans `config/cors.php`
   - Autoriser l'origine du frontend

2. **Validation** : Utiliser les Form Requests Laravel pour la validation

3. **Relations** : Définir les relations Eloquent dans les modèles

4. **API Resources** : Utiliser les API Resources pour formater les réponses

---

## ✅ Checklist

- [ ] PHP installé et dans le PATH
- [ ] Composer installé
- [ ] MySQL installé et configuré
- [ ] Projet Laravel créé
- [ ] Base de données créée
- [ ] Migrations créées et exécutées
- [ ] Contrôleurs créés
- [ ] Routes API configurées
- [ ] CORS configuré
- [ ] Serveur Laravel fonctionne

---

## 🆘 Dépannage

### Composer non trouvé
- Vérifier que Composer est dans le PATH
- Redémarrer le terminal après installation

### PHP non trouvé
- Vérifier que PHP est dans le PATH
- Redémarrer le terminal

### Erreur de connexion MySQL
- Vérifier que MySQL est démarré
- Vérifier les credentials dans `.env`

---

**Recommandation :** Utiliser **Laragon** pour une installation plus simple et rapide sur Windows.

