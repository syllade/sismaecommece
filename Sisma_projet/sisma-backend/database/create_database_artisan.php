<?php

/**
 * Script Artisan pour créer la base de données
 * 
 * Utilisation: php artisan db:create
 * 
 * Ce script lit la configuration depuis .env et crée la base de données
 */

require __DIR__.'/../../vendor/autoload.php';

$app = require_once __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Lire la configuration depuis .env
$dbConnection = env('DB_CONNECTION', 'mysql');
$dbHost = env('DB_HOST', '127.0.0.1');
$dbPort = env('DB_PORT', '3306');
$dbDatabase = env('DB_DATABASE', 'fashop_db');
$dbUsername = env('DB_USERNAME', 'root');
$dbPassword = env('DB_PASSWORD', '');

echo "========================================\n";
echo "Création de la base de données Fashop\n";
echo "========================================\n\n";

echo "Configuration:\n";
echo "  Connexion: $dbConnection\n";
echo "  Hôte: $dbHost:$dbPort\n";
echo "  Base de données: $dbDatabase\n";
echo "  Utilisateur: $dbUsername\n\n";

try {
    // Créer une connexion sans spécifier la base de données
    $dsn = "$dbConnection:host=$dbHost;port=$dbPort;charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUsername, $dbPassword);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Créer la base de données
    $sql = "CREATE DATABASE IF NOT EXISTS `$dbDatabase` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    $pdo->exec($sql);
    
    echo "✓ Base de données '$dbDatabase' créée avec succès!\n\n";
    echo "Vous pouvez maintenant exécuter:\n";
    echo "  php artisan migrate\n\n";
    
} catch (PDOException $e) {
    echo "✗ Erreur: " . $e->getMessage() . "\n\n";
    echo "Solutions alternatives:\n";
    echo "1. Créez la base de données via phpMyAdmin:\n";
    echo "   http://localhost/phpmyadmin\n";
    echo "   Nom: $dbDatabase\n";
    echo "   Interclassement: utf8mb4_unicode_ci\n\n";
    echo "2. Utilisez MySQL Workbench ou un autre client MySQL\n\n";
    exit(1);
}

