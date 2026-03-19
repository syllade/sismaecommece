<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller for Home Page dynamic data
 * 
 * Endpoints:
 * - GET /api/v1/home - Get all home data
 * - GET /api/v1/home/top-products - Get top products
 * - GET /api/v1/home/new-products - Get new products
 * - GET /api/v1/home/top-shops - Get top shops
 * - GET /api/v1/home/promotions - Get promotions
 */
class HomeController extends Controller
{
    /**
     * GET /api/v1/home
     * 
     * Get all home page data
     */
    public function index(Request $request)
    {
        try {
            $limit = (int) $request->get('limit', 10);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'top_products' => $this->getTopProducts($limit),
                    'new_products' => $this->getNewProducts($limit),
                    'top_shops' => $this->getTopShops($limit),
                    'promotions' => $this->getPromotions($limit),
                    'categories' => $this->getCategories(),
                ],
                'meta' => [
                    'generated_at' => now()->toIso8601String()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('HomeController index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading home data'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/home/top-products
     * 
     * Get top selling products
     */
    public function topProducts(Request $request)
    {
        try {
            $limit = (int) $request->get('limit', 10);
            $products = $this->getTopProducts($limit);
            
            return response()->json([
                'success' => true,
                'data' => $products
            ]);
        } catch (\Exception $e) {
            Log::error('HomeController topProducts error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading top products'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/home/new-products
     * 
     * Get newest products
     */
    public function newProducts(Request $request)
    {
        try {
            $limit = (int) $request->get('limit', 10);
            $products = $this->getNewProducts($limit);
            
            return response()->json([
                'success' => true,
                'data' => $products
            ]);
        } catch (\Exception $e) {
            Log::error('HomeController newProducts error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading new products'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/home/top-shops
     * 
     * Get top rated shops
     */
    public function topShops(Request $request)
    {
        try {
            $limit = (int) $request->get('limit', 10);
            $shops = $this->getTopShops($limit);
            
            return response()->json([
                'success' => true,
                'data' => $shops
            ]);
        } catch (\Exception $e) {
            Log::error('HomeController topShops error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading top shops'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/home/promotions
     * 
     * Get products on promotion
     */
    public function promotions(Request $request)
    {
        try {
            $limit = (int) $request->get('limit', 10);
            $promotions = $this->getPromotions($limit);
            
            return response()->json([
                'success' => true,
                'data' => $promotions
            ]);
        } catch (\Exception $e) {
            Log::error('HomeController promotions error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading promotions'
            ], 500);
        }
    }
    
    /**
     * Get top products by sales
     */
    private function getTopProducts(int $limit): array
    {
        $products = DB::table('products')
            ->selectRaw('
                products.id,
                products.name,
                products.slug,
                products.price,
                products.image,
                products.images,
                products.discount,
                products.is_active,
                suppliers.name as supplier_name,
                suppliers.logo as supplier_logo,
                (SELECT COUNT(*) FROM order_items WHERE order_items.product_id = products.id) as sales_count,
                (SELECT SUM(order_items.quantity) FROM order_items WHERE order_items.product_id = products.id) as quantity_sold
            ')
            ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
            ->where('products.is_active', 1)
            ->where('suppliers.is_active', 1)
            ->orderByDesc('quantity_sold')
            ->limit($limit)
            ->get();
            
        return $products->map(function ($product) {
            $product->images = $product->images ? json_decode($product->images, true) : [];
            return $product;
        })->toArray();
    }
    
    /**
     * Get newest products
     */
    private function getNewProducts(int $limit): array
    {
        $products = DB::table('products')
            ->selectRaw('
                products.id,
                products.name,
                products.slug,
                products.price,
                products.image,
                products.images,
                products.discount,
                products.is_active,
                suppliers.name as supplier_name,
                suppliers.logo as supplier_logo,
                products.created_at
            ')
            ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
            ->where('products.is_active', 1)
            ->where('suppliers.is_active', 1)
            ->orderByDesc('products.created_at')
            ->limit($limit)
            ->get();
            
        return $products->map(function ($product) {
            $product->images = $product->images ? json_decode($product->images, true) : [];
            return $product;
        })->toArray();
    }
    
    /**
     * Get top shops by rating and sales
     */
    private function getTopShops(int $limit): array
    {
        $shops = DB::table('suppliers')
            ->selectRaw('
                suppliers.id,
                suppliers.name,
                suppliers.slug,
                suppliers.logo,
                suppliers.address,
                suppliers.is_active,
                (SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id AND products.is_active = 1) as products_count,
                (SELECT COUNT(*) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered") as total_sales,
                (SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered") as revenue,
                (SELECT AVG(rating) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as avg_rating,
                (SELECT COUNT(*) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as ratings_count
            ')
            ->where('suppliers.is_active', 1)
            ->orderByDesc('avg_rating')
            ->orderByDesc('total_sales')
            ->limit($limit)
            ->get();
            
        return $shops->toArray();
    }
    
    /**
     * Get products on promotion
     */
    private function getPromotions(int $limit): array
    {
        $products = DB::table('products')
            ->selectRaw('
                products.id,
                products.name,
                products.slug,
                products.price,
                products.image,
                products.images,
                products.discount,
                products.is_active,
                suppliers.name as supplier_name,
                suppliers.logo as supplier_logo,
                (products.price * (100 - products.discount) / 100) as final_price
            ')
            ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
            ->where('products.is_active', 1)
            ->where('suppliers.is_active', 1)
            ->where('products.discount', '>', 0)
            ->orderByDesc('products.discount')
            ->limit($limit)
            ->get();
            
        return $products->map(function ($product) {
            $product->images = $product->images ? json_decode($product->images, true) : [];
            return $product;
        })->toArray();
    }
    
    /**
     * Get all categories
     */
    private function getCategories(): array
    {
        return DB::table('categories')
            ->select('id', 'name', 'slug', 'image', 'parent_id')
            ->where('is_active', 1)
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    /**
     * GET /api/v1/home/suppliers-with-products
     * 
     * Get suppliers with their products, sorted by rating
     * Used for Homme/Femme pages
     */
    public function suppliersWithProducts(Request $request)
    {
        try {
            $gender = $request->get('gender'); // 'homme' or 'femme' or null for all
            $limit = (int) $request->get('limit', 20);
            $productsLimit = (int) $request->get('products_limit', 12);
            
            // Get suppliers with their products, sorted by rating
            $suppliers = DB::table('suppliers')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.slug,
                    suppliers.logo,
                    suppliers.address,
                    suppliers.is_active,
                    (SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id AND products.is_active = 1) as products_count,
                    (SELECT COUNT(*) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered") as total_sales,
                    (SELECT COALESCE(AVG(rating), 0) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as avg_rating,
                    (SELECT COUNT(*) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as ratings_count
                ')
                ->where('suppliers.is_active', 1)
                ->having('products_count', '>', 0)
                ->orderByDesc('avg_rating')
                ->orderByDesc('total_sales')
                ->limit($limit)
                ->get();
            
            // Get products for each supplier
            $suppliersArray = $suppliers->toArray();
            
            foreach ($suppliersArray as $supplier) {
                $query = DB::table('products')
                    ->selectRaw('
                        products.id,
                        products.name,
                        products.slug,
                        products.price,
                        products.discount,
                        products.image,
                        products.images,
                        products.stock,
                        products.is_active,
                        categories.name as category_name,
                        categories.id as category_id,
                        suppliers.name as supplier_name,
                        suppliers.slug as supplier_slug
                    ')
                    ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                    ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
                    ->where('products.supplier_id', $supplier->id)
                    ->where('products.is_active', 1);
                
                // Filter by gender if specified
                if ($gender) {
                    $genderLower = strtolower($gender);
                    $query->where(function($q) use ($genderLower) {
                        // Match category names containing homme/femme
                        $q->whereRaw('LOWER(categories.name) LIKE ?', ['%' . $genderLower . '%'])
                          ->orWhereRaw('LOWER(products.name) LIKE ?', ['%' . $genderLower . '%'])
                          ->orWhereRaw('LOWER(products.description) LIKE ?', ['%' . $genderLower . '%']);
                    });
                }
                
                $products = $query
                    ->orderByDesc('products.is_featured')
                    ->orderByDesc('products.created_at')
                    ->limit($productsLimit)
                    ->get()
                    ->map(function ($product) {
                        $product->images = $product->images ? json_decode($product->images, true) : [];
                        return $product;
                    });
                
                $supplier->products = $products->toArray();
                $supplier->products_count = count($supplier->products);
            }
            
            // Filter out suppliers with no products after gender filter
            $suppliersArray = array_filter($suppliersArray, function($supplier) {
                return count($supplier->products) > 0;
            });
            
            return response()->json([
                'success' => true,
                'data' => array_values($suppliersArray),
                'meta' => [
                    'gender' => $gender,
                    'total_suppliers' => count($suppliersArray),
                    'generated_at' => now()->toIso8601String()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('HomeController suppliersWithProducts error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading suppliers with products'
            ], 500);
        }
    }
}
