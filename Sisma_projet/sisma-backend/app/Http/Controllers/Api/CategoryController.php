<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    /** Liste des catégories (PUBLIC) */
    public function index()
    {
        try {
            $categories = Category::active()
                ->ordered()
                ->get();

            // Ajouter le count manuellement pour éviter les problèmes avec withCount
            foreach ($categories as $category) {
                try {
                    $category->products_count = $category->products()->where('is_active', true)->count();
                } catch (\Exception $e) {
                    $category->products_count = 0;
                }
            }

            return response()->json($categories);
        } catch (\Exception $e) {
            \Log::error('Erreur liste catégories: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Liste complète */
    public function adminIndex()
    {
        try {
            $categories = Category::ordered()->get();
            
            // Transformer les données pour correspondre au format attendu par le frontend
            $transformedCategories = $categories->map(function ($category) {
                try {
                    $productCount = $category->products()->count();
                } catch (\Exception $e) {
                    $productCount = 0;
                }
                
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'productCount' => $productCount, // Le frontend attend productCount en camelCase
                ];
            });
            
            return response()->json($transformedCategories);
        } catch (\Exception $e) {
            \Log::error('Erreur liste catégories admin: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Créer */
    public function store(Request $request)
    {
        try {
            \Log::info('Début création catégorie', ['data' => $request->all()]);
            
            // Validation (Laravel 5.2 compatible - pas de 'nullable', utiliser 'sometimes' ou omettre)
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'slug' => 'sometimes|string', // Accepté mais ignoré si fourni
                'description' => 'sometimes|string',
                'is_active' => 'sometimes|boolean',
                'productCount' => 'sometimes', // Ignoré, vient du frontend
            ]);

            // Récupérer les données validées
            $name = trim($request->input('name'));
            $description = $request->input('description', '');

            if (empty($name)) {
                return response()->json([
                    'message' => 'Erreur de validation',
                    'errors' => ['name' => ['Le nom de la catégorie est requis']]
                ], 422);
            }

            \Log::info('Validation réussie', ['name' => $name]);

            // Vérifier l'unicité du nom
            $existing = Category::where('name', $name)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'Erreur de validation',
                    'errors' => ['name' => ['Une catégorie avec ce nom existe déjà']]
                ], 422);
            }

            // Générer le slug avant la création pour éviter les problèmes
            $baseSlug = \Illuminate\Support\Str::slug($name);
            if (empty($baseSlug)) {
                $baseSlug = 'categorie-' . time();
            }
            
            // Vérifier l'unicité du slug
            $slug = $baseSlug;
            $counter = 1;
            $maxAttempts = 100;
            $attempts = 0;
            
            while ($attempts < $maxAttempts) {
                try {
                    $exists = \App\Models\Category::where('slug', $slug)->exists();
                    if (!$exists) {
                        break;
                    }
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                    $attempts++;
                } catch (\Exception $e) {
                    \Log::warning('Erreur vérification slug: ' . $e->getMessage());
                    $slug = $baseSlug . '-' . time();
                    break;
                }
            }
            
            if ($attempts >= $maxAttempts) {
                $slug = $baseSlug . '-' . time();
            }

            // Préparer les données pour la création
            $data = [
                'name' => $name,
                'slug' => $slug, // Inclure le slug généré
                'description' => $description,
                'is_active' => $request->has('is_active') ? filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) : true,
                'order' => 0,
            ];

            // Ne pas inclure productCount - c'est un champ calculé

            \Log::info('Création de la catégorie', ['data' => $data]);

            try {
                // Créer la catégorie avec le slug déjà généré
                $category = Category::create($data);
            } catch (\InvalidArgumentException $e) {
                \Log::error('Erreur argument invalide création catégorie: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Erreur de validation',
                    'errors' => ['name' => [$e->getMessage()]]
                ], 422);
            }

            \Log::info('Catégorie créée', ['id' => $category->id, 'slug' => $category->slug]);

            // Retourner au format attendu par le frontend
            return response()->json([
                'message' => 'Catégorie créée avec succès',
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'productCount' => 0, // Nouvelle catégorie, donc 0 produits
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : ['message' => [$e->getMessage()]];
            \Log::error('Erreur validation catégorie', ['errors' => $errors]);
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $errors
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Erreur base de données création catégorie: ' . $e->getMessage());
            
            // Détecter les erreurs spécifiques
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || strpos($e->getMessage(), 'UNIQUE constraint') !== false) {
                if (strpos($e->getMessage(), 'slug') !== false) {
                    return response()->json([
                        'message' => 'Erreur de validation',
                        'errors' => ['slug' => ['Un slug similaire existe déjà. Veuillez réessayer.']]
                    ], 422);
                }
                return response()->json([
                    'message' => 'Erreur de validation',
                    'errors' => ['name' => ['Une catégorie avec ce nom existe déjà']]
                ], 422);
            }
            
            return response()->json([
                'message' => 'Erreur base de données',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur lors de la création de la catégorie',
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Erreur création catégorie: ' . $e->getMessage());
            \Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            \Log::error('Type d\'exception: ' . get_class($e));
            
            $errorDetails = [
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ];
            
            if (config('app.debug')) {
                $errorDetails['debug'] = [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'type' => get_class($e),
                    'trace' => explode("\n", $e->getTraceAsString()),
                ];
            }
            
            return response()->json($errorDetails, 500);
        }
    }

    /** ADMIN: Mettre à jour */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $category->id,
            'slug' => 'sometimes|string|unique:categories,slug,' . $category->id,
            'description' => 'sometimes|string',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Catégorie mise à jour avec succès',
            'category' => $category,
        ]);
    }

    /** ADMIN: Supprimer */
    public function destroy(Category $category)
    {
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer une catégorie contenant des produits',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Catégorie supprimée avec succès',
        ]);
    }

    /**
     * Get dynamic fields schema for a category
     * GET /api/categories/{id}/schema
     * 
     * Returns JSON schema for dynamic product fields based on category
     */
    public function schema(Category $category)
    {
        try {
            // Get category fields configuration
            $fieldsConfig = [];
            if (!empty($category->fields_config)) {
                $fieldsConfig = json_decode($category->fields_config, true) ?? [];
            }

            // If no config, generate default fields based on category type
            if (empty($fieldsConfig)) {
                $fieldsConfig = $this->getDefaultFieldsForCategory($category);
            }

            // Get custom fields from category_fields table
            $customFields = DB::table('category_fields')
                ->where('category_id', $category->id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(function ($field) {
                    return [
                        'name' => $field->field_name,
                        'type' => $field->field_type ?? 'text',
                        'label' => $field->field_label ?? $field->field_name,
                        'required' => (bool) $field->is_required,
                        'options' => $field->field_options ? json_decode($field->field_options, true) : null,
                        'placeholder' => $field->placeholder ?? '',
                        'help_text' => $field->help_text ?? '',
                    ];
                })
                ->toArray();

            // Merge default and custom fields
            $allFields = array_merge($fieldsConfig, $customFields);

            return response()->json([
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ],
                'fields' => $allFields,
                'version' => '1.0',
            ]);
        } catch (\Exception $e) {
            \Log::error('CategoryController@schema error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération du schéma',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get default fields based on category name/type
     */
    private function getDefaultFieldsForCategory(Category $category): array
    {
        $categoryName = strtolower($category->name ?? '');
        
        // Default fields for all categories
        $defaultFields = [
            [
                'name' => 'brand',
                'type' => 'text',
                'label' => 'Marque',
                'required' => false,
            ],
            [
                'name' => 'model',
                'type' => 'text',
                'label' => 'Modèle',
                'required' => false,
            ],
            [
                'name' => 'color',
                'type' => 'select',
                'label' => 'Couleur',
                'required' => false,
                'options' => ['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet', 'Rose', 'Gris', 'Marron', 'Beige'],
            ],
            [
                'name' => 'size',
                'type' => 'select',
                'label' => 'Taille',
                'required' => false,
                'options' => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
            ],
            [
                'name' => 'material',
                'type' => 'text',
                'label' => 'Matière',
                'required' => false,
            ],
            [
                'name' => 'weight',
                'type' => 'number',
                'label' => 'Poids (g)',
                'required' => false,
            ],
            [
                'name' => 'dimensions',
                'type' => 'text',
                'label' => 'Dimensions',
                'required' => false,
                'placeholder' => 'L x H x P en cm',
            ],
        ];

        // Category-specific fields
        $specificFields = [];

        // Electronics
        if (str_contains($categoryName, 'électronique') || str_contains($categoryName, 'electronique') || str_contains($categoryName, 'phone') || str_contains($categoryName, 'smartphone')) {
            $specificFields = [
                ['name' => 'warranty', 'type' => 'select', 'label' => 'Garantie', 'options' => ['1 mois', '3 mois', '6 mois', '1 an', '2 ans']],
                ['name' => 'memory', 'type' => 'select', 'label' => 'Mémoire', 'options' => ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB']],
                ['name' => 'battery', 'type' => 'text', 'label' => 'Batterie'],
            ];
        }

        // Clothing/Fashion
        if (str_contains($categoryName, 'vetement') || str_contains($categoryName, 'habit') || str_contains($categoryName, 'mode') || str_contains($categoryName, 'chaussure')) {
            $specificFields = [
                ['name' => 'composition', 'type' => 'text', 'label' => 'Composition'],
                ['name' => 'care_instructions', 'type' => 'textarea', 'label' => 'Instructions d\'entretien'],
            ];
        }

        // Food
        if (str_contains($categoryName, 'aliment') || str_contains($categoryName, 'nourriture') || str_contains($categoryName, 'alimentaire')) {
            $specificFields = [
                ['name' => 'expiry_date', 'type' => 'date', 'label' => 'Date d\'expiration'],
                ['name' => 'ingredients', 'type' => 'textarea', 'label' => 'Ingrédients'],
                ['name' => 'nutritional_info', 'type' => 'textarea', 'label' => 'Informations nutritionnelles'],
                ['name' => 'allergens', 'type' => 'text', 'label' => 'Allergènes'],
            ];
        }

        return array_merge($defaultFields, $specificFields);
    }
}

