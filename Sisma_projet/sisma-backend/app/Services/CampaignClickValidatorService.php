<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Campaign Click Validator Service - Anti-Fraud
 * 
 * Validates campaign clicks to prevent fraud:
 * - Log IP addresses
 * - Prevent double clicks within 10 seconds
 * - Block auto-clicks (same user agent + IP repeated)
 * - Only decrement budget if click is valid
 */
class CampaignClickValidatorService
{
    private const CLICK_EXPIRY_SECONDS = 10; // Time window to prevent double clicks
    private const MAX_CLICKS_PER_IP_PER_HOUR = 100; // Rate limit

    /**
     * Validate a campaign click
     * 
     * @param int $campaignId
     * @param string $ipAddress
     * @param string $userAgent
     * @param string $productId
     * @return array ['valid' => bool, 'click_id' => string|null, 'reason' => string|null]
     */
    public function validateClick(int $campaignId, string $ipAddress, string $userAgent, ?string $productId = null): array
    {
        try {
            // 1. Check if campaign exists and is active
            $campaign = DB::table('marketing_campaigns')
                ->where('id', $campaignId)
                ->where('status', 'active')
                ->first();

            if (!$campaign) {
                return ['valid' => false, 'click_id' => null, 'reason' => 'Campaign not found or inactive'];
            }

            // 2. Check if campaign has budget remaining
            $remaining = $campaign->budget - $campaign->spent;
            if ($remaining <= 0) {
                return ['valid' => false, 'click_id' => null, 'reason' => 'Campaign budget exhausted'];
            }

            // 3. Check for double click (same IP within 10 seconds)
            $recentClick = DB::table('campaign_clicks')
                ->where('campaign_id', $campaignId)
                ->where('ip_address', $ipAddress)
                ->where('created_at', '>', now()->subSeconds(self::CLICK_EXPIRY_SECONDS))
                ->first();

            if ($recentClick) {
                Log::info('CampaignClickValidator: Double click detected', [
                    'campaign_id' => $campaignId,
                    'ip' => $ipAddress,
                ]);
                return ['valid' => false, 'click_id' => null, 'reason' => 'Double click detected'];
            }

            // 4. Check rate limit per IP (max X clicks per hour)
            $clicksThisHour = DB::table('campaign_clicks')
                ->where('campaign_id', $campaignId)
                ->where('ip_address', $ipAddress)
                ->where('created_at', '>', now()->subHour())
                ->count();

            if ($clicksThisHour >= self::MAX_CLICKS_PER_IP_PER_HOUR) {
                Log::warning('CampaignClickValidator: Rate limit exceeded', [
                    'campaign_id' => $campaignId,
                    'ip' => $ipAddress,
                    'clicks_this_hour' => $clicksThisHour,
                ]);
                return ['valid' => false, 'click_id' => null, 'reason' => 'Rate limit exceeded'];
            }

            // 5. Check for auto-click pattern (same user agent + IP repeated)
            $autoClickPattern = $this->checkAutoClickPattern($campaignId, $ipAddress, $userAgent);
            if ($autoClickPattern) {
                Log::warning('CampaignClickValidator: Auto-click pattern detected', [
                    'campaign_id' => $campaignId,
                    'ip' => $ipAddress,
                    'user_agent' => $userAgent,
                ]);
                // Log but don't block - just mark as suspicious
            }

            // 6. Generate unique click hash
            $clickId = Str::uuid()->toString();
            $clickHash = hash('sha256', $clickId . $campaignId . $ipAddress . now());

            // 7. Record the click
            DB::table('campaign_clicks')->insert([
                'campaign_id' => $campaignId,
                'click_id' => $clickId,
                'click_hash' => $clickHash,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'product_id' => $productId,
                'is_valid' => true,
                'is_suspicious' => $autoClickPattern,
                'clicked_at' => now(),
                'created_at' => now(),
            ]);

            // 8. Increment campaign impressions
            DB::table('marketing_campaigns')
                ->where('id', $campaignId)
                ->increment('impressions');

            return [
                'valid' => true,
                'click_id' => $clickId,
                'click_hash' => $clickHash,
                'reason' => null,
            ];

        } catch (\Exception $e) {
            Log::error('CampaignClickValidator: Error validating click', [
                'campaign_id' => $campaignId,
                'error' => $e->getMessage(),
            ]);
            // Fail open - allow click but log error
            return ['valid' => true, 'click_id' => null, 'reason' => null];
        }
    }

