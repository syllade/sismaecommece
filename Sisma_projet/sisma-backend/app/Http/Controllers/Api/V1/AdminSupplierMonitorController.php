<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin Supplier Monitoring Controller
 * 
 * Provides endpoints for:
 * - Supplier activity logs
 * - AI usage tracking
 * - Campaign click analytics
 * - Performance metrics
 */
class AdminSupplierMonitorController extends Controller
{
    /**
     * Get supplier activity logs
     * GET /api/v1/admin/suppliers/{id}/activity
     */
    public function getActivity(Request $request, int $supplierId)
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        if (!$supplier) {
            return response()->json(['error' => 'Fournisseur non trouvé'], 404);
        }

        $query = DB::table('supplier_activity_logs')
            ->where('supplier_id', $supplierId);

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        // Filter by action type
        if ($request->has('action')) {
            $query->where('action', $request->input('action'));
        }

        $perPage = $request->input('per_page', 50);
        $activities = $query->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($activities);
    }

    /**
     * Get supplier AI usage
     * GET /api/v1/admin/suppliers/{id}/ai-usage
     */
    public function getAiUsage(Request $request, int $supplierId)
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        if (!$supplier) {
            return response()->json(['error' => 'Fournisseur non trouvé'], 404);
        }

        // Get AI balance
        $balance = DB::table('supplier_ai_balances')
            ->where('supplier_id', $supplierId)
            ->first();

        // Get usage history
        $usageQuery = DB::table('supplier_ai_usage_logs')
            ->where('supplier_id', $supplierId);

        if ($request->has('date_from')) {
            $usageQuery->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->has('date_to')) {
            $usageQuery->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $usage = $usageQuery->orderByDesc('created_at')
            ->limit(100)
            ->get();

        // Calculate totals
        $totals = DB::table('supplier_ai_usage_logs')
            ->where('supplier_id', $supplierId)
            ->select(
                DB::raw('SUM(tokens_used) as total_tokens'),
                DB::raw('SUM(cost) as total_cost'),
                DB::raw('COUNT(*) as total_requests')
            )
            ->first();

        // Group by feature
        $byFeature = DB::table('supplier_ai_usage_logs')
            ->where('supplier_id', $supplierId)
            ->select('feature', DB::raw('COUNT(*) as count'), DB::raw('SUM(cost) as total_cost'))
            ->groupBy('feature')
            ->get();

        return response()->json([
            'balance' => [
                'credits' => (float) ($balance->credits ?? 0),
                'spent' => (float) ($balance->spent ?? 0),
            ],
            'totals' => [
                'tokens' => (int) ($totals->total_tokens ?? 0),
                'cost' => (float) ($totals->total_cost ?? 0),
                'requests' => (int) ($totals->total_requests ?? 0),
            ],
            'by_feature' => $byFeature,
            'usage_history' => $usage,
        ]);
    }

    /**
     * Get supplier campaign clicks
     * GET /api/v1/admin/suppliers/{id}/campaign-clicks
     */
    public function getCampaignClicks(Request $request, int $supplierId)
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        if (!$supplier) {
            return response()->json(['error' => 'Fournisseur non trouvé'], 404);
        }

        // Get clicks with campaign info
        $query = DB::table('campaign_clicks as cc')
            ->join('marketing_campaigns as mc', 'cc.campaign_id', '=', 'mc.id')
            ->where('mc.supplier_id', $supplierId)
            ->select(
                'cc.*',
                'mc.name as campaign_name',
                'mc.budget as campaign_budget'
            );

        if ($request->has('date_from')) {
            $query->whereDate('cc.created_at', '>=', $request->input('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('cc.created_at', '<=', $request->input('date_to'));
        }

        if ($request->has('campaign_id')) {
            $query->where('cc.campaign_id', $request->input('campaign_id'));
        }

        // Fraud detection - suspicious clicks
        $suspicious = DB::table('campaign_clicks as cc')
            ->join('marketing_campaigns as mc', 'cc.campaign_id', '=', 'mc.id')
            ->where('mc.supplier_id', $supplierId)
            ->where('cc.is_suspicious', true)
            ->count();

        // Get totals
        $totals = DB::table('campaign_clicks as cc')
            ->join('marketing_campaigns as mc', 'cc.campaign_id', '=', 'mc.id')
            ->where('mc.supplier_id', $supplierId)
            ->select(
                DB::raw('COUNT(*) as total_clicks'),
                DB::raw('SUM(cc.cost) as total_cost'),
                DB::raw('COUNT(DISTINCT cc.ip_address) as unique_ips')
            )
            ->first();

        $perPage = $request->input('per_page', 50);
        $clicks = $query->orderByDesc('cc.created_at')
            ->paginate($perPage);

        // Calculate CTR
        $impressions = DB::table('marketing_campaigns')
            ->where('supplier_id', $supplierId)
            ->sum('impressions');

        $ctr = $impressions > 0 ? ($totals->total_clicks / $impressions) * 100 : 0;

        return response()->json([
            'totals' => [
                'clicks' => (int) ($totals->total_clicks ?? 0),
                'unique_ips' => (int) ($totals->unique_ips ?? 0),
                'cost' => (float) ($totals->total_cost ?? 0),
                'ctr' => round($ctr, 2),
                'suspicious_clicks' => $suspicious,
            ],
            'clicks' => $clicks,
        ]);
    }

    /**
     * Get supplier performance metrics
     * GET /api/v1/admin/suppliers/{id}/metrics
     */
    public function getMetrics(Request $request, int $supplierId)
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        if (!$supplier) {
            return response()->json(['error' => 'Fournisseur non trouvé'], 404);
        }

        $period = $request->input('period', 30); // days

        // Orders metrics
        $ordersTotal = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->where('created_at', '>=', now()->subDays($period))
            ->count();

        $ordersRevenue = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->where('created_at', '>=', now()->subDays($period))
            ->sum('total');

        // Products metrics
        $productsActive = DB::table('products')
            ->where('supplier_id', $supplierId)
            ->where('status', 'active')
            ->count();

        $productsTotal = DB::table('products')
            ->where('supplier_id', $supplierId)
            ->count();

        // Campaign metrics
        $campaignsActive = DB::table('marketing_campaigns')
            ->where('supplier_id', $supplierId)
            ->where('status', 'active')
            ->count();

        $campaignsSpend = DB::table('marketing_campaigns')
            ->where('supplier_id', $supplierId)
            ->where('status', 'active')
            ->sum('spent_budget');

        // Orders by status
        $ordersByStatus = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->where('created_at', '>=', now()->subDays($period))
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        // Daily orders for chart
        $dailyOrders = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->where('created_at', '>=', now()->subDays($period))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'period_days' => $period,
            'orders' => [
                'total' => $ordersTotal,
                'revenue' => (float) $ordersRevenue,
                'by_status' => $ordersByStatus,
                'daily' => $dailyOrders,
            ],
            'products' => [
                'active' => $productsActive,
                'total' => $productsTotal,
            ],
            'campaigns' => [
                'active' => $campaignsActive,
                'spend' => (float) $campaignsSpend,
            ],
        ]);
    }

    /**
     * Get all suppliers overview (admin dashboard)
     * GET /api/v1/admin/suppliers-overview
     */
    public function getSuppliersOverview(Request $request)
    {
        $period = $request->input('period', 30);

        // Suppliers count by status
        $byStatus = DB::table('suppliers')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        // Top suppliers by revenue
        $topByRevenue = DB::table('suppliers')
            ->join('orders', 'suppliers.id', '=', 'orders.supplier_id')
            ->where('orders.created_at', '>=', now()->subDays($period))
            ->select(
                'suppliers.id',
                'suppliers.name',
                DB::raw('SUM(orders.total) as revenue'),
                DB::raw('COUNT(orders.id) as orders_count')
            )
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        // Top suppliers by orders
        $topByOrders = DB::table('suppliers')
            ->join('orders', 'suppliers.id', '=', 'orders.supplier_id')
            ->where('orders.created_at', '>=', now()->subDays($period))
            ->select(
                'suppliers.id',
                'suppliers.name',
                DB::raw('COUNT(orders.id) as orders_count'),
                DB::raw('SUM(orders.total) as revenue')
            )
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('orders_count')
            ->limit(10)
            ->get();

        // Recent activity
        $recentActivity = DB::table('supplier_activity_logs')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'by_status' => $byStatus,
            'top_by_revenue' => $topByRevenue,
            'top_by_orders' => $topByOrders,
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * Export supplier data (CSV)
     * GET /api/v1/admin/suppliers/{id}/export
     */
    public function export(Request $request, int $supplierId)
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        if (!$supplier) {
            return response()->json(['error' => 'Fournisseur non trouvé'], 404);
        }

        $format = $request->input('format', 'csv');
        
        // Get all supplier data
        $orders = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->orderByDesc('created_at')
            ->get();

        if ($format === 'csv') {
            $csv = "Order ID,Date,Customer,Total,Status\n";
            foreach ($orders as $order) {
                $csv .= "{$order->order_number},{$order->created_at},{$order->customer_name},{$order->total},{$order->status}\n";
            }
            
            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=supplier_{$supplierId}_orders.csv",
            ]);
        }

        return response()->json([
            'supplier' => $supplier,
            'orders' => $orders,
        ]);
    }
}
