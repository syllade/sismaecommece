<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Supplier Wallet & Payment Service
 * 
 * Manages:
 * - Supplier wallet balance
 * - Automatic commission deduction
 * - Payout requests
 * - Transaction history
 */
class SupplierWalletService
{
    /**
     * Get supplier wallet info
     */
    public function getWallet(int $supplierId): array
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

        if (!$supplier) {
            throw new \Exception('Fournisseur non trouvé');
        }

        // Calculate available balance
        $pendingBalance = $this->getPendingBalance($supplierId);
        $availableBalance = $supplier->wallet_balance - $pendingBalance;

        return [
            'supplier_id' => $supplierId,
            'total_balance' => (float) $supplier->wallet_balance,
            'available_balance' => (float) $availableBalance,
            'pending_balance' => (float) $pendingBalance,
            'advertising_balance' => (float) ($supplier->advertising_balance ?? 0),
            'currency' => 'XOF',
        ];
    }

    /**
     * Get transaction history
     */
    public function getTransactions(int $supplierId, array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $query = DB::table('supplier_wallet_transactions')
            ->where('supplier_id', $supplierId);

        // Apply filters
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $total = $query->count();
        $transactions = $query->orderByDesc('created_at')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return [
            'data' => $transactions,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ],
        ];
    }

    /**
     * Deduct commission on order delivery
     */
    public function deductCommission(int $orderId, int $supplierId, float $orderTotal): array
    {
        $order = DB::table('orders')->where('id', $orderId)->first();
        
        if (!$order || $order->commission_deducted) {
            return ['success' => false, 'message' => 'Commande non trouvée ou commission déjà déduite'];
        }

        // Get supplier commission rate
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        $commissionRate = $supplier->commission_rate ?? config('fashop.default_commission_rate', 10);
        $commissionAmount = $orderTotal * ($commissionRate / 100);

        DB::beginTransaction();
        try {
            // Update order
            DB::table('orders')
                ->where('id', $orderId)
                ->update([
                    'commission_deducted' => true,
                    'commission_amount' => $commissionAmount,
                    'commission_rate' => $commissionRate,
                ]);

            // Deduct from supplier wallet
            DB::table('suppliers')
                ->where('id', $supplierId)
                ->decrement('wallet_balance', $commissionAmount);

            // Record transaction
            DB::table('supplier_wallet_transactions')->insert([
                'supplier_id' => $supplierId,
                'type' => 'commission',
                'amount' => -$commissionAmount,
                'reference_type' => 'order',
                'reference_id' => $orderId,
                'status' => 'completed',
                'description' => "Commission commande #{$order->order_number}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            Log::info("Commission deducted", [
                'order_id' => $orderId,
                'supplier_id' => $supplierId,
                'amount' => $commissionAmount,
                'rate' => $commissionRate,
            ]);

            return [
                'success' => true,
                'commission_amount' => $commissionAmount,
                'commission_rate' => $commissionRate,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Commission deduction failed: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Request payout
     */
    public function requestPayout(int $supplierId, float $amount, string $paymentMethod): array
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        if (!$supplier) {
            return ['success' => false, 'message' => 'Fournisseur non trouvé'];
        }

        $pendingBalance = $this->getPendingBalance($supplierId);
        $availableBalance = $supplier->wallet_balance - $pendingBalance;

        if ($amount > $availableBalance) {
            return [
                'success' => false,
                'message' => 'Solde insuffisant',
                'available_balance' => $availableBalance,
            ];
        }

        DB::beginTransaction();
        try {
            // Reserve amount (pending)
            DB::table('suppliers')
                ->where('id', $supplierId)
                ->decrement('wallet_balance', $amount);

            // Create payout request
            $payoutId = DB::table('supplier_payouts')->insertGetId([
                'supplier_id' => $supplierId,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'payment_details' => json_encode($this->getPaymentDetails($supplier, $paymentMethod)),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Record transaction
            DB::table('supplier_wallet_transactions')->insert([
                'supplier_id' => $supplierId,
                'type' => 'payout_request',
                'amount' => -$amount,
                'reference_type' => 'payout',
                'reference_id' => $payoutId,
                'status' => 'pending',
                'description' => "Demande de retrait - {$amount}XOF",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return [
                'success' => true,
                'payout_id' => $payoutId,
                'amount' => $amount,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Payout request failed: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Approve payout (admin only)
     */
    public function approvePayout(int $payoutId, int $adminId): array
    {
        $payout = DB::table('supplier_payouts')->where('id', $payoutId)->first();

        if (!$payout || $payout->status !== 'pending') {
            return ['success' => false, 'message' => 'Demande de retrait non trouvée ou déjà traitée'];
        }

        DB::beginTransaction();
        try {
            // Update payout status
            DB::table('supplier_payouts')
                ->where('id', $payoutId)
                ->update([
                    'status' => 'approved',
                    'approved_by' => $adminId,
                    'approved_at' => now(),
                ]);

            // Update transaction status
            DB::table('supplier_wallet_transactions')
                ->where('reference_type', 'payout')
                ->where('reference_id', $payoutId)
                ->update([
                    'status' => 'completed',
                ]);

            DB::commit();

            return ['success' => true];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Reject payout (admin only)
     */
    public function rejectPayout(int $payoutId, int $adminId, string $reason): array
    {
        $payout = DB::table('supplier_payouts')->where('id', $payoutId)->first();

        if (!$payout || $payout->status !== 'pending') {
            return ['success' => false, 'message' => 'Demande non trouvée'];
        }

        DB::beginTransaction();
        try {
            // Refund amount to supplier
            DB::table('suppliers')
                ->where('id', $payout->supplier_id)
                ->increment('wallet_balance', $payout->amount);

            // Update payout status
            DB::table('supplier_payouts')
                ->where('id', $payoutId)
                ->update([
                    'status' => 'rejected',
                    'rejected_by' => $adminId,
                    'rejected_reason' => $reason,
                    'rejected_at' => now(),
                ]);

            // Update transaction status
            DB::table('supplier_wallet_transactions')
                ->where('reference_type', 'payout')
                ->where('reference_id', $payoutId)
                ->update([
                    'status' => 'rejected',
                ]);

            DB::commit();

            return ['success' => true];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Get pending balance (payouts in progress)
     */
    private function getPendingBalance(int $supplierId): float
    {
        return DB::table('supplier_payouts')
            ->where('supplier_id', $supplierId)
            ->where('status', 'pending')
            ->sum('amount');
    }

    /**
     * Get payment details
     */
    private function getPaymentDetails($supplier, string $method): array
    {
        return [
            'method' => $method,
            'phone' => $supplier->phone ?? null,
            'email' => $supplier->email ?? null,
        ];
    }

    /**
     * Get payout requests (admin)
     */
    public function getPayoutRequests(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $query = DB::table('supplier_payouts')
            ->join('suppliers', 'supplier_payouts.supplier_id', '=', 'suppliers.id')
            ->select(
                'supplier_payouts.*',
                'suppliers.name as supplier_name',
                'suppliers.email as supplier_email'
            );

        if (!empty($filters['status'])) {
            $query->where('supplier_payouts.status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('supplier_payouts.created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('supplier_payouts.created_at', '<=', $filters['date_to']);
        }

        $total = $query->count();
        $payouts = $query->orderByDesc('supplier_payouts.created_at')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return [
            'data' => $payouts,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ],
        ];
    }
}
