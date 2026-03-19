<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller for Promotions and Commissions
 * 
 * Endpoints:
 * - POST /api/v1/promotions/validate - Validate promo code
 * - POST /api/v1/admin/promotions - Create promotion (admin)
 * - GET /api/v1/admin/promotions - List promotions (admin)
 * - POST /api/v1/admin/promotions/{id}/toggle - Toggle promotion
 * - GET /api/v1/admin/commissions - View commissions (admin)
 * - GET /api/v1/supplier/wallet - Supplier wallet
 * - GET /api/v1/supplier/commissions - Supplier commissions
 * - POST /api/v1/supplier/withdraw - Request withdrawal
 */
class PromotionController extends Controller
{
    /**
     * POST /api/v1/promotions/validate
     * 
     * Validate promo code at checkout
     */
    public function validateCode(Request $request)
    {
        try {
            $code = strtoupper(trim($request->input('code')));
            $orderAmount = $request->input('amount', 0);

            $promotion = DB::table('promotions')
                ->where('code', $code)
                ->where('is_active', 1)
                ->where(function ($q) {
                    $q->whereNull('starts_at')
                        ->orWhere('starts_at', '<=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>=', now());
                })
                ->first();

            if (!$promotion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code promo invalide ou expiré'
                ], 400);
            }

