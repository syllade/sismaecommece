<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller for Payment on Delivery
 * 
 * Endpoints:
 * - POST /api/v1/driver/orders/{id}/confirm-payment - Confirm payment received
 * - GET /api/v1/orders/{id}/payment - Get payment status
 * - POST /api/v1/admin/orders/{id}/mark-paid - Mark as paid (admin)
 */
class PaymentController extends Controller
{
    /**
     * POST /api/v1/driver/orders/{id}/confirm-payment
     * 
     * Confirm payment received from client
     */
    public function confirmPayment(Request $request, $orderId)
    {
        try {
            $deliveryPersonId = $request->user()->id ?? $request->input('delivery_person_id');

            $order = DB::table('orders')->where('id', $orderId)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }

            // Verify delivery person
            if ($order->delivery_person_id != $deliveryPersonId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette commande ne vous est pas attribuée'
                ], 403);
            }

            // Verify order is delivered
            if ($order->status !== 'delivered') {
                return response()->json([
                    'success' => false,
                    'message' => 'La commande doit être livrée avant de confirmer le paiement'
                ], 400);
            }

            // Verify payment method is COD
            if ($order->payment_method !== 'cash_on_delivery') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette commande n\'est pas en paiement à la livraison'
                ], 400);
            }

            // BLOCK DOUBLE PAYMENT - Check if already paid
            if ($order->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Paiement déjà confirmé pour cette commande',
                    'data' => [
                        'payment_status' => 'paid',
                        'paid_at' => $order->paid_at
                    ]
                ], 400);
            }

            // Update payment status with driver info
            DB::table('orders')
                ->where('id', $orderId)
                ->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                    'payment_reference' => 'COD-' . strtoupper(uniqid()),
                    'paid_by_driver_id' => $deliveryPersonId,
                    'payment_collected_at' => now(),
                    'updated_at' => now()
                ]);

            // Log the payment
            DB::table('payment_logs')->insert([
                'order_id' => $orderId,
                'driver_id' => $deliveryPersonId,
                'amount' => $order->total,
                'payment_method' => 'cash_on_delivery',
                'action' => 'collected',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Record commission if not already recorded
            $existingCommission = DB::table('commission_transactions')
                ->where('order_id', $orderId)
                ->first();

            if (!$existingCommission && $order->supplier_id) {
                // Calculate commission
                $supplier = DB::table('suppliers')->where('id', $order->supplier_id)->first();
                $commissionRate = $supplier->commission_rate ?? 10;
                $commissionAmount = $order->total * ($commissionRate / 100);
                $supplierAmount = $order->total - $commissionAmount;

                DB::table('commission_transactions')->insert([
                    'supplier_id' => $order->supplier_id,
                    'order_id' => $orderId,
                    'order_amount' => $order->total,
                    'commission_rate' => $commissionRate,
                    'commission_amount' => $commissionAmount,
                    'supplier_amount' => $supplierAmount,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Update supplier wallet
                DB::table('supplier_wallets')
                    ->updateOrInsert(
                        ['supplier_id' => $order->supplier_id],
                        [
                            'pending_balance' => DB::raw('pending_balance + ' . $supplierAmount),
                            'total_earned' => DB::raw('total_earned + ' . $supplierAmount),
                            'updated_at' => now()
                        ]
                    );
            }

            return response()->json([
                'success' => true,
                'message' => 'Paiement confirmé avec succès',
                'data' => [
                    'order_id' => $orderId,
                    'payment_status' => 'paid',
                    'paid_at' => now()->toIso8601String(),
                    'amount_paid' => $order->total,
                    'collected_by_driver_id' => $deliveryPersonId
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('PaymentController confirmPayment error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la confirmation'
            ], 500);
        }
    }

    /**
     * GET /api/v1/orders/{id}/payment
     * 
     * Get payment status
     */
    public function getPaymentStatus($orderId)
    {
        try {
            $order = DB::table('orders')
                ->where('id', $orderId)
                ->first(['id', 'order_number', 'payment_method', 'payment_status', 'paid_at', 'payment_reference', 'total']);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status,
                    'paid_at' => $order->paid_at,
                    'payment_reference' => $order->payment_reference,
                    'amount' => $order->total
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur'
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/orders/{id}/mark-paid
     * 
     * Mark order as paid (admin)
     */
    public function markAsPaid(Request $request, $orderId)
    {
        try {
            $order = DB::table('orders')->where('id', $orderId)->first();
            
            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Non trouvée'], 404);
            }

            DB::table('orders')
                ->where('id', $orderId)
                ->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                    'payment_reference' => $request->input('reference') ?? 'ADMIN-' . strtoupper(uniqid()),
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Paiement marqué comme reçu'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }

    /**
     * GET /api/v1/admin/payments
     * 
     * List payments (admin)
     */
    public function listPayments(Request $request)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 20)));
            $status = $request->get('status', 'all');

            $query = DB::table('orders')
                ->selectRaw('
                    orders.id,
                    orders.order_number,
                    orders.customer_name,
                    orders.customer_phone,
                    orders.total,
                    orders.payment_method,
                    orders.payment_status,
                    orders.paid_at,
                    orders.payment_reference,
                    orders.paid_by_driver_id,
                    orders.payment_collected_at,
                    orders.status as order_status,
                    suppliers.name as supplier_name,
                    delivery_persons.name as driver_name
                ')
                ->leftJoin('suppliers', 'orders.supplier_id', '=', 'suppliers.id')
                ->leftJoin('users as delivery_persons', 'orders.delivery_person_id', '=', 'delivery_persons.id')
                ->where('orders.payment_method', 'cash_on_delivery');

            if ($status === 'pending') {
                $query->where('orders.payment_status', 'pending');
            } elseif ($status === 'paid') {
                $query->where('orders.payment_status', 'paid');
            }

            $total = (int) clone $query->count();

            $orders = $query
                ->orderByDesc('orders.created_at')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            // Stats
            $stats = DB::table('orders')
                ->where('payment_method', 'cash_on_delivery')
                ->selectRaw('
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN payment_status = "paid" THEN 1 ELSE 0 END) as paid_orders,
                    SUM(CASE WHEN payment_status = "pending" THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN payment_status = "paid" THEN total ELSE 0 END) as total_collected,
                    SUM(CASE WHEN payment_status = "pending" THEN total ELSE 0 END) as total_pending
                ')
                ->first();

            return response()->json([
                'success' => true,
                'data' => $orders,
                'stats' => $stats,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }

    /**
     * GET /api/v1/admin/payments/logs
     * 
     * List payment logs (admin)
     */
    public function listPaymentLogs(Request $request)
    {
        try {
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 20)));
            $orderId = $request->get('order_id');
            $driverId = $request->get('driver_id');

            $query = DB::table('payment_logs')
                ->selectRaw('
                    payment_logs.*,
                    orders.order_number,
                    driver.name as driver_name,
                    admin.name as admin_name
                ')
                ->leftJoin('orders', 'payment_logs.order_id', '=', 'orders.id')
                ->leftJoin('users as driver', 'payment_logs.driver_id', '=', 'driver.id')
                ->leftJoin('users as admin', 'payment_logs.admin_id', '=', 'admin.id');

            if ($orderId) {
                $query->where('payment_logs.order_id', $orderId);
            }
            if ($driverId) {
                $query->where('payment_logs.driver_id', $driverId);
            }

            $total = (int) clone $query->count();

            $logs = $query
                ->orderByDesc('payment_logs.created_at')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $logs,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur'], 500);
        }
    }
}
