<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\RiskManagementService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Risk Management Controller
 * 
 * API pour la gestion des risques :
 * - Clients à risque
 * - Fournisseurs à risque
 * - Bannissement
 * - Historique sécurité
 */
class AdminRiskController extends Controller
{
    protected $riskService;

    public function __construct()
    {
        $this->riskService = new RiskManagementService();
    }

    /**
     * GET /api/v1/admin/risk/clients
     * 
     * Liste des clients à risque avec filtres
     */
    public function atRiskClients(Request $request)
    {
        try {
            $riskLevel = $request->get('risk_level', 'all');
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            
            $query = DB::table('users')
                ->select([
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.risk_level',
                    'users.cancellation_count',
                    'users.risk_score',
                    'users.last_cancellation_at',
                    'users.created_at',
                    DB::raw('(SELECT COUNT(*) FROM orders WHERE orders.customer_user_id = users.id) as total_orders'),
                ])
                ->where('users.role', 'client');

            if ($riskLevel !== 'all') {
                $query->where('users.risk_level', $riskLevel);
            } else {
                $query->whereIn('users.risk_level', ['warning', 'red_zone']);
            }

            // Tri
            $sortBy = $request->get('sort_by', 'risk_score');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $clients = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $clients->items(),
                'meta' => [
                    'current_page' => $clients->currentPage(),
                    'per_page' => $clients->perPage(),
                    'total' => $clients->total(),
                    'last_page' => $clients->lastPage(),
                ],
                'summary' => [
                    'total_at_risk' => DB::table('users')->where('role', 'client')->whereIn('risk_level', ['warning', 'red_zone'])->count(),
                    'warning_count' => DB::table('users')->where('role', 'client')->where('risk_level', 'warning')->count(),
                    'red_zone_count' => DB::table('users')->where('role', 'client')->where('risk_level', 'red_zone')->count(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController atRiskClients error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des clients à risque',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/risk/suppliers
     * 
     * Liste des fournisseurs à risque
     */
    public function atRiskSuppliers(Request $request)
    {
        try {
            $riskLevel = $request->get('risk_level', 'all');
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            
            $query = DB::table('suppliers')
                ->select([
                    'suppliers.id',
                    'suppliers.name',
                    'suppliers.email',
                    'suppliers.phone',
                    'suppliers.risk_level',
                    'suppliers.return_rate',
                    'suppliers.complaint_count',
                    'suppliers.is_active',
                    'suppliers.status',
                    'suppliers.created_at',
                    DB::raw('(SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id) as products_count'),
                    DB::raw('(SELECT COUNT(*) FROM orders WHERE orders.supplier_id = suppliers.id) as orders_count'),
                ]);

            if ($riskLevel !== 'all') {
                $query->where('suppliers.risk_level', $riskLevel);
            } else {
                $query->whereIn('suppliers.risk_level', ['warning', 'red_zone']);
            }

            $sortBy = $request->get('sort_by', 'return_rate');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $suppliers = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $suppliers->items(),
                'meta' => [
                    'current_page' => $suppliers->currentPage(),
                    'per_page' => $suppliers->perPage(),
                    'total' => $suppliers->total(),
                    'last_page' => $suppliers->lastPage(),
                ],
                'summary' => [
                    'total_at_risk' => DB::table('suppliers')->whereIn('risk_level', ['warning', 'red_zone'])->count(),
                    'warning_count' => DB::table('suppliers')->where('risk_level', 'warning')->count(),
                    'red_zone_count' => DB::table('suppliers')->where('risk_level', 'red_zone')->count(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController atRiskSuppliers error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des fournisseurs à risque',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/risk/clients/{id}/ban
     * 
     * Bannir définitivement un client
     */
    public function banClient(Request $request, $id)
    {
        try {
            $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $client = DB::table('users')
                ->where('id', $id)
                ->where('role', 'client')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client non trouvé',
                ], 404);
            }

            $adminId = $request->user()->id;
            $reason = $request->input('reason');

            $result = $this->riskService->banPermanently($id, $adminId, $reason);

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Client banni définitivement',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du bannissement',
            ], 500);

        } catch (\Exception $e) {
            Log::error('AdminRiskController banClient error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du bannissement',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/risk/clients/{id}/suspend
     * 
     * Suspendre temporairement un client
     */
    public function suspendClient(Request $request, $id)
    {
        try {
            $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $client = DB::table('users')
                ->where('id', $id)
                ->where('role', 'client')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client non trouvé',
                ], 404);
            }

            $newStatus = $client->is_active ? false : true;
            $action = $newStatus ? 'suspendu' : 'réactivé';

            DB::table('users')
                ->where('id', $id)
                ->update([
                    'is_active' => $newStatus,
                    'status' => $newStatus ? 'active' : 'suspended',
                    'updated_at' => now(),
                ]);

            AuditLogService::record('risk.client.suspend', $request->user(), [
                'client_id' => $id,
                'reason' => $request->input('reason'),
                'action' => $action,
            ], 'admin');

            return response()->json([
                'success' => true,
                'message' => "Client $action",
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController suspendClient error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suspension',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/risk/suppliers/{id}/suspend
     * 
     * Suspendre un fournisseur
     */
    public function suspendSupplier(Request $request, $id)
    {
        try {
            $request->validate([
                'reason' => 'required|string|max:500',
                'permanent' => 'sometimes|boolean',
            ]);

            $supplier = DB::table('suppliers')->where('id', $id)->first();

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé',
                ], 404);
            }

            $isPermanent = $request->input('permanent', false);

            DB::table('suppliers')
                ->where('id', $id)
                ->update([
                    'is_active' => false,
                    'status' => $isPermanent ? 'banned' : 'suspended',
                    'suspended_permanently' => $isPermanent,
                    'suspended_at' => now(),
                    'risk_level' => 'red_zone',
                    'updated_at' => now(),
                ]);

            // Désactiver les produits
            DB::table('products')
                ->where('supplier_id', $id)
                ->update([
                    'status' => 'inactive',
                    'updated_at' => now(),
                ]);

            AuditLogService::record('risk.supplier.suspend', $request->user(), [
                'supplier_id' => $id,
                'reason' => $request->input('reason'),
                'permanent' => $isPermanent,
            ], 'admin');

            return response()->json([
                'success' => true,
                'message' => $isPermanent ? 'Fournisseur banni définitivement' : 'Fournisseur suspendu',
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController suspendSupplier error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suspension',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/risk/security-events
     * 
     * Liste des événements de sécurité
     */
    public function securityEvents(Request $request)
    {
        try {
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            $eventType = $request->get('event_type');
            $resolved = $request->get('resolved');
            
            $query = DB::table('security_events')
                ->select([
                    'security_events.*',
                    'users.email as user_email',
                ])
                ->leftJoin('users', 'security_events.user_id', '=', 'users.id');

            if ($eventType) {
                $query->where('security_events.event_type', $eventType);
            }

            if ($resolved !== null) {
                $query->where('security_events.resolved', $resolved === 'true');
            }

            $events = $query->orderBy('security_events.created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $events->items(),
                'meta' => [
                    'current_page' => $events->currentPage(),
                    'per_page' => $events->perPage(),
                    'total' => $events->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController securityEvents error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des événements',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/risk/blacklist
     * 
     * Liste des identifiants blacklistés
     */
    public function blacklist(Request $request)
    {
        try {
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            $type = $request->get('type');
            
            $query = DB::table('blacklisted_identifiers')
                ->select([
                    'blacklisted_identifiers.*',
                    'admin.email as banned_by_email',
                ])
                ->leftJoin('users as admin', 'blacklisted_identifiers.blacklisted_by', '=', 'admin.id');

            if ($type) {
                $query->where('blacklisted_identifiers.type', $type);
            }

            $list = $query->orderBy('blacklisted_identifiers.blacklisted_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $list->items(),
                'meta' => [
                    'current_page' => $list->currentPage(),
                    'per_page' => $list->perPage(),
                    'total' => $list->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController blacklist error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de la blacklist',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/risk/blacklist/add
     * 
     * Ajouter un identifiant à la blacklist
     */
    public function addToBlacklist(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:email,phone,device_hash,ip_address',
                'value' => 'required|string|max:255',
                'reason' => 'required|string|max:500',
            ]);

            $adminId = $request->user()->id;

            $this->riskService->addToBlacklist(
                $request->input('value'),
                $request->input('type'),
                $adminId,
                $request->input('reason')
            );

            return response()->json([
                'success' => true,
                'message' => 'Identifiant ajouté à la blacklist',
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController addToBlacklist error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout à la blacklist',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/risk/dashboard
     * 
     * Tableau de bord des risques
     */
    public function dashboard()
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'clients' => [
                        'at_risk' => DB::table('users')->where('role', 'client')->whereIn('risk_level', ['warning', 'red_zone'])->count(),
                        'warning' => DB::table('users')->where('role', 'client')->where('risk_level', 'warning')->count(),
                        'red_zone' => DB::table('users')->where('role', 'client')->where('risk_level', 'red_zone')->count(),
                        'banned' => DB::table('users')->where('role', 'client')->where('suspended_permanently', true)->count(),
                    ],
                    'suppliers' => [
                        'at_risk' => DB::table('suppliers')->whereIn('risk_level', ['warning', 'red_zone'])->count(),
                        'warning' => DB::table('suppliers')->where('risk_level', 'warning')->count(),
                        'red_zone' => DB::table('suppliers')->where('risk_level', 'red_zone')->count(),
                        'suspended' => DB::table('suppliers')->whereIn('status', ['suspended', 'banned'])->count(),
                    ],
                    'security' => [
                        'unresolved_events' => DB::table('security_events')->where('resolved', false)->count(),
                        'blacklisted_count' => DB::table('blacklisted_identifiers')->count(),
                        'recent_events_24h' => DB::table('security_events')
                            ->where('created_at', '>=', now()->subHours(24))
                            ->count(),
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AdminRiskController dashboard error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du dashboard',
            ], 500);
        }
    }
}
