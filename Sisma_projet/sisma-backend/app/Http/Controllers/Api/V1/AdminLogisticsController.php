<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Admin Logistics Controller V1
 * 
 * API Version 1 - Dashboard Logistique temps réel
 * Positions livreurs, flux livraisons, alertes
 */
class AdminLogisticsController extends Controller
{
    /**
     * GET /api/v1/admin/logistics/live
     * 
     * Données temps réel pour le dashboard logistique
     */
    public function live(Request $request)
    {
        try {
            // Livraisons actives
            $activeDeliveries = DB::table('orders')
                ->whereNotNull('delivery_person_id')
                ->whereIn('status', ['preparee', 'expediee'])
                ->selectRaw('
                    orders.*,
                    delivery_persons.name as driver_name,
                    delivery_persons.phone as driver_phone,
                    delivery_persons.zone as driver_zone
                ')
                ->leftJoin('delivery_persons', 'orders.delivery_person_id', '=', 'delivery_persons.id')
                ->orderBy('orders.updated_at', 'desc')
                ->limit(50)
                ->get();

            // Exceptions (retards, annulations en livraison)
            $exceptions = DB::table('orders')
                ->whereNotNull('delivery_person_id')
                ->where('status', 'cancelled')
                ->orWhere(function ($q) {
                    $q->whereIn('status', ['preparee', 'expediee'])
                        ->where('updated_at', '<', Carbon::now()->subHours(4));
                })
                ->selectRaw('
                    orders.*,
                    delivery_persons.name as driver_name,
                    delivery_persons.phone as driver_phone
                ')
                ->leftJoin('delivery_persons', 'orders.delivery_person_id', '=', 'delivery_persons.id')
                ->orderBy('orders.updated_at', 'desc')
                ->limit(20)
                ->get();

            // Positions des livreurs (simulées - à remplacer par données GPS réelles)
            $driverPositions = DB::table('delivery_persons')
                ->where('is_active', 1)
                ->select('id', 'name', 'phone', 'zone', 'vehicle_type')
                ->get()
                ->map(function ($driver) {
                    // Simulation - en production, ces données viendraient du GPS/téléphone
                    return [
                        'id' => $driver->id,
                        'name' => $driver->name,
                        'phone' => $driver->phone,
                        'zone' => $driver->zone,
                        'vehicle_type' => $driver->vehicle_type,
                        'latitude' => 5.36 + (rand(-50, 50) / 1000), // Simulation Abidjan
                        'longitude' => -4.0 + (rand(-50, 50) / 1000),
                        'last_update' => now()->toIso8601String(),
                        'status' => 'active',
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'active_deliveries' => $activeDeliveries,
                    'exceptions' => $exceptions,
                    'driver_positions' => $driverPositions,
                ],
                'meta' => [
                    'generated_at' => now()->toIso8601String(),
                    'active_count' => count($activeDeliveries),
                    'exception_count' => count($exceptions),
                    'drivers_online' => count($driverPositions),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données logistiques',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/logistics/zones
     * 
     * Statistiques par zone de livraison
     */
    public function zones(Request $request)
    {
        try {
            $zones = DB::table('delivery_persons')
                ->select('zone')
                ->whereNotNull('zone')
                ->where('zone', '!=', '')
                ->distinct()
                ->pluck('zone');

            $zoneStats = [];

            foreach ($zones as $zone) {
                $stats = DB::table('orders')
                    ->where('commune', $zone)
                    ->selectRaw('
                        COUNT(*) as total_orders,
                        SUM(CASE WHEN status IN ("delivered", "completed") THEN 1 ELSE 0 END) as delivered,
                        SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled,
                        SUM(CASE WHEN status IN ("pending", "preparee", "expediee") THEN 1 ELSE 0 END) as in_progress,
                        SUM(total) as revenue
                    ')
                    ->first();

                $activeDrivers = DB::table('delivery_persons')
                    ->where('zone', $zone)
                    ->where('is_active', 1)
                    ->count();

                $zoneStats[] = [
                    'zone' => $zone,
                    'total_orders' => (int) $stats->total_orders,
                    'delivered' => (int) $stats->delivered,
                    'cancelled' => (int) $stats->cancelled,
                    'in_progress' => (int) $stats->in_progress,
                    'revenue' => (float) $stats->revenue,
                    'active_drivers' => $activeDrivers,
                    'coverage_status' => $activeDrivers > 0 ? 'covered' : 'undercapacity',
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $zoneStats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des zones',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/logistics/alerts
     * 
     * Alertes logistiques
     */
    public function alerts(Request $request)
    {
        try {
            $alerts = [];

            // Commandes non traitées depuis plus de X heures
            $hoursThreshold = $request->get('hours', 24);
            $unprocessedOrders = DB::table('orders')
                ->whereIn('status', ['pending', 'preparee'])
                ->where('created_at', '<', Carbon::now()->subHours($hoursThreshold))
                ->count();

            if ($unprocessedOrders > 0) {
                $alerts[] = [
                    'type' => 'unprocessed_orders',
                    'severity' => 'warning',
                    'title' => 'Commandes non traitées',
                    'message' => "$unprocessedOrders commande(s) en attente depuis plus de $hoursThreshold heures",
                    'count' => $unprocessedOrders,
                ];
            }

            // Retards détectés
            $delayedOrders = DB::table('orders')
                ->whereIn('status', ['preparee', 'expediee'])
                ->where('updated_at', '<', Carbon::now()->subHours(4))
                ->count();

            if ($delayedOrders > 0) {
                $alerts[] = [
                    'type' => 'delayed_orders',
                    'severity' => 'danger',
                    'title' => 'Retards détectés',
                    'message' => "$delayedOrders commande(s) en retard (plus de 4h sans mise à jour)",
                    'count' => $delayedOrders,
                ];
            }

            // Zones sous-capacité
            $zones = DB::table('delivery_persons')
                ->select('zone')
                ->whereNotNull('zone')
                ->where('zone', '!=', '')
                ->distinct()
                ->pluck('zone');

            foreach ($zones as $zone) {
                $activeDrivers = DB::table('delivery_persons')
                    ->where('zone', $zone)
                    ->where('is_active', 1)
                    ->count();

                $pendingOrders = DB::table('orders')
                    ->where('commune', $zone)
                    ->whereIn('status', ['pending', 'preparee'])
                    ->count();

                if ($activeDrivers === 0 && $pendingOrders > 0) {
                    $alerts[] = [
                        'type' => 'undercapacity_zone',
                        'severity' => 'danger',
                        'title' => 'Zone sous-capacité',
                        'message' => "Zone '$zone' : $pendingOrders commandes en attente sans livreur disponible",
                        'count' => $pendingOrders,
                        'zone' => $zone,
                    ];
                }
            }

            // Retour livraison
            $returnDeliveries = DB::table('orders')
                ->where('delivery_type', 'return')
                ->whereIn('status', ['pending', 'preparee'])
                ->count();

            if ($returnDeliveries > 0) {
                $alerts[] = [
                    'type' => 'return_deliveries',
                    'severity' => 'info',
                    'title' => 'Retours à traiter',
                    'message' => "$returnDeliveries retour(s) de livraison en attente",
                    'count' => $returnDeliveries,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $alerts,
                'meta' => [
                    'generated_at' => now()->toIso8601String(),
                    'hours_threshold' => $hoursThreshold,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des alertes',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/logistics/tours
     * 
     * Groupement intelligent des tournées par commune et créneau horaire
     */
    public function tours(Request $request)
    {
        try {
            $date = $request->get('date', now()->format('Y-m-d'));
            
            // Commandes du jour
            $orders = DB::table('orders')
                ->whereDate('created_at', $date)
                ->whereIn('status', ['pending', 'preparee'])
                ->whereNotNull('commune')
                ->get();

            // Grouper par commune et créneau horaire
            $tours = $orders->groupBy(function ($order) {
                $hour = date('H:00', strtotime($order->created_at));
                return ($order->commune ?? 'Inconnue') . '|' . $hour;
            })->map(function ($orderGroup, $key) {
                [$commune, $hour] = explode('|', $key);
                
                return [
                    'commune' => $commune,
                    'time_slot' => $hour,
                    'order_ids' => $orderGroup->pluck('id')->toArray(),
                    'count' => $orderGroup->count(),
                    'total_amount' => $orderGroup->sum('total'),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $tours,
                'meta' => [
                    'date' => $date,
                    'total_orders' => count($orders),
                    'total_tours' => count($tours),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération des tournées',
            ], 500);
        }
    }
}
