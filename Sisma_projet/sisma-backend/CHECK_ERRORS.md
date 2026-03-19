# 🔍 Vérification des erreurs 500

## Pour voir l'erreur exacte

### Option 1 : Console du navigateur
1. Ouvrez F12
2. Allez dans Network
3. Cliquez sur la requête qui échoue (POST /api/admin/products ou /api/admin/categories)
4. Allez dans l'onglet Response
5. Copiez le message d'erreur exact

### Option 2 : Logs Laravel
```bash
tail -f storage/logs/laravel.log
```

### Option 3 : Vérifier les tables
```bash
php artisan tinker
```

Puis :
```php
use App\Models\Category;
use App\Models\Product;

// Vérifier si les tables existent
Category::count();
Product::count();
```

## Erreurs courantes

1. **Table n'existe pas** → Exécutez `php artisan migrate`
2. **Colonne manquante** → Vérifiez les migrations
3. **Relation échoue** → Vérifiez les modèles
4. **Validation échoue** → Vérifiez les règles de validation

## Test rapide

Testez la création directement dans tinker :
```php
use App\Models\Category;
Category::create(['name' => 'Test', 'is_active' => true]);
```

Si ça fonctionne dans tinker mais pas via l'API, c'est un problème de validation ou de format de données.

