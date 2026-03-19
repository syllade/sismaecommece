<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SupplierProductController extends Controller
{
    // Liste des produits du fournisseur connecté
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $supplierId = isset($user->supplier_id) ? (int)$user->supplier_id : null;
            if (!$supplierId) {
                return response()->json(['message' => 'Supplier not found for user'], 403);
            }

            $query = DB::table('products')->where('supplier_id', $supplierId);

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->get('per_page', 50);
            $offset = ($request->get('page', 1) - 1) * $perPage;
            $products = $query->skip($offset)->take($perPage)->get();

            $transformed = array();
            foreach ($products as $p) {
                $transformed[] = $this->transformSingleProductFromDb($p);
            }

            return response()->json($transformed);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@index error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la recuperation des produits'], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = auth()->user();
            $supplierId = isset($user->supplier_id) ? (int)$user->supplier_id : null;
            if (!$supplierId) return response()->json(['message' => 'Forbidden'], 403);

            $product = DB::table('products')->where('id', $id)->where('supplier_id', $supplierId)->first();
            if (!$product) return response()->json(['message' => 'Produit non trouve'], 404);

            return response()->json($this->transformSingleProductFromDb($product));
        } catch (\Exception $e) {
            Log::error('SupplierProductController@show error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la recuperation du produit'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = auth()->user();
            $supplierId = isset($user->supplier_id) ? (int)$user->supplier_id : null;
            if (!$supplierId) return response()->json(['message' => 'Forbidden'], 403);

            $rules = [
                'name' => 'required|string|max:255',
                'description' => 'sometimes|string',
                'price' => 'required|numeric|min:0',
                'discount' => 'sometimes|numeric|min:0|max:100',
                'commission_rate' => 'sometimes|numeric|min:0|max:100',
                'commissionRate' => 'sometimes|numeric|min:0|max:100',
                'image' => 'sometimes|string',
                'stock' => 'sometimes|integer|min:0',
            ];
            $rules['colors'] = 'sometimes|array';
            $rules['sizes'] = 'sometimes|array';

            if ($request->has('category_id')) {
                $rules['category_id'] = 'required|exists:categories,id';
            } elseif ($request->has('category')) {
                $rules['category'] = 'required|string';
            }

            $this->validate($request, $rules);

            // resolve category
            $categoryId = $this->resolveCategoryId($request);
            if (!$categoryId) {
                return response()->json(['message' => 'Erreur de validation', 'errors' => ['category' => ['La categorie est requise']]], 422);
            }

            $productName = $request->input('name') ?: $request->input('title');
            $slug = $this->generateSlug($productName);

            $images = [];
            if ($request->has('images') && is_array($request->input('images'))) {
                $images = array_filter($request->input('images'));
            } elseif ($request->has('image') && $request->input('image')) {
                $images = [$request->input('image')];
            }

            $data = [
                'category_id' => (int)$categoryId,
                'supplier_id' => $supplierId,
                'name' => $productName,
                'slug' => $slug,
                'description' => $request->input('description', $request->input('shortDescription', '')),
                'price' => (float)$request->input('price'),
                'discount' => $request->has('discount') ? (int)$request->input('discount') : 0,
                'image' => !empty($images) ? $images[0] : '',
                'images' => !empty($images) ? json_encode($images) : null,
                'stock' => $request->has('stock') ? (int)$request->input('stock') : 0,
                'is_active' => $this->resolveIsActive($request) ? 1 : 0,
                'is_featured' => filter_var($request->input('is_featured', false), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                'is_promo' => filter_var($request->input('is_promo', false), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                'views' => 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $commissionRate = null;
            if ($request->has('commission_rate')) $commissionRate = $request->input('commission_rate');
            elseif ($request->has('commissionRate')) $commissionRate = $request->input('commissionRate');
            if ($commissionRate !== null) $data['commission_rate'] = (float)$commissionRate;

            if ($request->has('colors') && is_array($request->input('colors'))) $data['colors'] = json_encode($request->input('colors'));
            if ($request->has('sizes') && is_array($request->input('sizes'))) $data['sizes'] = json_encode($request->input('sizes'));
            // Map optional fields from client schema
            if ($request->has('bulletPoints') && is_array($request->input('bulletPoints'))) {
                $bp = array_filter($request->input('bulletPoints'));
                if (!empty($bp)) {
                    $data['description'] = trim($data['description'] . "\n\n" . implode("\n", $bp));
                }
            }

            if ($request->hasFile('image')) {
                try {
                    $imagePath = $request->file('image')->store('products', 'public');
                    $data['image'] = $imagePath;
                    if (empty($images)) $images = [$imagePath];
                    else array_unshift($images, $imagePath);
                    $data['images'] = json_encode($images);
                } catch (\Exception $e) {
                    Log::warning('Erreur upload: ' . $e->getMessage());
                }
            }

            $productId = DB::table('products')->insertGetId($data);
            $product = DB::table('products')->where('id', $productId)->first();

            return response()->json(['message' => 'Produit cree avec succes', 'product' => $this->transformSingleProductFromDb($product)], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : [];
            return response()->json(['message' => 'Erreur de validation', 'errors' => $errors], 422);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@store error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la creation', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = auth()->user();
            $supplierId = isset($user->supplier_id) ? (int)$user->supplier_id : null;
            if (!$supplierId) return response()->json(['message' => 'Forbidden'], 403);

            $product = DB::table('products')->where('id', $id)->where('supplier_id', $supplierId)->first();
            if (!$product) return response()->json(['message' => 'Produit non trouve'], 404);

            $rules = [
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'price' => 'sometimes|numeric|min:0',
                'discount' => 'sometimes|numeric|min:0|max:100',
                'commission_rate' => 'sometimes|numeric|min:0|max:100',
                'commissionRate' => 'sometimes|numeric|min:0|max:100',
                'image' => 'sometimes|string',
                'stock' => 'sometimes|integer|min:0',
            ];
            if ($request->has('colors')) $rules['colors'] = 'array';
            if ($request->has('sizes')) $rules['sizes'] = 'array';
            if ($request->has('category_id')) $rules['category_id'] = 'sometimes|exists:categories,id';

            $this->validate($request, $rules);

            $data = ['updated_at' => date('Y-m-d H:i:s')];
            if ($request->has('category_id') || $request->has('category')) {
                $categoryId = $this->resolveCategoryId($request);
                if ($categoryId) $data['category_id'] = (int)$categoryId;
            }
            if ($request->has('name')) {
                $data['name'] = $request->input('name');
                $data['slug'] = $this->generateSlug($request->input('name'));
            }
            if ($request->has('description')) $data['description'] = $request->input('description');
            if ($request->has('price')) $data['price'] = (float)$request->input('price');
            if ($request->has('discount')) $data['discount'] = (int)$request->input('discount');
            if ($request->has('commission_rate')) $data['commission_rate'] = (float)$request->input('commission_rate');
            elseif ($request->has('commissionRate')) $data['commission_rate'] = (float)$request->input('commissionRate');
            if ($request->has('stock')) $data['stock'] = (int)$request->input('stock');
            if ($request->has('is_featured')) $data['is_featured'] = filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            if ($request->has('is_promo')) $data['is_promo'] = filter_var($request->input('is_promo'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            if ($request->has('is_active') || $request->has('isActive')) $data['is_active'] = $this->resolveIsActive($request) ? 1 : 0;

            if ($request->has('colors') && is_array($request->input('colors'))) $data['colors'] = json_encode($request->input('colors'));
            if ($request->has('sizes') && is_array($request->input('sizes'))) $data['sizes'] = json_encode($request->input('sizes'));

            if ($request->has('images') && is_array($request->input('images'))) {
                $images = array_filter($request->input('images'));
                $data['images'] = !empty($images) ? json_encode($images) : null;
                $data['image'] = !empty($images) ? $images[0] : '';
            } elseif ($request->has('image')) {
                $data['image'] = $request->input('image');
                if (!$request->has('images')) $data['images'] = json_encode([$request->input('image')]);
            }

            if ($request->hasFile('image')) {
                if ($product->image) Storage::disk('public')->delete($product->image);
                $imagePath = $request->file('image')->store('products', 'public');
                $data['image'] = $imagePath;
                $existingImages = [];
                if (isset($product->images) && $product->images) {
                    $decoded = json_decode($product->images, true);
                    if (is_array($decoded)) $existingImages = $decoded;
                }
                array_unshift($existingImages, $imagePath);
                $data['images'] = json_encode($existingImages);
            }

            DB::table('products')->where('id', $id)->update($data);
            $updatedProduct = DB::table('products')->where('id', $id)->first();

            return response()->json(['message' => 'Produit mis a jour avec succes', 'product' => $this->transformSingleProductFromDb($updatedProduct)]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : [];
            return response()->json(['message' => 'Erreur de validation', 'errors' => $errors], 422);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@update error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise a jour', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = auth()->user();
            $supplierId = isset($user->supplier_id) ? (int)$user->supplier_id : null;
            if (!$supplierId) return response()->json(['message' => 'Forbidden'], 403);

            $product = DB::table('products')->where('id', $id)->where('supplier_id', $supplierId)->first();
            if (!$product) return response()->json(['message' => 'Produit non trouve'], 404);

            if ($product->image) Storage::disk('public')->delete($product->image);
            DB::table('products')->where('id', $id)->delete();

            return response()->json(['message' => 'Produit supprime avec succes']);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la suppression', 'error' => $e->getMessage()], 500);
        }
    }

    // Copied helper functions from ProductController for consistency
    private function transformSingleProductFromDb($product)
    {
        $categoryName = '';
        if (isset($product->category_id) && $product->category_id) {
            try {
                $category = DB::table('categories')->where('id', $product->category_id)->first();
                if ($category) $categoryName = $category->name;
            } catch (\Exception $e) {
                Log::warning('Erreur categorie: ' . $e->getMessage());
            }
        }

        $price = isset($product->price) ? (float)$product->price : 0;
        $discount = isset($product->discount) ? (int)$product->discount : 0;
        $discountedPrice = $discount > 0 ? $price * (1 - ($discount / 100)) : $price;

        $images = [];
        if (isset($product->images) && $product->images) {
            $decoded = json_decode($product->images, true);
            if (is_array($decoded)) $images = $decoded;
            elseif (is_string($decoded)) $images = [$decoded];
        }
        if (empty($images) && isset($product->image) && $product->image) $images = [$product->image];

        $colors = [];
        if (isset($product->colors) && $product->colors) {
            $decodedColors = json_decode($product->colors, true);
            if (is_array($decodedColors)) $colors = $decodedColors;
        }
        $sizes = [];
        if (isset($product->sizes) && $product->sizes) {
            $decodedSizes = json_decode($product->sizes, true);
            if (is_array($decodedSizes)) $sizes = $decodedSizes;
        }

        // Map to Fourniseurs shared schema shape
        $shortDescription = '';
        if (!empty($description)) {
            $shortDescription = mb_substr(strip_tags($description), 0, 200);
        }
        $bulletPointsArr = [];
        if (!empty($product->bullet_points)) {
            $decodedBp = json_decode($product->bullet_points, true);
            if (is_array($decodedBp)) $bulletPointsArr = $decodedBp;
        } else {
            // try to derive from description by splitting lines
            if (!empty($description)) {
                $lines = preg_split('/\r?\n/', $description);
                foreach ($lines as $line) {
                    $t = trim($line);
                    if ($t) $bulletPointsArr[] = $t;
                    if (count($bulletPointsArr) >= 5) break;
                }
            }
        }

        return [
            'id' => (int)$product->id,
            'supplierId' => isset($product->supplier_id) ? (int)$product->supplier_id : null,
            'title' => isset($product->name) ? $product->name : '',
            'description' => isset($product->description) ? $product->description : '',
            'shortDescription' => $shortDescription,
            'bulletPoints' => $bulletPointsArr,
            'metaDescription' => isset($product->meta_description) ? $product->meta_description : '',
            'isVariable' => isset($product->is_variable) ? (bool)$product->is_variable : false,
            'status' => isset($product->status) ? $product->status : 'draft',
            'createdAt' => isset($product->created_at) ? $product->created_at : null,
        ];
    }

    private function resolveCategoryId($request)
    {
        $categoryId = $request->input('category_id');
        if (!$categoryId) $categoryId = $request->input('category');
        if (!$categoryId) return null;
        if (is_numeric($categoryId)) return (int)$categoryId;
        try {
            $category = DB::table('categories')->where('name', $categoryId)->first();
            return $category ? $category->id : null;
        } catch (\Exception $e) {
            Log::warning('Erreur resolution category: ' . $e->getMessage());
            return null;
        }
    }

    private function resolveIsActive($request)
    {
        if ($request->has('is_active')) return filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        if ($request->has('isActive')) return filter_var($request->input('isActive'), FILTER_VALIDATE_BOOLEAN);
        return true;
    }

    private function generateSlug($name)
    {
        $slug = function_exists('str_slug') ? str_slug($name) : preg_replace('/[^a-z0-9]+/i','-', strtolower(trim($name)));
        $count = 1;
        while (DB::table('products')->where('slug', $slug)->exists()) {
            $slug = (function_exists('str_slug') ? str_slug($name) : preg_replace('/[^a-z0-9]+/i','-', strtolower(trim($name)))) . '-' . $count;
            $count++;
        }
        return $slug;
    }
}
