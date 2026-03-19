# 🚀 Guide de démarrage rapide - Fashop

## ✅ Configuration terminée !

Tout est prêt pour vous connecter à votre admin et utiliser votre application.

## 📋 Étapes finales (2 minutes)

### 1. Exécuter la migration pour les tokens API

```bash
cd fashop-backend
php artisan migrate
```

### 2. Créer l'utilisateur admin

```bash
php artisan db:seed --class=AdminUserSeeder
```

### 3. Démarrer le serveur Laravel

```bash
php artisan serve
```

Le serveur sera sur : **http://localhost:8000**

### 4. Démarrer le frontend admin (nouveau terminal)

```bash
cd admin
npm run dev
```

Le frontend sera sur : **http://localhost:5173**

## 🔐 Connexion Admin

1. Ouvrez : **http://localhost:5173/login**
2. Identifiants :
   - **Email** : `admin@fashop.com`
   - **Password** : `admin123`

## 🎯 Ce qui fonctionne maintenant

### ✅ Backend Laravel
- Authentification avec tokens API
- Toutes les routes API configurées
- Tous les contrôleurs fonctionnels
- Middleware admin opérationnel

### ✅ Frontend Admin
- Page de login connectée au vrai API
- Tous les hooks connectés à Laravel
- Gestion des tokens automatique
- Redirection automatique si non authentifié

### ✅ Frontend Client
- Affichage des produits depuis l'API
- Affichage des catégories depuis l'API
- Création de commandes fonctionnelle
- Témoignages depuis l'API

## 🔗 URLs importantes

- **API Laravel** : http://localhost:8000/api
- **Admin Frontend** : http://localhost:5173
- **Client Frontend** : (à démarrer séparément si nécessaire)

## 🧪 Tester l'API

```bash
# Test de connexion
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fashop.com","password":"admin123"}'
```

Vous devriez recevoir un token !

## ⚠️ Important

- Changez le mot de passe admin après la première connexion
- Configurez CORS si vous avez des problèmes de connexion
- Vérifiez que MySQL est démarré dans XAMPP

**Tout est prêt ! 🎉**

