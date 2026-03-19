<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Controller for Smart Alerts
 * 
 * Provides intelligent alerts for:
 * - Inactive vendors
 * - Delayed orders
 * - Low stock products
 * - Revenue drops
 */
class AdminSmartAlertsController extends Controller
{
    /**
     * GET /api/v1/admin/alerts/smart
     * 
     * Get all smart alerts with severity and recommendations
     */
    public function index(Request $request)
    {
        try {
            $alerts = [];
            
            // 1. Check for inactive vendors (no orders in 14 days)
            $inactiveVendors = $this->getInactiveVendors();
            foreach ($inactiveVendors as $vendor) {
                $alerts[] = [
                    'id' => 'vendor_inactive_' . $vendor->id,
                    'category' => 'vendor',
                    'severity' => 'warning',
                    'title' => 'Fournisseur inactif',
                    'description' => $vendor->name . ' n\'a pas de commandes depuis ' . $vendor->days_since_last_order . ' jours',
                    'affectedEntity' => [
                        'type' => 'vendor',
                        'id' => $vendor->id,
                        'name' => $vendor->name,
                    ],
                    'recommendation' => 'Contacter le fournisseur pour identifier les problèmes.',
                    'created_at' => $vendor->last_order_at,
                    'dismissed' => false,
                    'actionUrl' => '/admin/suppliers/' . $vendor->id,
                ];
            }
            
            // 2. Check for unassigned orders (> 4 hours)
            $unassignedOrders = $this->getUnassignedOrders();
            foreach ($unassignedOrders as $order) {
                $alerts[] = [
                    'id' => 'order_unassigned_' . $order->id,
                    'category' => 'order',
                    'severity' => 'critical',
                    'title' => 'Commande non assignée',
                    'description' => 'Commande #' . $order->id . ' en attente depuis ' . $order->hours_waiting . ' heures',
                    'affectedEntity' => [
                        'type' => 'order',
                        'id' => $order->id,
                        'name' => '#' . $order->id,
                    ],
                    'recommendation' => 'Assigner immédiatement un livreur',
                    'created_at' => $order->created_at,
                    'dismissed' => false,
                    'actionUrl' => '/admin/orders/' . $order->id,
                ];
            }
            
            // 3. Check for low stock products
            $lowStockProducts = $this->getLowStockProducts();
            foreach ($lowStockProducts as $product) {
                $alerts[] = [
                    'id' => 'stock_low_' . $product->id,
                    'category' => 'stock',
                    'severity' => $product->stock <= 2 ? 'critical' : 'warning',
                    'title' => 'Stock faible',
                    'description' => $product->name . ' - Stock: ' . $product->stock . ' unités',
                    'affectedEntity' => [
                        'type' => 'product',
                        'id' => $product->id,
                        'name' => $product->name,
                    ],
                    'recommendation' => 'Contacter le fournisseur pour réapprovisionnement',
                    'created_at' => $product->updated_at,
                    'dismissed' => false,
                    'actionUrl' => '/admin/products',
                ];
            }
            
            // 4. Check for revenue drop
            $revenueDrop = $this->checkRevenueDrop();
            if ($revenueDrop['has_drop']) {
                $alerts[] = [
                    'id' => 'revenue_drop_' . date('Ymd'),
                    'category' => 'revenue',
                    'severity' => $revenueDrop['drop_percent'] > 50 ? 'critical' : 'warning',
                    'title' => 'Baisse de revenus',
                    'description' => 'Les revenus ont chuté de ' . round($revenueDrop['drop_percent'], 1) . '% par rapport à la veille',
                    'affectedEntity' => [
                        'type' => 'vendor',
                        'id' => 0,
                        'name' => 'Plateforme',
                    ],
                    'recommendation' => 'Analyser les causes et ajuster les stratégies marketing',
                    'created_at' => now(),
                    'dismissed' => false,
                    'actionUrl' => '/admin/reporting',
                ];
            }
            
            // 5. Check for delayed deliveries
            $delayedDeliveries = $this->getDelayedDeliveries();
            foreach ($delayedDeliveries as $delivery) {
                $alerts[] = [
                    'id' => 'delivery_delayed_' . $delivery->id,
                    'category' => 'delivery',
                    'severity' => 'warning',
                    'title' => 'Livraison retardée',
                    'description' => 'Livraison #' . $delivery->id . ' en retard de ' . $delivery->hours_late . ' heures',
                    'affectedEntity' => [
                        'type' => 'order',
                        'id' => $delivery->id,
                        'name' => '#' . $delivery->id,
                    ],
                    'recommendation' => 'Contacter le livreur pour mise à jour',
                    'created_at' => $delivery->updated_at,
                    'dismissed' => false,
                    'actionUrl' => '/admin/orders/' . $delivery->id,
                ];
            }
            
            // Calculate summary
            $summary = [
                'total' => count($alerts),
                'critical' => count(array_filter($alerts, fn($a) => $a['severity'] === 'critical')),
                'warning' => count(array_filter($alerts, fn($a) => $a['severity'] === 'warning')),
                'info' => count(array_filter($alerts, fn($a) => $a['severity'] === 'info')),
            ];
            
            return response()->json([
                'success' => true,
                'alerts' => $alerts,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération des alertes',
                'alerts' => [],
                'summary' => ['total' => 0, 'critical' => 0, 'warning' => 0, 'info' => 0],
            ], 500);
        }
    }
    
