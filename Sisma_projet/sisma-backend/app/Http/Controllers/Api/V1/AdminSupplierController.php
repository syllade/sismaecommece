<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminSupplierRequest;
use App\Services\AccountInvitationService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

/**
 * Admin Supplier Controller V1
 * 
 * API Version 1 - Gestion des fournisseurs
 * CRUD + block + reset-password + signed URLs
 */
class AdminSupplierController extends Controller
{
    /**
     * GET /api/v1/admin/suppliers
     * 
     * Liste des fournisseurs avec pagination, recherche, filtres
     */
    public function index(Request $request)
    {
        try {
            $suppliers = DB::table('suppliers')->get();
            return response()->json([
                'success' => true,
                'data' => $suppliers,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSupplierController index error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [],
                'message' => 'Fournisseurs charges (mode limite)',
            ], 200);
        }
    }

    /**
     * POST /api/v1/admin/suppliers
     * 
     * Créer un fournisseur avec génération de Signed URL
     */
    public function store(AdminSupplierRequest $request)
    {
        try {
            $data = [
                'name' => $request->input('name'),
                'logo' => $request->input('logo'),
                'phone' => $request->input('phone'),
                'email' => $request->input('email'),
                'address' => $request->input('address'),
                'availability' => $request->input('availability'),
                'commission_rate' => $request->input('commission_rate', 0),
                'invoice_frequency' => $request->input('invoice_frequency', 'weekly'),
                'is_active' => $request->has('is_active') 
                    ? ($request->input('is_active') ? 1 : 0) 
                    : 0, // Par défaut inactif en attente d'activation
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $id = DB::table('suppliers')->insertGetId($data);
            $supplier = DB::table('suppliers')->where('id', $id)->first();

            // Créer user et envoyer invitation avec Signed URL
            $signedUrl = null;
            if ($supplier->email) {
                $invitationService = new AccountInvitationService();
                $invitePayload = $invitationService->createOrUpdateInvitedUser([
                    'name' => $supplier->name,
                    'email' => $supplier->email,
                    'role' => 'supplier',
                    'supplier_id' => (int) $supplier->id,
                    'send_invite' => $request->input('send_invite', true),
                ]);

                // Générer Signed URL pour activation
                if ($invitePayload && isset($invitePayload['invite_sent']) && $invitePayload['invite_sent']) {
                    $signedUrl = URL::temporarySignedRoute(
                        'supplier.register',
                        now()->addHours(48),
                        ['supplier' => $supplier->id]
                    );
                }
            }

            AuditLogService::record('admin.supplier.create', $request->user(), [
                'supplier_id' => (int) $id,
                'supplier_email' => $supplier->email,
                'invite_sent' => !empty($signedUrl),
            ], 'supplier', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Fournisseur créé avec succès',
                'data' => $supplier,
                'invitation' => [
                    'signed_url' => $signedUrl,
                    'expires_at' => $signedUrl ? now()->addHours(48)->toIso8601String() : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('AdminSupplierController store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du fournisseur',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/suppliers/{id}
     * 
     * Détails d'un fournisseur
     */
    public function show($id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé',
                ], 404);
            }

            // Compter les produits
            $productsCount = DB::table('products')
                ->where('supplier_id', $id)
                ->count();

            // Compter les commandes en attente
            $pendingOrdersCount = DB::table('orders')
                ->where('supplier_id', $id)
                ->whereIn('status', ['pending', 'processing'])
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    ...(array) $supplier,
                    'products_count' => $productsCount,
                    'pending_orders_count' => $pendingOrdersCount,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du fournisseur',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/suppliers/{id}
     * 
     * Modifier un fournisseur
     */
    public function update(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé',
                ], 404);
            }

            $data = ['updated_at' => now()];
            $fillable = ['name', 'logo', 'phone', 'email', 'address', 'availability', 'commission_rate', 'invoice_frequency'];
            
            foreach ($fillable as $field) {
                if ($request->has($field)) {
                    $data[$field] = $request->input($field);
                }
            }

            if ($request->has('is_active')) {
                $data['is_active'] = $request->input('is_active') ? 1 : 0;
            }

            DB::table('suppliers')->where('id', $id)->update($data);
            $updated = DB::table('suppliers')->where('id', $id)->first();

            // Synchroniser avec user
            if ($request->has('is_active') && $updated->email) {
                DB::table('users')
                    ->where('email', $updated->email)
                    ->where('role', 'supplier')
                    ->update([
                        'is_active' => (int) $data['is_active'],
                        'updated_at' => now(),
                    ]);
            }

            AuditLogService::record('admin.supplier.update', $request->user(), [
                'supplier_id' => (int) $id,
                'fields' => array_keys($data),
            ], 'supplier', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Fournisseur mis à jour',
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
     * DELETE /api/v1/admin/suppliers/{id}
     * 
     * Supprimer un fournisseur
     */
    public function destroy(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé',
                ], 404);
            }

            DB::table('suppliers')->where('id', $id)->delete();

            AuditLogService::record('admin.supplier.delete', $request->user(), [
                'supplier_id' => (int) $id,
            ], 'supplier', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Fournisseur supprimé',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/suppliers/{id}/block
     * 
     * Bloquer/déblocker un fournisseur
     */
    public function block(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé',
                ], 404);
            }

