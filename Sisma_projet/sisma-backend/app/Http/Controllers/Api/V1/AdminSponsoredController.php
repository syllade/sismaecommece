<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SponsoredCampaign;
use App\Models\Product;
use App\Models\Supplier;
use App\Support\SponsoredCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AdminSponsoredController extends Controller
{
    /**
     * Dashboard global des campagnes sponsorisées
     * GET /api/v1/admin/sponsored/dashboard
     */
    public function dashboard(Request $request)
    {
        $cacheKey = 'sponsored_dashboard_v1';
        $data = Cache::remember($cacheKey, 120, function () {
            $campaigns = SponsoredCampaign::all();
            
            // Statistiques globales
            $totalBudget = $campaigns->sum('budget');
            $totalSpent = $campaigns->sum('spent');
            $totalImpressions = $campaigns->sum('impressions');
            $totalClicks = $campaigns->sum('clicks');
            $totalConversions = $campaigns->sum('conversions');
            
            // Statuts
            $activeCampaigns = $campaigns->where('status', 'active')->count();
            $pausedCampaigns = $campaigns->where('status', 'paused')->count();
            $completedCampaigns = $campaigns->where('status', 'completed')->count();
            $expiredCampaigns = $campaigns->where('status', 'expired')->count();
            
            // Campagnes avec budget faible (moins de 20%)
            $lowBudgetCampaigns = $campaigns->filter(function ($c) {
                return $c->budget > 0 && ($c->spent / $c->budget) >= 0.8 && $c->status === 'active';
            })->count();
            
            // Campagnes expirant dans les 3 jours
            $expiringCampaigns = $campaigns->filter(function ($c) {
                return $c->end_date && 
                       $c->end_date->isFuture() && 
                       $c->end_date->diffInDays(now()) <= 3 &&
                       $c->status === 'active';
            })->count();

            // Campagnes expirées par date
            $expiredByDate = $campaigns->filter(function ($c) {
                return $c->end_date && $c->end_date->isPast();
            })->count();
            
            // Top produits sponsorisés
            $topProducts = SponsoredCampaign::select('sponsored_campaigns.*', 
                DB::raw('(sponsored_campaigns.clicks / NULLIF(sponsored_campaigns.impressions, 0) * 100) as ctr'),
                DB::raw('(sponsored_campaigns.conversions / NULLIF(sponsored_campaigns.clicks, 0) * 100) as conversion_rate')
            )
                ->join('products', 'sponsored_campaigns.product_id', '=', 'products.id')
                ->with(['product:id,name,image', 'supplier:id,name'])
                ->orderByDesc('clicks')
                ->limit(10)
                ->get();
            
            // Top fournisseurs
            $topSuppliers = SponsoredCampaign::select(
                'supplier_id',
                'suppliers.name as supplier_name',
                'suppliers.logo as supplier_logo',
                DB::raw('COUNT(*) as campaign_count'),
                DB::raw('SUM(clicks) as total_clicks'),
                DB::raw('SUM(impressions) as total_impressions'),
                DB::raw('SUM(conversions) as total_conversions'),
                DB::raw('SUM(spent) as total_spent')
            )
                ->join('suppliers', 'sponsored_campaigns.supplier_id', '=', 'suppliers.id')
                ->groupBy('supplier_id', 'suppliers.name', 'suppliers.logo')
                ->orderByDesc('total_spent')
                ->limit(10)
                ->get();
            
            // Données pour graphiques (30 derniers jours)
            $chartData = $this->getChartData();
            
            return [
                'summary' => [
                    'total_campaigns' => $campaigns->count(),
                    'active_campaigns' => $activeCampaigns,
                    'paused_campaigns' => $pausedCampaigns,
                    'completed_campaigns' => $completedCampaigns,
                    'expired_campaigns' => $expiredCampaigns,
                ],
                'budget' => [
                    'total_budget' => $totalBudget,
                    'total_spent' => $totalSpent,
                    'remaining' => $totalBudget - $totalSpent,
                    'spend_percentage' => $totalBudget > 0 ? round(($totalSpent / $totalBudget) * 100, 2) : 0,
                ],
                'performance' => [
                    'total_impressions' => $totalImpressions,
                    'total_clicks' => $totalClicks,
                    'total_conversions' => $totalConversions,
                    'overall_ctr' => $totalImpressions > 0 ? round(($totalClicks / $totalImpressions) * 100, 2) : 0,
                    'overall_conversion_rate' => $totalClicks > 0 ? round(($totalConversions / $totalClicks) * 100, 2) : 0,
                ],
                'alerts' => [
                    'low_budget' => $lowBudgetCampaigns,
                    'expiring_soon' => $expiringCampaigns,
                    'expired' => $expiredByDate,
                ],
                'top_products' => $topProducts,
                'top_suppliers' => $topSuppliers,
                'chart_data' => $chartData,
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Données pour les graphiques
     */
    private function getChartData()
    {
        $days = 30;
        $data = [];
        
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            // Simuler des données basées sur les campagnes actives
            $campaigns = SponsoredCampaign::active()
                ->whereDate('start_date', '<=', $date)
                ->get();
            
            $impressions = $campaigns->sum('impressions') / max($campaigns->count(), 1);
            $clicks = $campaigns->sum('clicks') / max($campaigns->count(), 1);
            $conversions = $campaigns->sum('conversions') / max($campaigns->count(), 1);
            
            $data[] = [
                'date' => $date->format('Y-m-d'),
                'impressions' => (int) $impressions,
                'clicks' => (int) $clicks,
                'conversions' => (int) $conversions,
                'ctr' => $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0,
            ];
        }
        
        return $data;
    }

    /**
     * Liste des campagnes avec filtres
     * GET /api/v1/admin/sponsored/campaigns
     */
    public function campaigns(Request $request)
    {
        $query = SponsoredCampaign::with(['product:id,name,image', 'supplier:id,name,logo']);
        
        // Filtres
        if ($request->status) {
            $query->where('status', $request->status);
        }
        
        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }
        
        if ($request->search) {
            $query->where(function ($sub) use ($request) {
                $sub->whereHas('product', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                })->orWhereHas('supplier', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                });
            });
        }
        
        $perPage = min(200, max(1, (int) $request->get('per_page', 50)));
        $campaigns = $query->orderByDesc('created_at')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    /**
     * Mettre à jour le statut d'une campagne
     * PUT /api/v1/admin/sponsored/campaigns/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        $campaign = SponsoredCampaign::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|in:active,paused,completed,expired',
        ]);
        
        $campaign->update(['status' => $validated['status']]);
        
        // Mettre à jour le statut sponsorisé du produit
        $isActive = $validated['status'] === 'active';
        $campaign->product->update(['is_sponsored' => $isActive]);

        SponsoredCache::forgetAll();
        
        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data' => $campaign,
        ]);
    }

    /**
     * Supprimer une campagne
     * DELETE /api/v1/admin/sponsored/campaigns/{id}
     */
    public function destroy($id)
    {
        $campaign = SponsoredCampaign::findOrFail($id);
        
        // Retirer le statut sponsorisé du produit
        $campaign->product->update(['is_sponsored' => false]);
        
        $campaign->delete();

        SponsoredCache::forgetAll();
        
        return response()->json([
            'success' => true,
            'message' => 'Campagne supprimée',
        ]);
    }

    /**
     * Sponsoriser un fournisseur
     * POST /api/v1/admin/sponsored/suppliers/{id}/sponsor
     */
    public function sponsorSupplier(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        
        $validated = $request->validate([
            'priority' => 'required|integer|min:0|max:10',
        ]);
        
        $supplier->update([
            'is_sponsored' => true,
            'sponsored_priority' => $validated['priority'],
        ]);

        SponsoredCache::forgetAll();
        
        return response()->json([
            'success' => true,
            'message' => 'Fournisseur sponsorisé',
            'data' => $supplier,
        ]);
    }

    /**
     * Retirer le statut sponsorisé d'un fournisseur
     * DELETE /api/v1/admin/sponsored/suppliers/{id}/sponsor
     */
    public function unsponsorSupplier($id)
    {
        $supplier = Supplier::findOrFail($id);
        
        $supplier->update([
            'is_sponsored' => false,
            'sponsored_priority' => 0,
        ]);

        SponsoredCache::forgetAll();
        
        return response()->json([
            'success' => true,
            'message' => 'Statut sponsorisé retiré',
        ]);
    }

    /**
     * Export CSV des campagnes
     * GET /api/v1/admin/sponsored/export
     */
    public function export(Request $request)
    {
        $campaigns = SponsoredCampaign::with(['product:id,name', 'supplier:id,name'])
            ->orderByDesc('created_at')
            ->get();
        
        $csv = "ID,Campagne,Produit,Fournisseur,Budget,Dépensé,Impressions,Clics,Conversions,CTR,Statut,Date début,Date fin\n";
        
        foreach ($campaigns as $c) {
            $ctr = $c->impressions > 0 ? round(($c->clicks / $c->impressions) * 100, 2) : 0;
            $csv .= sprintf(
                "%d,%s,%s,%s,%.2f,%.2f,%d,%d,%d,%.2f,%s,%s,%s\n",
                $c->id,
                escapeshellarg($c->name),
                escapeshellarg($c->product->name ?? ''),
                escapeshellarg($c->supplier->name ?? ''),
                $c->budget,
                $c->spent,
                $c->impressions,
                $c->clicks,
                $c->conversions,
                $ctr,
                $c->status,
                $c->start_date,
                $c->end_date ?? ''
            );
        }
        
        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="campagnes_sponsorisees_' . date('Y-m-d') . '.csv"',
        ]);
    }
}
