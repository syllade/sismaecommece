<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Controller for admin order management with QR code support
 * 
 * Endpoints:
 * - POST /api/v1/admin/orders/create - Create order for client
 * - GET /api/v1/admin/orders/{id}/qr - Get QR code for order
 * - POST /api/v1/admin/orders/{id}/validate-qr - Validate QR code manually
 */
class AdminOrderManagementController extends Controller
{
    protected $qrCodeService;
    
    public function __construct()
    {
        $this->qrCodeService = new QrCodeService();
    }
    
    /**
     * POST /api/v1/admin/orders/create
     * 
     * Create an order for a client (for clients who cannot order themselves)
     */
    public function createOrder(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_name' => 'required|string|max:255',
                'customer_phone' => 'required|string|max:20',
                'customer_location' => 'nullable|string|max:255',
                'commune' => 'nullable|string|max:100',
                'quartier' => 'nullable|string|max:100',
                'delivery_type' => 'nullable|in:standard,express',
                'delivery_date' => 'nullable|date',
                'supplier_id' => 'required|integer|exists:suppliers,id',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|integer|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'notes' => 'nullable|string'
            ]);
            
            // Verify supplier exists and is active
            $supplier = DB::table('suppliers')
                ->where('id', $validated['supplier_id'])
                ->where('is_active', 1)
                ->first();
                
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fournisseur non trouvé ou inactif'
                ], 404);
            }
            
            // Calculate order totals
            $subtotal = 0;
            $orderItems = [];
            
            foreach ($validated['items'] as $item) {
                $product = DB::table('products')
                    ->where('id', $item['product_id'])
                    ->where('supplier_id', $validated['supplier_id'])
                    ->first();
                    
                if (!$product) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Produit non trouvé chez ce fournisseur'
                    ], 404);
                }
                
                $price = $product->price ?? 0;
                $quantity = $item['quantity'];
                $itemTotal = $price * $quantity;
                
                $subtotal += $itemTotal;
                $orderItems[] = [
                    'product_id' => $item['product_id'],
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'price' => $price,
                    'total' => $itemTotal
                ];
            }
            
            // Get delivery fee
            $deliveryFee = 0;
            if ($validated['delivery_type'] === 'express') {
                $deliveryFee = DB::table('delivery_fees')
                    ->where('type', 'express')
                    ->value('fee') ?? 500;
            } else {
                $deliveryFee = DB::table('delivery_fees')
                    ->where('type', 'standard')
                    ->value('fee') ?? 0;
            }
            
            $total = $subtotal + $deliveryFee;
            
            // Generate order number
            $orderNumber = 'ORD-' . strtoupper(Str::random(8));
            
            // Generate QR code
            $qrResult = $this->qrCodeService->generateForOrder(
                0, // Will be updated after order creation
                $validated['supplier_id']
            );
            
            // Create order
            $orderId = DB::table('orders')->insertGetId([
                'order_number' => $orderNumber,
                'supplier_id' => $validated['supplier_id'],
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_location' => $validated['customer_location'] ?? '',
                'commune' => $validated['commune'] ?? '',
                'quartier' => $validated['quartier'] ?? '',
                'delivery_type' => $validated['delivery_type'] ?? 'standard',
                'delivery_date' => $validated['delivery_date'] ?? null,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'status' => 'pending',
                'notes' => $validated['notes'] ?? '',
                'qr_code' => $qrResult['qr_code'] ?? null,
                'qr_code_security' => $qrResult['security_code'] ?? null,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            // Update QR code with actual order ID
            if ($qrResult['success']) {
                $newQrData = [
                    'order_id' => $orderId,
                    'supplier_id' => $validated['supplier_id'],
                    'security' => $qrResult['security_code'],
                    'timestamp' => time(),
                    'checksum' => md5($orderId . $validated['supplier_id'] . $qrResult['security_code'])
                ];
                $newQrCode = base64_encode(json_encode($newQrData));
                
                DB::table('orders')
                    ->where('id', $orderId)
                    ->update(['qr_code' => $newQrCode]);
            }
            
            // Create order items
            foreach ($orderItems as &$item) {
                $item['order_id'] = $orderId;
            }
            
            DB::table('order_items')->insert(
                array_map(function($item) {
                    return [
                        'order_id' => $item['order_id'],
                        'product_id' => $item['product_id'],
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'total' => $item['total'],
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }, $orderItems)
            );
            
            // Get created order
            $order = DB::table('orders')->where('id', $orderId)->first();
            $items = DB::table('order_items')->where('order_id', $orderId)->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Commande créée avec succès',
                'data' => [
                    'order' => $order,
                    'items' => $items,
                    'qr_code_image' => $qrResult['qr_image'] ?? null
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('AdminOrderManagementController createOrder error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la commande'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/admin/orders/{id}/qr
     * 
     * Get QR code for an order
     */
    public function getQrCode($id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }
            
            // Generate new QR code if doesn't exist
            if (!$order->qr_code) {
                $qrResult = $this->qrCodeService->generateForOrder(
                    $id,
                    $order->supplier_id
                );
                
                if ($qrResult['success']) {
                    $newQrData = [
                        'order_id' => $id,
                        'supplier_id' => $order->supplier_id,
                        'security' => $qrResult['security_code'],
                        'timestamp' => time(),
                        'checksum' => md5($id . $order->supplier_id . $qrResult['security_code'])
                    ];
                    $newQrCode = base64_encode(json_encode($newQrData));
                    
                    DB::table('orders')
                        ->where('id', $id)
                        ->update([
                            'qr_code' => $newQrCode,
                            'qr_code_security' => $qrResult['security_code']
                        ]);
                    
                    $order->qr_code = $newQrCode;
                    $order->qr_code_security = $qrResult['security_code'];
                    $qrResult['qr_image'] = $qrResult['qr_image'] ?? '';
                }
            } else {
                // Regenerate image from existing data
                $qrResult = [
                    'success' => true,
                    'qr_image' => $this->qrCodeService->generateQrCodeImage($order->qr_code)
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'qr_code' => $order->qr_code,
                    'qr_code_image' => $qrResult['qr_image'] ?? '',
                    'qr_code_security' => $order->qr_code_security,
                    'status' => $order->status
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminOrderManagementController getQrCode error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du QR code'
            ], 500);
        }
    }
    
    /**
     * POST /api/v1/admin/orders/{id}/validate-qr
     * 
     * Validate QR code manually (for admin)
     */
    public function validateQr(Request $request, $id)
    {
        try {
            $qrData = $request->input('qr_data');
            $securityCode = $request->input('security_code');
            
            if (!$qrData && !$securityCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code ou code de sécurité requis'
                ], 400);
            }
            
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }
            
            // Validate by QR data or security code
            if ($qrData) {
                $validation = $this->qrCodeService->validateScan($qrData, $id);
            } else {
                $validation = $this->qrCodeService->validateBySecurityCode($securityCode, $id);
            }
            
            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'valid' => false,
                    'message' => $validation['message']
                ], 400);
            }
            
            // Update order with scan info
            DB::table('orders')
                ->where('id', $id)
                ->update([
                    'qr_code_scanned_at' => now(),
                    'qr_code_scanned_by' => 'admin',
                    'delivery_confirmation_method' => 'manual',
                    'status' => 'delivered',
                    'updated_at' => now()
                ]);
            
            return response()->json([
                'success' => true,
                'valid' => true,
                'message' => 'Validation QR code réussie',
                'data' => [
                    'order_id' => $id,
                    'status' => 'delivered',
                    'validated_at' => now()->toIso8601String(),
                    'validated_by' => 'admin',
                    'method' => 'manual'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminOrderManagementController validateQr error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation'
            ], 500);
        }
    }
    
    /**
     * POST /api/v1/admin/orders/{id}/regenerate-qr
     * 
     * Regenerate QR code for an order
     */
    public function regenerateQr($id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }
            
            // Generate new QR code
            $qrResult = $this->qrCodeService->generateForOrder(
                $id,
                $order->supplier_id
            );
            
            if (!$qrResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la génération du QR code'
                ], 500);
            }
            
            $newQrData = [
                'order_id' => $id,
                'supplier_id' => $order->supplier_id,
                'security' => $qrResult['security_code'],
                'timestamp' => time(),
                'checksum' => md5($id . $order->supplier_id . $qrResult['security_code'])
            ];
            $newQrCode = base64_encode(json_encode($newQrData));
            
            DB::table('orders')
                ->where('id', $id)
                ->update([
                    'qr_code' => $newQrCode,
                    'qr_code_security' => $qrResult['security_code'],
                    'qr_code_scanned_at' => null,
                    'qr_code_scanned_by' => null,
                    'delivery_confirmation_method' => null,
                    'updated_at' => now()
                ]);
            
            return response()->json([
                'success' => true,
                'message' => 'QR code régénéré avec succès',
                'data' => [
                    'order_id' => $id,
                    'qr_code' => $newQrCode,
                    'qr_code_image' => $qrResult['qr_image'],
                    'qr_code_security' => $qrResult['security_code']
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminOrderManagementController regenerateQr error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la régénération du QR code'
            ], 500);
        }
    }
}
