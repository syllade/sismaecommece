<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /** Dashboard stats */
    public function dashboardStats()
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();

        // Total commandes
        $totalOrders = Order::count();
        $ordersLastMonth = Order::where('created_at', '>=', $lastMonth)->count();
        $ordersVariation = $this->calculateVariation($totalOrders, $ordersLastMonth);

        // Chiffre d'affaires
        $totalRevenue = Order::where('status', '!=', 'cancelled')->sum('total');
        $revenueLastMonth = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', $lastMonth)
            ->sum('total');
        $revenueVariation = $this->calculateVariation($totalRevenue, $revenueLastMonth);

        // Produits actifs
        $activeProducts = Product::active()->count();

        // Commandes en attente
        $pendingOrders = Order::where('status', 'pending')->count();

        return response()->json([
            'total_orders' => [
                'value' => $totalOrders,
                'variation' => $ordersVariation,
            ],
            'total_revenue' => [
                'value' => $totalRevenue,
                'variation' => $revenueVariation,
            ],
            'active_products' => $activeProducts,
            'pending_orders' => $pendingOrders,
        ]);
    }

    /** Ventes sur période */
    public function salesData(Request $request)
    {
        $period = $request->get('period', 30); // jours
        $startDate = Carbon::now()->subDays($period);

        $sales = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, SUM(total) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($sales);
    }

    /** Ventes par catégorie */
    public function categorySales()
    {
        $sales = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', '!=', 'cancelled')
            ->select('categories.name', DB::raw('SUM(order_items.subtotal) as total'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        return response()->json($sales);
    }

    /** Top produits */
    public function topProducts(Request $request)
    {
        $limit = $request->get('limit', 10);

        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', '!=', 'cancelled')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as quantity'))
            ->groupBy('products.id', 'products.name')
            ->orderBy('quantity', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($topProducts);
    }

    /** Commandes par statut */
    public function ordersByStatus()
    {
        $orders = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        return response()->json($orders);
    }

    /** Statistiques des livreurs */
    public function deliveryPersonsStats()
    {
        try {
            // Vérifier si la table delivery_persons existe
            try {
                DB::table('delivery_persons')->first();
            } catch (\Exception $e) {
                return response()->json([]);
            }

            // Statistiques par livreur : nombre de commandes livrées
            $stats = DB::table('orders')
                ->join('delivery_persons', 'orders.delivery_person_id', '=', 'delivery_persons.id')
                ->where('orders.status', '!=', 'cancelled')
                ->select(
                    'delivery_persons.id',
                    'delivery_persons.name',
                    'delivery_persons.phone',
                    'delivery_persons.vehicle_type',
                    DB::raw('COUNT(orders.id) as total_orders'),
                    DB::raw('SUM(CASE WHEN orders.status = "delivered" THEN 1 ELSE 0 END) as delivered_orders'),
                    DB::raw('SUM(CASE WHEN orders.status = "processing" THEN 1 ELSE 0 END) as processing_orders'),
                    DB::raw('SUM(orders.total) as total_revenue')
                )
                ->groupBy('delivery_persons.id', 'delivery_persons.name', 'delivery_persons.phone', 'delivery_persons.vehicle_type')
                ->orderBy('total_orders', 'desc')
                ->get();

            return response()->json($stats);
        } catch (\Exception $e) {
            \Log::warning('Erreur stats livreurs: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    /** Calcul variation en pourcentage */
    private function calculateVariation($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }
}

