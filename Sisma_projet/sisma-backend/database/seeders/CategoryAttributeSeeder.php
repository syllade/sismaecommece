<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoryAttributeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Seeds category-specific attributes for dynamic product forms
     */
    public function run()
    {
        $attributes = [];
        
        // Get category IDs
        $categories = DB::table('categories')->pluck('id', 'slug');
        
        $now = now();
        
        // Electronics attributes
        if (isset($categories['telephones-tablettes'])) {
            $catId = $categories['telephones-tablettes'];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'Marque',
                'slug' => 'brand_' . $catId,
                'type' => 'select',
                'required' => 1,
                'placeholder' => 'Sélectionner une marque',
                'options' => json_encode(['Samsung', 'Apple', 'Huawei', 'Xiaomi', 'Oppo', 'Realme', 'Tecno', 'Infinix', 'Nokia', 'Autre']),
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'Modèle',
                'slug' => 'model_' . $catId,
                'type' => 'text',
                'required' => 1,
                'placeholder' => 'Numéro de modèle',
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'Capacité de stockage',
                'slug' => 'storage_' . $catId,
                'type' => 'select',
                'required' => 1,
                'placeholder' => 'Sélectionner la capacité',
                'options' => json_encode(['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To']),
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'RAM',
                'slug' => 'ram_' . $catId,
                'type' => 'select',
                'required' => 1,
                'placeholder' => 'Sélectionner la RAM',
                'options' => json_encode(['2 Go', '3 Go', '4 Go', '6 Go', '8 Go', '12 Go', '16 Go']),
                'sort_order' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'Couleur',
                'slug' => 'color_' . $catId,
                'type' => 'select',
                'required' => 0,
                'placeholder' => 'Sélectionner la couleur',
                'options' => json_encode(['Noir', 'Blanc', 'Bleu', 'Rouge', 'Vert', 'Or', 'Gris', 'Violet']),
                'sort_order' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        
        // Clothing attributes
        foreach (['mode-hommes', 'mode-femmes', 'mode-enfants', 'chaussures', 'sacs-maroquinerie'] as $slug) {
            if (isset($categories[$slug])) {
                $catId = $categories[$slug];
                $attributes[] = [
                    'category_id' => $catId,
                    'name' => 'Taille',
                    'slug' => 'size_' . $catId,
                    'type' => 'select',
                    'required' => 1,
                    'placeholder' => 'Sélectionner la taille',
                    'options' => json_encode(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
                    'sort_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $attributes[] = [
                    'category_id' => $catId,
                    'name' => 'Couleur',
                    'slug' => 'color_' . $catId,
                    'type' => 'multiselect',
                    'required' => 0,
                    'placeholder' => 'Sélectionner les couleurs',
                    'options' => json_encode(['Noir', 'Blanc', 'Gris', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Rose', 'Marron', 'Beige']),
                    'sort_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $attributes[] = [
                    'category_id' => $catId,
                    'name' => 'Matière',
                    'slug' => 'material_' . $catId,
                    'type' => 'select',
                    'required' => 0,
                    'placeholder' => 'Sélectionner la matière',
                    'options' => json_encode(['Coton', 'Polyester', 'Lin', 'Soie', 'Laine', 'Cuir', 'Jean', 'Synthetique']),
                    'sort_order' => 3,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        // Beauty attributes
        foreach (['soins-visage', 'soins-corps', 'maquillage', 'parfums'] as $slug) {
            if (isset($categories[$slug])) {
                $catId = $categories[$slug];
                $attributes[] = [
                    'category_id' => $catId,
                    'name' => 'Marque',
                    'slug' => 'brand_' . $catId,
                    'type' => 'select',
                    'required' => 1,
                    'placeholder' => 'Sélectionner une marque',
                    'options' => json_encode(['Nivea', 'LOreal', 'Creme', 'Dove', 'Palmers', 'Shea Moisture', 'Ambi', 'Coco Butter', 'Autre']),
                    'sort_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $attributes[] = [
                    'category_id' => $catId,
                    'name' => 'Type de peau',
                    'slug' => 'skin_type_' . $catId,
                    'type' => 'select',
                    'required' => 0,
                    'placeholder' => 'Sélectionner le type de peau',
                    'options' => json_encode(['Normale', 'Seche', 'Mixte', 'Grasse', 'Sensible']),
                    'sort_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $attributes[] = [
                    'category_id' => $catId,
                    'name' => 'Volume/Quantité',
                    'slug' => 'volume_' . $catId,
                    'type' => 'text',
                    'required' => 1,
                    'placeholder' => 'Ex: 250ml, 100g',
                    'sort_order' => 3,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        // Furniture attributes
        if (isset($categories['meuble'])) {
            $catId = $categories['meuble'];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'Matière',
                'slug' => 'material_' . $catId,
                'type' => 'select',
                'required' => 1,
                'placeholder' => 'Sélectionner la matière',
                'options' => json_encode(['Bois massif', 'Panneau MDF', 'Metal', 'Verre', 'Plastique', 'Cannage', 'Rotin']),
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'Dimensions',
                'slug' => 'dimensions_' . $catId,
                'type' => 'text',
                'required' => 0,
                'placeholder' => 'L x H x P en cm',
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $attributes[] = [
                'category_id' => $catId,
                'name' => 'Couleur',
                'slug' => 'color_' . $catId,
                'type' => 'select',
                'required' => 0,
                'placeholder' => 'Sélectionner la couleur',
                'options' => json_encode(['Naturel', 'Blanc', 'Noir', 'Marron', 'Gris', 'Beige', 'Bleu', 'Vert']),
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        
        // Insert all attributes
        if (!empty($attributes)) {
            foreach ($attributes as $attr) {
                DB::table('category_attributes')->insert($attr);
            }
        }
        
        $this->command->info('Category attributes seeded successfully!');
        $this->command->info('Total attributes: ' . count($attributes));
    }
}
