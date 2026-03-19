<?php
// Script pour ajouter la route dashboard manquante
$file = file_get_contents('routes/api.php');

// Chercher la section admin et ajouter la route dashboard
$search = "    \$router->group(['prefix' => 'admin', 'middleware' => 'role:admin'], function (\$router) {\n        \n        // Dashboard & Analytics";
$replace = "    \$router->group(['prefix' => 'admin', 'middleware' => 'role:admin'], function (\$router) {\n        \n        // Dashboard - route principale\n        \$router->get('dashboard', 'Api\\AnalyticsController@dashboardStats');\n        \n        // Dashboard & Analytics";

if (strpos($file, $search) !== false) {
    $file = str_replace($search, $replace, $file);
    file_put_contents('routes/api.php', $file);
    echo "Route dashboard ajoutée avec succès!";
} else {
    // Essayer une autre recherche
    $search2 = "    \$router->group(['prefix' => 'admin', 'middleware' => 'role:admin'], function (\$router) {\n        \n        // Dashboard & Analytics";
    if (strpos($file, $search2) !== false) {
        $file = str_replace($search2, $replace, $file);
        file_put_contents('routes/api.php', $file);
        echo "Route dashboard ajoutée avec succès (tentative 2)!";
    } else {
        echo "Pattern non trouvé. Recherche manuelle nécessaire.";
    }
}
