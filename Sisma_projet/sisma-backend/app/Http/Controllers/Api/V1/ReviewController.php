<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller for Reviews and Ratings
 * 
 * Endpoints:
 * - POST /api/v1/products/{id}/reviews - Add review to product
 * - GET /api/v1/products/{id}/reviews - Get product reviews
 * - GET /api/v1/products/{id}/reviews-summary - Get product rating summary
 * - POST /api/v1/shops/{id}/reviews - Add review to supplier
 * - GET /api/v1/shops/{id}/reviews - Get supplier reviews
 * - GET /api/v1/shops/{id}/reviews-summary - Get supplier rating summary
 * - POST /api/v1/admin/reviews/{id}/verify - Verify review (admin)
 * - DELETE /api/v1/admin/reviews/{id} - Delete review (admin)
 */
class ReviewController extends Controller
{
    /**
     * POST /api/v1/products/{id}/reviews
     * 
     * Add review to product
     */
    public function storeProductReview(Request $request, $productId)
    {
        try {
            $validated = $request->validate([
                'rating' => 'required|integer|between:1,5',
                'comment' => 'nullable|string|max:1000',
                'user_name' => 'required|string|max:100',
                'order_id' => 'nullable|integer'
            ]);

            // Verify product exists
            $product = DB::table('products')->where('id', $productId)->first();
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit non trouvé'
                ], 404);
            }

            // Check if user already reviewed this product from this order
            if ($validated['order_id']) {
                $existing = DB::table('reviews')
                    ->where('order_id', $validated['order_id'])
                    ->where('product_id', $productId)
                    ->first();
                
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous avez déjà noté ce produit'
                    ], 400);
                }
            }

            // Create review
            $reviewId = DB::table('reviews')->insertGetId([
                'product_id' => $productId,
                'supplier_id' => $product->supplier_id,
                'order_id' => $validated['order_id'] ?? null,
                'user_id' => $request->user()->id ?? null,
                'user_name' => $validated['user_name'],
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'is_verified' => !empty($validated['order_id']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Update product review summary
            $this->updateProductReviewSummary($productId);

            // Update supplier review summary
            if ($product->supplier_id) {
                $this->updateSupplierReviewSummary($product->supplier_id);
            }

            return response()->json([
                'success' => true,
                'message' => 'Avis enregistré avec succès',
                'data' => [
                    'id' => $reviewId,
                    'rating' => $validated['rating'],
                    'is_verified' => !empty($validated['order_id'])
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('ReviewController storeProductReview error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement'
            ], 500);
        }
    }

    /**
     * GET /api/v1/products/{id}/reviews
     * 
     * Get product reviews
     */
    public function getProductReviews(Request $request, $productId)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 10)));

            $query = DB::table('reviews')
                ->where('product_id', $productId)
                ->where('is_active', 1);

            $countQuery = clone $query;
            $total = (int) $countQuery->count();

            $reviews = $query
                ->orderByDesc('created_at')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reviews,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => (int) max(1, ceil($total / $perPage))
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('ReviewController getProductReviews error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement'
            ], 500);
        }
    }

    /**
     * GET /api/v1/products/{id}/reviews-summary
     * 
     * Get product rating summary
     */
    public function getProductReviewsSummary($productId)
    {
        try {
            $summary = DB::table('product_reviews')
                ->where('product_id', $productId)
                ->first();

            if (!$summary) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'avg_rating' => 0,
                        'total_reviews' => 0,
                        'distribution' => [
                            '5' => 0,
                            '4' => 0,
                            '3' => 0,
                            '2' => 0,
                            '1' => 0
                        ]
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'avg_rating' => (float) $summary->avg_rating,
                    'total_reviews' => $summary->total_reviews,
                    'distribution' => [
                        '5' => $summary->five_stars,
                        '4' => $summary->four_stars,
                        '3' => $summary->three_stars,
                        '2' => $summary->two_stars,
                        '1' => $summary->one_star
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('ReviewController getProductReviewsSummary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement'
            ], 500);
        }
    }

    /**
     * POST /api/v1/shops/{id}/reviews
     * 
     * Add review to supplier
     */
    public function storeSupplierReview(Request $request, $supplierId)
    {
        try {
            $validated = $request->validate([
                'rating' => 'required|integer|between:1,5',
                'comment' => 'nullable|string|max:1000',
                'user_name' => 'required|string|max:100',
                'order_id' => 'nullable|integer'
            ]);

            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }

            $reviewId = DB::table('reviews')->insertGetId([
                'supplier_id' => $supplierId,
                'order_id' => $validated['order_id'] ?? null,
                'user_id' => $request->user()->id ?? null,
                'user_name' => $validated['user_name'],
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'is_verified' => !empty($validated['order_id']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $this->updateSupplierReviewSummary($supplierId);

            return response()->json([
                'success' => true,
                'message' => 'Avis enregistré avec succès',
                'data' => ['id' => $reviewId]
            ], 201);
        } catch (\Exception $e) {
            Log::error('ReviewController storeSupplierReview error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement'
            ], 500);
        }
    }

    /**
     * GET /api/v1/shops/{id}/reviews
     * 
     * Get supplier reviews
     */
    public function getSupplierReviews(Request $request, $supplierId)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 10)));

            $query = DB::table('reviews')
                ->where('supplier_id', $supplierId)
                ->where('is_active', 1);

            $total = (int) clone $query->count();

            $reviews = $query
                ->orderByDesc('created_at')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reviews,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => (int) max(1, ceil($total / $perPage))
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement'
            ], 500);
        }
    }

    /**
     * GET /api/v1/shops/{id}/reviews-summary
     * 
     * Get supplier rating summary
     */
    public function getSupplierReviewsSummary($supplierId)
    {
        try {
            $summary = DB::table('supplier_reviews')
                ->where('supplier_id', $supplierId)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $summary ? [
                    'avg_rating' => (float) $summary->avg_rating,
                    'total_reviews' => $summary->total_reviews
                ] : [
                    'avg_rating' => 0,
                    'total_reviews' => 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement'
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/reviews
     * 
     * List all reviews with filters (admin)
     */
    public function listReviews(Request $request)
    {
        try {
            $query = DB::table('reviews')
                ->leftJoin('products', 'reviews.product_id', '=', 'products.id')
                ->leftJoin('suppliers', 'reviews.supplier_id', '=', 'suppliers.id')
                ->select(
                    'reviews.*',
                    'products.name as product_name',
                    'products.image as product_image',
                    'suppliers.name as supplier_name'
                );
            
            // Filter by type
            if ($request->type === 'product') {
                $query->whereNotNull('reviews.product_id');
            } elseif ($request->type === 'supplier') {
                $query->whereNotNull('reviews.supplier_id');
            }
            
            // Filter by rating
            if ($request->min_rating) {
                $query->where('reviews.rating', '>=', $request->min_rating);
            }
            if ($request->max_rating) {
                $query->where('reviews.rating', '<=', $request->max_rating);
            }
            
            // Search
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('reviews.comment', 'like', "%{$request->search}%")
                      ->orWhere('reviews.user_name', 'like', "%{$request->search}%");
                });
            }
            
            // Filter by verified status
            if ($request->status === 'verified') {
                $query->where('reviews.is_verified', true);
            } elseif ($request->status === 'unverified') {
                $query->where('reviews.is_verified', false);
            }
            
            // Sort
            $sortBy = $request->sort_by ?? 'created_at';
            $sortDir = $request->sort_dir ?? 'desc';
            $query->orderBy("reviews.{$sortBy}", $sortDir);
            
            // Pagination
            $page = $request->page ?? 1;
            $perPage = $request->per_page ?? 20;
            $offset = ($page - 1) * $perPage;
            
            $total = $query->count();
            $reviews = $query->offset($offset)->limit($perPage)->get();
            
            // Format data
            $data = $reviews->map(function ($review) {
                return [
                    'id' => $review->id,
                    'product_id' => $review->product_id,
                    'supplier_id' => $review->supplier_id,
                    'user_id' => $review->user_id,
                    'order_id' => $review->order_id,
                    'rating' => (int) $review->rating,
                    'comment' => $review->comment,
                    'user_name' => $review->user_name,
                    'is_verified' => (bool) $review->is_verified,
                    'is_featured' => (bool) $review->is_featured,
                    'created_at' => $review->created_at,
                    'updated_at' => $review->updated_at,
                    'product' => $review->product_id ? [
                        'id' => $review->product_id,
                        'name' => $review->product_name,
                        'image' => $review->product_image,
                    ] : null,
                    'supplier' => $review->supplier_id ? [
                        'id' => $review->supplier_id,
                        'name' => $review->supplier_name,
                    ] : null,
                ];
            });
            
            return response()->json([
                'data' => $data,
                'meta' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement'
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/reviews/{id}/verify
     * 
     * Verify a review (admin)
     */
    public function verifyReview($id)
    {
        try {
            $review = DB::table('reviews')->where('id', $id)->first();
            if (!$review) {
                return response()->json(['success' => false, 'message' => 'Avis non trouvé'], 404);
            }

            DB::table('reviews')
                ->where('id', $id)
                ->update(['is_verified' => true, 'updated_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Avis vérifié'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/reviews/{id}
     * 
     * Delete a review (admin)
     */
    public function deleteReview($id)
    {
        try {
            $review = DB::table('reviews')->where('id', $id)->first();
            if (!$review) {
                return response()->json(['success' => false, 'message' => 'Avis non trouvé'], 404);
            }

            DB::table('reviews')->where('id', $id)->delete();

            // Update summaries
            if ($review->product_id) {
                $this->updateProductReviewSummary($review->product_id);
            }
            if ($review->supplier_id) {
                $this->updateSupplierReviewSummary($review->supplier_id);
            }

            return response()->json([
                'success' => true,
                'message' => 'Avis supprimé'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }

    /**
     * Update product review summary
     */
    private function updateProductReviewSummary($productId)
    {
        $stats = DB::table('reviews')
            ->where('product_id', $productId)
            ->where('is_active', 1)
            ->selectRaw('
                COUNT(*) as total,
                AVG(rating) as avg,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one
            ')
            ->first();

        DB::table('product_reviews')->updateOrInsert(
            ['product_id' => $productId],
            [
                'avg_rating' => $stats->avg ?? 0,
                'total_reviews' => $stats->total ?? 0,
                'five_stars' => $stats->five ?? 0,
                'four_stars' => $stats->four ?? 0,
                'three_stars' => $stats->three ?? 0,
                'two_stars' => $stats->two ?? 0,
                'one_star' => $stats->one ?? 0,
                'updated_at' => now()
            ]
        );
    }

    /**
     * Update supplier review summary
     */
    private function updateSupplierReviewSummary($supplierId)
    {
        $stats = DB::table('reviews')
            ->where('supplier_id', $supplierId)
            ->where('is_active', 1)
            ->selectRaw('COUNT(*) as total, AVG(rating) as avg')
            ->first();

        DB::table('supplier_reviews')->updateOrInsert(
            ['supplier_id' => $supplierId],
            [
                'avg_rating' => $stats->avg ?? 0,
                'total_reviews' => $stats->total ?? 0,
                'updated_at' => now()
            ]
        );
    }
}
