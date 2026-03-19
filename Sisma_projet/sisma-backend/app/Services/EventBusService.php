<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

/**
 * Event-Driven Architecture Service
 * 
 * Handles:
 * - Event publishing to Redis Streams
 * - Event sourcing for wallet, orders, campaigns
 * - Event subscription and processing
 * - Audit trail and history reconstruction
 */
class EventBusService
{
    protected $redis;
    protected $streams = [
        'orders' => 'fashop_events_orders',
        'wallet' => 'fashop_events_wallet',
        'campaigns' => 'fashop_events_campaigns',
        'suppliers' => 'fashop_events_suppliers',
        'deliveries' => 'fashop_events_deliveries',
    ];

    public function __construct()
    {
        $this->redis = Redis::connection('streams');
    }

    /**
     * Publish an event to the stream
     */
    public function publish(string $stream, array $event): void
    {
        $eventData = [
            'event_id' => $this->generateEventId(),
            'event_type' => $event['type'] ?? 'unknown',
            'aggregate_type' => $event['aggregate_type'] ?? null,
            'aggregate_id' => $event['aggregate_id'] ?? null,
            'data' => json_encode($event['data'] ?? []),
            'metadata' => json_encode([
                'timestamp' => now()->toIso8601String(),
                'user_id' => auth()->id() ?? null,
                'supplier_id' => auth()->user()?->supplier_id ?? null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]),
            'created_at' => now()->toIso8601String(),
        ];

        try {
            $this->redis->xadd($this->streams[$stream] ?? "fashop_events_{$stream}", '*', $eventData);
            
            Log::info("Event published", [
                'stream' => $stream,
                'event_id' => $eventData['event_id'],
                'type' => $eventData['event_type'],
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to publish event", [
                'stream' => $stream,
                'error' => $e->getMessage(),
            ]);
            
            // Fallback: store in database if Redis fails
            $this->storeEventFallback($stream, $eventData);
        }
    }

    /**
     * Publish order event
     */
    public function publishOrderEvent(string $type, int $orderId, array $data): void
    {
        $this->publish('orders', [
            'type' => $type,
            'aggregate_type' => 'Order',
            'aggregate_id' => $orderId,
            'data' => array_merge($data, [
                'order_id' => $orderId,
            ]),
        ]);
    }

    /**
     * Publish wallet event (for event sourcing)
     */
    public function publishWalletEvent(string $type, int $supplierId, array $data): void
    {
        $this->publish('wallet', [
            'type' => $type,
            'aggregate_type' => 'SupplierWallet',
            'aggregate_id' => $supplierId,
            'data' => array_merge($data, [
                'supplier_id' => $supplierId,
                'balance_change' => $data['amount'] ?? 0,
            ]),
        ]);
    }

    /**
     * Publish campaign event
     */
    public function publishCampaignEvent(string $type, int $campaignId, array $data): void
    {
        $this->publish('campaigns', [
            'type' => $type,
            'aggregate_type' => 'MarketingCampaign',
            'aggregate_id' => $campaignId,
            'data' => array_merge($data, [
                'campaign_id' => $campaignId,
            ]),
        ]);
    }

    /**
     * Subscribe to events (consumer group)
     */
    public function subscribe(string $stream, string $group, callable $handler): void
    {
        $streamName = $this->streams[$stream] ?? "fashop_events_{$stream}";
        
        try {
            // Create consumer group if not exists
            $this->redis->xgroup('CREATE', $streamName, $group, '0', 'MKSTREAM');
        } catch (\Exception $e) {
            // Group might already exist
        }

        while (true) {
            try {
                // Read new messages
                $messages = $this->redis->xreadgroup(
                    $group,
                    gethostname(),
                    [$streamName => '>'],
                    100,
                    5000
                );

                if (empty($messages)) {
                    continue;
                }

                foreach ($messages[$streamName] ?? [] as $messageId => $message) {
                    try {
                        $event = [
                            'id' => $messageId,
                            ...$message,
                            'data' => json_decode($message['data'], true),
                            'metadata' => json_decode($message['metadata'], true),
                        ];

                        $handler($event);

                        // Acknowledge processed message
                        $this->redis->xack($streamName, $group, $messageId);
                    } catch (\Exception $e) {
                        Log::error("Event processing failed", [
                            'message_id' => $messageId,
                            'error' => $e->getMessage(),
                        ]);
                        
                        // Send to dead letter queue
                        $this->sendToDeadLetter($stream, $messageId, $message, $e);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Event subscription error", [
                    'stream' => $stream,
                    'error' => $e->getMessage(),
                ]);
                sleep(5);
            }
        }
    }

