<?php

namespace App\Jobs;

use App\Models\SponsoredCampaign;
use App\Support\SponsoredCache;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RecordSponsoredClick implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $campaignId;
    public $tries = 3;
    public $timeout = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(int $campaignId)
    {
        $this->campaignId = $campaignId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $campaign = SponsoredCampaign::find($this->campaignId);
            
            if ($campaign && $campaign->isActive()) {
                $campaign->increment('clicks');
                $campaign->increment('spent', $campaign->cost_per_click);
                
                // Auto-pause if budget exhausted
                if ($campaign->spent >= $campaign->budget) {
                    $campaign->update(['status' => 'completed']);
                    $campaign->product->update(['is_sponsored' => false]);
                    SponsoredCache::forgetAll();
                }
                
                Log::info("Sponsored click recorded", [
                    'campaign_id' => $this->campaignId,
                    'new_spent' => $campaign->spent,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to record sponsored click", [
                'campaign_id' => $this->campaignId,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }
}
