<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Supplier;
use App\Services\InvoiceService;
use App\Services\CommissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Supplier Order Controller - Merchant Space
 * Handles order management including manual order creation
 */
class SupplierOrderController extends Controller
{
    /**
     * Get supplier orders with filters
     * GET /api/v1/supplier/orders
     */
    public function index(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $query = DB::table('orders')->where('supplier_id', $supplierId);

            // Filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('payment_status') && $request->payment_status) {
                $query->where('payment_status', $request->payment_status);
            }

            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', '%' . $search . '%')
                      ->orWhere('client_name', 'like', '%' . $search . '%')
                      ->orWhere('client_phone', 'like', '%' . $search . '%');
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $offset = ($page - 1) * $perPage;

            $total = $query->count();
            $orders = $query->skip($offset)->take($perPage)->get();

            return response()->json([
                'data' => $orders,
                'meta' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'last_page' => ceil($total / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderController@index error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des commandes'], 500);
        }
    }

    /**
     * Get single order details
     * GET /api/v1/supplier/orders/{id}
     */
    public function show($id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $order = DB::table('orders')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$order) {
                return response()->json(['message' => 'Commande non trouvée'], 404);
            }

            // Get order items
            $items = DB::table('order_items')
                ->where('order_id', $id)
                ->get();

            // Get product details for each item
            $itemsWithProducts = $items->map(function ($item) {
                $product = DB::table('products')->where('id', $item->product_id)->first();
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $product ? $product->name : 'Produit supprimé',
                    'product_image' => $product ? $product->image : null,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'total' => $item->price * $item->quantity,
                    'variants' => $item->variants ? json_decode($item->variants, true) : null,
                ];
            });

            return response()->json([
                'order' => $order,
                'items' => $itemsWithProducts,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderController@show error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération de la commande'], 500);
        }
    }

