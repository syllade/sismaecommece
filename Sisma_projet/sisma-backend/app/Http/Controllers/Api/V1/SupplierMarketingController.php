<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Supplier Marketing Controller - Merchant Space
 * Handles CPC campaigns and advertising for suppliers
 */
class SupplierMarketingController extends Controller
{
    /**
     * Get supplier's campaigns
     * GET /api/v1/supplier/campaigns
     */
    public function index(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $query = DB::table('marketing_campaigns')
                ->where('supplier_id', $supplierId);

            // Filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
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
            $campaigns = $query->skip($offset)->take($perPage)->get();

            // Transform campaigns
            $transformed = $campaigns->map(function ($campaign) {
                return $this->transformCampaign($campaign);
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
            Log::error('SupplierMarketingController@index error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des campagnes'], 500);
        }
    }

    /**
     * Get single campaign
     * GET /api/v1/supplier/campaigns/{id}
     */
    public function show($id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $campaign = DB::table('marketing_campaigns')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$campaign) {
                return response()->json(['message' => 'Campagne non trouvée'], 404);
            }

            // Get product details
            $product = null;
            if ($campaign->product_id) {
                $product = DB::table('products')
                    ->where('id', $campaign->product_id)
                    ->first();
            }

            // Get campaign stats
            $stats = $this->getCampaignStats($id);

            return response()->json([
                'campaign' => $this->transformCampaign($campaign),
                'product' => $product,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@show error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération de la campagne'], 500);
        }
    }

    /**
     * Create new campaign
     * POST /api/v1/supplier/campaigns
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
                'type' => 'required|string|in:sponsored,featured,banner',
                'product_id' => 'required|integer|exists:products,id',
                'budget' => 'required|numeric|min:0',
                'cpc' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            // Verify product belongs to supplier
            $product = DB::table('products')
                ->where('id', $request->product_id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$product) {
                return response()->json(['message' => 'Produit non trouvé ou ne vous appartient pas'], 403);
            }

            // Check if supplier has sufficient balance
            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
            $balance = (float) ($supplier->advertising_balance ?? 0);

            if ($balance < $request->budget) {
                return response()->json([
                    'message' => 'Solde publicitaire insuffisant',
                    'available_balance' => $balance,
                    'required_budget' => $request->budget,
                ], 400);
            }

            // Deduct budget from balance
            DB::table('suppliers')
                ->where('id', $supplierId)
                ->decrement('advertising_balance', $request->budget);

            // Calculate CPC if not provided
            $cpc = $request->cpc ?? config('fashop.default_cpc', 0.50);

            // Create campaign
            $campaignId = DB::table('marketing_campaigns')->insertGetId([
                'supplier_id' => $supplierId,
                'product_id' => $request->product_id,
                'name' => $request->name,
                'type' => $request->type,
                'budget' => $request->budget,
                'spent' => 0,
                'cpc' => $cpc,
                'ctr' => 0,
                'acos' => 0,
                'impressions' => 0,
                'clicks' => 0,
                'conversions' => 0,
                'start_date' => $request->start_date ?? now(),
                'end_date' => $request->end_date,
                'status' => 'pending', // Requires admin approval
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $campaign = DB::table('marketing_campaigns')->where('id', $campaignId)->first();

            return response()->json([
                'message' => 'Campagne créée, en attente de validation',
                'campaign' => $this->transformCampaign($campaign),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@store error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la création de la campagne'], 500);
        }
    }

    /**
     * Update campaign
     * PUT /api/v1/supplier/campaigns/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $campaign = DB::table('marketing_campaigns')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$campaign) {
                return response()->json(['message' => 'Campagne non trouvée'], 404);
            }

            // Only allow editing active or paused campaigns
            if (!in_array($campaign->status, ['active', 'paused', 'pending'])) {
                return response()->json(['message' => 'Impossible de modifier cette campagne'], 400);
            }

            $request->validate([
                'name' => 'nullable|string|max:255',
                'budget' => 'nullable|numeric|min:0',
                'cpc' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
            ]);

            $updateData = ['updated_at' => now()];

            if ($request->has('name')) $updateData['name'] = $request->name;
            if ($request->has('cpc')) $updateData['cpc'] = $request->cpc;
            if ($request->has('start_date')) $updateData['start_date'] = $request->start_date;
            if ($request->has('end_date')) $updateData['end_date'] = $request->end_date;

            // Handle budget adjustment
            if ($request->has('budget') && $request->budget != $campaign->budget) {
                $difference = $request->budget - $campaign->budget;

                if ($difference > 0) {
                    // Adding budget - check supplier balance
                    $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
                    $balance = (float) ($supplier->advertising_balance ?? 0);

                    if ($balance < $difference) {
                        return response()->json([
                            'message' => 'Solde publicitaire insuffisant',
                            'available_balance' => $balance,
                            'required_additional' => $difference,
                        ], 400);
                    }

                    DB::table('suppliers')
                        ->where('id', $supplierId)
                        ->decrement('advertising_balance', $difference);
                } else {
                    // Refunding difference to balance
                    DB::table('suppliers')
                        ->where('id', $supplierId)
                        ->increment('advertising_balance', abs($difference));
                }

                $updateData['budget'] = $request->budget;
            }

            DB::table('marketing_campaigns')->where('id', $id)->update($updateData);

            $updatedCampaign = DB::table('marketing_campaigns')->where('id', $id)->first();

            return response()->json([
                'message' => 'Campagne mise à jour',
                'campaign' => $this->transformCampaign($updatedCampaign),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@update error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    /**
     * Pause/Resume campaign
     * PUT /api/v1/supplier/campaigns/{id}/toggle
     */
    public function toggle(Request $request, $id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $campaign = DB::table('marketing_campaigns')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$campaign) {
                return response()->json(['message' => 'Campagne non trouvée'], 404);
            }

