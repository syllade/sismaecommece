<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;
use PDOException;

class CreateDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:create';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Créer la base de données si elle n\'existe pas';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $dbConnection = config('database.default');
        $dbConfig = config("database.connections.$dbConnection");
        
        $dbHost = $dbConfig['host'];
        $dbPort = isset($dbConfig['port']) ? $dbConfig['port'] : 3306;
        $dbDatabase = $dbConfig['database'];
        $dbUsername = $dbConfig['username'];
        $dbPassword = $dbConfig['password'];
        
        $this->info("========================================");
        $this->info("Création de la base de données Fashop");
        $this->info("========================================");
        $this->line("");
        
        $this->info("Configuration:");
        $this->line("  Connexion: $dbConnection");
        $this->line("  Hôte: $dbHost:$dbPort");
        $this->line("  Base de données: $dbDatabase");
        $this->line("  Utilisateur: $dbUsername");
        $this->line("");
        
        try {
            // Créer une connexion sans spécifier la base de données
            $dsn = "mysql:host=$dbHost;port=$dbPort;charset=utf8mb4";
            $pdo = new PDO($dsn, $dbUsername, $dbPassword);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Créer la base de données
            $sql = "CREATE DATABASE IF NOT EXISTS `$dbDatabase` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
            $pdo->exec($sql);
            
            $this->info("✓ Base de données '$dbDatabase' créée avec succès!");
            $this->line("");
            $this->info("Vous pouvez maintenant exécuter:");
            $this->line("  php artisan migrate");
            $this->line("");
            
            return 0;
            
        } catch (PDOException $e) {
            $this->error("✗ Erreur: " . $e->getMessage());
            $this->line("");
            $this->warn("Solutions alternatives:");
            $this->line("1. Créez la base de données via phpMyAdmin:");
            $this->line("   http://localhost/phpmyadmin");
            $this->line("   Nom: $dbDatabase");
            $this->line("   Interclassement: utf8mb4_unicode_ci");
            $this->line("");
            $this->line("2. Utilisez MySQL Workbench ou un autre client MySQL");
            $this->line("");
            
            return 1;
        }
    }
}

