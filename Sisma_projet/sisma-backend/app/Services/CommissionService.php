<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SupplierCommission;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommissionService
{
    // Commission rates based on product tier
    const COMMISSION_RATE_FIRST_10 = 5;  // 5% for suppliers with <= 10 products
    const COMMISSION_RATE_STANDARD = 10; // 10% for suppliers with > 10 products
    const PRODUCT_THRESHOLD = 10;        // First 10 products get 5%
    
    // Payment cycle
    const PAYMENT_CYCLE_DAYS = 7; // Weekly payment cycle

    /**
     * Calculate and record commission when order is delivered
     * Uses tiered rate based on supplier's product count
     */
    public function calculateCommission(Order $order): bool
    {
        try {
            DB::beginTransaction();

            $supplierId = $order->supplier_id;
            $orderTotal = $order->total;
            
            // Determine commission rate based on supplier's product count
            $commissionRate = $this->getSupplierCommissionRate($supplierId);
            
            // Calculate commission
            $commissionAmount = ($orderTotal * $commissionRate) / 100;
            $earningSupplier = $orderTotal - $commissionAmount;

            // Get order items
            $orderItems = DB::table('order_items')
                ->where('order_id', $order->id)
                ->get();

            // Update each order item with commission snapshot
            foreach ($orderItems as $item) {
                $itemTotal = $item->total;
                $itemCommission = ($itemTotal * $commissionRate) / 100;
                $itemEarning = $itemTotal - $itemCommission;
                
                // Get product creation date to determine tier
                $product = DB::table('products')
                    ->where('id', $item->product_id)
                    ->first();
                
                // Individual product rate based on when it was added
                $productCount = $this->getSupplierProductCount($supplierId);
                $individualRate = $productCount <= self::PRODUCT_THRESHOLD ? 
                    self::COMMISSION_RATE_FIRST_10 : self::COMMISSION_RATE_STANDARD;
                
                // If this product was added when supplier had <= 10 products, use 5%
                if ($product && $product->created_at) {
                    $productsAtTime = DB::table('products')
                        ->where('supplier_id', $supplierId)
                        ->where('created_at', '<=', $product->created_at)
                        ->count();
                    $individualRate = $productsAtTime <= self::PRODUCT_THRESHOLD ? 
                        self::COMMISSION_RATE_FIRST_10 : self::COMMISSION_RATE_STANDARD;
                }
                
                // Recalculate with individual rate
                $itemCommission = ($itemTotal * $individualRate) / 100;
                $itemEarning = $itemTotal - $itemCommission;

                DB::table('order_items')
                    ->where('id', $item->id)
                    ->update([
                        'commission_rate_snapshot' => $individualRate,
                        'commission_amount' => $itemCommission,
                        'earning_supplier' => $itemEarning,
                    ]);
            }

            // Calculate totals using individual rates
            $totalCommission = DB::table('order_items')
                ->where('order_id', $order->id)
                ->sum('commission_amount');
            
            $totalEarnings = DB::table('order_items')
                ->where('order_id', $order->id)
                ->sum('earning_supplier');

            // Calculate average rate for the order
            $averageRate = $orderTotal > 0 ? ($totalCommission / $orderTotal) * 100 : $commissionRate;

            // Determine due date (weekly cycle)
            $dueDate = $this->getNextWeeklyDueDate();

            // Create commission record
            SupplierCommission::create([
                'supplier_id' => $supplierId,
                'order_id' => $order->id,
                'order_total' => $orderTotal,
                'commission_rate' => round($averageRate, 2),
                'commission_amount' => $totalCommission,
                'earning_supplier' => $totalEarnings,
                'status' => 'unpaid',
                'due_date' => $dueDate,
            ]);

            DB::commit();
            
            Log::info("Commission calculated for order {$order->order_number}: {$totalCommission} XOF (rate: " . round($averageRate, 2) . "%)");
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("CommissionService@calculateCommission error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get supplier's commission rate based on product count
     */
    public function getSupplierCommissionRate(int $supplierId): int
    {
        $productCount = $this->getSupplierProductCount($supplierId);
        return $productCount <= self::PRODUCT_THRESHOLD ? 
            self::COMMISSION_RATE_FIRST_10 : self::COMMISSION_RATE_STANDARD;
    }

    /**
     * Get total number of products for a supplier
     */
    public function getSupplierProductCount(int $supplierId): int
    {
        return DB::table('products')
            ->where('supplier_id', $supplierId)
            ->count();
    }

    /**
     * Get next weekly due date
     * Due date is always the following Friday
     */
    public function getNextWeeklyDueDate(): string
    {
        $today = now();
        $friday = $today->copy()->next('Friday');
        
        // If today is Friday, use next Friday
        if ($today->isFriday()) {
            $friday = $today->copy()->addWeek()->next('Friday');
        }
        
        return $friday->toDateString();
    }

    /**
     * Get supplier's commission summary
     */
    public function getSupplierSummary(int $supplierId): array
    {
        $commissions = SupplierCommission::where('supplier_id', $supplierId)->get();

        $productCount = $this->getSupplierProductCount($supplierId);
        $currentRate = $productCount <= self::PRODUCT_THRESHOLD ? 
            self::COMMISSION_RATE_FIRST_10 : self::COMMISSION_RATE_STANDARD;

        return [
            'current_rate' => $currentRate,
            'product_count' => $productCount,
            'rate_tier' => $productCount <= self::PRODUCT_THRESHOLD ? 
                '5% (first 10 products)' : '10% (standard)',
            'total_due' => $commissions->where('status', 'unpaid')->sum('commission_amount'),
            'total_overdue' => $commissions->where('status', 'overdue')->sum('commission_amount'),
            'total_paid' => $commissions->where('status', 'paid')->sum('commission_amount'),
            'pending_count' => $commissions->where('status', 'unpaid')->count(),
            'overdue_count' => $commissions->where('status', 'overdue')->count(),
            'next_due_date' => $commissions->where('status', 'unpaid')->min('due_date'),
        ];
    }

    /**
     * Check if supplier has overdue commissions
     */
    public function hasOverdueCommissions(int $supplierId): bool
    {
        return SupplierCommission::where('supplier_id', $supplierId)
            ->where('status', 'overdue')
            ->exists();
    }

    /**
     * Mark commission as paid
     */
    public function markAsPaid(int $commissionId, string $paymentMethod, string $reference = null, int $paidBy = null): bool
    {
        try {
            $commission = SupplierCommission::findOrFail($commissionId);
            $commission->update([
                'status' => 'paid',
                'paid_date' => now(),
                'payment_method' => $paymentMethod,
                'payment_reference' => $reference,
                'paid_by' => $paidBy,
            ]);

            Log::info("Commission {$commissionId} marked as paid");
            return true;
        } catch (\Exception $e) {
            Log::error("CommissionService@markAsPaid error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all overdue commissions (for CRON job)
     */
    public function getOverdueCommissions(): \Illuminate\Database\Eloquent\Collection
    {
        return SupplierCommission::where('status', 'unpaid')
            ->where('due_date', '<', now()->toDateString())
            ->get();
    }

    /**
     * Mark overdue commissions (for CRON job)
     */
    public function markOverdue(): int
    {
        $count = SupplierCommission::where('status', 'unpaid')
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);

        if ($count > 0) {
            Log::info("Marked {$count} commissions as overdue");
        }

        return $count;
    }

    /**
     * Get admin dashboard stats
     */
    public function getAdminStats(): array
    {
        $all = SupplierCommission::all();
        
        return [
            'total_unpaid' => $all->where('status', 'unpaid')->sum('commission_amount'),
            'total_overdue' => $all->where('status', 'overdue')->sum('commission_amount'),
            'total_paid' => $all->where('status', 'paid')->sum('commission_amount'),
            'unpaid_count' => $all->where('status', 'unpaid')->count(),
            'overdue_count' => $all->where('status', 'overdue')->count(),
            'suppliers_with_overdue' => $all->where('status', 'overdue')->pluck('supplier_id')->unique()->count(),
        ];
    }

    /**
     * Get suppliers with overdue commissions
     */
    public function getSuppliersWithOverdue(): array
    {
        return SupplierCommission::where('status', 'overdue')
            ->select('supplier_id', DB::raw('SUM(commission_amount) as total_overdue'))
            ->groupBy('supplier_id')
            ->orderByDesc('total_overdue')
            ->get()
            ->toArray();
    }

    /**
     * Get weekly commission summary for a supplier
     */
    public function getWeeklySummary(int $supplierId, ?string $weekStart = null): array
    {
        $start = $weekStart ? \Carbon\Carbon::parse($weekStart) : now()->startOfWeek();
        $end = $start->copy()->endOfWeek();

        $commissions = SupplierCommission::where('supplier_id', $supplierId)
            ->whereBetween('created_at', [$start, $end])
            ->get();

        return [
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'total_orders' => $commissions->count(),
            'total_sales' => $commissions->sum('order_total'),
            'total_commission' => $commissions->sum('commission_amount'),
            'total_earnings' => $commissions->sum('earning_supplier'),
            'commissions' => $commissions,
        ];
    }

    /**
     * Get commission breakdown by product for a supplier
     */
    public function getCommissionsByProduct(int $supplierId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.supplier_id', $supplierId)
            ->where('orders.status', 'delivered');

        if ($dateFrom) {
            $query->whereDate('orders.created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('orders.created_at', '<=', $dateTo);
        }

        return $query
            ->select([
                'products.id as product_id',
                'products.name as product_name',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.total) as total_revenue'),
                DB::raw('AVG(order_items.commission_rate_snapshot) as avg_commission_rate'),
                DB::raw('SUM(order_items.commission_amount) as total_commission'),
                DB::raw('SUM(order_items.earning_supplier) as total_earnings'),
            ])
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_revenue')
            ->get()
            ->toArray();
    }

    /**
     * Get all weekly summaries for a supplier
     */
    public function getAllWeeklySummaries(int $supplierId, int $weeks = 12): array
    {
        $summaries = [];
        $start = now()->startOfWeek();

        for ($i = 0; $i < $weeks; $i++) {
            $weekStart = $start->copy()->subWeeks($i)->startOfWeek();
            $summaries[] = $this->getWeeklySummary($supplierId, $weekStart->toDateString());
        }

        return $summaries;
    }
}
