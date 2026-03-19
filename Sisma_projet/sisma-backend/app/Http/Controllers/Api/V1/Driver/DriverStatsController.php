<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Driver Stats Controller V1
 * 
 * Statistics endpoints for drivers
 * - Today/weekly/monthly stats
 * - Cached for 5 minutes
 */
class DriverStatsController extends Controller
{
    /**
     * GET /api/v1/driver/stats
     * 
     * Get driver statistics
     */
    public function index(Request $request)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            // Check cache (5 minutes)
            $cacheKey = 'driver_stats_' . $driverId;
            $stats = Cache::get($cacheKey);

            if ($stats) {
                return response()->json([
                    'success' => true,
                    'data' => $stats,
                    'cached' => true,
                ]);
            }

            // Today's date
            $today = date('Y-m-d');
            $weekStart = date('Y-m-d', strtotime('monday this week'));
            $monthStart = date('Y-m-01');

            // Today's stats
            $todayStats = DB::table('orders')
                ->where('delivery_person_id', $driverId)
                ->whereDate('scheduled_date', $today)
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status IN ("pending", "processing", "shipped", "in_transit") THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = "exception" THEN 1 ELSE 0 END) as exceptions,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN total ELSE 0 END) as revenue
                ')
                ->first();

            // Weekly stats
            $weeklyStats = DB::table('orders')
                ->where('delivery_person_id', $driverId)
                ->whereDate('scheduled_date', '>=', $weekStart)
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = "exception" THEN 1 ELSE 0 END) as exceptions
                ')
                ->first();

            // Monthly stats
            $monthlyStats = DB::table('orders')
                ->where('delivery_person_id', $driverId)
                ->whereDate('scheduled_date', '>=', $monthStart)
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = "exception" THEN 1 ELSE 0 END) as exceptions,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN total ELSE 0 END) as revenue
                ')
                ->first();

            // Build response
            $stats = [
                'today' => [
                    'completed' => (int) ($todayStats->completed ?? 0),
                    'pending' => (int) ($todayStats->pending ?? 0),
                    'exceptions' => (int) ($todayStats->exceptions ?? 0),
                    'revenue' => (float) ($todayStats->revenue ?? 0),
                ],
                'weekly' => [
                    'completed' => (int) ($weeklyStats->completed ?? 0),
                    'total' => (int) ($weeklyStats->total ?? 0),
                    'exceptions' => (int) ($weeklyStats->exceptions ?? 0),
                ],
                'monthly' => [
                    'completed' => (int) ($monthlyStats->completed ?? 0),
                    'total' => (int) ($monthlyStats->total ?? 0),
                    'exceptions' => (int) ($monthlyStats->exceptions ?? 0),
                    'revenue' => (float) ($monthlyStats->revenue ?? 0),
                ],
            ];

            // Cache for 5 minutes
            Cache::put($cacheKey, $stats, 300);

            return response()->json([
                'success' => true,
                'data' => $stats,
                'cached' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('DriverStatsController index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
            ], 500);
        }
    }

    /**
     * GET /api/v1/driver/stats/weekly
     * 
     * Get weekly breakdown
     */
    public function weekly(Request $request)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $weekStart = date('Y-m-d', strtotime('monday this week'));

            // Get daily breakdown for the week
            $dailyStats = DB::table('orders')
                ->where('delivery_person_id', $driverId)
                ->whereDate('scheduled_date', '>=', $weekStart)
                ->groupBy(DB::raw('DATE(scheduled_date)'))
                ->selectRaw('
                    DATE(scheduled_date) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = "exception" THEN 1 ELSE 0 END) as exceptions
                ')
                ->orderBy('date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $dailyStats,
            ]);
        } catch (\Exception $e) {
            Log::error('DriverStatsController weekly error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
            ], 500);
        }
    }

    /**
     * Get driver ID from authenticated user
     */
    private function getDriverId(Request $request)
    {
        $user = $request->user();
        return $user->delivery_person_id ?? null;
    }
}
