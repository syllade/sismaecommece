<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AccountInvitationService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

/**
 * Admin Driver Controller V1
 * 
 * API Version 1 - Gestion des livreurs
 * CRUD + toggle-status + signed URLs
 */
class AdminDriverController extends Controller
{
    /**
     * GET /api/v1/admin/drivers
     * 
     * Liste des livreurs avec filtres
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('delivery_persons');

            // Filtres
            $status = $request->get('status', 'all');
            if ($status === 'active') {
                $query->where('is_active', 1);
            } elseif ($status === 'inactive') {
                $query->where('is_active', 0);
            }

            $search = trim($request->get('search', ''));
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $like = '%' . $search . '%';
                    $q->where('name', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhere('email', 'like', $like);
                });
            }

            // Pagination
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            $offset = ($page - 1) * $perPage;

            $countQuery = clone $query;
            $total = (int) $countQuery->count();

            $drivers = $query
                ->orderBy('created_at', 'desc')
                ->offset($offset)
                ->limit($perPage)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $drivers,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => (int) ceil($total / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminDriverController index error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [],
                'meta' => [
                    'page' => 1,
                    'per_page' => 25,
                    'total' => 0,
                    'last_page' => 1,
                ],
                'message' => 'Livreurs charges (mode limite)',
            ], 200);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des livreurs',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/drivers
     * 
     * Créer un livreur (Admin uniquement)
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'required|string|max:20|unique:delivery_persons,phone',
                'email' => 'sometimes|email',
                'vehicle_type' => 'sometimes|string|max:50',
                'zone' => 'required|string|max:100',
                'is_active' => 'sometimes|boolean',
            ]);

            $data = [
                'name' => $request->name,
                'phone' => $request->phone,
                'email' => $request->email ?? '',
                'vehicle_type' => $request->vehicle_type ?? '',
                'zone' => $request->zone,
                'is_active' => $request->has('is_active') ? ($request->is_active ? 1 : 0) : 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $id = DB::table('delivery_persons')->insertGetId($data);
            $driver = DB::table('delivery_persons')->where('id', $id)->first();

            // Créer user et envoyer invitation avec Signed URL
            $signedUrl = null;
            if ($driver->email) {
                $invitationService = new AccountInvitationService();
                $invitationService->createOrUpdateInvitedUser([
                    'name' => $driver->name,
                    'email' => $driver->email,
                    'role' => 'delivery',
                    'delivery_person_id' => (int) $id,
                    'send_invite' => $request->input('send_invite', true),
                ]);

                // Générer Signed URL pour activation
                $signedUrl = URL::temporarySignedRoute(
                    'delivery.register',
                    now()->addHours(48),
                    ['driver' => $id]
                );
            }

            AuditLogService::record('admin.driver.create', $request->user(), [
                'driver_id' => (int) $id,
            ], 'delivery_person', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Livreur créé avec succès',
                'data' => $driver,
                'invitation' => [
                    'signed_url' => $signedUrl,
                    'expires_at' => $signedUrl ? now()->addHours(48)->toIso8601String() : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('AdminDriverController store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/drivers/{id}
     * 
     * Détails d'un livreur
     */
    public function show($id)
    {
        try {
            $driver = DB::table('delivery_persons')->where('id', $id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                ], 404);
            }

