<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\DeliveryPerson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Admin Stats Controller V1
 * 
 * API Version 1 - Dashboard Principal
 * Returns comprehensive stats for the admin dashboard
 */
class AdminStatsController extends Controller
{
    /**
     * GET /api/v1/admin/stats
     * 
     * Dashboard principal avec toutes les métriques requises
     */
    public function stats(Request $request)
    {
        try {
            $today = Carbon::today();
            $startOfWeek = Carbon::now()->startOfWeek();
            $startOfMonth = Carbon::now()->startOfMonth();
            
            $ordersToday = DB::table('orders')->whereDate('created_at', $today)->count();
            $ordersWeek = DB::table('orders')->where('created_at', '>=', $startOfWeek)->count();
            $ordersMonth = DB::table('orders')->where('created_at', '>=', $startOfMonth)->count();
            $totalOrders = DB::table('orders')->count();
            
            $revenueTotal = DB::table('orders')->where('status', '!=', 'annulee')->where('status', '!=', 'cancelled')->sum('total') ?? 0;
            $revenueToday = DB::table('orders')->whereDate('created_at', $today)->where('status', '!=', 'annulee')->sum('total') ?? 0;
            $revenueWeek = DB::table('orders')->where('created_at', '>=', $startOfWeek)->where('status', '!=', 'annulee')->sum('total') ?? 0;
            $revenueMonth = DB::table('orders')->where('created_at', '>=', $startOfMonth)->where('status', '!=', 'annulee')->sum('total') ?? 0;
            
            $outOfStockProducts = DB::table('products')->where('stock', '<=', 0)->count();
            $pendingSuppliers = DB::table('suppliers')->where('is_active', 0)->count();
            $pendingDrivers = DB::table('delivery_persons')->where('is_active', 0)->count();
            $unassignedOrders = DB::table('orders')->whereNull('delivery_person_id')->whereNotIn('status', ['annulee', 'cancelled', 'livree'])->count();
            
            // Get orders over time for charts (last 30 days)
            $ordersOverTime = DB::table('orders')
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as orders'), DB::raw('SUM(total) as revenue'))
                ->where('created_at', '>=', Carbon::now()->subDays(30))
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get();
            
            // Revenue by supplier
            $revenueBySupplier = DB::table('orders')
                ->join('suppliers', 'orders.supplier_id', '=', 'suppliers.id')
                ->select('suppliers.id as supplier_id', 'suppliers.name', DB::raw('SUM(orders.total) as revenue'))
                ->where('orders.status', '!=', 'annulee')
                ->groupBy('suppliers.id', 'suppliers.name')
                ->limit(10)
                ->get();
            
            // Top products
            $topProducts = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->select('products.id', 'products.name', DB::raw('SUM(order_items.quantity) as quantity_sold'), DB::raw('SUM(order_items.subtotal) as revenue'))
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('quantity_sold')
                ->limit(10)
                ->get();
            
            // Delivery success rate
            $totalDeliveries = DB::table('orders')->whereIn('status', ['livree', 'delivered'])->count();
            $deliveredOrders = DB::table('orders')->whereIn('status', ['livree', 'delivered'])->count();
            $exceptionOrders = DB::table('orders')->whereIn('status', ['annulee', 'cancelled'])->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'orders_today' => $ordersToday,
                    'orders_week' => $ordersWeek,
                    'orders_month' => $ordersMonth,
                    'revenue_total' => (float) $revenueTotal,
                    'revenue_today' => (float) $revenueToday,
                    'revenue_week' => (float) $revenueWeek,
                    'revenue_month' => (float) $revenueMonth,
                    'out_of_stock_products' => $outOfStockProducts,
                    'pending_suppliers' => $pendingSuppliers,
                    'pending_drivers' => $pendingDrivers,
                    'unassigned_orders' => $unassignedOrders,
                    'charts' => [
                        'orders_over_time' => $ordersOverTime->map(function($item) {
                            return [
                                'date' => $item->date,
                                'orders' => (int) $item->orders,
                                'revenue' => (float) $item->revenue
                            ];
                        }),
                        'revenue_by_supplier' => $revenueBySupplier->map(function($item) {
                            return [
                                'supplier_id' => $item->supplier_id,
                                'supplier_name' => $item->name,
                                'revenue' => (float) $item->revenue
                            ];
                        }),
                        'top_products' => $topProducts->map(function($item) {
                            return [
                                'id' => $item->id,
                                'name' => $item->name,
                                'quantity_sold' => (int) $item->quantity_sold,
                                'revenue' => (float) $item->revenue
                            ];
                        }),
                        'delivery_success_rate' => [
                            'total' => $totalDeliveries,
                            'delivered' => $deliveredOrders,
                            'exceptions' => $exceptionOrders,
                            'success_rate' => $totalDeliveries > 0 ? round(($deliveredOrders / $totalDeliveries) * 100, 2) : 0,
                            'exception_rate' => $totalDeliveries > 0 ? round(($exceptionOrders / $totalDeliveries) * 100, 2) : 0,
                        ]
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AdminStatsController error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'orders_today' => 0,
                    'orders_week' => 0,
                    'orders_month' => 0,
                    'revenue_total' => 0,
                    'revenue_today' => 0,
                    'revenue_week' => 0,
                    'revenue_month' => 0,
                    'out_of_stock_products' => 0,
                    'pending_suppliers' => 0,
                    'pending_drivers' => 0,
                    'unassigned_orders' => 0,
                    'charts' => [
                        'orders_over_time' => [],
                        'revenue_by_supplier' => [],
                        'top_products' => [],
                        'delivery_success_rate' => [
                            'total' => 0,
                            'delivered' => 0,
                            'exceptions' => 0,
                            'success_rate' => 0,
                            'exception_rate' => 0,
                        ]
                    ]
                ],
            ], 200);
        }
    }

    /**
     * GET /api/v1/admin/stats/kpis
     * 
     * KPIs simples pour le dashboard
     */
    public function kpis(Request $request)
    {
        try {
            $today = Carbon::today();
            $startOfWeek = Carbon::now()->startOfWeek();
            $startOfMonth = Carbon::now()->startOfMonth();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders' => DB::table('orders')->count(),
                    'orders_today' => DB::table('orders')->whereDate('created_at', $today)->count(),
                    'orders_week' => DB::table('orders')->where('created_at', '>=', $startOfWeek)->count(),
                    'orders_month' => DB::table('orders')->where('created_at', '>=', $startOfMonth)->count(),
                    'total_products' => DB::table('products')->count(),
                    'out_of_stock_products' => DB::table('products')->where('stock', '<=', 0)->count(),
                    'total_suppliers' => DB::table('suppliers')->count(),
                    'active_suppliers' => DB::table('suppliers')->where('is_active', 1)->count(),
                    'pending_suppliers' => DB::table('suppliers')->where('is_active', 0)->count(),
                    'total_drivers' => DB::table('delivery_persons')->count(),
                    'active_drivers' => DB::table('delivery_persons')->where('is_active', 1)->count(),
                    'pending_drivers' => DB::table('delivery_persons')->where('is_active', 0)->count(),
                    'pending_orders' => DB::table('orders')->where('status', 'pending')->count(),
                    'unassigned_orders' => DB::table('orders')->whereNull('delivery_person_id')->whereNotIn('status', ['annulee', 'cancelled', 'livree'])->count(),
                    'revenue_total' => (float) DB::table('orders')->where('status', '!=', 'annulee')->where('status', '!=', 'cancelled')->sum('total'),
                    'revenue_today' => (float) DB::table('orders')->whereDate('created_at', $today)->where('status', '!=', 'annulee')->sum('total'),
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AdminStatsController KPIs error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders' => 0,
                    'orders_today' => 0,
                    'orders_week' => 0,
                    'orders_month' => 0,
                    'total_products' => 0,
                    'out_of_stock_products' => 0,
                    'total_suppliers' => 0,
                    'active_suppliers' => 0,
                    'pending_suppliers' => 0,
                    'total_drivers' => 0,
                    'active_drivers' => 0,
                    'pending_drivers' => 0,
                    'pending_orders' => 0,
                    'unassigned_orders' => 0,
                    'revenue_total' => 0,
                    'revenue_today' => 0,
                ],
            ], 200);
        }
    }
}
