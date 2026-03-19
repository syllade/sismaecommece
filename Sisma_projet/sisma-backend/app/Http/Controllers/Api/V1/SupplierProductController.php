<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Supplier Product Controller v1 - Merchant Space
 * Enhanced product management with variants and bulk import
 */
class SupplierProductController extends Controller
{
    /**
     * Get all products for supplier
     * GET /api/v1/supplier/products
     */
    public function index(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $query = DB::table('products')->where('supplier_id', $supplierId);

            // Filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Stock filter
            if ($request->has('stock_status')) {
                if ($request->stock_status === 'out_of_stock') {
                    $query->where('stock', '<=', 0);
                } elseif ($request->stock_status === 'low_stock') {
                    $query->where('stock', '>', 0)->where('stock', '<=', 5);
                } elseif ($request->stock_status === 'in_stock') {
                    $query->where('stock', '>', 5);
                }
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $offset = ($page - 1) * $perPage;

            $total = $query->count();
            $products = $query->skip($offset)->take($perPage)->get();

            // Transform products
            $transformed = $products->map(function ($product) {
                return $this->transformProduct($product);
            });

            return response()->json([
                'data' => $transformed,
                'meta' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'last_page' => ceil($total / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@index error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des produits'], 500);
        }
    }

    /**
     * Get single product
     * GET /api/v1/supplier/products/{id}
     */
    public function show($id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $product = DB::table('products')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$product) {
                return response()->json(['message' => 'Produit non trouvé'], 404);
            }

            // Get variants if variable product
            $variants = [];
            if ($product->is_variable) {
                $variants = DB::table('product_variants')
                    ->where('product_id', $id)
                    ->get();
            }

            // Get category fields
            $categoryFields = [];
            if ($product->category_id) {
                $categoryFields = DB::table('category_fields')
                    ->where('category_id', $product->category_id)
                    ->where('is_active', 1)
                    ->orderBy('position')
                    ->get();
            }

            return response()->json([
                'product' => $this->transformProduct($product),
                'variants' => $variants,
                'category_fields' => $categoryFields,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@show error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération du produit'], 500);
        }
    }

    /**
     * Create new product
     * POST /api/v1/supplier/products
     */
    public function store(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category_id' => 'nullable|integer|exists:categories,id',
                'price' => 'required|numeric|min:0',
                'discount' => 'nullable|numeric|min:0|max:100',
                'stock' => 'nullable|integer|min:0',
                'sku' => 'nullable|string|max:100|unique:products,sku',
                'is_variable' => 'nullable|boolean',
                'colors' => 'nullable|array',
                'sizes' => 'nullable|array',
                'images' => 'nullable|array',
                'is_active' => 'nullable|boolean',
                'commission_rate' => 'nullable|numeric|min:0|max:100',
                // Dynamic fields
                'fields' => 'nullable|array',
            ]);

            // Check if supplier needs approval
            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
            $needsApproval = !$supplier || !$supplier->is_approved;

            $slug = $this->generateSlug($request->name);

            // Process images
            $images = [];
            if ($request->has('images') && is_array($request->images)) {
                $images = array_filter($request->images);
            }
            if ($request->hasFile('image')) {
                try {
                    $imagePath = $request->file('image')->store('products', 'public');
                    array_unshift($images, $imagePath);
                } catch (\Exception $e) {
                    Log::warning('Image upload error: ' . $e->getMessage());
                }
            }

            // Process dynamic fields
            $dynamicFields = null;
            if ($request->has('fields') && is_array($request->fields)) {
                $dynamicFields = json_encode($request->fields);
            }

            $productId = DB::table('products')->insertGetId([
                'supplier_id' => $supplierId,
                'category_id' => $request->category_id ?? null,
                'name' => $request->name,
                'slug' => $slug,
                'description' => $request->description ?? '',
                'short_description' => $request->short_description ?? '',
                'price' => $request->price,
                'discount' => $request->discount ?? 0,
                'stock' => $request->stock ?? 0,
                'sku' => $request->sku ?? $this->generateSKU($supplierId),
                'image' => !empty($images) ? $images[0] : '',
                'images' => !empty($images) ? json_encode($images) : null,
                'is_variable' => $request->is_variable ? 1 : 0,
                'is_active' => ($request->is_active !== false && !$needsApproval) ? 1 : 0,
                'status' => $needsApproval ? 'pending' : 'active',
                'commission_rate' => $request->commission_rate ?? $supplier->commission_rate ?? 0,
                'colors' => $request->has('colors') ? json_encode($request->colors) : null,
                'sizes' => $request->has('sizes') ? json_encode($request->sizes) : null,
                'dynamic_fields' => $dynamicFields,
                'views' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create variants if variable product
            if ($request->is_variable && ($request->has('colors') || $request->has('sizes'))) {
                $this->createVariants($productId, $request);
            }

            $product = DB::table('products')->where('id', $productId)->first();

            // Check product threshold and notify admin if crossed
            $productCount = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->where('status', 'active')
                ->count();
            
            if ($productCount == 11) {
                // Notify admin when supplier crosses 10 products (now has 11)
                AdminNotification::notifyProductThreshold($supplierId, $productCount, $productId);
            }

            return response()->json([
                'message' => $needsApproval ? 'Produit créé et en attente de validation' : 'Produit créé avec succès',
                'product' => $this->transformProduct($product),
                'needs_approval' => $needsApproval,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@store error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la création du produit'], 500);
        }
    }

    /**
     * Update product
     * PUT /api/v1/supplier/products/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $product = DB::table('products')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$product) {
                return response()->json(['message' => 'Produit non trouvé'], 404);
            }

            $request->validate([
                'name' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'category_id' => 'nullable|integer|exists:categories,id',
                'price' => 'nullable|numeric|min:0',
                'discount' => 'nullable|numeric|min:0|max:100',
                'stock' => 'nullable|integer|min:0',
                'sku' => 'nullable|string|max:100|unique:products,sku,' . $id,
                'is_variable' => 'nullable|boolean',
                'colors' => 'nullable|array',
                'sizes' => 'nullable|array',
                'images' => 'nullable|array',
                'is_active' => 'nullable|boolean',
                'commission_rate' => 'nullable|numeric|min:0|max:100',
                'fields' => 'nullable|array',
            ]);

            $updateData = ['updated_at' => now()];

            // Check if needs re-approval after update
            $needsReapproval = false;
            $fieldsRequiringApproval = ['name', 'description', 'price', 'category_id'];
            foreach ($fieldsRequiringApproval as $field) {
                if ($request->has($field)) {
                    $needsReapproval = true;
                    break;
                }
            }

            if ($request->has('name')) {
                $updateData['name'] = $request->name;
                $updateData['slug'] = $this->generateSlug($request->name, $id);
            }
            if ($request->has('description')) $updateData['description'] = $request->description;
            if ($request->has('short_description')) $updateData['short_description'] = $request->short_description;
            if ($request->has('category_id')) $updateData['category_id'] = $request->category_id;
            if ($request->has('price')) $updateData['price'] = $request->price;
            if ($request->has('discount')) $updateData['discount'] = $request->discount;
            if ($request->has('stock')) $updateData['stock'] = $request->stock;
            if ($request->has('sku')) $updateData['sku'] = $request->sku;
            if ($request->has('commission_rate')) $updateData['commission_rate'] = $request->commission_rate;

            if ($request->has('is_variable')) {
                $updateData['is_variable'] = $request->is_variable ? 1 : 0;
            }

            if ($request->has('is_active')) {
                $updateData['is_active'] = $request->is_active ? 1 : 0;
            }

            if ($request->has('colors')) {
                $updateData['colors'] = json_encode($request->colors);
            }

            if ($request->has('sizes')) {
                $updateData['sizes'] = json_encode($request->sizes);
            }

            // Handle images
            if ($request->has('images') && is_array($request->images)) {
                $images = array_filter($request->images);
                $updateData['images'] = !empty($images) ? json_encode($images) : null;
                $updateData['image'] = !empty($images) ? $images[0] : '';
            }

            if ($request->hasFile('image')) {
                if ($product->image) {
                    Storage::disk('public')->delete($product->image);
                }
                $imagePath = $request->file('image')->store('products', 'public');
                $updateData['image'] = $imagePath;
                if (!isset($updateData['images'])) {
                    $existingImages = $product->images ? json_decode($product->images, true) : [];
                    array_unshift($existingImages, $imagePath);
                    $updateData['images'] = json_encode($existingImages);
                }
            }

            // Dynamic fields
            if ($request->has('fields')) {
                $updateData['dynamic_fields'] = json_encode($request->fields);
            }

            // Reset to pending if requires re-approval
            if ($needsReapproval && $product->status === 'active') {
                $updateData['status'] = 'pending';
            }

            DB::table('products')->where('id', $id)->update($updateData);

            // Update variants if changed
            if ($request->has('colors') || $request->has('sizes')) {
                $this->syncVariants($id, $request);
            }

            $updatedProduct = DB::table('products')->where('id', $id)->first();

            return response()->json([
                'message' => 'Produit mis à jour avec succès',
                'product' => $this->transformProduct($updatedProduct),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@update error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    /**
     * Delete product
     * DELETE /api/v1/supplier/products/{id}
     */
    public function destroy($id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $product = DB::table('products')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$product) {
                return response()->json(['message' => 'Produit non trouvé'], 404);
            }

            // Delete images
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            if ($product->images) {
                $images = json_decode($product->images, true);
                foreach ($images as $image) {
                    Storage::disk('public')->delete($image);
                }
            }

            // Delete variants
            DB::table('product_variants')->where('product_id', $id)->delete();

            // Delete product
            DB::table('products')->where('id', $id)->delete();

            return response()->json(['message' => 'Produit supprimé avec succès']);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }

    /**
     * Bulk import products from CSV
     * POST /api/v1/supplier/products/import
     */
    public function import(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:10240', // Max 10MB
            ]);

            $file = $request->file('file');
            $path = $file->getRealPath();

            $handle = fopen($path, 'r');
            $header = fgetcsv($handle, 1000, ',');

            $imported = 0;
            $failed = [];
            $rowNumber = 1;

            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                $rowNumber++;
                try {
                    $data = array_combine($header, $row);

                    // Validate required fields
                    if (empty($data['name']) || empty($data['price'])) {
                        $failed[] = ['row' => $rowNumber, 'error' => 'Nom ou prix manquant'];
                        continue;
                    }

                    // Check if product exists by SKU
                    $existingProduct = null;
                    if (!empty($data['sku'])) {
                        $existingProduct = DB::table('products')
                            ->where('sku', $data['sku'])
                            ->where('supplier_id', $supplierId)
                            ->first();
                    }

                    // Get category ID if provided
                    $categoryId = null;
                    if (!empty($data['category'])) {
                        $category = DB::table('categories')
                            ->where('name', 'like', '%' . $data['category'] . '%')
                            ->first();
                        $categoryId = $category ? $category->id : null;
                    }

                    // Get supplier info
                    $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
                    $needsApproval = !$supplier || !$supplier->is_approved;

                    if ($existingProduct) {
                        // Update existing
                        DB::table('products')
                            ->where('id', $existingProduct->id)
                            ->update([
                                'name' => $data['name'],
                                'description' => $data['description'] ?? '',
                                'category_id' => $categoryId ?? $existingProduct->category_id,
                                'price' => (float) $data['price'],
                                'discount' => (int) ($data['discount'] ?? 0),
                                'stock' => (int) ($data['stock'] ?? 0),
                                'status' => $needsApproval ? 'pending' : 'active',
                                'updated_at' => now(),
                            ]);
                    } else {
                        // Create new
                        DB::table('products')->insert([
                            'supplier_id' => $supplierId,
                            'category_id' => $categoryId,
                            'name' => $data['name'],
                            'slug' => $this->generateSlug($data['name']),
                            'description' => $data['description'] ?? '',
                            'price' => (float) $data['price'],
                            'discount' => (int) ($data['discount'] ?? 0),
                            'stock' => (int) ($data['stock'] ?? 0),
                            'sku' => $data['sku'] ?? $this->generateSKU($supplierId),
                            'is_active' => $needsApproval ? 0 : 1,
                            'status' => $needsApproval ? 'pending' : 'active',
                            'commission_rate' => $supplier->commission_rate ?? 0,
                            'views' => 0,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    $imported++;
                } catch (\Exception $e) {
                    $failed[] = ['row' => $rowNumber, 'error' => $e->getMessage()];
                }
            }

            fclose($handle);

            // Log AI usage for billing (if AI was used)
            // Log::info('Bulk import completed', ['supplier_id' => $supplierId, 'imported' => $imported, 'failed' => count($failed)]);

            return response()->json([
                'message' => 'Import terminé',
                'imported' => $imported,
                'failed' => $failed,
                'total_rows' => $rowNumber - 1,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@import error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de l\'import'], 500);
        }
    }

    /**
     * Export products to CSV
     * GET /api/v1/supplier/products/export
     */
    public function export(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $products = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->orderBy('created_at', 'desc')
                ->get();

            $data = [];
            foreach ($products as $product) {
                $category = DB::table('categories')->where('id', $product->category_id)->first();
                $data[] = [
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'description' => $product->description,
                    'category' => $category ? $category->name : '',
                    'price' => $product->price,
                    'discount' => $product->discount,
                    'stock' => $product->stock,
                    'is_active' => $product->is_active ? 'yes' : 'no',
                    'status' => $product->status,
                ];
            }

            return response()->json([
                'data' => $data,
                'total' => count($data),
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@export error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de l\'export'], 500);
        }
    }

    /**
     * Update product variants
     * PUT /api/v1/supplier/products/{id}/variants
     */
    public function updateVariants(Request $request, $id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $product = DB::table('products')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$product) {
                return response()->json(['message' => 'Produit non trouvé'], 404);
            }

            $request->validate([
                'variants' => 'required|array',
                'variants.*.name' => 'required|string',
                'variants.*.sku' => 'nullable|string',
                'variants.*.price' => 'nullable|numeric|min:0',
                'variants.*.stock' => 'nullable|integer|min:0',
            ]);

            // Delete existing variants
            DB::table('product_variants')->where('product_id', $id)->delete();

            // Create new variants
            foreach ($request->variants as $variant) {
                DB::table('product_variants')->insert([
                    'product_id' => $id,
                    'name' => $variant['name'],
                    'sku' => $variant['sku'] ?? $this->generateSKU($supplierId),
                    'price' => $variant['price'] ?? $product->price,
                    'stock' => $variant['stock'] ?? 0,
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'message' => 'Variantes mises à jour avec succès',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierProductController@updateVariants error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour des variantes'], 500);
        }
    }

    /**
     * Transform product for API response
     */
    private function transformProduct($product)
    {
        $category = null;
        if ($product->category_id) {
            $category = DB::table('categories')->where('id', $product->category_id)->first();
        }

        $images = [];
        if ($product->images) {
            $decoded = json_decode($product->images, true);
            if (is_array($decoded)) {
                $images = $decoded;
            }
        }
        if (empty($images) && $product->image) {
            $images = [$product->image];
        }

        $colors = [];
        if ($product->colors) {
            $decoded = json_decode($product->colors, true);
            if (is_array($decoded)) {
                $colors = $decoded;
            }
        }

        $sizes = [];
        if ($product->sizes) {
            $decoded = json_decode($product->sizes, true);
            if (is_array($decoded)) {
                $sizes = $decoded;
            }
        }

        $dynamicFields = [];
        if ($product->dynamic_fields) {
            $decoded = json_decode($product->dynamic_fields, true);
            if (is_array($decoded)) {
                $dynamicFields = $decoded;
            }
        }

        $price = (float) $product->price;
        $discount = (int) $product->discount;
        $finalPrice = $discount > 0 ? $price * (1 - ($discount / 100)) : $price;

        return [
            'id' => (int) $product->id,
            'supplier_id' => (int) $product->supplier_id,
            'category_id' => $product->category_id ? (int) $product->category_id : null,
            'category_name' => $category ? $category->name : null,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'short_description' => $product->short_description ?? '',
            'price' => $price,
            'discount' => $discount,
            'final_price' => $finalPrice,
            'stock' => (int) $product->stock,
            'sku' => $product->sku,
            'image' => $product->image,
            'images' => $images,
            'is_variable' => (bool) $product->is_variable,
            'is_active' => (bool) $product->is_active,
            'status' => $product->status,
            'commission_rate' => (float) $product->commission_rate,
            'colors' => $colors,
            'sizes' => $sizes,
            'dynamic_fields' => $dynamicFields,
            'views' => (int) $product->views,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
    }

    /**
     * Generate unique slug
     */
    private function generateSlug($name, $excludeId = null)
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $count = 1;

        $query = DB::table('products')->where('slug', $slug);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        while ($query->exists()) {
            $slug = $baseSlug . '-' . $count;
            $count++;
            $query = DB::table('products')->where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
        }

        return $slug;
    }

    /**
     * Generate SKU
     */
    private function generateSKU($supplierId)
    {
        return 'SKU-' . $supplierId . '-' . strtoupper(Str::random(6));
    }

    /**
     * Create variants for variable product
     */
    private function createVariants($productId, $request)
    {
        $colors = $request->has('colors') ? $request->colors : [];
        $sizes = $request->has('sizes') ? $request->sizes : [];
        $basePrice = $request->price;

        if (!empty($colors) && !empty($sizes)) {
            foreach ($colors as $color) {
                foreach ($sizes as $size) {
                    DB::table('product_variants')->insert([
                        'product_id' => $productId,
                        'name' => $color . ' / ' . $size,
                        'sku' => $this->generateSKU($this->getSupplierId()),
                        'price' => $basePrice,
                        'stock' => $request->stock ?? 0,
                        'is_active' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        } elseif (!empty($colors)) {
            foreach ($colors as $color) {
                DB::table('product_variants')->insert([
                    'product_id' => $productId,
                    'name' => $color,
                    'sku' => $this->generateSKU($this->getSupplierId()),
                    'price' => $basePrice,
                    'stock' => $request->stock ?? 0,
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } elseif (!empty($sizes)) {
            foreach ($sizes as $size) {
                DB::table('product_variants')->insert([
                    'product_id' => $productId,
                    'name' => $size,
                    'sku' => $this->generateSKU($this->getSupplierId()),
                    'price' => $basePrice,
                    'stock' => $request->stock ?? 0,
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Sync variants for variable product
     */
    private function syncVariants($productId, $request)
    {
        // Delete existing variants
        DB::table('product_variants')->where('product_id', $productId)->delete();

        // Recreate if still variable
        if ($request->is_variable) {
            $this->createVariants($productId, $request);
        }
    }

    /**
     * Get supplier ID from authenticated user
     */
    private function getSupplierId()
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        if (isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        if ($user->role === 'supplier') {
            $supplier = DB::table('suppliers')->where('user_id', $user->id)->first();
            return $supplier ? $supplier->id : null;
        }

        return null;
    }
}
