<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Policies\OrderAccessPolicy;
use App\Services\ActorResolverService;
use App\Services\AuditLogService;
use App\Services\OrderVisibilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeliveryOrderController extends Controller
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
        $deliveryPersonId = $this->actors->resolveDeliveryPersonIdForUser($user);
        if (!$deliveryPersonId) {
            return response()->json(['message' => 'Livreur lie au compte introuvable'], 404);
        }

        $status = $request->get('status', null);
        $page = max(1, (int)$request->get('page', 1));
        $perPage = min(100, max(1, (int)$request->get('per_page', 20)));

        $query = DB::table('orders')->where('delivery_person_id', (int)$deliveryPersonId);
        if ($status) {
            $query->where('status', $status);
        }
        $total = (int)$query->count();
        $rows = $query->orderBy('created_at', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $orderIds = array();
        foreach ($rows as $row) {
            $orderIds[] = (int)$row->id;
        }
        $itemsByOrder = $this->orders->getItemsByOrderIds($orderIds);

        $result = array();
        foreach ($rows as $order) {
            $orderItems = isset($itemsByOrder[(int)$order->id]) ? $itemsByOrder[(int)$order->id] : array();
            $result[] = array(
                'id' => (int)$order->id,
                'status' => isset($order->status) ? $order->status : 'pending',
                'delivery_status' => isset($order->delivery_status) ? $order->delivery_status : 'pending',
                'customer_name' => isset($order->customer_name) ? $order->customer_name : '',
                'customer_phone' => isset($order->customer_phone) ? $order->customer_phone : '',
                'customer_location' => isset($order->customer_location) ? $order->customer_location : '',
                'delivery_date' => isset($order->delivery_date) ? $order->delivery_date : null,
                'total' => isset($order->total) ? (float)$order->total : 0,
                'items' => $orderItems,
            );
        }

        return response()->json(array(
            'data' => $result,
            'meta' => array(
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ),
        ));
    }

    public function accept(Request $request, $id)
    {
        $order = DB::table('orders')->where('id', (int)$id)->first();
        if (!$order) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }
        if (!$this->policy->canDeliveryAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Acces refuse a cette commande'], 403);
        }

        $payload = array(
            'status' => 'processing',
            'updated_at' => date('Y-m-d H:i:s'),
        );
        if (DB::getSchemaBuilder()->hasColumn('orders', 'delivery_status')) {
            $payload['delivery_status'] = 'accepted';
        }
        DB::table('orders')->where('id', (int)$id)->update($payload);
        AuditLogService::record('delivery.order.accept', $request->user(), array(
            'order_id' => (int)$id,
        ), 'order', (int)$id);

        return response()->json([
            'message' => 'Livraison acceptee',
            'order' => DB::table('orders')->where('id', (int)$id)->first(),
        ]);
    }

    public function refuse(Request $request, $id)
    {
        $order = DB::table('orders')->where('id', (int)$id)->first();
        if (!$order) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }
        if (!$this->policy->canDeliveryAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Acces refuse a cette commande'], 403);
        }

        $payload = array(
            'status' => 'pending',
            'delivery_person_id' => null,
            'updated_at' => date('Y-m-d H:i:s'),
        );
        if (DB::getSchemaBuilder()->hasColumn('orders', 'delivery_status')) {
            $payload['delivery_status'] = 'refused';
        }
        DB::table('orders')->where('id', (int)$id)->update($payload);
        AuditLogService::record('delivery.order.refuse', $request->user(), array(
            'order_id' => (int)$id,
        ), 'order', (int)$id);

        return response()->json([
            'message' => 'Livraison refusee',
            'order' => DB::table('orders')->where('id', (int)$id)->first(),
        ]);
    }

    public function delivered(Request $request, $id)
    {
        $this->validate($request, array(
            'proof_photo_url' => 'sometimes|string|max:500',
            'proof_photo' => 'sometimes|file|mimes:jpeg,jpg,png,webp|max:4096',
            'proof_signature' => 'sometimes|string',
            'notes' => 'sometimes|string|max:1000',
        ));

        $order = DB::table('orders')->where('id', (int)$id)->first();
        if (!$order) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }
        if (!$this->policy->canDeliveryAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Acces refuse a cette commande'], 403);
        }
        if (isset($order->status) && $order->status === 'delivered') {
            return response()->json(['message' => 'Commande deja livree'], 409);
        }

        $payload = array(
            'status' => 'delivered',
            'updated_at' => date('Y-m-d H:i:s'),
        );

        if (DB::getSchemaBuilder()->hasColumn('orders', 'delivery_status')) {
            $payload['delivery_status'] = 'delivered';
        }
        if (DB::getSchemaBuilder()->hasColumn('orders', 'delivered_at')) {
            $payload['delivered_at'] = date('Y-m-d H:i:s');
        }
        if (DB::getSchemaBuilder()->hasColumn('orders', 'delivery_proof_photo')) {
            $proofPath = null;
            if ($request->hasFile('proof_photo')) {
                $proofDirectory = storage_path('app/private/delivery-proofs');
                if (!is_dir($proofDirectory)) {
                    @mkdir($proofDirectory, 0755, true);
                }
                $extension = $request->file('proof_photo')->getClientOriginalExtension();
                $filename = 'order_' . (int)$id . '_' . date('YmdHis') . '_' . Str::random(10) . '.' . $extension;
                $request->file('proof_photo')->move($proofDirectory, $filename);
                $proofPath = 'delivery-proofs/' . $filename;
            } else {
                $proofPath = $request->input('proof_photo_url', null);
            }
            $payload['delivery_proof_photo'] = $proofPath;
        }
        if (DB::getSchemaBuilder()->hasColumn('orders', 'delivery_proof_signature')) {
            $payload['delivery_proof_signature'] = $request->input('proof_signature', null);
        }
        if ($request->has('notes') && DB::getSchemaBuilder()->hasColumn('orders', 'delivery_notes')) {
            $payload['delivery_notes'] = $request->input('notes');
        }

        DB::table('orders')->where('id', (int)$id)->update($payload);
        AuditLogService::record('delivery.order.delivered', $request->user(), array(
            'order_id' => (int)$id,
            'has_proof_photo' => isset($payload['delivery_proof_photo']) && !empty($payload['delivery_proof_photo']),
            'has_signature' => isset($payload['delivery_proof_signature']) && !empty($payload['delivery_proof_signature']),
        ), 'order', (int)$id);

        return response()->json([
            'message' => 'Commande marquee livree',
            'order' => DB::table('orders')->where('id', (int)$id)->first(),
        ]);
    }

    public function proofPhoto(Request $request, $id)
    {
        $order = DB::table('orders')->where('id', (int)$id)->first();
        if (!$order) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }

        $user = $request->user();
        $role = isset($user->role) ? $user->role : null;
        $authorized = false;

        if ($role === 'admin') {
            $authorized = true;
        } elseif ($role === 'supplier') {
            $authorized = $this->policy->canSupplierAccessOrder($user, (int)$id);
        } elseif ($role === 'delivery') {
            $authorized = $this->policy->canDeliveryAccessOrder($user, $order);
        } elseif ($role === 'client') {
            $authorized = $this->policy->canClientAccessOrder($user, $order);
        }

        if (!$authorized) {
            return response()->json(['message' => 'Acces refuse a la preuve'], 403);
        }

        if (!isset($order->delivery_proof_photo) || !$order->delivery_proof_photo) {
            return response()->json(['message' => 'Aucune preuve photo'], 404);
        }

        $proofPath = (string)$order->delivery_proof_photo;
        if (filter_var($proofPath, FILTER_VALIDATE_URL)) {
            return response()->json(['message' => 'Preuve externe non exposee par l API securisee'], 409);
        }

        $absolutePath = storage_path('app/private/' . ltrim($proofPath, '/'));
        if (!file_exists($absolutePath)) {
            return response()->json(['message' => 'Fichier preuve introuvable'], 404);
        }

        AuditLogService::record('order.proof_photo.read', $user, array(
            'order_id' => (int)$id,
            'path' => $proofPath,
        ), 'order', (int)$id);

        $mimeType = function_exists('mime_content_type') ? mime_content_type($absolutePath) : 'application/octet-stream';
        return response()->download($absolutePath, basename($absolutePath), array(
            'Content-Type' => $mimeType ?: 'application/octet-stream',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ));
    }
}