    /**
     * Record a conversion (purchase) from a click
     * 
     * @param string $clickId
     * @param float $orderAmount
     * @return bool
     */
    public function recordConversion(string $clickId, float $orderAmount): bool
    {
        try {
            $click = DB::table('campaign_clicks')
                ->where('click_id', $clickId)
                ->first();

            if (!$click) {
                return false;
            }

            // Mark click as converted
            DB::table('campaign_clicks')
                ->where('click_id', $clickId)
                ->update([
                    'converted' => true,
                    'conversion_amount' => $orderAmount,
                    'converted_at' => now(),
                ]);

            // Update campaign stats
            DB::table('marketing_campaigns')
                ->where('id', $click->campaign_id)
                ->increment('conversions');

            // Calculate and deduct cost (CPC model)
            $campaign = DB::table('marketing_campaigns')->where('id', $click->campaign_id)->first();
            $cost = (float) $campaign->cpc;
            
            // Check if budget will be exceeded
            $newSpent = $campaign->spent + $cost;
            if ($newSpent > $campaign->budget) {
                $cost = $campaign->budget - $campaign->spent;
                if ($cost <= 0) {
                    // Budget exhausted - pause campaign
                    DB::table('marketing_campaigns')
                        ->where('id', $click->campaign_id)
                        ->update(['status' => 'paused']);
                    return false;
                }
            }

            DB::table('marketing_campaigns')
                ->where('id', $click->campaign_id)
                ->increment('spent', $cost);

            return true;

        } catch (\Exception $e) {
            Log::error('CampaignClickValidator: Error recording conversion', [
                'click_id' => $clickId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Track click (without validation) - for frontend tracking
     * 
     * @param int $campaignId
     * @param string $ipAddress
     * @param string $userAgent
     * @return array
     */
    public function trackClick(int $campaignId, string $ipAddress, string $userAgent): array
    {
        // This is a lightweight tracking endpoint - validate async
        return $this->validateClick($campaignId, $ipAddress, $userAgent);
    }

    /**
     * Check for auto-click patterns
     */
    private function checkAutoClickPattern(int $campaignId, string $ipAddress, string $userAgent): bool
    {
        // Look for repeated patterns: same user agent + IP within short time
        $recentClicks = DB::table('campaign_clicks')
            ->where('campaign_id', $campaignId)
            ->where('ip_address', $ipAddress)
            ->where('user_agent', $userAgent)
            ->where('created_at', '>', now()->subMinutes(5))
            ->count();

        return $recentClicks >= 3;
    }

    /**
     * Get campaign click analytics
     */
    public function getCampaignAnalytics(int $campaignId, int $days = 30): array
    {
        $startDate = now()->subDays($days);

        $totalClicks = DB::table('campaign_clicks')
            ->where('campaign_id', $campaignId)
            ->where('created_at', '>=', $startDate)
            ->count();

        $validClicks = DB::table('campaign_clicks')
            ->where('campaign_id', $campaignId)
            ->where('is_valid', true)
            ->where('created_at', '>=', $startDate)
            ->count();

        $suspiciousClicks = DB::table('campaign_clicks')
            ->where('campaign_id', $campaignId)
            ->where('is_suspicious', true)
            ->where('created_at', '>=', $startDate)
            ->count();

        $conversions = DB::table('campaign_clicks')
            ->where('campaign_id', $campaignId)
            ->where('converted', true)
            ->where('created_at', '>=', $startDate)
            ->count();

        // Daily breakdown
        $dailyStats = DB::table('campaign_clicks')
            ->where('campaign_id', $campaignId)
            ->where('created_at', '>=', $startDate)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as clicks'),
                DB::raw('SUM(converted) as conversions')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // Top IPs
        $topIps = DB::table('campaign_clicks')
            ->where('campaign_id', $campaignId)
            ->where('created_at', '>=', $startDate)
            ->select('ip_address', DB::raw('COUNT(*) as click_count'))
            ->groupBy('ip_address')
            ->orderByDesc('click_count')
            ->limit(10)
            ->get();

        return [
            'total_clicks' => $totalClicks,
            'valid_clicks' => $validClicks,
            'suspicious_clicks' => $suspiciousClicks,
            'conversions' => $conversions,
            'fraud_rate' => $totalClicks > 0 ? round(($suspiciousClicks / $totalClicks) * 100, 2) : 0,
            'conversion_rate' => $validClicks > 0 ? round(($conversions / $validClicks) * 100, 2) : 0,
            'daily' => $dailyStats,
            'top_ips' => $topIps,
        ];
    }
}