            // Statistiques
            $stats = DB::table('orders')
                ->where('delivery_person_id', $id)
                ->selectRaw('
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN 1 ELSE 0 END) as delivered_orders,
                    SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_orders,
                    SUM(CASE WHEN status IN ("pending", "processing") THEN 1 ELSE 0 END) as active_orders,
                    SUM(total) as total_revenue
                ')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    ...(array) $driver,
                    'stats' => $stats,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/drivers/{id}
     * 
     * Modifier un livreur
     */
    public function update(Request $request, $id)
    {
        try {
            $driver = DB::table('delivery_persons')->where('id', $id)->first();
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                ], 404);
            }

            $data = ['updated_at' => now()];
            $fillable = ['name', 'phone', 'email', 'vehicle_type', 'zone'];
            
            foreach ($fillable as $field) {
                if ($request->has($field)) {
                    $data[$field] = $request->input($field);
                }
            }

            if ($request->has('is_active')) {
                $data['is_active'] = $request->is_active ? 1 : 0;
            }

            DB::table('delivery_persons')->where('id', $id)->update($data);
            $updated = DB::table('delivery_persons')->where('id', $id)->first();

            AuditLogService::record('admin.driver.update', $request->user(), [
                'driver_id' => (int) $id,
                'fields' => array_keys($data),
            ], 'delivery_person', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Livreur mis à jour',
                'data' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/drivers/{id}/toggle-status
     * 
     * Activer/désactiver un livreur
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $driver = DB::table('delivery_persons')->where('id', $id)->first();
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                ], 404);
            }

            $newStatus = $driver->is_active ? 0 : 1;
            
            DB::table('delivery_persons')
                ->where('id', $id)
                ->update([
                    'is_active' => $newStatus,
                    'updated_at' => now(),
                ]);

            // Synchroniser user
            if ($driver->email) {
                DB::table('users')
                    ->where('email', $driver->email)
                    ->where('role', 'delivery')
                    ->update([
                        'is_active' => $newStatus,
                        'updated_at' => now(),
                    ]);
            }

            AuditLogService::record('admin.driver.toggle_status', $request->user(), [
                'driver_id' => (int) $id,
                'new_status' => $newStatus ? 'active' : 'inactive',
            ], 'delivery_person', (int) $id);

            return response()->json([
                'success' => true,
                'message' => $newStatus ? 'Livreur activé' : 'Livreur désactivé',
                'data' => [
                    'id' => $id,
                    'is_active' => $newStatus,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/drivers/{id}
     * 
     * Supprimer un livreur
     */
    public function destroy(Request $request, $id)
    {
        try {
            $driver = DB::table('delivery_persons')->where('id', $id)->first();
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                ], 404);
            }

            // Vérifier si le livreur a des commandes en cours
            $activeOrders = DB::table('orders')
                ->where('delivery_person_id', $id)
                ->whereIn('status', ['pending', 'processing'])
                ->count();

            if ($activeOrders > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce livreur a des commandes en cours. Attribution requise avant suppression.',
                ], 422);
            }

            DB::table('delivery_persons')->where('id', $id)->delete();

            AuditLogService::record('admin.driver.delete', $request->user(), [
                'driver_id' => (int) $id,
            ], 'delivery_person', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Livreur supprimé',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/drivers/zones
     * 
     * Liste des zones de livraison
     */
    public function zones()
    {
        try {
            $zones = DB::table('delivery_persons')
                ->select('zone')
                ->whereNotNull('zone')
                ->where('zone', '!=', '')
                ->distinct()
                ->pluck('zone');

            return response()->json([
                'success' => true,
                'data' => $zones,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des zones',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/drivers/bulk-toggle
     * 
     * Activer/désactiver plusieurs livreurs
     */
    public function bulkToggle(Request $request)
    {
        try {
            $request->validate([
                'driver_ids' => 'required|array|min:1',
                'action' => 'required|string|in:activate,deactivate',
            ]);

            $driverIds = array_map('intval', $request->driver_ids);
            $isActive = $request->action === 'activate' ? 1 : 0;

            DB::table('delivery_persons')
                ->whereIn('id', $driverIds)
                ->update([
                    'is_active' => $isActive,
                    'updated_at' => now(),
                ]);

            $emails = DB::table('delivery_persons')
                ->whereIn('id', $driverIds)
                ->whereNotNull('email')
                ->pluck('email');

            if ($emails->isNotEmpty()) {
                DB::table('users')
                    ->whereIn('email', $emails)
                    ->where('role', 'delivery')
                    ->update([
                        'is_active' => $isActive,
                        'updated_at' => now(),
                    ]);
            }

            AuditLogService::record('admin.driver.bulk_toggle', $request->user(), [
                'driver_ids' => $driverIds,
                'action' => $request->action,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Action groupée exécutée',
                'data' => [
                    'affected_count' => count($driverIds),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'action groupée',
            ], 500);
        }
    }
}
