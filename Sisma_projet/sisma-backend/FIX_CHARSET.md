# 🔧 Correction du problème de charset MySQL

## ❌ Erreur
```
SQLSTATE[HY000] [2054] Server sent charset unknown to the client
PDO::__construct(): Server sent charset (255) unknown to the client
```

## 🔍 Cause
PHP 5.5.12 ne reconnaît pas le charset `utf8mb4` envoyé par MySQL moderne. Il faut forcer l'utilisation de `utf8` lors de la connexion.

## ✅ Solution
Ajout d'options PDO dans `config/database.php` pour forcer le charset `utf8` lors de la connexion.

## 🚀 Test
Après la correction, essayez :
```bash
php artisan migrate
```

## 📝 Note
Si le problème persiste, vous pouvez aussi :
1. Vérifier la version de MySQL
2. Mettre à jour PHP vers une version plus récente (recommandé)
3. Ou configurer MySQL pour utiliser `utf8` par défaut

