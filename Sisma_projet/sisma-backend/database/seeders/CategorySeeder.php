<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $categories = [
            // Mode & Vêtements
            ['name' => 'Mode Hommes', 'slug' => 'mode-hommes', 'description' => 'Vêtements et accessoires pour hommes', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Mode Femmes', 'slug' => 'mode-femmes', 'description' => 'Vêtements et accessoires pour femmes', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Mode Enfants', 'slug' => 'mode-enfants', 'description' => 'Vêtements et accessoires pour enfants', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Chaussures', 'slug' => 'chaussures', 'description' => 'Chaussures pour hommes, femmes et enfants', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Sacs & Maroquinerie', 'slug' => 'sacs-maroquinerie', 'description' => 'Sacs, portafeuilles et articles de maroquinerie', 'is_active' => 1, 'parent_id' => null],
            
            // Électronique
            ['name' => 'Téléphones & Tablettes', 'slug' => 'telephones-tablettes', 'description' => 'Smartphones, tablettes et accessoires', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Ordinateurs', 'slug' => 'ordinateurs', 'description' => 'Ordinateurs portables et de bureau', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Accessoires Informatiques', 'slug' => 'accessoires-informatiques', 'description' => 'Claviers, souris, casques et autres accessoires', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Électronique', 'slug' => 'electronique', 'description' => 'Autres produits électroniques', 'is_active' => 1, 'parent_id' => null],
            
            // Beauté & Santé
            ['name' => 'Soins du Visage', 'slug' => 'soins-visage', 'description' => 'Crèmes, sérums et produits soin visage', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Soins du Corps', 'slug' => 'soins-corps', 'description' => 'Lotions, crèmes et produits soin corps', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Maquillage', 'slug' => 'maquillage', 'description' => 'Produits de maquillage', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Parfums & Fragrances', 'slug' => 'parfums', 'description' => 'Parfums et fragrances', 'is_active' => 1, 'parent_id' => null],
            
            // Maison & Déco
            ['name' => 'Meubles', 'slug' => 'meubles', 'description' => 'Meubles pour salon, chambre et bureau', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Décoration', 'slug' => 'decoration', 'description' => 'Objets de décoration intérieure', 'is_active' => 1, 'parent_id' => null],
            ['name' => 'Ustensiles de Cuisine', 'slug' => 'ustensiles-cuisine', 'description' => 'Ustensiles et équipements de cuisine', 'is_active' => 1, 'parent_id' => null],
            
            // Services
            ['name' => 'Services à la Personne', 'slug' => 'services-personne', 'description' => 'Services de ménage, livraison, etc.', 'is_active' => 1, 'parent_id' => null],
        ];

        $now = now();

        foreach ($categories as &$category) {
            $category['created_at'] = $now;
            $category['updated_at'] = $now;
        }

        DB::table('categories')->insert($categories);

        $this->command->info('Categories seeded successfully!');
        $this->command->info('Total categories: ' . count($categories));
    }
}