    /**
     * Get vendors with no recent orders
     */
    private function getInactiveVendors()
    {
        $fourteenDaysAgo = Carbon::now()->subDays(14)->toDateTimeString();
        
        return DB::table('suppliers')
            ->selectRaw('
                suppliers.id,
                suppliers.name,
                MAX(orders.created_at) as last_order_at,
                DATEDIFF(NOW(), MAX(orders.created_at)) as days_since_last_order
            ')
            ->leftJoin('orders', 'orders.supplier_id', '=', 'suppliers.id')
            ->where('suppliers.is_active', 1)
            ->groupBy('suppliers.id', 'suppliers.name')
            ->havingRaw('MAX(orders.created_at) IS NULL OR MAX(orders.created_at) < ?', [$fourteenDaysAgo])
            ->limit(10)
            ->get();
    }
    
    /**
     * Get orders not assigned to any driver for more than 4 hours
     */
    private function getUnassignedOrders()
    {
        $fourHoursAgo = Carbon::now()->subHours(4)->toDateTimeString();
        
        return DB::table('orders')
            ->selectRaw('
                id,
                created_at,
                TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_waiting
            ')
            ->whereNull('delivery_person_id')
            ->whereIn('status', ['pending', 'confirmed', 'preparing'])
            ->where('created_at', '<', $fourHoursAgo)
            ->limit(20)
            ->get();
    }
    
    /**
     * Get products with low stock
     */
    private function getLowStockProducts()
    {
        return DB::table('products')
            ->select('id', 'name', 'stock', 'updated_at')
            ->where('is_active', 1)
            ->where('stock', '<=', 10)
            ->where('stock', '>', 0)
            ->orderBy('stock', 'asc')
            ->limit(20)
            ->get();
    }
    
    /**
     * Check if revenue has dropped significantly
     */
    private function checkRevenueDrop()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        
        $todayRevenue = DB::table('orders')
            ->whereDate('created_at', $today)
            ->where('status', 'delivered')
            ->sum('total') ?? 0;
            
        $yesterdayRevenue = DB::table('orders')
            ->whereDate('created_at', $yesterday)
            ->where('status', 'delivered')
            ->sum('total') ?? 0;
            
        if ($yesterdayRevenue > 0) {
            $dropPercent = (($yesterdayRevenue - $todayRevenue) / $yesterdayRevenue) * 100;
            return [
                'has_drop' => $dropPercent > 30,
                'drop_percent' => $dropPercent,
            ];
        }
        
        return ['has_drop' => false, 'drop_percent' => 0];
    }
    
    /**
     * Get deliveries that are delayed
     */
    private function getDelayedDeliveries()
    {
        $twoHoursAgo = Carbon::now()->subHours(2)->toDateTimeString();
        
        return DB::table('orders')
            ->selectRaw('
                id,
                updated_at,
                TIMESTAMPDIFF(HOUR, updated_at, NOW()) as hours_late
            ')
            ->whereNotNull('delivery_person_id')
            ->whereIn('status', ['shipped', 'out_for_delivery'])
            ->where('updated_at', '<', $twoHoursAgo)
            ->limit(10)
            ->get();
    }
}
