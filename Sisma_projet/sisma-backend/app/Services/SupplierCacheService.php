<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Supplier Cache Service
 * 
 * Provides Redis caching with supplier-specific tags
 * and automatic invalidation on data changes
 */
class SupplierCacheService
{
    private const DEFAULT_TTL = 300; // 5 minutes
    private const SUPPLIER_TAG_PREFIX = 'supplier';

    /**
     * Get cached data for a supplier
     */
    public function remember(string $key, int $supplierId, callable $callback, ?int $ttl = null): mixed
    {
        $ttl = $ttl ?? self::DEFAULT_TTL;
        $fullKey = $this->buildKey($key, $supplierId);

        // Try to get from cache
        if ($this->cacheSupportsTags()) {
            return Cache::tags($this->getTags($supplierId))
                ->remember($fullKey, $ttl, $callback);
        }

        // Fallback to regular cache
        return Cache::remember($fullKey, $ttl, $callback);
    }

    /**
     * Invalidate all cache for a supplier
     */
    public function invalidate(int $supplierId): void
    {
        try {
            if ($this->cacheSupportsTags()) {
                Cache::tags($this->getTags($supplierId))->flush();
                Log::info("Cache invalidated for supplier {$supplierId}");
            } else {
                // Manual invalidation using keys pattern
                $pattern = self::SUPPLIER_TAG_PREFIX . ":{$supplierId}:*";
                $this->flushByPattern($pattern);
            }
        } catch (\Exception $e) {
            Log::error("Cache invalidation failed: " . $e->getMessage());
        }
    }

    /**
     * Invalidate specific cache keys for a supplier
     */
    public function invalidateKeys(int $supplierId, array $keys): void
    {
        foreach ($keys as $key) {
            $fullKey = $this->buildKey($key, $supplierId);
            Cache::forget($fullKey);
        }
    }

    /**
     * Cache dashboard stats
     */
    public function getDashboardStats(int $supplierId): array
    {
        return $this->remember("dashboard:stats", $supplierId, function () use ($supplierId) {
            return $this->calculateDashboardStats($supplierId);
        });
    }

    /**
     * Cache revenue data
     */
    public function getRevenue(int $supplierId, string $period, int $days): array
    {
        return $this->remember("dashboard:revenue:{$period}:{$days}", $supplierId, function () use ($supplierId, $period, $days) {
            return $this->calculateRevenue($supplierId, $period, $days);
        });
    }

    /**
     * Cache pending orders count
     */
    public function getPendingOrdersCount(int $supplierId): int
    {
        return $this->remember("orders:pending:count", $supplierId, function () use ($supplierId) {
            return DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
                ->count();
        }, 60); // 1 minute for frequently changing data
    }

    /**
     * Invalidate on order created
     */
    public function onOrderCreated(int $supplierId): void
    {
        $this->invalidateKeys($supplierId, [
            'dashboard:stats',
            'dashboard:revenue:*',
            'orders:pending:count',
            'orders:list',
        ]);
    }

    /**
     * Invalidate on order status changed
     */
    public function onOrderStatusChanged(int $supplierId): void
    {
        $this->invalidateKeys($supplierId, [
            'dashboard:stats',
            'dashboard:revenue:*',
            'orders:pending:count',
            'orders:list',
        ]);
    }

    /**
     * Invalidate on product updated
     */
    public function onProductUpdated(int $supplierId): void
    {
        $this->invalidateKeys($supplierId, [
            'dashboard:stats',
            'products:list',
            'products:stats',
        ]);
    }

    /**
     * Invalidate on campaign updated
     */
    public function onCampaignUpdated(int $supplierId): void
    {
        $this->invalidateKeys($supplierId, [
            'campaigns:list',
            'campaigns:stats',
            'advertising:balance',
        ]);
    }

    /**
     * Build full cache key
     */
    private function buildKey(string $key, int $supplierId): string
    {
        return self::SUPPLIER_TAG_PREFIX . ":{$supplierId}:{$key}";
    }

    /**
     * Get cache tags for supplier
     */
    private function getTags(int $supplierId): array
    {
        return [
            self::SUPPLIER_TAG_PREFIX,
            self::SUPPLIER_TAG_PREFIX . ":{$supplierId}",
        ];
    }

    /**
     * Check if cache driver supports tags
     */
    private function cacheSupportsTags(): bool
    {
        $driver = config('cache.default');
        return in_array($driver, ['redis', 'memcached']);
    }

    /**
     * Flush cache by pattern (fallback)
     */
    private function flushByPattern(string $pattern): void
    {
        // For Redis
        if (config('cache.default') === 'redis') {
            try {
                $redis = app('redis')->connection();
                $keys = $redis->keys($pattern);
                if (!empty($keys)) {
                    $redis->del($keys);
                }
            } catch (\Exception $e) {
                Log::warning("Redis pattern flush failed: " . $e->getMessage());
            }
        }
    }

    /**
     * Calculate dashboard stats
     */
    private function calculateDashboardStats(int $supplierId): array
    {
        $today = now()->toDateString();
        $weekStart = now()->startOfWeek()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();

        $revenueToday = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->whereDate('created_at', $today)
            ->whereIn('status', ['delivered', 'completed'])
            ->sum('total');

        $revenueWeek = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->whereDate('created_at', '>=', $weekStart)
            ->whereIn('status', ['delivered', 'completed'])
            ->sum('total');

        $revenueMonth = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->whereDate('created_at', '>=', $monthStart)
            ->whereIn('status', ['delivered', 'completed'])
            ->sum('total');

        return [
            'revenue' => [
                'today' => (float) $revenueToday,
                'week' => (float) $revenueWeek,
                'month' => (float) $revenueMonth,
            ],
            'orders' => [
                'pending' => DB::table('orders')
                    ->where('supplier_id', $supplierId)
                    ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
                    ->count(),
                'total' => DB::table('orders')
                    ->where('supplier_id', $supplierId)
                    ->count(),
            ],
            'products' => [
                'active' => DB::table('products')
                    ->where('supplier_id', $supplierId)
                    ->where('is_active', 1)
                    ->count(),
                'out_of_stock' => DB::table('products')
                    ->where('supplier_id', $supplierId)
                    ->where('stock', '<=', 0)
                    ->count(),
            ],
        ];
    }

    /**
     * Calculate revenue data
     */
    private function calculateRevenue(int $supplierId, string $period, int $days): array
    {
        $startDate = now()->subDays($days)->toDateString();

        $query = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->whereDate('created_at', '>=', $startDate)
            ->whereIn('status', ['delivered', 'completed']);

        if ($period === 'day') {
            return $query->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as orders_count')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->toArray();
        } elseif ($period === 'week') {
            return $query->select(
                DB::raw('YEARWEEK(created_at, 1) as week'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as orders_count')
            )
            ->groupBy(DB::raw('YEARWEEK(created_at, 1)'))
            ->orderBy('week')
            ->get()
            ->toArray();
        }

        return [];
    }

    /**
     * Prewarm cache for a supplier (run on schedule)
     */
    public function prewarm(int $supplierId): void
    {
        try {
            // Prewarm common queries
            $this->getDashboardStats($supplierId);
            $this->getRevenue($supplierId, 'day', 30);
            $this->getPendingOrdersCount($supplierId);

            Log::info("Cache prewarmed for supplier {$supplierId}");
        } catch (\Exception $e) {
            Log::error("Cache prewarm failed: " . $e->getMessage());
        }
    }
}
