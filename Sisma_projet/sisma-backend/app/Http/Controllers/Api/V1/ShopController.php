<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller for Shop/Boutique pages
 * 
 * Endpoints:
 * - GET /api/v1/shops/{slug} - Get shop details
 * - GET /api/v1/shops/{slug}/products - Get shop products
 * - GET /api/v1/shops/top - Get top shops ranking
 */
class ShopController extends Controller
{
    /**
     * GET /api/v1/shops/{slug}
     * 
     * Get shop details by slug
     */
    public function show(Request $request, string $slug)
    {
        try {
            $shop = DB::table('suppliers')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.slug,
                    suppliers.logo,
                    suppliers.address,
                    suppliers.phone,
                    suppliers.email,
                    suppliers.availability,
                    suppliers.is_active,
                    suppliers.created_at,
                    (SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id AND products.is_active = 1) as products_count,
                    (SELECT COUNT(*) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered") as total_sales,
                    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered") as revenue,
                    (SELECT AVG(rating) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as avg_rating,
                    (SELECT COUNT(*) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as ratings_count
                ')
                ->where('suppliers.slug', $slug)
                ->where('suppliers.is_active', 1)
                ->first();
            
            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }
            
            // Get recent testimonials
            $testimonials = DB::table('testimonials')
                ->select('id', 'user_name', 'rating', 'comment', 'created_at')
                ->where('supplier_id', $shop->id)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'shop' => $shop,
                    'testimonials' => $testimonials
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('ShopController show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading shop'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/shops/{slug}/products
     * 
     * Get products for a specific shop
     */
    public function products(Request $request, string $slug)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 20)));
            $sortBy = $request->get('sort', 'created_at');
            $categoryId = $request->get('category_id');
            
            // Get supplier
            $supplier = DB::table('suppliers')
                ->where('slug', $slug)
                ->where('is_active', 1)
                ->first();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }
            
            $query = DB::table('products')
                ->selectRaw('
                    products.id,
                    products.name,
                    products.slug,
                    products.price,
                    products.image,
                    products.images,
                    products.discount,
                    products.is_active,
                    products.stock,
                    products.created_at
                ')
                ->where('products.supplier_id', $supplier->id)
                ->where('products.is_active', 1);
            
            // Filter by category
            if ($categoryId) {
                $query->where('products.category_id', $categoryId);
            }
            
            // Sorting
            switch ($sortBy) {
                case 'price_asc':
                    $query->orderBy('products.price', 'asc');
                    break;
                case 'price_desc':
                    $query->orderBy('products.price', 'desc');
                    break;
                case 'name':
                    $query->orderBy('products.name', 'asc');
                    break;
                case 'popular':
                    $query->orderByDesc('products.views');
                    break;
                default:
                    $query->orderByDesc('products.created_at');
            }
            
            $offset = ($page - 1) * $perPage;
            $countQuery = clone $query;
            $total = (int) $countQuery->count();
            
            $products = $query
                ->offset($offset)
                ->limit($perPage)
                ->get();
            
            $products = $products->map(function ($product) {
                $product->images = $product->images ? json_decode($product->images, true) : [];
                return $product;
            });
            
            $lastPage = (int) max(1, ceil($total / $perPage));
            
            // Get categories for this shop
            $categories = DB::table('products')
                ->selectRaw('categories.id, categories.name, categories.slug, COUNT(products.id) as products_count')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('products.supplier_id', $supplier->id)
                ->where('products.is_active', 1)
                ->groupBy('categories.id', 'categories.name', 'categories.slug')
                ->orderBy('categories.name')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'supplier' => [
                        'id' => $supplier->id,
                        'name' => $supplier->name,
                        'slug' => $supplier->slug,
                        'logo' => $supplier->logo
                    ],
                    'products' => $products,
                    'categories' => $categories
                ],
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage,
                    'has_next' => $page < $lastPage,
                    'has_prev' => $page > 1,
                    'sort' => $sortBy
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('ShopController products error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading products'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/shops/top
     * 
     * Get top shops ranking
     */
    public function top(Request $request)
    {
        try {
            $limit = (int) $request->get('limit', 20);
            $period = $request->get('period', 'all');
            
            $dateFilter = null;
            switch ($period) {
                case 'day':
                    $dateFilter = now()->startOfDay();
                    break;
                case 'week':
                    $dateFilter = now()->subWeek();
                    break;
                case 'month':
                    $dateFilter = now()->subMonth();
                    break;
                case 'year':
                    $dateFilter = now()->subYear();
                    break;
            }
            
            $shops = DB::table('suppliers')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.slug,
                    suppliers.logo,
                    suppliers.address,
                    suppliers.is_active,
                    (SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id AND products.is_active = 1) as products_count,
                    (SELECT COUNT(*) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered"' . ($dateFilter ? ' AND orders.created_at >= "' . $dateFilter . '"' : '') . ') as total_sales,
                    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered"' . ($dateFilter ? ' AND orders.created_at >= "' . $dateFilter . '"' : '') . ') as revenue,
                    (SELECT AVG(rating) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as avg_rating,
                    (SELECT COUNT(*) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as ratings_count,
                    (SELECT AVG(delivery_time) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered") as avg_delivery_time
                ')
                ->where('suppliers.is_active', 1)
                ->orderByDesc('avg_rating')
                ->orderByDesc('total_sales')
                ->orderByDesc('revenue')
                ->limit($limit)
                ->get();
            
            // Add rank
            $shops = $shops->map(function ($shop, $index) {
                $shop->rank = $index + 1;
                
                // Calculate score
                $ratingScore = ($shop->avg_rating ?? 0) * 20; // 0-100
                $salesScore = min(($shop->total_sales ?? 0) / 10, 100); // Max at 1000 sales
                $shop->score = round($ratingScore + $salesScore, 1);
                
                return $shop;
            });
            
            return response()->json([
                'success' => true,
                'data' => $shops,
                'meta' => [
                    'period' => $period,
                    'total_shops' => count($shops)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('ShopController top error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading top shops'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/shops
     * 
     * Get all active shops
     */
    public function index(Request $request)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 20)));
            $search = trim($request->get('search', ''));
            
            $query = DB::table('suppliers')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.slug,
                    suppliers.logo,
                    suppliers.address,
                    suppliers.is_active,
                    (SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id AND products.is_active = 1) as products_count,
                    (SELECT AVG(rating) FROM testimonials WHERE testimonials.supplier_id = suppliers.id) as avg_rating
                ')
                ->where('suppliers.is_active', 1);
            
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('suppliers.name', 'like', '%' . $search . '%')
                        ->orWhere('suppliers.address', 'like', '%' . $search . '%');
                });
            }
            
            $offset = ($page - 1) * $perPage;
            $countQuery = clone $query;
            $total = (int) $countQuery->count();
            
            $shops = $query
                ->orderByDesc('avg_rating')
                ->offset($offset)
                ->limit($perPage)
                ->get();
            
            $lastPage = (int) max(1, ceil($total / $perPage));
            
            return response()->json([
                'success' => true,
                'data' => $shops,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('ShopController index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading shops'
            ], 500);
        }
    }
}
