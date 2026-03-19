<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Delivery Grouping Service
 * 
 * Groups orders by:
 * - Commune/zone
 * - Delivery time window
 * - Driver
 * 
 * Optimizes delivery routes and reduces costs
 */
class DeliveryGroupingService
{
    private const TIME_WINDOWS = [
        'morning' => ['08:00', '12:00'],
        'afternoon' => ['12:00', '17:00'],
        'evening' => ['17:00', '20:00'],
    ];

    private const MAX_ORDERS_PER_TOUR = 15;
    private const MAX_WEIGHT_PER_TOUR = 50; // kg

    /**
     * Group orders for delivery optimization
     * 
     * @param array $orderIds
     * @param array $options [commune, time_window, driver_id]
     * @return array [tours => [...]]
     */
    public function groupOrders(array $orderIds, array $options = []): array
    {
        $orders = DB::table('orders')
            ->whereIn('id', $orderIds)
            ->whereIn('status', ['ready', 'shipped'])
            ->get();

        if ($orders->isEmpty()) {
            return ['tours' => [], 'summary' => []];
        }

        // Group by commune first
        $byCommune = $orders->groupBy('commune');

        $tours = [];
        $tourId = 1;

        foreach ($byCommune as $commune => $communeOrders) {
            // Then group by time window
            $byTimeWindow = $this->groupByTimeWindow($communeOrders, $options['time_window'] ?? null);

            foreach ($byTimeWindow as $window => $windowOrders) {
                // Create tours with capacity limits
                $windowOrdersArray = $windowOrders->values()->all();
                $chunks = array_chunk($windowOrdersArray, self::MAX_ORDERS_PER_TOUR);

                foreach ($chunks as $chunk) {
                    $tour = [
                        'tour_id' => $tourId++,
                        'commune' => $commune,
                        'time_window' => $window,
                        'orders' => array_map(function ($order) {
                            return [
                                'id' => $order->id,
                                'order_number' => $order->order_number,
                                'client_name' => $order->client_name,
                                'client_address' => $order->client_address,
                                'client_phone' => $order->client_phone,
                                'total' => $order->total,
                            ];
                        }, $chunk),
                        'order_count' => count($chunk),
                        'total_amount' => array_sum(array_column($chunk, 'total')),
                        'estimated_duration' => $this->estimateDuration(count($chunk)),
                    ];

                    // Assign driver if provided
                    if (!empty($options['driver_id'])) {
                        $tour['driver_id'] = $options['driver_id'];
                    }

                    $tours[] = $tour;
                }
            }
        }

        return [
            'tours' => $tours,
            'summary' => [
                'total_tours' => count($tours),
                'total_orders' => $orders->count(),
                'total_amount' => $orders->sum('total'),
                'communes_covered' => $byCommune->keys()->count(),
            ],
        ];
    }

    /**
     * Get unassigned orders grouped by optimal delivery configuration
     */
    public function getUnassignedOrders(?int $supplierId = null, int $hoursOld = 2): array
    {
        $query = DB::table('orders')
            ->whereIn('status', ['pending', 'confirmed', 'preparing'])
            ->whereNull('delivery_person_id')
            ->where('created_at', '<', now()->subHours($hoursOld));

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        $orders = $query->orderBy('created_at')->get();

        // Get available drivers
        $availableDrivers = DB::table('delivery_persons')
            ->where('is_available', true)
            ->where('is_active', true)
            ->get();

        // Group orders by zone
        $zones = $orders->groupBy('commune')->map(function ($zoneOrders, $commune) {
            return [
                'commune' => $commune,
                'order_count' => $zoneOrders->count(),
                'total_amount' => $zoneOrders->sum('total'),
                'orders' => $zoneOrders->values(),
                'recommended_driver' => null, // Would be calculated based on driver zone
                'urgency' => $this->calculateUrgency($zoneOrders),
            ];
        });

        return [
            'orders' => $orders->values(),
            'zones' => $zones->values(),
            'available_drivers' => $availableDrivers->count(),
            'alerts' => $this->generateAlerts($orders),
        ];
    }

