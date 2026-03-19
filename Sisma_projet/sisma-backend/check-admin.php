<?php
/**
 * Script de vérification rapide de l'admin
 * Usage: php check-admin.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "========================================\n";
echo "VÉRIFICATION ADMIN\n";
echo "========================================\n\n";

try {
    $admin = App\User::where('email', 'admin@fashop.com')->first();
    
    if ($admin) {
        echo "✓ Admin trouvé!\n";
        echo "  ID: " . $admin->id . "\n";
        echo "  Name: " . $admin->name . "\n";
        echo "  Email: " . $admin->email . "\n";
        echo "  Role: " . $admin->role . "\n";
        echo "  Is Active: " . ($admin->is_active ? 'Oui' : 'Non') . "\n";
        echo "\n";
        
        // Test du mot de passe
        if (\Illuminate\Support\Facades\Hash::check('admin123', $admin->password)) {
            echo "✓ Mot de passe correct!\n";
        } else {
            echo "✗ Mot de passe incorrect!\n";
        }
        
        // Test isAdmin
        if ($admin->isAdmin()) {
            echo "✓ isAdmin() retourne true\n";
        } else {
            echo "✗ isAdmin() retourne false\n";
        }
    } else {
        echo "✗ Admin non trouvé!\n";
        echo "\n";
        echo "Créez l'admin avec:\n";
        echo "  php artisan tinker\n";
        echo "  use App\User;\n";
        echo "  User::create(['name' => 'Admin', 'email' => 'admin@fashop.com', 'password' => bcrypt('admin123'), 'role' => 'admin', 'is_active' => true]);\n";
    }
    
    // Vérifier la table api_tokens
    echo "\n";
    echo "Vérification table api_tokens...\n";
    try {
        $tokens = \Illuminate\Support\Facades\DB::table('api_tokens')->count();
        echo "✓ Table api_tokens existe (" . $tokens . " tokens)\n";
    } catch (\Exception $e) {
        echo "✗ Table api_tokens n'existe pas!\n";
        echo "  Exécutez: php artisan migrate\n";
    }
    
} catch (\Exception $e) {
    echo "✗ Erreur: " . $e->getMessage() . "\n";
    echo "  Fichier: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n========================================\n";

