<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $products = [
            // Category 1 - Fashion
            ['name' => 'T-shirt Blanc Coton', 'price' => 5000, 'stock' => 50, 'category_id' => 1, 'supplier_id' => 2, 'description' => 'T-shirt en coton blanc de qualité supérieure', 'is_active' => 1],
            ['name' => 'Jean Slim Bleu', 'price' => 12000, 'stock' => 30, 'category_id' => 1, 'supplier_id' => 2, 'description' => 'Jean slim bleu foncé taille haute', 'is_active' => 1],
            ['name' => 'Robe Rouge Élégante', 'price' => 25000, 'stock' => 20, 'category_id' => 1, 'supplier_id' => 2, 'description' => 'Rouge élégante pour soirée', 'is_active' => 1],
            ['name' => 'Veste en Cuir Noir', 'price' => 45000, 'stock' => 15, 'category_id' => 1, 'supplier_id' => 2, 'description' => 'Veste en cuir véritable noir', 'is_active' => 1],
            ['name' => 'Chaussures Sport Blanc', 'price' => 18000, 'stock' => 25, 'category_id' => 1, 'supplier_id' => 2, 'description' => 'Chaussures de sport confortables', 'is_active' => 1],
            
            // Category 2 - Electronics
            ['name' => 'Samsung Galaxy S21', 'price' => 150000, 'stock' => 15, 'category_id' => 2, 'supplier_id' => 3, 'description' => 'Smartphone Samsung Galaxy S21 128GB', 'is_active' => 1],
            ['name' => 'Laptop HP Pavilion', 'price' => 250000, 'stock' => 10, 'category_id' => 2, 'supplier_id' => 3, 'description' => 'Ordinateur portable HP Pavilion 15 pouces', 'is_active' => 1],
            ['name' => 'Casque Audio Bluetooth', 'price' => 25000, 'stock' => 40, 'category_id' => 2, 'supplier_id' => 3, 'description' => 'Casque audio sans fil Bluetooth', 'is_active' => 1],
            ['name' => 'Tablette iPad 10', 'price' => 180000, 'stock' => 8, 'category_id' => 2, 'supplier_id' => 3, 'description' => 'Apple iPad 10ème génération 64GB', 'is_active' => 1],
            ['name' => 'Montre Connectée', 'price' => 35000, 'stock' => 20, 'category_id' => 2, 'supplier_id' => 3, 'description' => 'Montre connectée intelligente', 'is_active' => 1],
            
            // Category 3 - Home & Living
            ['name' => 'Canapé Gris 3 Places', 'price' => 180000, 'stock' => 5, 'category_id' => 3, 'supplier_id' => 4, 'description' => 'Canapé gris moderne 3 places', 'is_active' => 1],
            ['name' => 'Lampe de Bureau LED', 'price' => 12000, 'stock' => 35, 'category_id' => 3, 'supplier_id' => 4, 'description' => 'Lampe de bureau LED adjustable', 'is_active' => 1],
            ['name' => 'Table à Manger Bois', 'price' => 95000, 'stock' => 8, 'category_id' => 3, 'supplier_id' => 4, 'description' => 'Table à manger en bois massif 6 personnes', 'is_active' => 1],
            ['name' => 'Rideaux Occultants', 'price' => 18000, 'stock' => 50, 'category_id' => 3, 'supplier_id' => 4, 'description' => 'Paire de rideaux occultants', 'is_active' => 1],
            ['name' => 'Ensemble Literie 5 Pièces', 'price' => 45000, 'stock' => 15, 'category_id' => 3, 'supplier_id' => 4, 'description' => 'Ensemble literie complet 5 pièces', 'is_active' => 1],
            
            // Category 4 - Beauty
            ['name' => 'Crème Hydratante Visage', 'price' => 8500, 'stock' => 60, 'category_id' => 4, 'supplier_id' => 5, 'description' => 'Crème hydratante pour visage', 'is_active' => 1],
            ['name' => 'Parfums Femme Chanel', 'price' => 55000, 'stock' => 10, 'category_id' => 4, 'supplier_id' => 5, 'description' => 'Parfum femme Chanel', 'is_active' => 1],
            ['name' => 'Kit Maquillage Complet', 'price' => 22000, 'stock' => 25, 'category_id' => 4, 'supplier_id' => 5, 'description' => 'Kit maquillage professionnel', 'is_active' => 1],
            ['name' => 'Shampooing Réparateur', 'price' => 4500, 'stock' => 80, 'category_id' => 4, 'supplier_id' => 5, 'description' => 'Shampooing réparateur cheveux', 'is_active' => 1],
            ['name' => 'Huile Essentielle Lavande', 'price' => 3500, 'stock' => 100, 'category_id' => 4, 'supplier_id' => 5, 'description' => 'Huile essentielle de lavande 100ml', 'is_active' => 1],
        ];

        foreach ($products as $productData) {
            Product::create($productData);
        }
        
        $this->command->info("Created " . count($products) . " products successfully!");
    }
}
