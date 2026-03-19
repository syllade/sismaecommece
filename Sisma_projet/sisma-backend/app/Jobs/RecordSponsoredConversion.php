<?php

namespace App\Jobs;

use App\Models\SponsoredCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RecordSponsoredConversion implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $campaignId;
    public $tries = 3;
    public $timeout = 30;

    public function __construct(int $campaignId)
    {
        $this->campaignId = $campaignId;
    }

    public function handle(): void
    {
        try {
            $campaign = SponsoredCampaign::find($this->campaignId);

            if ($campaign && $campaign->isActive()) {
                $campaign->increment('conversions');
                Log::info("Sponsored conversion recorded", [
                    'campaign_id' => $this->campaignId,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to record sponsored conversion", [
                'campaign_id' => $this->campaignId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