    /**
     * Get delivery statistics
     */
    public function getDeliveryStats(?int $supplierId = null, int $days = 7): array
    {
        $query = DB::table('orders')
            ->where('created_at', '>=', now()->subDays($days));

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        $totalOrders = $query->count();
        $deliveredOrders = $query->where('status', 'delivered')->count();
        $cancelledOrders = $query->where('status', 'cancelled')->count();

        // Average delivery time
        $deliveredWithTime = $query->where('status', 'delivered')
            ->whereNotNull('delivered_at')
            ->whereNotNull('created_at')
            ->get()
            ->map(function ($order) {
                return strtotime($order->delivered_at) - strtotime($order->created_at);
            });

        $avgDeliveryTime = $deliveredWithTime->isNotEmpty() 
            ? round($deliveredWithTime->avg() / 3600, 1) // hours
            : 0;

        // Success rate
        $successRate = $totalOrders > 0 
            ? round(($deliveredOrders / $totalOrders) * 100, 1) 
            : 0;

        return [
            'period_days' => $days,
            'total_orders' => $totalOrders,
            'delivered' => $deliveredOrders,
            'cancelled' => $cancelledOrders,
            'success_rate' => $successRate,
            'average_delivery_time_hours' => $avgDeliveryTime,
            'by_status' => $query->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
        ];
    }

    /**
     * Group orders by time window
     */
    private function groupByTimeWindow($orders, ?string $preferredWindow = null)
    {
        if ($preferredWindow) {
            return collect([$preferredWindow => $orders]);
        }

        return $orders->groupBy(function ($order) {
            $time = $order->delivery_time ?? $order->created_at;
            $hour = (int) date('H', strtotime($time));

            if ($hour < 12) return 'morning';
            if ($hour < 17) return 'afternoon';
            return 'evening';
        });
    }

    /**
     * Calculate urgency score for orders
     */
    private function calculateUrgency($orders): string
    {
        $oldestOrder = $orders->min('created_at');
        $hoursOld = (strtotime(now()) - strtotime($oldestOrder)) / 3600;

        if ($hoursOld > 24) return 'critical';
        if ($hoursOld > 12) return 'high';
        if ($hoursOld > 6) return 'medium';
        return 'normal';
    }

    /**
     * Generate alerts for unprocessed orders
     */
    private function generateAlerts($orders): array
    {
        $alerts = [];
        $criticalThreshold = config('fashop.alerts.critical_hours', 24);
        $warningThreshold = config('fashop.alerts.warning_hours', 12);

        $oldOrders = $orders->filter(function ($order) use ($criticalThreshold, $warningThreshold) {
            $hoursOld = (strtotime(now()) - strtotime($order->created_at)) / 3600;
            return $hoursOld > $warningThreshold;
        });

        if ($oldOrders->isNotEmpty()) {
            $critical = $oldOrders->filter(function ($order) use ($criticalThreshold) {
                return (strtotime(now()) - strtotime($order->created_at)) / 3600 > $criticalThreshold;
            });

            if ($critical->isNotEmpty()) {
                $alerts[] = [
                    'type' => 'critical',
                    'message' => $critical->count() . ' commande(s) non traitées depuis plus de ' . $criticalThreshold . 'h',
                    'order_ids' => $critical->pluck('id')->toArray(),
                ];
            }

            $warning = $oldOrders->filter(function ($order) use ($criticalThreshold) {
                return (strtotime(now()) - strtotime($order->created_at)) / 3600 <= $criticalThreshold;
            });

            if ($warning->isNotEmpty()) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => $warning->count() . ' commande(s) en attente depuis plus de ' . $warningThreshold . 'h',
                    'order_ids' => $warning->pluck('id')->toArray(),
                ];
            }
        }

        return $alerts;
    }

    /**
     * Estimate tour duration based on order count
     */
    private function estimateDuration(int $orderCount): int
    {
        // Base time: 30 minutes per delivery + 15 minutes setup
        return ($orderCount * 30) + 15;
    }
}
