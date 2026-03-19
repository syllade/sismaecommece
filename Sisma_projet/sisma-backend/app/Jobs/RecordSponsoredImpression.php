<?php

namespace App\Jobs;

use App\Models\SponsoredCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RecordSponsoredImpression implements ShouldQueue
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
                $campaign->increment('impressions');
                Log::info("Sponsored impression recorded", [
                    'campaign_id' => $this->campaignId,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to record sponsored impression", [
                'campaign_id' => $this->campaignId,
                'error' => $e->getMessage(),
            ]);
            
            // Retry logic is handled by Laravel automatically
            throw $e;
        }
    }
}
