<?php

/**
 * Quick fix to mark all new migrations as run
 * Run: php fix-migrations.php
 */

$db_host = '127.0.0.1';
$db_name = 'fashop_db';
$db_user = 'root';
$db_pass = '';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $migrations = [
        '2026_02_26_000001_create_marketing_campaigns_table',
        '2026_02_26_000002_create_delivery_zones_table',
        '2026_02_26_000003_create_notification_templates_table',
        '2026_02_26_000003_create_product_variants_table',
        '2026_02_26_000004_create_category_fields_table',
        '2026_02_26_000004_create_supplier_commissions_table',
        '2026_02_26_000005_add_zone_to_delivery_persons_table',
        '2026_02_26_000006_create_security_and_tracking_tables',
        '2026_02_26_000007_create_rate_limits_table',
        '2026_02_26_000008_softdeletes_and_wallet',
        '2026_02_26_000009_activity_and_ai_logs',
        '2026_02_26_000010_zero_trust_security',
        '2026_02_26_000011_mobile_app_support',
    ];
    
    $batch = 999;
    
    foreach ($migrations as $migration) {
        // Check if already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM migrations WHERE migration = ?");
        $stmt->execute([$migration]);
        $exists = $stmt->fetchColumn();
        
        if (!$exists) {
            $stmt = $pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
            $stmt->execute([$migration, $batch]);
            echo "Added: $migration\n";
        } else {
            echo "Already exists: $migration\n";
        }
    }
    
    echo "\nDone! All migrations marked as run.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "\nUsage: Edit this file to set correct DB credentials.\n";
}
