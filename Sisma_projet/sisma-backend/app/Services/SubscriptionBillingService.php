<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * Subscription Billing & SaaS Plans Service
 * 
 * Features:
 * - Multi-tier subscription plans (Free, Pro, Enterprise)
 * - Feature gating per plan
 * - Usage-based billing for AI credits
 * - Subscription management
 */
class SubscriptionBillingService
{
    const PLAN_FREE = 'free';
    const PLAN_PRO = 'pro';
    const PLAN_ENTERPRISE = 'enterprise';

    /**
     * Get all available plans
     */
    public function getPlans(): array
    {
        return [
            self::PLAN_FREE => [
                'id' => self::PLAN_FREE,
                'name' => 'Gratuit',
                'price' => 0,
                'interval' => 'month',
                'features' => [
                    'products' => 50,
                    'orders_per_month' => 100,
                    'ai_credits' => 10,
                    'campaigns' => 1,
                    'custom_domain' => false,
                    'api_access' => false,
                    'priority_support' => false,
                    'analytics_advanced' => false,
                    'team_members' => 1,
                    'storage_mb' => 100,
                ],
                'limits' => [
                    'products' => 50,
                    'orders_per_month' => 100,
                    'ai_credits_per_month' => 10,
                    'active_campaigns' => 1,
                    'storage_mb' => 100,
                ],
            ],
            self::PLAN_PRO => [
                'id' => self::PLAN_PRO,
                'name' => 'Professionnel',
                'price' => 25000, // XOF
                'interval' => 'month',
                'features' => [
                    'products' => 500,
                    'orders_per_month' => 1000,
                    'ai_credits' => 100,
                    'campaigns' => 10,
                    'custom_domain' => true,
                    'api_access' => true,
                    'priority_support' => false,
                    'analytics_advanced' => false,
                    'team_members' => 5,
                    'storage_mb' => 1000,
                ],
                'limits' => [
                    'products' => 500,
                    'orders_per_month' => 1000,
                    'ai_credits_per_month' => 100,
                    'active_campaigns' => 10,
                    'storage_mb' => 1000,
                ],
            ],
            self::PLAN_ENTERPRISE => [
                'id' => self::PLAN_ENTERPRISE,
                'name' => 'Entreprise',
                'price' => 75000, // XOF
                'interval' => 'month',
                'features' => [
                    'products' => -1, // Unlimited
                    'orders_per_month' => -1,
                    'ai_credits' => 500,
                    'campaigns' => -1,
                    'custom_domain' => true,
                    'api_access' => true,
                    'priority_support' => true,
                    'analytics_advanced' => true,
                    'team_members' => -1,
                    'storage_mb' => 10000,
                ],
                'limits' => [
                    'products' => -1,
                    'orders_per_month' => -1,
                    'ai_credits_per_month' => 500,
                    'active_campaigns' => -1,
                    'storage_mb' => 10000,
                ],
            ],
        ];
    }

    /**
     * Get supplier's current plan
     */
    public function getSupplierPlan(int $supplierId): array
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        $planId = $supplier->subscription_plan ?? self::PLAN_FREE;
        $plans = $this->getPlans();
        
        $plan = $plans[$planId] ?? $plans[self::PLAN_FREE];
        
        // Get usage stats
        $usage = $this->getUsageStats($supplierId, $planId);
        
