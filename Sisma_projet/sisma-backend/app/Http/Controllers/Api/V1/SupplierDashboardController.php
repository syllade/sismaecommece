<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Supplier Dashboard Controller - Merchant Space
 * Provides revenue metrics and KPIs for the supplier
 */
class SupplierDashboardController extends Controller
{
    /**
     * Get supplier dashboard stats
     * GET /api/v1/supplier/dashboard
     * 
     * Returns: revenue_today, revenue_week, revenue_month, pending_orders_count, 
     * out_of_stock_products, rejected_products, pending_payments
     */
    public function stats(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized - Supplier not found'], 401);
            }

            // Date calculations
            $today = now()->toDateString();
            $weekStart = now()->startOfWeek()->toDateString();
            $monthStart = now()->startOfMonth()->toDateString();

            // Revenue today
            $revenueToday = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereDate('created_at', $today)
                ->whereIn('status', ['delivered', 'completed'])
                ->sum('total');

            // Revenue this week
            $revenueWeek = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereDate('created_at', '>=', $weekStart)
                ->whereIn('status', ['delivered', 'completed'])
                ->sum('total');

            // Revenue this month
            $revenueMonth = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereDate('created_at', '>=', $monthStart)
                ->whereIn('status', ['delivered', 'completed'])
                ->sum('total');

            // Pending orders count
            $pendingOrdersCount = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
                ->count();

            // Out of stock products
            $outOfStockProducts = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->where('stock', '<=', 0)
                ->count();

            // Low stock products (warning)
            $lowStockProducts = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->where('stock', '>', 0)
                ->where('stock', '<=', 5)
                ->count();

            // Rejected products (pending approval)
            $rejectedProducts = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->where('status', 'rejected')
                ->count();

            // Pending products (awaiting approval)
            $pendingProducts = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->where('status', 'pending')
                ->count();

            // Active products count
            $activeProducts = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->where('is_active', 1)
                ->count();

            // Total orders count
            $totalOrders = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->count();

            // Completed orders
            $completedOrders = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereIn('status', ['delivered', 'completed'])
                ->count();

            // Cancelled orders
            $cancelledOrders = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->where('status', 'cancelled')
                ->count();

            // Pending payments (orders delivered but not paid to supplier)
            $pendingPayments = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereIn('status', ['delivered', 'completed'])
                ->where('payment_status', '!=', 'paid')
                ->sum('total');

            // ========== CONVERSION RATE ==========
            // Conversion rate = (completed orders / total views) * 100
            // We'll estimate using total products viewed vs orders
            $totalViews = DB::table('products')
                ->where('supplier_id', $supplierId)
                ->sum('views');
            
            $conversionRate = 0;
            if ($totalViews > 0) {
                $conversionRate = round(($completedOrders / $totalViews) * 100, 2);
            }

            // ========== AVERAGE BASKET ==========
            // Average basket = total revenue / completed orders
            $averageBasket = 0;
            if ($completedOrders > 0) {
                $totalRevenue = DB::table('orders')
                    ->where('supplier_id', $supplierId)
                    ->whereIn('status', ['delivered', 'completed'])
                    ->sum('total');
                $averageBasket = round($totalRevenue / $completedOrders, 2);
            }

            // Get supplier info
            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

