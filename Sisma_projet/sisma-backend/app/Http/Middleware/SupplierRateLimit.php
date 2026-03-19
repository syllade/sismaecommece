<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Supplier Rate Limiting Middleware
 * 
 * Applies rate limits per supplier for:
 * - AI generation: 30 requests/hour
 * - Manual orders: 50 requests/hour
 * - General API: 100 requests/minute
 */
class SupplierRateLimit
{
    private const LIMITS = [
        'ai' => ['max' => 30, 'period' => 60], // 30 per hour
        'manual-order' => ['max' => 50, 'period' => 60], // 50 per hour
        'general' => ['max' => 100, 'period' => 1], // 100 per minute
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $type = 'general'): Response
    {
        $supplierId = $this->getSupplierId($request);
        
        if (!$supplierId) {
            return $next($request);
        }

        $limit = self::LIMITS[$type] ?? self::LIMITS['general'];
        $key = "rate_limit:supplier:{$supplierId}:{$type}";

        // Check current request count
        $currentCount = $this->getRequestCount($key, $limit['period']);

        if ($currentCount >= $limit['max']) {
            Log::warning('SupplierRateLimit: Rate limit exceeded', [
                'supplier_id' => $supplierId,
                'type' => $type,
                'current_count' => $currentCount,
                'limit' => $limit['max'],
            ]);

            return response()->json([
                'message' => 'Limite de requêtes dépassée',
                'retry_after' => $limit['period'] * 60,
                'limit' => $limit['max'],
                'remaining' => 0,
            ], 429);
        }

        // Increment counter
        $this->incrementCounter($key, $limit['period']);

        // Add rate limit headers
        $response = $next($request);
        
        $response->headers->set('X-RateLimit-Limit', $limit['max']);
        $response->headers->set('X-RateLimit-Remaining', max(0, $limit['max'] - $currentCount - 1));
        $response->headers->set('X-RateLimit-Reset', now()->addSeconds($limit['period'] * 60)->timestamp);

        return $response;
    }

    /**
     * Get supplier ID from request
     */
    private function getSupplierId(Request $request): ?int
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }

        if (isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        if ($user->role === 'supplier') {
            $supplier = DB::table('suppliers')->where('user_id', $user->id)->first();
            return $supplier ? $supplier->id : null;
        }

        return null;
    }

    /**
     * Get current request count
     */
    private function getRequestCount(string $key, int $periodMinutes): int
    {
        // Try Redis first if available
        if ($this->redisAvailable()) {
            $redis = redis();
            $count = $redis->get($key);
            return (int) ($count ?? 0);
        }

        // Fallback to database
        $keyHash = md5($key);
        $record = DB::table('rate_limits')
            ->where('key_hash', $keyHash)
            ->where('expires_at', '>', now())
            ->first();

        return $record ? (int) $record->count : 0;
    }

    /**
     * Increment counter
     */
    private function incrementCounter(string $key, int $periodMinutes): void
    {
        if ($this->redisAvailable()) {
            $redis = redis();
            $redis->incr($key);
            $redis->expire($key, $periodMinutes * 60);
            return;
        }

        // Fallback to database
        $keyHash = md5($key);
        $expiresAt = now()->addMinutes($periodMinutes);

        DB::table('rate_limits')->updateOrInsert(
            ['key_hash' => $keyHash],
            [
                'count' => DB::raw('count + 1'),
                'expires_at' => $expiresAt,
                'created_at' => now(),
            ]
        );
    }

    /**
     * Check if Redis is available
     */
    private function redisAvailable(): bool
    {
        try {
            if (function_exists('redis')) {
                redis()->ping();
                return true;
            }
        } catch (\Exception $e) {
            // Redis not available
        }
        return false;
    }
}