        return [
            'plan' => $plan,
            'usage' => $usage,
            'is_active' => $supplier->subscription_status === 'active',
            'current_period_start' => $supplier->subscription_start,
            'current_period_end' => $supplier->subscription_end,
        ];
    }

    /**
     * Get usage statistics
     */
    public function getUsageStats(int $supplierId, string $planId): array
    {
        $plans = $this->getPlans();
        $plan = $plans[$planId] ?? $plans[self::PLAN_FREE];
        
        // Count products
        $productsCount = DB::table('products')
            ->where('supplier_id', $supplierId)
            ->whereNull('deleted_at')
            ->count();

        // Count orders this month
        $ordersCount = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        // Get AI credits used this month
        $aiCreditsUsed = DB::table('supplier_ai_usage_logs')
            ->where('supplier_id', $supplierId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('cost');

        // Get storage used
        $storageUsed = $this->getStorageUsed($supplierId);

        // Get active campaigns
        $campaignsCount = DB::table('marketing_campaigns')
            ->where('supplier_id', $supplierId)
            ->where('status', 'active')
            ->count();

        return [
            'products' => [
                'used' => $productsCount,
                'limit' => $plan['limits']['products'],
                'percent' => $plan['limits']['products'] > 0 
                    ? min(100, ($productsCount / $plan['limits']['products']) * 100) 
                    : 0,
            ],
            'orders' => [
                'used' => $ordersCount,
                'limit' => $plan['limits']['orders_per_month'],
                'percent' => $plan['limits']['orders_per_month'] > 0 
                    ? min(100, ($ordersCount / $plan['limits']['orders_per_month']) * 100) 
                    : 0,
            ],
            'ai_credits' => [
                'used' => (float) $aiCreditsUsed,
                'limit' => $plan['limits']['ai_credits_per_month'],
                'percent' => min(100, ($aiCreditsUsed / $plan['limits']['ai_credits_per_month']) * 100),
            ],
            'storage' => [
                'used' => $storageUsed,
                'limit' => $plan['limits']['storage_mb'],
                'percent' => min(100, ($storageUsed / $plan['limits']['storage_mb']) * 100),
            ],
            'campaigns' => [
                'used' => $campaignsCount,
                'limit' => $plan['limits']['active_campaigns'],
                'percent' => $plan['limits']['active_campaigns'] > 0 
                    ? min(100, ($campaignsCount / $plan['limits']['active_campaigns']) * 100) 
                    : 0,
            ],
        ];
    }

    /**
     * Check if supplier can use feature
     */
    public function canUseFeature(int $supplierId, string $feature): bool
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        
        if ($supplier->subscription_status !== 'active') {
            return $feature === 'products'; // Free products for inactive
        }

        $planId = $supplier->subscription_plan ?? self::PLAN_FREE;
        $plans = $this->getPlans();
        $plan = $plans[$planId] ?? $plans[self::PLAN_FREE];

        // Check feature availability
        $value = $plan['features'][$feature] ?? false;
        
        if ($value === true) return true;
        if ($value === false) return false;
        
        // For numeric features, check limit
        if (is_numeric($value)) {
            $usage = $this->getUsageStats($supplierId, $planId);
            $featureKey = $this->mapFeatureToUsageKey($feature);
            
            if (isset($usage[$featureKey])) {
                return $usage[$featureKey]['used'] < $usage[$featureKey]['limit'];
            }
        }
        
        return false;
    }

    /**
     * Subscribe to a plan
     */
    public function subscribe(int $supplierId, string $planId): array
    {
        $plans = $this->getPlans();
        
        if (!isset($plans[$planId])) {
            return ['success' => false, 'message' => 'Plan invalide'];
        }

        $plan = $plans[$planId];

        if ($plan['price'] > 0) {
            // Would integrate with Stripe Connect here
            // For now, just update the plan
        }

        $startDate = now();
        $endDate = $plan['interval'] === 'month' 
            ? now()->addMonth() 
            : now()->addYear();

        DB::table('suppliers')
            ->where('id', $supplierId)
            ->update([
                'subscription_plan' => $planId,
                'subscription_status' => 'active',
                'subscription_start' => $startDate,
                'subscription_end' => $endDate,
                'subscription_auto_renew' => true,
            ]);

        // Log event
        app(EventBusService::class)->publish('suppliers', [
            'type' => 'subscription.started',
            'aggregate_type' => 'SupplierSubscription',
            'aggregate_id' => $supplierId,
            'data' => [
                'plan' => $planId,
                'start_date' => $startDate->toIso8601String(),
                'end_date' => $endDate->toIso8601String(),
            ],
        ]);

        return [
            'success' => true,
            'plan' => $plan,
            'period_start' => $startDate,
            'period_end' => $endDate,
        ];
    }

    /**
     * Cancel subscription
     */
    public function cancel(int $supplierId): array
    {
        DB::table('suppliers')
            ->where('id', $supplierId)
            ->update([
                'subscription_status' => 'cancelled',
                'subscription_auto_renew' => false,
                'cancelled_at' => now(),
            ]);

        app(EventBusService::class)->publish('suppliers', [
            'type' => 'subscription.cancelled',
            'aggregate_type' => 'SupplierSubscription',
            'aggregate_id' => $supplierId,
            'data' => ['cancelled_at' => now()->toIso8601String()],
        ]);

        return ['success' => true];
    }

    /**
     * Check and update expired subscriptions
     */
    public function checkExpiredSubscriptions(): int
    {
        $expired = DB::table('suppliers')
            ->where('subscription_status', 'active')
            ->where('subscription_end', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $supplier) {
            if ($supplier->subscription_auto_renew) {
                // Auto-renew: extend subscription
                $this->subscribe($supplier->id, $supplier->subscription_plan);
            } else {
                // Downgrade to free
                DB::table('suppliers')
                    ->where('id', $supplier->id)
                    ->update([
                        'subscription_plan' => self::PLAN_FREE,
                        'subscription_status' => 'expired',
                    ]);
            }
            $count++;
        }

        return $count;
    }

    /**
     * Feature gating middleware check
     */
    public function checkFeatureAccess(int $supplierId, string $feature): void
    {
        if (!$this->canUseFeature($supplierId, $feature)) {
            abort(403, "Cette fonctionnalité n'est pas disponible dans votre plan");
        }
    }

    /**
     * Get storage used (simplified)
     */
    protected function getStorageUsed(int $supplierId): int
    {
        // Simplified - would check actual file sizes
        $products = DB::table('products')
            ->where('supplier_id', $supplierId)
            ->whereNull('deleted_at')
            ->get();

        $totalSize = 0;
        foreach ($products as $product) {
            // Assume average image size if exists
            if ($product->image) {
                $totalSize += 500; // KB
            }
        }

        return $totalSize;
    }

    /**
     * Map feature name to usage key
     */
    protected function mapFeatureToUsageKey(string $feature): string
    {
        $mapping = [
            'products' => 'products',
            'orders_per_month' => 'orders',
            'ai_credits' => 'ai_credits',
            'campaigns' => 'campaigns',
            'storage_mb' => 'storage',
        ];

        return $mapping[$feature] ?? $feature;
    }
}
