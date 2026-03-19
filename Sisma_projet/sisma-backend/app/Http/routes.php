<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('/', function () {
    return response()->json([
        'message' => 'Bienvenue sur l\'API Fashop',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => [
                'POST /api/auth/login' => 'Connexion',
                'POST /api/auth/register' => 'Inscription',
                'GET /api/auth/me' => 'Utilisateur connecté (auth requis)',
                'POST /api/auth/logout' => 'Déconnexion (auth requis)',
            ],
            'products' => [
                'GET /api/products' => 'Liste des produits (public)',
                'GET /api/products/{slug}' => 'Détails produit (public)',
                'GET /api/admin/products' => 'Liste produits (admin)',
                'POST /api/admin/products' => 'Créer produit (admin)',
            ],
            'categories' => [
                'GET /api/categories' => 'Liste des catégories (public)',
            ],
            'orders' => [
                'POST /api/orders' => 'Créer une commande (public)',
                'GET /api/admin/orders' => 'Liste des commandes (admin)',
            ],
            'testimonials' => [
                'GET /api/testimonials' => 'Liste des témoignages (public)',
            ],
            'settings' => [
                'GET /api/settings' => 'Paramètres (public)',
            ],
        ],
        'documentation' => 'Consultez les fichiers README.md pour plus d\'informations',
    ], 200, [
        'Content-Type' => 'application/json',
    ]);
});
