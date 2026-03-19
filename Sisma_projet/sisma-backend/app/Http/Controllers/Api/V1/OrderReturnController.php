<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderReturnController extends Controller
{
    /**
     * Créer une demande de retour (client)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'order_item_id' => 'nullable|integer|exists:order_items,id',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        try {
            $order = Order::findOrFail($validated['order_id']);
            
            // Vérifier que la commande est livrée et éligible pour un retour
            $status = strtolower($order->status);
            if (!in_array($status, ['delivered', 'completed', 'livree', 'terminee'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette commande ne peut pas être retournée. Elle doit être livrée.',
                ], 400);
            }

            // Vérifier le délai de retour (7 jours après livraison)
            $deliveredAt = $order->delivered_at ?? $order->updated_at;
            $daysSinceDelivery = now()->diffInDays($deliveredAt);
            if ($daysSinceDelivery > 7) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le délai de retour (7 jours) est expiré.',
                ], 400);
            }

            // Vérifier si un retour existe déjà pour cette commande
            $existingReturn = OrderReturn::where('order_id', $validated['order_id'])
                ->where('order_item_id', $validated['order_item_id'] ?? null)
                ->first();

            if ($existingReturn) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une demande de retour existe déjà pour cette commande.',
                ], 400);
            }

            // Déterminer le supplier_id depuis la commande
            $supplierId = $order->supplier_id;
            
            // Ou depuis l'item de commande
            if (!empty($validated['order_item_id'])) {
                $orderItem = OrderItem::find($validated['order_item_id']);
                if ($orderItem && $orderItem->product) {
                    $supplierId = $orderItem->product->supplier_id;
                }
            }

            $return = OrderReturn::create([
                'order_id' => $validated['order_id'],
                'order_item_id' => $validated['order_item_id'] ?? null,
                'user_id' => auth()->id() ?? null,
                'supplier_id' => $supplierId,
                'reason' => $validated['reason'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);

            Log::info("Return request created", [
                'return_id' => $return->id,
                'order_id' => $return->order_id,
                'reason' => $return->reason,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Demande de retour créée avec succès',
                'data' => $return,
            ], 201);
        } catch (\Exception $e) {
            Log::error('OrderReturnController@store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la demande de retour',
            ], 500);
        }
    }

    /**
     * Liste des retours (admin)
     */
    public function index(Request $request)
    {
        $query = OrderReturn::with(['order', 'orderItem', 'user', 'supplier']);

        // Filtres
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('supplier_id') && $request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('order', function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        // Tri
        $sortBy = $request->sort_by ?? 'created_at';
        $sortDir = $request->sort_dir ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = $request->per_page ?? 15;
        $returns = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $returns->items(),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'per_page' => $returns->perPage(),
                'total' => $returns->total(),
            ],
        ]);
    }

    /**
     * Détails d'un retour
     */
    public function show(int $id)
    {
        $return = OrderReturn::with(['order', 'orderItem', 'order.items', 'orderItem.product', 'user', 'supplier'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $return,
        ]);
    }

    /**
     * Approuver une demande de retour
     */
    public function approve(Request $request, int $id)
    {
        $return = OrderReturn::findOrFail($id);

        if (!$return->canApprove()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande ne peut pas être approuvée.',
            ], 400);
        }

        $validated = $request->validate([
            'refund_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $return->update([
                'status' => 'approved',
                'admin_notes' => $validated['notes'] ?? null,
                'refund_amount' => $validated['refund_amount'] ?? null,
                'processed_at' => now(),
            ]);

            DB::commit();

            Log::info("Return approved", ['return_id' => $return->id]);

            return response()->json([
                'success' => true,
                'message' => 'Demande de retour approuvée',
                'data' => $return,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('OrderReturnController@approve error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation',
            ], 500);
        }
    }

    /**
     * Rejeter une demande de retour
     */
    public function reject(Request $request, int $id)
    {
        $return = OrderReturn::findOrFail($id);

        if (!$return->canReject()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande ne peut pas être rejetée.',
            ], 400);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $return->update([
                'status' => 'rejected',
                'admin_notes' => $validated['reason'],
                'processed_at' => now(),
            ]);

            Log::info("Return rejected", ['return_id' => $return->id]);

            return response()->json([
                'success' => true,
                'message' => 'Demande de retour rejetée',
                'data' => $return,
            ]);
        } catch (\Exception $e) {
            Log::error('OrderReturnController@reject error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet',
            ], 500);
        }
    }

    /**
     * Marquer comme remboursé
     */
    public function refund(Request $request, int $id)
    {
        $return = OrderReturn::findOrFail($id);

        if (!$return->canRefund()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande ne peut pas être remboursée.',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $return->update([
                'status' => 'refunded',
                'processed_at' => now(),
            ]);

            // Ici vous pouvez ajouter la logique de remboursement réel
            // (intégration avec paiement, etc.)

            DB::commit();

            Log::info("Return refunded", ['return_id' => $return->id]);

            return response()->json([
                'success' => true,
                'message' => 'Remboursement effectué',
                'data' => $return,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('OrderReturnController@refund error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du remboursement',
            ], 500);
        }
    }

    /**
     * Retours du client connecté
     */
    public function myReturns(Request $request)
    {
        $userId = auth()->id();
        
        $returns = OrderReturn::where('user_id', $userId)
            ->with(['order', 'orderItem', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $returns->items(),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'total' => $returns->total(),
            ],
        ]);
    }
}