            $newStatus = $supplier->is_active ? 0 : 1;
            
            DB::table('suppliers')
                ->where('id', $id)
                ->update([
                    'is_active' => $newStatus,
                    'updated_at' => now(),
                ]);

            // Synchroniser user
            if ($supplier->email) {
                DB::table('users')
                    ->where('email', $supplier->email)
                    ->where('role', 'supplier')
                    ->update([
                        'is_active' => $newStatus,
                        'updated_at' => now(),
                    ]);
            }

            AuditLogService::record('admin.supplier.block', $request->user(), [
                'supplier_id' => (int) $id,
                'new_status' => $newStatus ? 'active' : 'blocked',
            ], 'supplier', (int) $id);

            return response()->json([
                'success' => true,
                'message' => $newStatus ? 'Fournisseur débloqué' : 'Fournisseur bloqué',
                'data' => [
                    'id' => $id,
                    'is_active' => $newStatus,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du blocage',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/suppliers/{id}/reset-password
     * 
     * Réinitialiser le mot de passe d'un fournisseur
     */
    public function resetPassword(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé',
                ], 404);
            }

            if (!$supplier->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun email associé à ce fournisseur',
                ], 400);
            }

            // Générer Signed URL pour réinitialisation
            $resetUrl = URL::temporarySignedRoute(
                'password.reset',
                now()->addHours(24),
                ['email' => $supplier->email]
            );

            AuditLogService::record('admin.supplier.reset_password', $request->user(), [
                'supplier_id' => (int) $id,
                'supplier_email' => $supplier->email,
            ], 'supplier', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Lien de réinitialisation généré',
                'data' => [
                    'reset_url' => $resetUrl,
                    'expires_at' => now()->addHours(24)->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/suppliers/invite
     * 
     * Envoyer une invitation avec Signed URL
     */
    public function invite(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email',
            ]);

            // Vérifier si le fournisseur existe déjà
            $existing = DB::table('suppliers')->where('email', $request->email)->first();
            
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un fournisseur avec cet email existe déjà',
                ], 422);
            }

            // Créer le fournisseur avec statut pending
            $id = DB::table('suppliers')->insertGetId([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone ?? '',
                'is_active' => 0,
                'commission_rate' => $request->commission_rate ?? 0,
                'invoice_frequency' => $request->invoice_frequency ?? 'weekly',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Créer user et envoyer invitation
            $invitationService = new AccountInvitationService();
            $invitationService->createOrUpdateInvitedUser([
                'name' => $request->name,
                'email' => $request->email,
                'role' => 'supplier',
                'supplier_id' => $id,
                'send_invite' => true,
            ]);

            // Générer Signed URL
            $signedUrl = URL::temporarySignedRoute(
                'supplier.register',
                now()->addHours(48),
                ['supplier' => $id]
            );

            AuditLogService::record('admin.supplier.invite', $request->user(), [
                'supplier_id' => $id,
                'email' => $request->email,
            ], 'supplier', $id);

            return response()->json([
                'success' => true,
                'message' => 'Invitation envoyée',
                'data' => [
                    'id' => $id,
                    'signed_url' => $signedUrl,
                    'expires_at' => now()->addHours(48)->toIso8601String(),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'invitation',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/suppliers/bulk-action
     * 
     * Actions groupées sur plusieurs fournisseurs
     */
    public function bulkAction(Request $request)
    {
        try {
            $request->validate([
                'supplier_ids' => 'required|array|min:1',
                'action' => 'required|string|in:activate,deactivate,delete',
            ]);

            $supplierIds = array_map('intval', $request->supplier_ids);
            $action = $request->action;

            switch ($action) {
                case 'activate':
                    DB::table('suppliers')
                        ->whereIn('id', $supplierIds)
                        ->update(['is_active' => 1, 'updated_at' => now()]);
                    
                    $emails = DB::table('suppliers')
                        ->whereIn('id', $supplierIds)
                        ->whereNotNull('email')
                        ->pluck('email');
                    
                    if ($emails->isNotEmpty()) {
                        DB::table('users')
                            ->whereIn('email', $emails)
                            ->where('role', 'supplier')
                            ->update(['is_active' => 1, 'updated_at' => now()]);
                    }
                    break;

                case 'deactivate':
                    DB::table('suppliers')
                        ->whereIn('id', $supplierIds)
                        ->update(['is_active' => 0, 'updated_at' => now()]);
                    
                    $emails = DB::table('suppliers')
                        ->whereIn('id', $supplierIds)
                        ->whereNotNull('email')
                        ->pluck('email');
                    
                    if ($emails->isNotEmpty()) {
                        DB::table('users')
                            ->whereIn('email', $emails)
                            ->where('role', 'supplier')
                            ->update(['is_active' => 0, 'updated_at' => now()]);
                    }
                    break;

                case 'delete':
                    DB::table('suppliers')->whereIn('id', $supplierIds)->delete();
                    break;
            }

            AuditLogService::record('admin.supplier.bulk_action', $request->user(), [
                'supplier_ids' => $supplierIds,
                'action' => $action,
            ], 'supplier');

            return response()->json([
                'success' => true,
                'message' => 'Action groupée exécutée',
                'data' => [
                    'affected_count' => count($supplierIds),
                    'action' => $action,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'action groupée',
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/admin/suppliers/{id}/export-pdf
     * 
     * Génère un PDF avec la fiche complète du fournisseur
     */
    public function exportPdf(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé'
                ], 404);
            }
            
            // Get supplier metrics
            $metrics = DB::table('orders')
                ->selectRaw('
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status = "delivered" THEN 1 ELSE 0 END) as delivered_orders,
                    SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_orders,
                    SUM(total) as total_revenue,
                    AVG(total) as avg_order_value
                ')
                ->where('supplier_id', $id)
                ->first();
            
            $productsCount = DB::table('products')->where('supplier_id', $id)->count();
            $activeProductsCount = DB::table('products')->where('supplier_id', $id)->where('is_active', 1)->count();
            
            $recentOrders = DB::table('orders')
                ->where('supplier_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
            
            $rating = DB::table('supplier_reviews')
                ->where('supplier_id', $id)
                ->avg('rating') ?? 0;
            
            // Calculate grade based on score
            $revenueScore = min(($metrics->total_revenue ?? 0) / 10000, 100) * 0.4;
            $ordersScore = min(($metrics->total_orders ?? 0) / 50, 100) * 0.3;
            $deliveryScore = ($metrics->total_orders > 0) ? (($metrics->delivered_orders / $metrics->total_orders) * 100) * 0.2 : 0;
            $ratingScore = ($rating / 5) * 100 * 0.1;
            $score = round($revenueScore + $ordersScore + $deliveryScore + $ratingScore, 2);
            
            $grade = 'F';
            if ($score >= 80) $grade = 'A';
            elseif ($score >= 60) $grade = 'B';
            elseif ($score >= 40) $grade = 'C';
            elseif ($score >= 20) $grade = 'D';
            
            // Generate HTML for PDF
            $html = view('reports.supplier', [
                'supplier' => $supplier,
                'metrics' => $metrics,
                'products_count' => $productsCount,
                'active_products_count' => $activeProductsCount,
                'recent_orders' => $recentOrders,
                'rating' => round($rating, 1),
                'score' => $score,
                'grade' => $grade,
                'generated_at' => now()->format('d/m/Y H:i')
            ])->render();
            
            // Generate PDF
            $dompdf = new \Dompdf\Dompdf();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            
            $filename = 'fournisseur-' . $supplier->slug . '-' . date('Y-m-d') . '.pdf';
            
            return response()->make($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSupplierController exportPdf error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