    /**
     * Get event history for an aggregate (event sourcing)
     */
    public function getAggregateHistory(string $aggregateType, int $aggregateId): array
    {
        $stream = $this->getStreamForAggregate($aggregateType);
        $streamName = $this->streams[$stream] ?? "fashop_events_{$stream}";

        $events = $this->redis->xrange($streamName, '-', '+', 1000);

        $history = [];
        foreach ($events as $eventId => $event) {
            if ($event['aggregate_type'] === $aggregateType && 
                $event['aggregate_id'] == $aggregateId) {
                $history[] = [
                    'event_id' => $eventId,
                    'event_type' => $event['event_type'],
                    'data' => json_decode($event['data'], true),
                    'metadata' => json_decode($event['metadata'], true),
                    'created_at' => $event['created_at'],
                ];
            }
        }

        return $history;
    }

    /**
     * Rebuild wallet balance from event history
     */
    public function rebuildWalletBalance(int $supplierId): array
    {
        $history = $this->getAggregateHistory('SupplierWallet', $supplierId);
        
        $balance = 0;
        $events = [];

        foreach ($history as $event) {
            $data = $event['data'];
            
            switch ($event['event_type']) {
                case 'wallet.deposit':
                    $balance += $data['amount'] ?? 0;
                    break;
                case 'wallet.withdraw':
                case 'wallet.commission':
                case 'wallet.payout':
                    $balance -= abs($data['amount'] ?? 0);
                    break;
                case 'wallet.adjustment':
                    $balance = $data['new_balance'] ?? $balance;
                    break;
            }

            $events[] = [
                'event_id' => $event['event_id'],
                'type' => $event['event_type'],
                'balance_after' => $balance,
                'created_at' => $event['created_at'],
            ];
        }

        return [
            'current_balance' => $balance,
            'event_count' => count($events),
            'events' => $events,
        ];
    }

    /**
     * Get stream name for aggregate type
     */
    protected function getStreamForAggregate(string $aggregateType): string
    {
        $mapping = [
            'Order' => 'orders',
            'SupplierWallet' => 'wallet',
            'MarketingCampaign' => 'campaigns',
            'Supplier' => 'suppliers',
            'Delivery' => 'deliveries',
        ];

        return $mapping[$aggregateType] ?? 'general';
    }

    /**
     * Generate unique event ID
     */
    protected function generateEventId(): string
    {
        return sprintf(
            '%s-%s-%s',
            date('YmdHis'),
            substr(md5(uniqid()), 0, 8),
            random_int(1000, 9999)
        );
    }

    /**
     * Fallback: store event in database if Redis fails
     */
    protected function storeEventFallback(string $stream, array $event): void
    {
        try {
            \DB::table('events_store')->insert([
                'stream' => $stream,
                'event_type' => $event['event_type'],
                'aggregate_type' => $event['aggregate_type'],
                'aggregate_id' => $event['aggregate_id'],
                'data' => $event['data'],
                'metadata' => $event['metadata'],
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::critical("Event store fallback failed", [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send failed event to dead letter queue
     */
    protected function sendToDeadLetter(string $stream, string $messageId, array $message, \Exception $error): void
    {
        try {
            $this->redis->xadd('fashop_events_dlq', '*', [
                'original_stream' => $stream,
                'message_id' => $messageId,
                'message' => json_encode($message),
                'error' => $error->getMessage(),
                'failed_at' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error("Dead letter queue failed", ['error' => $e->getMessage()]);
        }
    }
}
