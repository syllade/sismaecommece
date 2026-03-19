<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SponsoredCampaign;
use App\Models\Product;
use App\Models\Supplier;
use App\Jobs\RecordSponsoredImpression;
use App\Jobs\RecordSponsoredClick;
use App\Jobs\RecordSponsoredConversion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SponsoredController extends Controller
{
    /**
     * Liste des produits sponsorisés (public)
     * GET /api/v1/sponsored/products
     */
    public function products(Request $request)
    {
        $limit = $request->input('limit', 10);
        
        // Cache les résultats pendant 5 minutes
        $cacheKey = "sponsored_products_{$limit}";
        
        $products = Cache::remember($cacheKey, 300, function () use ($limit) {
            return SponsoredCampaign::active()
                ->with(['product' => function ($query) {
                    $query->select('id', 'name', 'image', 'price', 'supplier_id', 'category_id')
                        ->where('status', 'active');
                }])
                ->byPriority()
                ->limit($limit)
                ->get()
                ->map(function ($campaign) {
                    $product = $campaign->product;
                    if (!$product) return null;
                    $product->is_sponsored = true;
                    $product->sponsored_campaign_id = $campaign->id;
                    return $product;
                })
                ->filter()
                ->values();
        });

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Liste des boutiques sponsorisées (public)
     * GET /api/v1/sponsored/suppliers
     */
    public function suppliers(Request $request)
    {
        $limit = $request->input('limit', 6);
        
        // Cache les résultats pendant 5 minutes
        $cacheKey = "sponsored_suppliers_{$limit}";
        
        $suppliers = Cache::remember($cacheKey, 300, function () use ($limit) {
            return Supplier::where('is_sponsored', true)
                ->where('status', 'active')
                ->orderBy('sponsored_priority', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($supplier) {
                    $productCount = DB::table('products')
                        ->where('supplier_id', $supplier->id)
                        ->where('status', 'active')
                        ->count();
                    
                    return [
                        'id' => $supplier->id,
                        'name' => $supplier->name,
                        'slug' => $supplier->slug,
                        'logo' => $supplier->logo,
                        'cover_image' => $supplier->cover_image ?? $supplier->banner,
                        'rating' => $supplier->rating ?? 0,
                        'product_count' => $productCount,
                        'is_verified' => $supplier->verified ?? false,
                    ];
                });
        });

        return response()->json([
            'success' => true,
            'data' => $suppliers,
        ]);
    }

    /**
     * Enregistrer une impression (public) - Utilise la queue pour scalabilité
     * POST /api/v1/sponsored/impression
     */
    public function recordImpression(Request $request)
    {
        $campaignId = $request->input('campaign_id');
        $productId = $request->input('product_id');

        if (!$campaignId && $productId) {
            $campaignId = SponsoredCampaign::active()
                ->where('product_id', $productId)
                ->value('id');
        }
        
        if ($campaignId) {
            // Dispatch le job pour traitement asynchrone
            RecordSponsoredImpression::dispatch($campaignId);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Enregistrer un clic (public) - Utilise la queue pour scalabilité
     * POST /api/v1/sponsored/click
     */
    public function recordClick(Request $request)
    {
        $campaignId = $request->input('campaign_id');
        $productId = $request->input('product_id');

        if (!$campaignId && $productId) {
            $campaignId = SponsoredCampaign::active()
                ->where('product_id', $productId)
                ->value('id');
        }
        
        if ($campaignId) {
            // Dispatch le job pour traitement asynchrone
            RecordSponsoredClick::dispatch($campaignId);
            
            return response()->json([
                'success' => true,
                'data' => ['click_recorded' => true]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Campagne non trouvée'
        ], 404);
    }

    /**
     * Enregistrer une conversion (public)
     * POST /api/v1/sponsored/conversion
     */
    public function recordConversion(Request $request)
    {
        $campaignId = $request->input('campaign_id');
        $productId = $request->input('product_id');

        if (!$campaignId && $productId) {
            $campaignId = SponsoredCampaign::active()
                ->where('product_id', $productId)
                ->value('id');
        }
        
        if ($campaignId) {
            RecordSponsoredConversion::dispatch($campaignId);

            return response()->json([
                'success' => true,
                'data' => ['conversion_recorded' => true]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Campagne non trouvée'
        ], 404);
    }

    /**
     * Produits sponsorisés mélangés avec organiques (public)
     * GET /api/v1/sponsored/mixed
     */
    public function mixed(Request $request)
    {
        $limit = $request->input('limit', 20);
        $sponsoredRatio = 0.3; // 30% de produits sponsorisés
        
        $sponsoredCount = (int) ceil($limit * $sponsoredRatio);
        $organicCount = $limit - $sponsoredCount;
        
        // Cache les résultats
        $cacheKey = "mixed_products_{$limit}";
        
        $mixed = Cache::remember($cacheKey, 300, function () use ($sponsoredCount, $organicCount) {
            // Récupérer les produits sponsorisés
            $sponsoredProducts = SponsoredCampaign::active()
                ->with(['product' => function ($query) {
                    $query->select('id', 'name', 'image', 'price', 'supplier_id', 'category_id', 'original_price', 'discount')
                        ->where('status', 'active');
                }])
                ->byPriority()
                ->limit($sponsoredCount)
                ->get()
                ->map(function ($campaign) {
                    $product = $campaign->product;
                    if (!$product) return null;
                    $product->is_sponsored = true;
                    $product->sponsored_campaign_id = $campaign->id;
                    return $product;
                })
                ->filter()
                ->values();
            
            // Récupérer les produits organiques
            $organicProducts = Product::where('status', 'active')
                ->where('is_sponsored', false)
                ->inRandomOrder()
                ->limit($organicCount)
                ->get()
                ->map(function ($product) {
                    $product->is_sponsored = false;
                    return $product;
                });
            
            // Mélanger les produits
            return $sponsoredProducts->concat($organicProducts)->shuffle()->values();
        });

        return response()->json([
            'success' => true,
            'data' => $mixed,
        ]);
    }
}
