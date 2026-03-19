<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event: Order Status Updated
 * Broadcast to supplier channel when order status changes
 */
class SupplierOrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $supplierId;
    public int $orderId;
    public string $orderNumber;
    public string $oldStatus;
    public string $newStatus;
    public string $message;

    /**
     * Create a new event instance.
     */
    public function __construct(
        int $supplierId,
        int $orderId,
        string $orderNumber,
        string $oldStatus,
        string $newStatus
    ) {
        $this->supplierId = $supplierId;
        $this->orderId = $orderId;
        $this->orderNumber = $orderNumber;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->message = $this->getStatusMessage($newStatus);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('supplier.' . $this->supplierId),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->orderId,
            'order_number' => $this->orderNumber,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'message' => $this->message,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Get status message
     */
    private function getStatusMessage(string $status): string
    {
        $messages = [
            'pending' => 'Nouvelle commande en attente',
            'confirmed' => 'Commande confirmée',
            'preparing' => 'Commande en préparation',
            'ready' => 'Commande prête',
            'shipped' => 'Commande expédiée',
            'delivered' => 'Commande livrée',
            'cancelled' => 'Commande annulée',
        ];

        return $messages[$status] ?? 'Statut mis à jour';
    }
}
