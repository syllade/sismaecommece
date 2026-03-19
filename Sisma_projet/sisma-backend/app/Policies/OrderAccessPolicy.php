<?php

namespace App\Policies;

use Illuminate\Support\Facades\DB;
use App\Services\ActorResolverService;
use App\Services\OrderVisibilityService;

class OrderAccessPolicy
{
    protected $actors;
    protected $orders;

    public function __construct()
    {
        $this->actors = new ActorResolverService();
        $this->orders = new OrderVisibilityService();
    }

    public function canSupplierAccessOrder($user, $orderId)
    {
        $supplierId = $this->actors->resolveSupplierIdForUser($user);
        if (!$supplierId) return false;

        $orderIds = $this->orders->getSupplierOrderIds($supplierId);
        return in_array((int) $orderId, array_map('intval', $orderIds));
    }

    public function canDeliveryAccessOrder($user, $order)
    {
        $deliveryPersonId = $this->actors->resolveDeliveryPersonIdForUser($user);
        if (!$deliveryPersonId) return false;

        if (is_object($order) && isset($order->delivery_person_id)) {
            return (int) $order->delivery_person_id === (int) $deliveryPersonId;
        }

        $dbOrder = DB::table('orders')->where('id', (int) $order)->first();
        if (!$dbOrder) return false;

        return (int) $dbOrder->delivery_person_id === (int) $deliveryPersonId;
    }

    public function canClientAccessOrder($user, $order)
    {
        if (!$user || !isset($user->id)) return false;

        if (is_object($order) && isset($order->customer_user_id)) {
            return (int) $order->customer_user_id === (int) $user->id;
        }

        $dbOrder = DB::table('orders')->where('id', (int) $order)->first();
        if (!$dbOrder) return false;

        return isset($dbOrder->customer_user_id) && (int) $dbOrder->customer_user_id === (int) $user->id;
    }
}