    /**
     * Update order status
     * PUT /api/v1/supplier/orders/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'status' => 'required|string|in:pending,confirmed,preparing,ready,shipped,delivered,cancelled',
            ]);

            $order = DB::table('orders')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$order) {
                return response()->json(['message' => 'Commande non trouvée'], 404);
            }

            // Validate status transition
            $validTransitions = $this->getValidStatusTransitions();
            $currentStatus = $order->status;
            $newStatus = $request->status;

            if (!isset($validTransitions[$currentStatus]) || !in_array($newStatus, $validTransitions[$currentStatus])) {
                return response()->json([
                    'message' => 'Transition de statut invalide',
                    'current_status' => $currentStatus,
                    'requested_status' => $newStatus,
                    'allowed_transitions' => $validTransitions[$currentStatus] ?? [],
                ], 422);
            }

            $updateData = [
                'status' => $newStatus,
                'updated_at' => now(),
            ];

            // If cancelled, restore stock
            if ($newStatus === 'cancelled' && $currentStatus !== 'cancelled') {
                $this->restoreStock($id);
            }

            DB::table('orders')->where('id', $id)->update($updateData);

            // Log the status change
            $this->logStatusChange($id, $currentStatus, $newStatus);

            // Lock order when delivered (for invoice generation)
            if ($newStatus === 'delivered') {
                $orderModel = Order::find($id);
                if ($orderModel) {
                    $invoiceService = app(InvoiceService::class);
                    $invoiceService->lockOrder($orderModel, 'delivered');
                    
                    // Calculate commission
                    $commissionService = app(CommissionService::class);
                    $commissionService->calculateCommission($orderModel);
                }
            }

            return response()->json([
                'message' => 'Statut mis à jour avec succès',
                'order_id' => $id,
                'new_status' => $newStatus,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierOrderController@updateStatus error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour du statut'], 500);
        }
    }

    /**
     * Bulk update order status
     * POST /api/v1/supplier/orders/bulk-status
     */
    public function bulkStatus(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'order_ids' => 'required|array',
                'order_ids.*' => 'integer|exists:orders,id',
                'status' => 'required|string|in:confirmed,preparing,ready,shipped,delivered,cancelled',
            ]);

            $orderIds = $request->order_ids;
            $newStatus = $request->status;

            // Verify all orders belong to this supplier
            $orders = DB::table('orders')
                ->whereIn('id', $orderIds)
                ->where('supplier_id', $supplierId)
                ->get();

            if ($orders->count() !== count($orderIds)) {
                return response()->json(['message' => 'Certaines commandes n\'existent pas ou ne vous appartiennent pas'], 403);
            }

            $validTransitions = $this->getValidStatusTransitions();
            $updated = 0;
            $failed = [];

            foreach ($orders as $order) {
                if (isset($validTransitions[$order->status]) && in_array($newStatus, $validTransitions[$order->status])) {
                    DB::table('orders')
                        ->where('id', $order->id)
                        ->update([
                            'status' => $newStatus,
                            'updated_at' => now(),
                        ]);
                    
                    $this->logStatusChange($order->id, $order->status, $newStatus);
                    $updated++;
                } else {
                    $failed[] = $order->id;
                }
            }

            return response()->json([
                'message' => 'Mise à jour groupée terminée',
                'updated' => $updated,
                'failed' => $failed,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierOrderController@bulkStatus error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour groupée'], 500);
        }
    }

    /**
     * Create manual order (téléphone/whatsapp)
     * POST /api/v1/supplier/orders/manual
     */
    public function createManual(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'client_name' => 'required|string|max:255',
                'client_phone' => 'required|string|max:20',
                'client_address' => 'required|string|max:500',
                'commune' => 'nullable|string|max:100',
                'products' => 'required|array|min:1',
                'products.*.product_id' => 'required|integer|exists:products,id',
                'products.*.quantity' => 'required|integer|min:1',
                'products.*.price_override' => 'nullable|numeric|min:0',
                'delivery_date' => 'nullable|date',
                'delivery_time' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000',
            ]);

            // Verify all products belong to this supplier
            $productIds = collect($request->products)->pluck('product_id')->toArray();
            $products = DB::table('products')
                ->whereIn('id', $productIds)
                ->where('supplier_id', $supplierId)
                ->get();

            if ($products->count() !== count($productIds)) {
                return response()->json(['message' => 'Certains produits n\'existent pas ou ne vous appartiennent pas'], 403);
            }

            // Calculate totals
            $items = [];
            $subtotal = 0;

            foreach ($request->products as $item) {
                $product = $products->firstWhere('id', $item['product_id']);
                $price = isset($item['price_override']) ? $item['price_override'] : $product->price;
                $quantity = $item['quantity'];
                $itemTotal = $price * $quantity;

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'price' => $price,
                    'total' => $itemTotal,
                    'variants' => isset($item['variants']) ? json_encode($item['variants']) : null,
                ];

                $subtotal += $itemTotal;
            }

            // Calculate delivery fee
            $deliveryFee = 0;
            if ($request->commune) {
                $zone = DB::table('delivery_zones')
                    ->where('name', 'like', '%' . $request->commune . '%')
                    ->first();
                if ($zone) {
                    $deliveryFee = (float) $zone->fee;
                }
            }

            $total = $subtotal + $deliveryFee;

            // Generate order number
            $orderNumber = 'ORD-' . strtoupper(Str::random(8));

            // Create order
            $orderId = DB::table('orders')->insertGetId([
                'order_number' => $orderNumber,
                'supplier_id' => $supplierId,
                'client_name' => $request->client_name,
                'client_phone' => $request->client_phone,
                'client_address' => $request->client_address,
                'commune' => $request->commune ?? null,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => 'cash',
                'notes' => $request->notes ?? null,
                'delivery_date' => $request->delivery_date ?? null,
                'delivery_time' => $request->delivery_time ?? null,
                'is_manual' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create order items
            foreach ($items as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'total' => $item['total'],
                    'variants' => $item['variants'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Deduct stock
                DB::table('products')
                    ->where('id', $item['product_id'])
                    ->decrement('stock', $item['quantity']);
            }

            // Log AI usage for billing (if applicable)
            // Log::info('Manual order created', ['order_id' => $orderId, 'supplier_id' => $supplierId]);

            return response()->json([
                'message' => 'Commande créée avec succès',
                'order' => [
                    'id' => $orderId,
                    'order_number' => $orderNumber,
                    'client_name' => $request->client_name,
                    'client_phone' => $request->client_phone,
                    'subtotal' => $subtotal,
                    'delivery_fee' => $deliveryFee,
                    'total' => $total,
                    'status' => 'pending',
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierOrderController@createManual error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la création de la commande'], 500);
        }
    }

    /**
     * Get pending orders count
     * GET /api/v1/supplier/orders/pending-count
     */
    public function pendingCount()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $count = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
                ->count();

            return response()->json(['pending_count' => $count]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderController@pendingCount error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get valid status transitions
     */
    private function getValidStatusTransitions()
    {
        return [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['preparing', 'cancelled'],
            'preparing' => ['ready', 'cancelled'],
            'ready' => ['shipped', 'cancelled'],
            'shipped' => ['delivered', 'cancelled'],
            'delivered' => ['completed'],
            'completed' => [],
            'cancelled' => [],
        ];
    }

    /**
     * Restore stock when order is cancelled
     */
    private function restoreStock($orderId)
    {
        $items = DB::table('order_items')->where('order_id', $orderId)->get();
        foreach ($items as $item) {
            DB::table('products')
                ->where('id', $item->product_id)
                ->increment('stock', $item->quantity);
        }
    }

    /**
     * Log status change for audit
     */
    private function logStatusChange($orderId, $oldStatus, $newStatus)
    {
        DB::table('order_status_logs')->insert([
            'order_id' => $orderId,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_by' => auth()->id(),
            'created_at' => now(),
        ]);
    }

    /**
     * Helper: Get supplier ID from authenticated user
     */
    private function getSupplierId()
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        if (isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        if ($user->role === 'supplier') {
            $supplier = DB::table('suppliers')->where('user_id', $user->id)->first();
            return $supplier ? $supplier->id : null;
        }

        return null;
    }
}
