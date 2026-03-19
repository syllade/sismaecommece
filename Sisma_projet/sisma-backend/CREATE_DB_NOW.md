# Créer la base de données MAINTENANT

## ⚡ Méthode la plus rapide : phpMyAdmin

1. **Assurez-vous que XAMPP est démarré**
   - Ouvrez le Panneau de Contrôle XAMPP
   - Démarrez Apache et MySQL

2. **Ouvrez phpMyAdmin**
   - Allez sur : http://localhost/phpmyadmin
   - Connectez-vous (généralement pas de mot de passe pour root)

3. **Créez la base de données**
   - Cliquez sur "Nouvelle base de données" dans le menu de gauche
   - **Nom de la base de données** : `fashop_db`
   - **Interclassement** : `utf8mb4_unicode_ci`
   - Cliquez sur "Créer"

4. **Exécutez les migrations**
   ```bash
   php artisan migrate
   ```

---

## 🔧 Méthode alternative : Ligne de commande MySQL

Si vous êtes dans Git Bash ou PowerShell, utilisez le chemin complet :

```bash
# Dans Git Bash ou PowerShell
C:/xampp/mysql/bin/mysql.exe -u root -p
```

Puis dans MySQL :
```sql
CREATE DATABASE fashop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

## ✅ Vérification

Après avoir créé la base de données, vérifiez qu'elle existe :

```bash
C:/xampp/mysql/bin/mysql.exe -u root -p -e "SHOW DATABASES;"
```

Vous devriez voir `fashop_db` dans la liste.

---

## 🚀 Après la création

Une fois la base créée, exécutez :

```bash
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
```

**Identifiants admin par défaut :**
- Email : `admin@fashop.com`
- Password : `admin123`

⚠️ **Changez le mot de passe après la première connexion !**

