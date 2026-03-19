<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Policies\OrderAccessPolicy;
use App\Services\OrderVisibilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClientOrderController extends Controller
{
    protected $orders;
    protected $policy;

    public function __construct()
    {
        $this->orders = new OrderVisibilityService();
        $this->policy = new OrderAccessPolicy();
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !isset($user->id)) {
            return response()->json(['message' => 'Non authentifie'], 401);
        }

        $page = max(1, (int)$request->get('page', 1));
        $perPage = min(100, max(1, (int)$request->get('per_page', 20)));
        $status = $request->get('status', null);

        $result = $this->orders->getClientOrders((int)$user->id, $status, $page, $perPage);
        $rows = isset($result['data']) ? $result['data'] : array();
        $total = isset($result['total']) ? (int)$result['total'] : 0;

        $orderIds = array();
        foreach ($rows as $order) {
            $orderIds[] = (int)$order->id;
        }
        $itemsByOrder = $this->orders->getItemsByOrderIds($orderIds);

        $payload = array();
        foreach ($rows as $order) {
            if (!$this->policy->canClientAccessOrder($user, $order)) {
                continue;
            }
            $orderItems = isset($itemsByOrder[(int)$order->id]) ? $itemsByOrder[(int)$order->id] : array();
            $payload[] = array(
                'id' => (int)$order->id,
                'status' => isset($order->status) ? $order->status : 'pending',
                'customer_name' => isset($order->customer_name) ? $order->customer_name : '',
                'customer_phone' => isset($order->customer_phone) ? $order->customer_phone : '',
                'customer_location' => isset($order->customer_location) ? $order->customer_location : '',
                'delivery_date' => isset($order->delivery_date) ? $order->delivery_date : null,
                'total' => isset($order->total) ? (float)$order->total : 0,
                'created_at' => isset($order->created_at) ? $order->created_at : null,
                'items' => $orderItems,
            );
        }

        return response()->json(array(
            'data' => $payload,
            'meta' => array(
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ),
        ));
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifie'], 401);
        }

        $order = DB::table('orders')->where('id', (int)$id)->first();
        if (!$order) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }
        if (!$this->policy->canClientAccessOrder($user, $order)) {
            return response()->json(['message' => 'Acces refuse a cette commande'], 403);
        }

        return response()->json(array(
            'id' => (int)$order->id,
            'status' => isset($order->status) ? $order->status : 'pending',
            'customer_name' => isset($order->customer_name) ? $order->customer_name : '',
            'customer_phone' => isset($order->customer_phone) ? $order->customer_phone : '',
            'customer_location' => isset($order->customer_location) ? $order->customer_location : '',
            'delivery_date' => isset($order->delivery_date) ? $order->delivery_date : null,
            'total' => isset($order->total) ? (float)$order->total : 0,
            'items' => $this->orders->getOrderItems($order->id),
        ));
    }

    /**
     * Get order QR data for tracking
     * GET /api/client/orders/{id}/qr-data
     */
    public function getQrData(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        $order = DB::table('orders')->where('id', (int)$id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Commande introuvable'], 404);
        }
        
        if (!$this->policy->canClientAccessOrder($user, $order)) {
            return response()->json(['success' => false, 'message' => 'Accès refusé à cette commande'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'qr_code' => $order->qr_code ?? null,
                'qr_code_security' => $order->qr_code_security ?? null,
                'status' => $order->status,
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
            ]
        ]);
    }

    /**
     * Get order tracking status
     * GET /api/client/orders/{id}/tracking
     */
    public function getTrackingStatus(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        $order = DB::table('orders')->where('id', (int)$id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Commande introuvable'], 404);
        }
        
        if (!$this->policy->canClientAccessOrder($user, $order)) {
            return response()->json(['success' => false, 'message' => 'Accès refusé à cette commande'], 403);
        }

        // Build timeline
        $timeline = [];
        $statuses = [
            'pending' => ['label' => 'Commande passée', 'completed' => true],
            'processing' => ['label' => 'En préparation', 'completed' => in_array($order->status, ['processing', 'shipped', 'out_for_delivery', 'delivered'])],
            'shipped' => ['label' => 'Expédiée', 'completed' => in_array($order->status, ['shipped', 'out_for_delivery', 'delivered'])],
            'out_for_delivery' => ['label' => 'En livraison', 'completed' => in_array($order->status, ['out_for_delivery', 'delivered'])],
            'delivered' => ['label' => 'Livrée', 'completed' => $order->status === 'delivered'],
        ];

        foreach ($statuses as $key => $item) {
            $timeline[] = [
                'status' => $key,
                'label' => $item['label'],
                'completed' => $item['completed'],
                'current' => $order->status === $key,
                'date' => $item['completed'] ? $order->updated_at : null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $order->status,
                'order_number' => $order->order_number,
                'timeline' => $timeline,
                'delivery_person' => $order->delivery_person_id ? [
                    'name' => $order->delivery_person_name ?? 'Livreur',
                    'phone' => $order->delivery_person_phone ?? '',
                ] : null,
            ]
        ]);
    }
}
