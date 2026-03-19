<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Admin Marketing Controller V1
 * 
 * API Version 1 - Gestion des campagnes sponsorisées
 * CRUD + approve/reject + calculs CTR/ACoS
 */
class AdminMarketingController extends Controller
{
    /**
     * GET /api/v1/admin/campaigns
     * 
     * Liste des campagnes sponsorisées
     */
    public function index(Request $request)
    {
        try {
            $status = $request->get('status', 'all');
            $search = $request->get('search', '');

            $query = DB::table('marketing_campaigns');

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('product_name', 'like', "%$search%")
                        ->orWhere('supplier_name', 'like', "%$search%");
                });
            }

            // Pagination
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            $offset = ($page - 1) * $perPage;

            $total = (clone $query)->count();
            $campaigns = $query->orderBy('created_at', 'desc')->offset($offset)->limit($perPage)->get();

            // Calculer CTR et ACoS pour chaque campagne
            $campaigns = $campaigns->map(function ($campaign) {
                $impressions = (int) ($campaign->impressions ?? 0);
                $clicks = (int) ($campaign->clicks ?? 0);
                $spend = (float) ($campaign->spend ?? 0);
                $revenue = (float) ($campaign->attributed_revenue ?? 0);

                $campaign->ctr = $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0;
                $campaign->acos = $revenue > 0 ? round(($spend / $revenue) * 100, 2) : 0;

                return $campaign;
            });

            return response()->json([
                'success' => true,
                'data' => $campaigns,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => (int) ceil($total / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des campagnes',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/campaigns
     * 
     * Créer une campagne sponsorisée
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|integer',
                'product_name' => 'required|string',
                'supplier_id' => 'required|integer',
                'supplier_name' => 'required|string',
                'budget' => 'required|numeric|min:0',
                'cpc' => 'required|numeric|min:0',
            ]);

            $campaignId = DB::table('marketing_campaigns')->insertGetId([
                'product_id' => $request->product_id,
                'product_name' => $request->product_name,
                'supplier_id' => $request->supplier_id,
                'supplier_name' => $request->supplier_name,
                'budget' => $request->budget,
                'cpc' => $request->cpc,
                'status' => 'pending',
                'impressions' => 0,
                'clicks' => 0,
                'spend' => 0,
                'attributed_revenue' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $campaign = DB::table('marketing_campaigns')->where('id', $campaignId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Campagne créée avec succès',
                'data' => $campaign,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/campaigns/{id}
     * 
     * Détails d'une campagne
     */
    public function show($id)
    {
        try {
            $campaign = DB::table('marketing_campaigns')->where('id', $id)->first();

            if (!$campaign) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campagne non trouvée',
                ], 404);
            }

            // Calculer CTR et ACoS
            $impressions = (int) $campaign->impressions;
            $clicks = (int) $campaign->clicks;
            $spend = (float) $campaign->spend;
            $revenue = (float) $campaign->attributed_revenue;

            $campaign->ctr = $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0;
            $campaign->acos = $revenue > 0 ? round(($spend / $revenue) * 100, 2) : 0;

            return response()->json([
                'success' => true,
                'data' => $campaign,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/campaigns/{id}
     * 
     * Modifier une campagne
     */
    public function update(Request $request, $id)
    {
        try {
            $campaign = DB::table('marketing_campaigns')->where('id', $id)->first();
            if (!$campaign) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campagne non trouvée',
                ], 404);
            }

            $data = ['updated_at' => now()];
            $fillable = ['product_name', 'budget', 'cpc'];

            foreach ($fillable as $field) {
                if ($request->has($field)) {
                    $data[$field] = $request->input($field);
                }
            }

            // Si changement de statut vers approved, vérifier le budget
            if ($request->has('status') && $request->status === 'approved' && $campaign->status !== 'approved') {
                $data['status'] = 'approved';
                $data['approved_at'] = now();
            } elseif ($request->has('status')) {
                $data['status'] = $request->status;
            }

            DB::table('marketing_campaigns')->where('id', $id)->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Campagne mise à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/campaigns/{id}/approve
     * 
     * Approuver une campagne
     */
    public function approve(Request $request, $id)
    {
        try {
            $campaign = DB::table('marketing_campaigns')->where('id', $id)->first();
            if (!$campaign) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campagne non trouvée',
                ], 404);
            }

            DB::table('marketing_campaigns')->where('id', $id)->update([
                'status' => 'approved',
                'approved_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campagne approuvée',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/campaigns/{id}/reject
     * 
     * Rejeter une campagne
     */
    public function reject(Request $request, $id)
    {
        try {
            $campaign = DB::table('marketing_campaigns')->where('id', $id)->first();
            if (!$campaign) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campagne non trouvée',
                ], 404);
            }

            $request->validate([
                'reason' => 'required|string|min:10',
            ]);

            DB::table('marketing_campaigns')->where('id', $id)->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason,
                'rejected_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campagne rejetée',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/campaigns/{id}
     * 
     * Supprimer une campagne
     */
    public function destroy($id)
    {
        try {
            DB::table('marketing_campaigns')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Campagne supprimée',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/campaigns/{id}/stats
     * 
     * Statistiques détaillées d'une campagne
     */
    public function stats($id)
    {
        try {
            $campaign = DB::table('marketing_campaigns')->where('id', $id)->first();
            if (!$campaign) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campagne non trouvée',
                ], 404);
            }

            // Calculer les métriques
            $impressions = (int) $campaign->impressions;
            $clicks = (int) $campaign->clicks;
            $spend = (float) $campaign->spend;
            $revenue = (float) $campaign->attributed_revenue;
            $budget = (float) $campaign->budget;

            $ctr = $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0;
            $acos = $revenue > 0 ? round(($spend / $revenue) * 100, 2) : 0;
            $budgetUsed = $budget > 0 ? round(($spend / $budget) * 100, 2) : 0;
            $cpc = $clicks > 0 ? round($spend / $clicks, 2) : 0;
            $roas = $spend > 0 ? round($revenue / $spend, 2) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'campaign_id' => $id,
                    'impressions' => $impressions,
                    'clicks' => $clicks,
                    'spend' => $spend,
                    'revenue' => $revenue,
                    'budget' => $budget,
                    'ctr' => $ctr,
                    'acos' => $acos,
                    'budget_used_percent' => $budgetUsed,
                    'cpc' => $cpc,
                    'roas' => $roas,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des stats',
            ], 500);
        }
    }
}