            if ($campaign->status === 'active') {
                DB::table('marketing_campaigns')
                    ->where('id', $id)
                    ->update(['status' => 'paused', 'updated_at' => now()]);
                return response()->json(['message' => 'Campagne en pause', 'status' => 'paused']);
            } elseif ($campaign->status === 'paused') {
                // Check if campaign has budget
                $remaining = $campaign->budget - $campaign->spent;
                if ($remaining <= 0) {
                    return response()->json(['message' => 'Budget épuisé'], 400);
                }

                DB::table('marketing_campaigns')
                    ->where('id', $id)
                    ->update(['status' => 'active', 'updated_at' => now()]);
                return response()->json(['message' => 'Campagne reprise', 'status' => 'active']);
            } else {
                return response()->json(['message' => 'Impossible de modifier cette campagne'], 400);
            }
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@toggle error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Delete campaign
     * DELETE /api/v1/supplier/campaigns/{id}
     */
    public function destroy($id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $campaign = DB::table('marketing_campaigns')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$campaign) {
                return response()->json(['message' => 'Campagne non trouvée'], 404);
            }

            // Refund remaining budget
            $remaining = $campaign->budget - $campaign->spent;
            if ($remaining > 0) {
                DB::table('suppliers')
                    ->where('id', $supplierId)
                    ->increment('advertising_balance', $remaining);
            }

            DB::table('marketing_campaigns')->where('id', $id)->delete();

            return response()->json(['message' => 'Campagne supprimée']);
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }

    /**
     * Get campaign statistics
     * GET /api/v1/supplier/campaigns/{id}/stats
     */
    public function stats($id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $campaign = DB::table('marketing_campaigns')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$campaign) {
                return response()->json(['message' => 'Campagne non trouvée'], 404);
            }

            $stats = $this->getCampaignStats($id);

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@stats error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get advertising balance
     * GET /api/v1/supplier/advertising/balance
     */
    public function balance()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

            return response()->json([
                'balance' => (float) ($supplier->advertising_balance ?? 0),
                'currency' => 'XOF',
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@balance error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Add funds to advertising balance
     * POST /api/v1/supplier/advertising/deposit
     */
    public function deposit(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'amount' => 'required|numeric|min:1000',
            ]);

            // In production, this would integrate with payment gateway
            // For now, just add to balance (would require payment confirmation)
            DB::table('suppliers')
                ->where('id', $supplierId)
                ->increment('advertising_balance', $request->amount);

            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

            return response()->json([
                'message' => 'Funds added successfully',
                'new_balance' => (float) $supplier->advertising_balance,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierMarketingController@deposit error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Transform campaign for API response
     */
    private function transformCampaign($campaign)
    {
        $product = null;
        if ($campaign->product_id) {
            $product = DB::table('products')
                ->where('id', $campaign->product_id)
                ->first();
        }

        return [
            'id' => (int) $campaign->id,
            'supplier_id' => (int) $campaign->supplier_id,
            'product_id' => (int) $campaign->product_id,
            'product_name' => $product ? $product->name : null,
            'product_image' => $product ? $product->image : null,
            'name' => $campaign->name,
            'type' => $campaign->type,
            'budget' => (float) $campaign->budget,
            'spent' => (float) $campaign->spent,
            'remaining' => (float) ($campaign->budget - $campaign->spent),
            'cpc' => (float) $campaign->cpc,
            'ctr' => (float) $campaign->ctr,
            'acos' => (float) $campaign->acos,
            'impressions' => (int) $campaign->impressions,
            'clicks' => (int) $campaign->clicks,
            'conversions' => (int) $campaign->conversions,
            'start_date' => $campaign->start_date,
            'end_date' => $campaign->end_date,
            'status' => $campaign->status,
            'created_at' => $campaign->created_at,
            'updated_at' => $campaign->updated_at,
        ];
    }

    /**
     * Get campaign statistics
     */
    private function getCampaignStats($campaignId)
    {
        $campaign = DB::table('marketing_campaigns')->where('id', $campaignId)->first();

        // Daily stats for the last 30 days
        $dailyStats = DB::table('marketing_campaign_stats')
            ->where('campaign_id', $campaignId)
            ->whereDate('created_at', '>=', now()->subDays(30))
            ->orderBy('date')
            ->get();

        // Calculate metrics
        $impressions = (int) $campaign->impressions;
        $clicks = (int) $campaign->clicks;
        $conversions = (int) $campaign->conversions;
        $spent = (float) $campaign->spent;

        $ctr = $impressions > 0 ? ($clicks / $impressions) * 100 : 0;
        $conversionRate = $clicks > 0 ? ($conversions / $clicks) * 100 : 0;
        $acos = $conversions > 0 ? ($spent / $conversions) * 100 : 0;

        return [
            'overview' => [
                'impressions' => $impressions,
                'clicks' => $clicks,
                'conversions' => $conversions,
                'ctr' => round($ctr, 2),
                'conversion_rate' => round($conversionRate, 2),
                'acos' => round($acos, 2),
                'spent' => $spent,
                'remaining' => (float) ($campaign->budget - $spent),
            ],
            'daily' => $dailyStats,
        ];
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
