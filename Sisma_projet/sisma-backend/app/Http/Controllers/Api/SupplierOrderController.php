<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Policies\OrderAccessPolicy;
use App\Services\ActorResolverService;
use App\Services\AuditLogService;
use App\Services\OrderVisibilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierOrderController extends Controller
{
    protected $actors;
    protected $orders;
    protected $policy;

    public function __construct()
    {
        $this->actors = new ActorResolverService();
        $this->orders = new OrderVisibilityService();
        $this->policy = new OrderAccessPolicy();
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $supplierId = $this->actors->resolveSupplierIdForUser($user);
        if (!$supplierId) {
            return response()->json(['message' => 'Fournisseur lie au compte introuvable'], 404);
        }

        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(100, max(1, (int) $request->get('per_page', 20)));
        $status = $request->get('status', null);

        $result = $this->orders->getSupplierOrders($supplierId, $status, $page, $perPage);
        $rows = isset($result['data']) ? $result['data'] : array();
        $total = isset($result['total']) ? (int) $result['total'] : 0;

        $orderIds = array();
        foreach ($rows as $order) {
            $orderIds[] = (int)$order->id;
        }
        $allItemsByOrder = $this->orders->getItemsByOrderIds($orderIds);
        $productIds = array();
        foreach ($allItemsByOrder as $items) {
            foreach ($items as $item) {
                if (isset($item->product_id) && $item->product_id) {
                    $productIds[(int)$item->product_id] = true;
                }
            }
        }
        $productsById = array();
        if (count($productIds) > 0) {
            $products = DB::table('products')
                ->select('id', 'supplier_id')
                ->whereIn('id', array_keys($productIds))
                ->get();
            foreach ($products as $product) {
                $productsById[(int)$product->id] = $product;
            }
        }

        $enriched = array();
        foreach ($rows as $order) {
            $allItems = isset($allItemsByOrder[(int)$order->id]) ? $allItemsByOrder[(int)$order->id] : array();
            $items = array();
            foreach ($allItems as $item) {
                $product = isset($productsById[(int)$item->product_id]) ? $productsById[(int)$item->product_id] : null;
                if ($product && isset($product->supplier_id) && (int)$product->supplier_id === (int)$supplierId) {
                    $items[] = $item;
                }
            }
            $enriched[] = array(
                'id' => (int)$order->id,
                'status' => isset($order->status) ? $order->status : 'pending',
                'supplier_status' => isset($order->supplier_status) ? $order->supplier_status : 'pending',
                'customer_name' => isset($order->customer_name) ? $order->customer_name : '',
                'customer_phone' => isset($order->customer_phone) ? $order->customer_phone : '',
                'customer_location' => isset($order->customer_location) ? $order->customer_location : '',
                'delivery_person_id' => isset($order->delivery_person_id) ? $order->delivery_person_id : null,
                'delivery_date' => isset($order->delivery_date) ? $order->delivery_date : null,
                'created_at' => isset($order->created_at) ? $order->created_at : null,
                'items' => $items,
            );
        }

        return response()->json(array(
            'data' => $enriched,
            'meta' => array(
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ),
        ));
    }

    public function updateStatus(Request $request, $id)
    {
        $this->validate($request, array(
            'status' => 'required|in:accepted,prepared',
            'delivery_person_id' => 'sometimes|integer',
        ));

        $user = $request->user();
        if (!$this->policy->canSupplierAccessOrder($user, $id)) {
            return response()->json(['message' => 'Acces refuse a cette commande'], 403);
        }

        $order = DB::table('orders')->where('id', (int) $id)->first();
        if (!$order) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }
        if (isset($order->status) && $order->status === 'delivered') {
            return response()->json(['message' => 'Commande deja livree, modification impossible'], 409);
        }

        $status = (string) $request->input('status');
        $payload = array('updated_at' => date('Y-m-d H:i:s'));

        if (DB::getSchemaBuilder()->hasColumn('orders', 'supplier_status')) {
            $payload['supplier_status'] = $status;
        }

        // Statut global minimal sans casser l'existant.
        if ($status === 'prepared') {
            $payload['status'] = 'processing';
        }

        if ($request->has('delivery_person_id') && DB::getSchemaBuilder()->hasColumn('orders', 'delivery_person_id')) {
            $deliveryPersonId = (int) $request->input('delivery_person_id');
            $deliveryPerson = DB::table('delivery_persons')->where('id', $deliveryPersonId)->first();
            if (!$deliveryPerson) {
                return response()->json(['message' => 'Livreur introuvable'], 404);
            }
            $payload['delivery_person_id'] = $deliveryPersonId;
        }

        DB::table('orders')->where('id', (int)$id)->update($payload);
        $updated = DB::table('orders')->where('id', (int)$id)->first();

        AuditLogService::record('supplier.order.status_update', $user, array(
            'order_id' => (int)$id,
            'status' => $status,
            'delivery_person_id' => isset($payload['delivery_person_id']) ? (int)$payload['delivery_person_id'] : null,
        ), 'order', (int)$id);

        return response()->json(array(
            'message' => 'Statut fournisseur mis a jour',
            'order' => $updated,
        ));
    }

    public function bulkStatus(Request $request)
    {
        $this->validate($request, array(
            'order_ids' => 'required|array|min:1',
            'status' => 'required|in:accepted,prepared',
            'delivery_person_id' => 'sometimes|integer',
        ));

        $user = $request->user();
        $orderIds = array_values(array_unique(array_map('intval', (array)$request->input('order_ids', array()))));
        $status = (string)$request->input('status');
        $updatedCount = 0;
        $deniedIds = array();
        $deliveryPersonId = null;

        if ($request->has('delivery_person_id') && DB::getSchemaBuilder()->hasColumn('orders', 'delivery_person_id')) {
            $deliveryPersonId = (int)$request->input('delivery_person_id');
            $deliveryPerson = DB::table('delivery_persons')->where('id', $deliveryPersonId)->first();
            if (!$deliveryPerson) {
                return response()->json(['message' => 'Livreur introuvable'], 404);
            }
        }

        foreach ($orderIds as $orderId) {
            if (!$this->policy->canSupplierAccessOrder($user, $orderId)) {
                $deniedIds[] = $orderId;
                continue;
            }
            $order = DB::table('orders')->where('id', $orderId)->first();
            if (!$order || (isset($order->status) && $order->status === 'delivered')) {
                $deniedIds[] = $orderId;
                continue;
            }

            $payload = array('updated_at' => date('Y-m-d H:i:s'));
            if (DB::getSchemaBuilder()->hasColumn('orders', 'supplier_status')) {
                $payload['supplier_status'] = $status;
            }
            if ($status === 'prepared') {
                $payload['status'] = 'processing';
            }
            if ($deliveryPersonId && DB::getSchemaBuilder()->hasColumn('orders', 'delivery_person_id')) {
                $payload['delivery_person_id'] = $deliveryPersonId;
            }

            DB::table('orders')->where('id', $orderId)->update($payload);
            $updatedCount++;
        }

        AuditLogService::record('supplier.order.bulk_status_update', $user, array(
            'order_ids' => $orderIds,
            'status' => $status,
            'updated_count' => $updatedCount,
            'denied_ids' => $deniedIds,
            'delivery_person_id' => $deliveryPersonId,
        ), 'order');

        return response()->json(array(
            'message' => 'Mise a jour en masse terminee',
            'updated_count' => $updatedCount,
            'denied_ids' => $deniedIds,
        ));
    }
}