            return response()->json([
                'revenue' => [
                    'today' => (float) $revenueToday,
                    'week' => (float) $revenueWeek,
                    'month' => (float) $revenueMonth,
                ],
                'orders' => [
                    'pending' => $pendingOrdersCount,
                    'total' => $totalOrders,
                    'completed' => $completedOrders,
                    'cancelled' => $cancelledOrders,
                ],
                'products' => [
                    'active' => $activeProducts,
                    'out_of_stock' => $outOfStockProducts,
                    'low_stock' => $lowStockProducts,
                    'pending_approval' => $pendingProducts,
                    'rejected' => $rejectedProducts,
                ],
                'payments' => [
                    'pending' => (float) $pendingPayments,
                ],
                'analytics' => [
                    'conversion_rate' => $conversionRate,
                    'average_basket' => $averageBasket,
                    'total_views' => (int) $totalViews,
                ],
                'supplier' => [
                    'name' => $supplier->name ?? '',
                    'commission_rate' => (float) ($supplier->commission_rate ?? 0),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierDashboardController@stats error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des statistiques'], 500);
        }
    }

    /**
     * Get revenue chart data
     * GET /api/v1/supplier/dashboard/revenue
     * 
     * Query params: period (day|week|month), days (default 30)
     */
    public function revenue(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $period = $request->get('period', 'day');
            $days = (int) $request->get('days', 30);

            $startDate = now()->subDays($days)->toDateString();

            $query = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereDate('created_at', '>=', $startDate)
                ->whereIn('status', ['delivered', 'completed']);

            if ($period === 'day') {
                $data = $query->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as revenue'),
                    DB::raw('COUNT(*) as orders_count')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get();
            } elseif ($period === 'week') {
                $data = $query->select(
                    DB::raw('YEARWEEK(created_at, 1) as week'),
                    DB::raw('SUM(total) as revenue'),
                    DB::raw('COUNT(*) as orders_count')
                )
                ->groupBy(DB::raw('YEARWEEK(created_at, 1)'))
                ->orderBy('week')
                ->get();
            } else {
                $data = $query->select(
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                    DB::raw('SUM(total) as revenue'),
                    DB::raw('COUNT(*) as orders_count')
                )
                ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
                ->orderBy('month')
                ->get();
            }

            return response()->json([
                'period' => $period,
                'days' => $days,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierDashboardController@revenue error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération du chiffre d\'affaires'], 500);
        }
    }

    /**
     * Get orders by status for pie chart
     * GET /api/v1/supplier/dashboard/orders-by-status
     */
    public function ordersByStatus(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $days = (int) $request->get('days', 30);
            $startDate = now()->subDays($days)->toDateString();

            $data = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereDate('created_at', '>=', $startDate)
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get();

            return response()->json([
                'days' => $days,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierDashboardController@ordersByStatus error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des commandes'], 500);
        }
    }

    /**
     * Get top selling products
     * GET /api/v1/supplier/dashboard/top-products
     */
    public function topProducts(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $limit = (int) $request->get('limit', 10);
            $days = (int) $request->get('days', 30);
            $startDate = now()->subDays($days)->toDateString();

            $data = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('orders.supplier_id', $supplierId)
                ->whereDate('orders.created_at', '>=', $startDate)
                ->select(
                    'products.id',
                    'products.name',
                    'products.image',
                    DB::raw('SUM(order_items.quantity) as total_sold'),
                    DB::raw('SUM(order_items.price * order_items.quantity) as total_revenue')
                )
                ->groupBy('products.id', 'products.name', 'products.image')
                ->orderByDesc('total_sold')
                ->limit($limit)
                ->get();

            return response()->json([
                'days' => $days,
                'limit' => $limit,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierDashboardController@topProducts error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des produits'], 500);
        }
    }

    /**
     * Get recent orders
     * GET /api/v1/supplier/dashboard/recent-orders
     */
    public function recentOrders(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $limit = (int) $request->get('limit', 10);

            $orders = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get();

            return response()->json([
                'data' => $orders,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierDashboardController@recentOrders error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des commandes'], 500);
        }
    }

    /**
     * Helper: Get supplier ID from authenticated user
     */
    private function getSupplierId()
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        // Check if user has supplier_id or is a supplier
        if (isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        // If user role is supplier, check suppliers table
        if ($user->role === 'supplier') {
            $supplier = DB::table('suppliers')->where('user_id', $user->id)->first();
            return $supplier ? $supplier->id : null;
        }

        return null;
    }
}
