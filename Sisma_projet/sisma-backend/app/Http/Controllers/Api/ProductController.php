<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    /**
     * Liste des produits (PUBLIC)
     */
    public function index(Request $request)
    {
        try {
            Log::info('=== DEBUT index PUBLIC ===');
            
            $query = DB::table('products')->where('is_active', 1);

            if ($request->has('category_id') && $request->category_id) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            if ($request->has('on_sale') && $request->on_sale) {
                $query->where('discount', '>', 0);
            }

            if ($request->has('featured') && $request->featured) {
                $query->where('is_featured', 1);
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->get('per_page', 20);
            
            // Utiliser skip et take au lieu de paginate pour plus de compatibilité
            $offset = ($request->get('page', 1) - 1) * $perPage;
            $products = $query->skip($offset)->take($perPage)->get();

            Log::info('Produits recuperes', array('count' => count($products)));

            $transformed = $this->transformProductsFromDb($products);

            Log::info('=== FIN index PUBLIC ===');

            return response()->json($transformed);
            
        } catch (\Exception $e) {
            Log::error('=== ERREUR index PUBLIC ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            
            return response()->json(array(
                'message' => 'Erreur lors de la recuperation des produits',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ), 500);
        }
    }

    /**
     * Détails d'un produit (PUBLIC)
     * Accepte soit un ID soit un slug
     */
    public function show($identifier)
    {
        try {
            // Essayer d'abord par ID (si c'est numérique)
            if (is_numeric($identifier)) {
                $product = DB::table('products')
                    ->where('id', $identifier)
                    ->where('is_active', 1)
                    ->first();
            } else {
                // Sinon chercher par slug
                $product = DB::table('products')
                    ->where('slug', $identifier)
                    ->where('is_active', 1)
                    ->first();
            }

            if (!$product) {
                return response()->json(array(
                    'message' => 'Produit non trouve'
                ), 404);
            }

            // Incrémenter les vues
            DB::table('products')->where('id', $product->id)->increment('views');

            $transformed = $this->transformSingleProductFromDb($product);

            return response()->json($transformed);
            
        } catch (\Exception $e) {
            Log::error('Erreur show: ' . $e->getMessage());
            
            return response()->json(array(
                'message' => 'Erreur lors de la recuperation du produit',
                'error' => $e->getMessage()
            ), 500);
        }
    }

    /**
     * ADMIN: Liste complète des produits
     */
    public function adminIndex(Request $request)
    {
        try {
            Log::info('=== DEBUT adminIndex ===');
            
            $query = DB::table('products');

            // Filtres
            if ($request->has('category_id') && $request->category_id !== '') {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('is_active') && $request->is_active !== '') {
                $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
                $query->where('is_active', $isActive);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSortColumns = array('id', 'name', 'price', 'created_at', 'stock', 'discount');
            if (!in_array($sortBy, $allowedSortColumns)) {
                $sortBy = 'created_at';
            }
            
            $query->orderBy($sortBy, $sortOrder);

            $products = $query->get();
            Log::info('Produits recuperes', array('count' => count($products)));

            $transformed = $this->transformProductsFromDb($products);

            Log::info('=== FIN adminIndex ===');

            return response()->json($transformed);
            
        } catch (\Exception $e) {
            Log::error('=== ERREUR adminIndex ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            
            return response()->json(array(
                'message' => 'Erreur lors de la recuperation des produits',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ), 500);
        }
    }

    /**
     * ADMIN: Créer un produit
     */
    public function store(Request $request)
    {
        try {
            Log::info('=== DEBUT store ===');
            
            // Validation
            $rules = array(
                'name' => 'required|string|max:255',
                'description' => 'sometimes|string',
                'price' => 'required|numeric|min:0',
                'discount' => 'sometimes|numeric|min:0|max:100',
                'commission_rate' => 'sometimes|numeric|min:0|max:100',
                'commissionRate' => 'sometimes|numeric|min:0|max:100',
                'image' => 'sometimes|string',
                'stock' => 'sometimes|integer|min:0',
            );
            $rules['supplier_id'] = 'required|exists:suppliers,id';
            $rules['colors'] = 'sometimes|array';
            $rules['sizes'] = 'sometimes|array';
            
            if ($request->has('category_id')) {
                $rules['category_id'] = 'required|exists:categories,id';
            } elseif ($request->has('category')) {
                $rules['category'] = 'required|string';
            }
            
            $this->validate($request, $rules);

            // Récupérer category_id
            $categoryId = $this->resolveCategoryId($request);
            
            if (!$categoryId) {
                return response()->json(array(
                    'message' => 'Erreur de validation',
                    'errors' => array('category' => array('La categorie est requise'))
                ), 422);
            }

            // Générer le slug
            $slug = $this->generateSlug($request->input('name'));

            // Gérer les images multiples
            $images = array();
            if ($request->has('images') && is_array($request->input('images'))) {
                $images = array_filter($request->input('images')); // Enlever les valeurs vides
            } elseif ($request->has('image') && $request->input('image')) {
                // Compatibilité : si image est fourni, le mettre dans images
                $images = array($request->input('image'));
            }
            
            // Préparer les données
            $data = array(
                'category_id' => (int)$categoryId,
                'supplier_id' => (int)$request->input('supplier_id'),
                'name' => $request->input('name'),
                'slug' => $slug,
                'description' => $request->input('description', ''),
                'price' => (float)$request->input('price'),
                'discount' => $request->has('discount') ? (int)$request->input('discount') : 0,
                'image' => !empty($images) ? $images[0] : '', // Première image pour compatibilité
                'images' => !empty($images) ? json_encode($images) : null,
                'stock' => $request->has('stock') ? (int)$request->input('stock') : 0,
                'is_active' => $this->resolveIsActive($request) ? 1 : 0,
                'is_featured' => filter_var($request->input('is_featured', false), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                'is_promo' => filter_var($request->input('is_promo', false), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                'views' => 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            );
            $commissionRate = null;
            if ($request->has('commission_rate')) {
                $commissionRate = $request->input('commission_rate');
            } elseif ($request->has('commissionRate')) {
                $commissionRate = $request->input('commissionRate');
            }
            if ($commissionRate !== null) {
                $data['commission_rate'] = (float)$commissionRate;
            }
            if ($request->has('colors') && is_array($request->input('colors'))) {
                $data['colors'] = json_encode($request->input('colors'));
            }
            if ($request->has('sizes') && is_array($request->input('sizes'))) {
                $data['sizes'] = json_encode($request->input('sizes'));
            }

            // Upload image (si fichier fourni)
            if ($request->hasFile('image')) {
                try {
                    $imagePath = $request->file('image')->store('products', 'public');
                    $data['image'] = $imagePath;
                    if (empty($images)) {
                        $images = array($imagePath);
                    } else {
                        array_unshift($images, $imagePath); // Ajouter en premier
                    }
                    $data['images'] = json_encode($images);
                } catch (\Exception $e) {
                    Log::warning('Erreur upload: ' . $e->getMessage());
                }
            }

            Log::info('Donnees a inserer', $data);

            $productId = DB::table('products')->insertGetId($data);
            $product = DB::table('products')->where('id', $productId)->first();

            Log::info('Produit cree', array('id' => $productId));

            return response()->json(array(
                'message' => 'Produit cree avec succes',
                'product' => $this->transformSingleProductFromDb($product),
            ), 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation echouee');
            $errors = method_exists($e, 'errors') ? $e->errors() : array();
            return response()->json(array(
                'message' => 'Erreur de validation',
                'errors' => $errors
            ), 422);
        } catch (\Exception $e) {
            Log::error('=== ERREUR store ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            
            return response()->json(array(
                'message' => 'Erreur lors de la creation',
                'error' => $e->getMessage(),
            ), 500);
        }
    }

    /**
     * ADMIN: Mettre à jour un produit
     */
    public function update(Request $request, $id)
    {
        try {
            Log::info('=== DEBUT update ===', array('id' => $id));
            
            $product = DB::table('products')->where('id', $id)->first();
            
            if (!$product) {
                return response()->json(array('message' => 'Produit non trouve'), 404);
            }

            $rules = array(
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'price' => 'sometimes|numeric|min:0',
                'discount' => 'sometimes|numeric|min:0|max:100',
                'commission_rate' => 'sometimes|numeric|min:0|max:100',
                'commissionRate' => 'sometimes|numeric|min:0|max:100',
                'image' => 'sometimes|string',
                'stock' => 'sometimes|integer|min:0',
            );
            if ($request->has('supplier_id')) {
                $rules['supplier_id'] = 'exists:suppliers,id';
            }
            if ($request->has('colors')) {
                $rules['colors'] = 'array';
            }
            if ($request->has('sizes')) {
                $rules['sizes'] = 'array';
            }
            
            if ($request->has('category_id')) {
                $rules['category_id'] = 'sometimes|exists:categories,id';
            }
            
            $this->validate($request, $rules);

            $data = array('updated_at' => date('Y-m-d H:i:s'));
            
            if ($request->has('category_id') || $request->has('category')) {
                $categoryId = $this->resolveCategoryId($request);
                if ($categoryId) {
                    $data['category_id'] = (int)$categoryId;
                }
            }
            
            if ($request->has('name')) {
                $data['name'] = $request->input('name');
                $data['slug'] = $this->generateSlug($request->input('name'));
            }
            if ($request->has('description')) $data['description'] = $request->input('description');
            if ($request->has('price')) $data['price'] = (float)$request->input('price');
            if ($request->has('discount')) $data['discount'] = (int)$request->input('discount');
            if ($request->has('commission_rate')) {
                $data['commission_rate'] = (float)$request->input('commission_rate');
            } elseif ($request->has('commissionRate')) {
                $data['commission_rate'] = (float)$request->input('commissionRate');
            }
            if ($request->has('stock')) $data['stock'] = (int)$request->input('stock');
            if ($request->has('is_featured')) $data['is_featured'] = filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            if ($request->has('is_promo')) $data['is_promo'] = filter_var($request->input('is_promo'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            if ($request->has('is_active') || $request->has('isActive')) {
                $data['is_active'] = $this->resolveIsActive($request) ? 1 : 0;
            }
            if ($request->has('supplier_id')) {
                $data['supplier_id'] = (int)$request->input('supplier_id');
            }
            if ($request->has('colors') && is_array($request->input('colors'))) {
                $data['colors'] = json_encode($request->input('colors'));
            }
            if ($request->has('sizes') && is_array($request->input('sizes'))) {
                $data['sizes'] = json_encode($request->input('sizes'));
            }

            // Gérer les images multiples
            if ($request->has('images') && is_array($request->input('images'))) {
                $images = array_filter($request->input('images'));
                $data['images'] = !empty($images) ? json_encode($images) : null;
                $data['image'] = !empty($images) ? $images[0] : ''; // Première image pour compatibilité
            } elseif ($request->has('image')) {
                $data['image'] = $request->input('image');
                // Si images n'est pas fourni mais image oui, mettre à jour images aussi
                if (!$request->has('images')) {
                    $data['images'] = json_encode(array($request->input('image')));
                }
            }

            if ($request->hasFile('image')) {
                if ($product->image) {
                    Storage::disk('public')->delete($product->image);
                }
                $imagePath = $request->file('image')->store('products', 'public');
                $data['image'] = $imagePath;
                // Ajouter à images
                $existingImages = array();
                if (isset($product->images) && $product->images) {
                    $decoded = json_decode($product->images, true);
                    if (is_array($decoded)) {
                        $existingImages = $decoded;
                    }
                }
                array_unshift($existingImages, $imagePath);
                $data['images'] = json_encode($existingImages);
            }

            DB::table('products')->where('id', $id)->update($data);
            $updatedProduct = DB::table('products')->where('id', $id)->first();

            return response()->json(array(
                'message' => 'Produit mis a jour avec succes',
                'product' => $this->transformSingleProductFromDb($updatedProduct),
            ));
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : array();
            return response()->json(array(
                'message' => 'Erreur de validation',
                'errors' => $errors
            ), 422);
        } catch (\Exception $e) {
            Log::error('Erreur update: ' . $e->getMessage());
            return response()->json(array(
                'message' => 'Erreur lors de la mise a jour',
                'error' => $e->getMessage(),
            ), 500);
        }
    }

    /**
     * ADMIN: Supprimer un produit
     */
    public function destroy($id)
    {
        try {
            $product = DB::table('products')->where('id', $id)->first();
            
            if (!$product) {
                return response()->json(array('message' => 'Produit non trouve'), 404);
            }

            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }

            DB::table('products')->where('id', $id)->delete();

            return response()->json(array(
                'message' => 'Produit supprime avec succes',
            ));
        } catch (\Exception $e) {
            Log::error('Erreur destroy: ' . $e->getMessage());
            return response()->json(array(
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ), 500);
        }
    }

    /**
     * ADMIN: Dupliquer un produit
     */
    public function duplicate($id)
    {
        try {
            $product = DB::table('products')->where('id', $id)->first();
            
            if (!$product) {
                return response()->json(array('message' => 'Produit non trouve'), 404);
            }

            $data = array(
                'category_id' => $product->category_id,
                'name' => $product->name . ' (Copie)',
                'slug' => $this->generateSlug($product->name . ' Copie'),
                'description' => $product->description,
                'price' => $product->price,
                'discount' => $product->discount,
                'commission_rate' => isset($product->commission_rate) ? $product->commission_rate : null,
                'image' => $product->image,
                'stock' => $product->stock,
                'is_active' => 0,
                'is_featured' => $product->is_featured,
                'views' => 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            );

            $newProductId = DB::table('products')->insertGetId($data);
            $newProduct = DB::table('products')->where('id', $newProductId)->first();

            return response()->json(array(
                'message' => 'Produit duplique avec succes',
                'product' => $this->transformSingleProductFromDb($newProduct),
            ), 201);
        } catch (\Exception $e) {
            Log::error('Erreur duplicate: ' . $e->getMessage());
            return response()->json(array(
                'message' => 'Erreur lors de la duplication',
                'error' => $e->getMessage(),
            ), 500);
        }
    }

    /**
     * Transformer une collection de produits (depuis DB)
     */
    private function transformProductsFromDb($products)
    {
        $transformed = array();
        foreach ($products as $product) {
            $transformed[] = $this->transformSingleProductFromDb($product);
        }
        return $transformed;
    }

    /**
     * Transformer un produit (depuis DB)
     */
    private function transformSingleProductFromDb($product)
    {
        $categoryName = '';
        if (isset($product->category_id) && $product->category_id) {
            try {
                $category = DB::table('categories')->where('id', $product->category_id)->first();
                if ($category) {
                    $categoryName = $category->name;
                }
            } catch (\Exception $e) {
                Log::warning('Erreur categorie: ' . $e->getMessage());
            }
        }
        
        // Calculer le prix réduit si une réduction existe
        $price = isset($product->price) ? (float)$product->price : 0;
        $discount = isset($product->discount) ? (int)$product->discount : 0;
        $discountedPrice = $discount > 0 ? $price * (1 - ($discount / 100)) : $price;
        
        // Gérer les images : priorité à images (tableau), sinon image (string), sinon tableau vide
        $images = array();
        if (isset($product->images) && $product->images) {
            $decoded = json_decode($product->images, true);
            if (is_array($decoded)) {
                $images = $decoded;
            } elseif (is_string($decoded)) {
                $images = array($decoded);
            }
        }
        // Fallback sur image si images est vide
        if (empty($images) && isset($product->image) && $product->image) {
            $images = array($product->image);
        }

        $colors = array();
        if (isset($product->colors) && $product->colors) {
            $decodedColors = json_decode($product->colors, true);
            if (is_array($decodedColors)) {
                $colors = $decodedColors;
            }
        }
        $sizes = array();
        if (isset($product->sizes) && $product->sizes) {
            $decodedSizes = json_decode($product->sizes, true);
            if (is_array($decodedSizes)) {
                $sizes = $decodedSizes;
            }
        }
        
        return array(
            'id' => (int)$product->id,
            'name' => isset($product->name) ? $product->name : '',
            'slug' => isset($product->slug) ? $product->slug : '',
            'description' => isset($product->description) ? $product->description : '',
            'price' => $price,
            'discountedPrice' => round($discountedPrice, 2),
            'discount' => $discount,
            'discountPercentage' => $discount, // Pour compatibilité frontend
            'commissionRate' => isset($product->commission_rate) ? (float)$product->commission_rate : null,
            'image' => !empty($images) ? $images[0] : '', // Première image pour compatibilité
            'images' => $images, // Tableau d'images
            'isActive' => isset($product->is_active) ? (bool)$product->is_active : false,
            'isFeatured' => isset($product->is_featured) ? (bool)$product->is_featured : false,
            'isPromo' => isset($product->is_promo) ? (bool)$product->is_promo : false,
            'category' => $categoryName,
            'categoryId' => isset($product->category_id) ? (int)$product->category_id : null,
            'colors' => $colors,
            'sizes' => $sizes,
            'supplierId' => isset($product->supplier_id) ? (int)$product->supplier_id : null,
            'stock' => isset($product->stock) ? (int)$product->stock : 0,
            'views' => isset($product->views) ? (int)$product->views : 0,
            'createdAt' => isset($product->created_at) ? $product->created_at : null,
        );
    }

    /**
     * Résoudre category_id
     */
    private function resolveCategoryId($request)
    {
        $categoryId = $request->input('category_id');
        if (!$categoryId) {
            $categoryId = $request->input('category');
        }
        
        if (!$categoryId) {
            return null;
        }
        
        if (is_numeric($categoryId)) {
            return (int)$categoryId;
        }
        
        try {
            $category = DB::table('categories')->where('name', $categoryId)->first();
            return $category ? $category->id : null;
        } catch (\Exception $e) {
            Log::warning('Erreur resolution category: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Résoudre is_active
     */
    private function resolveIsActive($request)
    {
        if ($request->has('is_active')) {
            return filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('isActive')) {
            return filter_var($request->input('isActive'), FILTER_VALIDATE_BOOLEAN);
        }
        return true;
    }

    /**
     * Générer un slug unique
     */
    private function generateSlug($name)
    {
        $slug = str_slug($name);
        $count = 1;
        
        while (DB::table('products')->where('slug', $slug)->exists()) {
            $slug = str_slug($name) . '-' . $count;
            $count++;
        }
        
        return $slug;
    }
}