            // Check usage limit
            if ($promotion->usage_limit && $promotion->used_count >= $promotion->usage_limit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code promo déjà utilisé'
                ], 400);
            }

            // Check minimum order amount
            if ($promotion->min_order_amount && $orderAmount < $promotion->min_order_amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Montant minimum requis: ' . $promotion->min_order_amount
                ], 400);
            }

            // Calculate discount
            $discount = 0;
            if ($promotion->type === 'percentage') {
                $discount = $orderAmount * ($promotion->value / 100);
            } else {
                $discount = $promotion->value;
            }

            // Apply max discount cap
            if ($promotion->max_discount && $discount > $promotion->max_discount) {
                $discount = $promotion->max_discount;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'code' => $promotion->code,
                    'type' => $promotion->type,
                    'value' => $promotion->value,
                    'discount_amount' => round($discount, 2),
                    'promotion_id' => $promotion->id
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('PromotionController validateCode error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation'
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/promotions
     * 
     * Create promotion (admin)
     */
    public function create(Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|unique:promotions,code',
                'type' => 'required|in:percentage,fixed',
                'value' => 'required|numeric|min:0',
                'min_order_amount' => 'nullable|numeric|min:0',
                'max_discount' => 'nullable|numeric|min:0',
                'usage_limit' => 'nullable|integer|min:1',
                'supplier_id' => 'nullable|integer',
                'product_id' => 'nullable|integer',
                'starts_at' => 'nullable|date',
                'expires_at' => 'nullable|date'
            ]);

            $id = DB::table('promotions')->insertGetId([
                'code' => strtoupper($validated['code']),
                'type' => $validated['type'],
                'value' => $validated['value'],
                'min_order_amount' => $validated['min_order_amount'],
                'max_discount' => $validated['max_discount'],
                'usage_limit' => $validated['usage_limit'],
                'supplier_id' => $validated['supplier_id'] ?? null,
                'product_id' => $validated['product_id'] ?? null,
                'starts_at' => $validated['starts_at'] ?? null,
                'expires_at' => $validated['expires_at'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Promotion créée',
                'data' => ['id' => $id]
            ], 201);
        } catch (\Exception $e) {
            Log::error('PromotionController create error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création'
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/promotions
     * 
     * List promotions (admin)
     */
    public function listAdmin(Request $request)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 20)));
            $status = $request->get('status', 'all');

            $query = DB::table('promotions')
                ->selectRaw('promotions.*, suppliers.name as supplier_name')
                ->leftJoin('suppliers', 'promotions.supplier_id', '=', 'suppliers.id');

            if ($status === 'active') {
                $query->where('promotions.is_active', 1);
            } elseif ($status === 'inactive') {
                $query->where('promotions.is_active', 0);
            }

            $total = (int) clone $query->count();

            $promotions = $query
                ->orderByDesc('promotions.created_at')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $promotions,
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
                'message' => 'Erreur'
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/promotions/{id}/toggle
     * 
     * Toggle promotion status
     */
    public function toggle($id)
    {
        try {
            $promotion = DB::table('promotions')->where('id', $id)->first();
            if (!$promotion) {
                return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);
            }

            DB::table('promotions')
                ->where('id', $id)
                ->update(['is_active' => !$promotion->is_active, 'updated_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Statut mis à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }

    /**
     * GET /api/v1/admin/commissions
     * 
     * View all commissions (admin)
     */
    public function listCommissions(Request $request)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 20)));

            $query = DB::table('commission_transactions')
                ->selectRaw('
                    commission_transactions.*,
                    suppliers.name as supplier_name,
                    orders.order_number
                ')
                ->leftJoin('suppliers', 'commission_transactions.supplier_id', '=', 'suppliers.id')
                ->leftJoin('orders', 'commission_transactions.order_id', '=', 'orders.id');

            $total = (int) clone $query->count();

            $commissions = $query
                ->orderByDesc('commission_transactions.created_at')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            // Get totals
            $totals = DB::table('commission_transactions')
                ->selectRaw('
                    SUM(commission_amount) as total_commission,
                    SUM(supplier_amount) as total_supplier
                ')
                ->first();

            return response()->json([
                'success' => true,
                'data' => $commissions,
                'totals' => $totals,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }

    /**
     * GET /api/v1/supplier/wallet
     * 
     * Get supplier wallet
     */
    public function getWallet(Request $request)
    {
        try {
            $supplierId = $request->user()->supplier_id;

            $wallet = DB::table('supplier_wallets')
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$wallet) {
                // Create wallet if doesn't exist
                $walletId = DB::table('supplier_wallets')->insertGetId([
                    'supplier_id' => $supplierId,
                    'balance' => 0,
                    'pending_balance' => 0,
                    'total_earned' => 0,
                    'total_withdrawn' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                
                $wallet = DB::table('supplier_wallets')->where('id', $walletId)->first();
            }

            // Get recent transactions
            $recentTransactions = DB::table('commission_transactions')
                ->where('supplier_id', $supplierId)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            // Get pending withdrawals
            $pendingWithdrawals = DB::table('withdrawals')
                ->where('supplier_id', $supplierId)
                ->where('status', 'pending')
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'wallet' => $wallet,
                    'recent_transactions' => $recentTransactions,
                    'pending_withdrawals' => $pendingWithdrawals
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('PromotionController getWallet error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }

    /**
     * POST /api/v1/supplier/withdraw
     * 
     * Request withdrawal
     */
    public function requestWithdrawal(Request $request)
    {
        try {
            $supplierId = $request->user()->supplier_id;

            $validated = $request->validate([
                'amount' => 'required|numeric|min:1000',
                'method' => 'required|in:mobile_money,bank',
                'recipient_phone' => 'required_if:method,mobile_money',
                'recipient_name' => 'required',
                'bank_name' => 'required_if:method,bank',
                'account_number' => 'required_if:method,bank'
            ]);

            // Check balance
            $wallet = DB::table('supplier_wallets')
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$wallet || $wallet->balance < $validated['amount']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant'
                ], 400);
            }

            // Create withdrawal request
            $withdrawalId = DB::table('withdrawals')->insertGetId([
                'supplier_id' => $supplierId,
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'recipient_phone' => $validated['recipient_phone'] ?? null,
                'recipient_name' => $validated['recipient_name'],
                'bank_name' => $validated['bank_name'] ?? null,
                'account_number' => $validated['account_number'] ?? null,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Deduct from balance
            DB::table('supplier_wallets')
                ->where('supplier_id', $supplierId)
                ->update([
                    'balance' => DB::raw('balance - ' . $validated['amount']),
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Demande de retrait soumise',
                'data' => ['id' => $withdrawalId]
            ], 201);
        } catch (\Exception $e) {
            Log::error('PromotionController requestWithdrawal error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la demande'
            ], 500);
        }
    }

    /**
     * Calculate and record commission for an order
     * Called when order is completed
     */
    public static function recordCommission($orderId, $supplierId, $orderAmount)
    {
        try {
            // Get supplier commission rate
            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
            $commissionRate = $supplier->commission_rate ?? 10; // Default 10%

            $commissionAmount = $orderAmount * ($commissionRate / 100);
            $supplierAmount = $orderAmount - $commissionAmount;

            // Record transaction
            DB::table('commission_transactions')->insert([
                'supplier_id' => $supplierId,
                'order_id' => $orderId,
                'order_amount' => $orderAmount,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
                'supplier_amount' => $supplierAmount,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Update supplier wallet
            DB::table('supplier_wallets')
                ->updateOrInsert(
                    ['supplier_id' => $supplierId],
                    [
                        'pending_balance' => DB::raw('pending_balance + ' . $supplierAmount),
                        'total_earned' => DB::raw('total_earned + ' . $supplierAmount),
                        'updated_at' => now()
                    ]
                );

            return true;
        } catch (\Exception $e) {
            Log::error('recordCommission error: ' . $e->getMessage());
            return false;
        }
    }
}
