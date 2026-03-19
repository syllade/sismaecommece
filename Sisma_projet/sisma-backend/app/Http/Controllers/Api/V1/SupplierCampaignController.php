<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SponsoredCampaign;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierCampaignController extends Controller
{
    /**
     * Liste des campagnes du fournisseur
     * GET /api/v1/supplier/campaigns
     */
    public function index(Request $request)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;
        
        $campaigns = SponsoredCampaign::where('supplier_id', $supplierId)
            ->with('product:id,name,image,price')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($campaign) {
                return [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'product' => $campaign->product,
                    'budget' => $campaign->budget,
                    'spent' => $campaign->spent,
                    'remaining' => $campaign->budget - $campaign->spent,
                    'impressions' => $campaign->impressions,
                    'clicks' => $campaign->clicks,
                    'conversions' => $campaign->conversions,
                    'ctr' => $campaign->ctr,
                    'conversion_rate' => $campaign->conversion_rate,
                    'status' => $campaign->status,
                    'start_date' => $campaign->start_date,
                    'end_date' => $campaign->end_date,
                    'priority' => $campaign->priority,
                    'created_at' => $campaign->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    /**
     * Créer une nouvelle campagne
     * POST /api/v1/supplier/campaigns
     */
    public function store(Request $request)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
            'budget' => 'required|numeric|min:1000',
            'daily_budget' => 'nullable|numeric|min:500',
            'cost_per_click' => 'nullable|numeric|min:10',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'priority' => 'nullable|integer|min:0|max:10',
        ]);

        // Vérifier que le produit appartient au fournisseur
        $product = Product::find($validated['product_id']);
        if ($product->supplier_id != $supplierId) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas promouvoir ce produit',
            ], 403);
        }

        // Créer la campagne
        $campaign = SponsoredCampaign::create([
            'supplier_id' => $supplierId,
            'product_id' => $validated['product_id'],
            'name' => $validated['name'],
            'budget' => $validated['budget'],
            'daily_budget' => $validated['daily_budget'] ?? null,
            'cost_per_click' => $validated['cost_per_click'] ?? 50,
            'status' => 'active',
            'start_date' => $validated['start_date'] ?? now(),
            'end_date' => $validated['end_date'] ?? null,
            'priority' => $validated['priority'] ?? 0,
        ]);

        // Marquer le produit comme sponsorisé
        $product->update(['is_sponsored' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Campagne créée avec succès',
            'data' => $campaign,
        ], 201);
    }

    /**
     * Voir les détails d'une campagne
     * GET /api/v1/supplier/campaigns/{id}
     */
    public function show(Request $request, $id)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;

        $campaign = SponsoredCampaign::where('supplier_id', $supplierId)
            ->with('product')
            ->find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'product' => $campaign->product,
                'budget' => $campaign->budget,
                'spent' => $campaign->spent,
                'remaining' => $campaign->budget - $campaign->spent,
                'impressions' => $campaign->impressions,
                'clicks' => $campaign->clicks,
                'conversions' => $campaign->conversions,
                'ctr' => $campaign->ctr,
                'conversion_rate' => $campaign->conversion_rate,
                'cost_per_click' => $campaign->cost_per_click,
                'status' => $campaign->status,
                'start_date' => $campaign->start_date,
                'end_date' => $campaign->end_date,
                'priority' => $campaign->priority,
                'created_at' => $campaign->created_at,
            ],
        ]);
    }

    /**
     * Mettre à jour une campagne
     * PUT /api/v1/supplier/campaigns/{id}
     */
    public function update(Request $request, $id)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;

        $campaign = SponsoredCampaign::where('supplier_id', $supplierId)->find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'budget' => 'sometimes|numeric|min:1000',
            'daily_budget' => 'nullable|numeric|min:500',
            'cost_per_click' => 'nullable|numeric|min:10',
            'status' => 'sometimes|in:active,paused,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'priority' => 'nullable|integer|min:0|max:10',
        ]);

        $campaign->update($validated);

        // Si la campagne est terminée, retirer le statut sponsorisé du produit
        if ($validated['status'] ?? '' === 'completed') {
            $campaign->product->update(['is_sponsored' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Campagne mise à jour',
            'data' => $campaign,
        ]);
    }

    /**
     * Supprimer une campagne
     * DELETE /api/v1/supplier/campaigns/{id}
     */
    public function destroy(Request $request, $id)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;

        $campaign = SponsoredCampaign::where('supplier_id', $supplierId)->find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée',
            ], 404);
        }

        // Retirer le statut sponsorisé du produit
        $campaign->product->update(['is_sponsored' => false]);
        
        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Campagne supprimée',
        ]);
    }

    /**
     * Mettre en pause/reprendre une campagne
     * POST /api/v1/supplier/campaigns/{id}/toggle
     */
    public function toggle(Request $request, $id)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;

        $campaign = SponsoredCampaign::where('supplier_id', $supplierId)->find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée',
            ], 404);
        }

        $newStatus = $campaign->status === 'active' ? 'paused' : 'active';
        $campaign->update(['status' => $newStatus]);

        // Mettre à jour le statut sponsorisé du produit
        $campaign->product->update(['is_sponsored' => $newStatus === 'active']);

        return response()->json([
            'success' => true,
            'message' => $newStatus === 'active' ? 'Campagne activée' : 'Campagne mise en pause',
            'data' => ['status' => $newStatus],
        ]);
    }

    /**
     * Statistiques globales des campagnes
     * GET /api/v1/supplier/campaigns/stats
     */
    public function stats(Request $request)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;

        $campaigns = SponsoredCampaign::where('supplier_id', $supplierId)->get();

        $totalBudget = $campaigns->sum('budget');
        $totalSpent = $campaigns->sum('spent');
        $totalImpressions = $campaigns->sum('impressions');
        $totalClicks = $campaigns->sum('clicks');
        $totalConversions = $campaigns->sum('conversions');

        $activeCampaigns = $campaigns->where('status', 'active')->count();
        $pausedCampaigns = $campaigns->where('status', 'paused')->count();
        $completedCampaigns = $campaigns->where('status', 'completed')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_campaigns' => $campaigns->count(),
                'active_campaigns' => $activeCampaigns,
                'paused_campaigns' => $pausedCampaigns,
                'completed_campaigns' => $completedCampaigns,
                'total_budget' => $totalBudget,
                'total_spent' => $totalSpent,
                'remaining_budget' => $totalBudget - $totalSpent,
                'total_impressions' => $totalImpressions,
                'total_clicks' => $totalClicks,
                'total_conversions' => $totalConversions,
                'overall_ctr' => $totalImpressions > 0 ? round(($totalClicks / $totalImpressions) * 100, 2) : 0,
                'overall_conversion_rate' => $totalClicks > 0 ? round(($totalConversions / $totalClicks) * 100, 2) : 0,
            ],
        ]);
    }

    /**
     * Produits disponibles pour sponsorship
     * GET /api/v1/supplier/campaigns/products
     */
    public function products(Request $request)
    {
        $supplierId = $request->user()->supplier_id ?? $request->user()->id;

        $products = Product::where('supplier_id', $supplierId)
            ->where('status', 'active')
            ->select('id', 'name', 'image', 'price', 'is_sponsored')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }
}
