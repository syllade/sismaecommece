<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller for driver QR code scanning and delivery confirmation
 * 
 * Endpoints:
 * - POST /api/v1/driver/deliveries/{id}/scan-qr - Scan QR code to confirm delivery
 * - POST /api/v1/driver/deliveries/{id}/confirm-manual - Manual confirmation
 * - GET /api/v1/driver/deliveries/{id}/verify-qr - Verify QR code before delivery
 */
class DriverQrController extends Controller
{
    protected $qrCodeService;
    
    public function __construct()
    {
        $this->qrCodeService = new QrCodeService();
    }
    
    /**
     * GET /api/v1/driver/deliveries/{id}/verify-qr
     * 
     * Verify QR code before delivery confirmation
     */
    public function verifyQr(Request $request, $id)
    {
        try {
            $qrData = $request->input('qr_data');
            
            if (!$qrData) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code requis'
                ], 400);
            }
            
            // Get delivery person from auth
            $deliveryPersonId = $request->user()->id ?? null;
            
            // Get order
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }
            
            // Verify order is assigned to this driver
            if ($order->delivery_person_id != $deliveryPersonId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette commande ne vous est pas attribuée'
                ], 403);
            }
            
            // Verify order is in correct status
            if (!in_array($order->status, ['processing', 'shipped', 'out_for_delivery'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Statut de commande incompatible avec la livraison'
                ], 400);
            }
            
            // Validate QR code
            $validation = $this->qrCodeService->validateScan($qrData, $id);
            
            return response()->json([
                'success' => $validation['success'],
                'valid' => $validation['valid'],
                'message' => $validation['message'] ?? ($validation['valid'] ? 'QR code valide' : 'QR code invalide'),
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer_name,
                    'customer_phone' => $order->customer_phone,
                    'status' => $order->status
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('DriverQrController verifyQr error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification'
            ], 500);
        }
    }
    
    /**
     * POST /api/v1/driver/deliveries/{id}/scan-qr
     * 
     * Confirm delivery by scanning QR code
     */
    public function scanQr(Request $request, $id)
    {
        try {
            $qrData = $request->input('qr_data');
            
            if (!$qrData) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code requis'
                ], 400);
            }
            
            // Get delivery person from auth
            $deliveryPersonId = $request->user()->id ?? $request->input('delivery_person_id');
            
            // Get order
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }
            
            // Verify order is assigned to this driver
            if ($order->delivery_person_id != $deliveryPersonId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette commande ne vous est pas attribuée'
                ], 403);
            }
            
            // Verify order is in correct status
            if (!in_array($order->status, ['processing', 'shipped', 'out_for_delivery'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Statut de commande incompatible avec la livraison'
                ], 400);
            }
            
            // Validate QR code
            $validation = $this->qrCodeService->validateScan($qrData, $id);
            
            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'valid' => false,
                    'message' => $validation['message']
                ], 400);
            }
            
            // Check if already delivered
            if ($order->qr_code_scanned_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette commande a déjà été livrée',
                    'data' => [
                        'delivered_at' => $order->qr_code_scanned_at,
                        'delivered_by' => $order->qr_code_scanned_by
                    ]
                ], 400);
            }
            
            // Update order as delivered
            DB::table('orders')
                ->where('id', $id)
                ->update([
                    'status' => 'delivered',
                    'qr_code_scanned_at' => now(),
                    'qr_code_scanned_by' => 'driver',
                    'delivery_confirmation_method' => 'qr_scan',
                    'updated_at' => now()
                ]);
            
            // Get updated order
            $updatedOrder = DB::table('orders')->where('id', $id)->first();
            
            return response()->json([
                'success' => true,
                'valid' => true,
                'message' => 'Livraison confirmée par scan QR',
                'data' => [
                    'order_id' => $id,
                    'order_number' => $order->order_number,
                    'status' => 'delivered',
                    'delivered_at' => now()->toIso8601String(),
                    'delivered_by' => 'driver',
                    'method' => 'qr_scan'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('DriverQrController scanQr error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la confirmation'
            ], 500);
        }
    }
    
    /**
     * POST /api/v1/driver/deliveries/{id}/confirm-manual
     * 
     * Manual confirmation when QR scan is not possible
     */
    public function confirmManual(Request $request, $id)
    {
        try {
            $reason = $request->input('reason', '');
            
            // Get delivery person from auth
            $deliveryPersonId = $request->user()->id ?? $request->input('delivery_person_id');
            
            // Get order
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }
            
            // Verify order is assigned to this driver
            if ($order->delivery_person_id != $deliveryPersonId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette commande ne vous est pas attribuée'
                ], 403);
            }
            
            // Update order as delivered manually
            DB::table('orders')
                ->where('id', $id)
                ->update([
                    'status' => 'delivered',
                    'qr_code_scanned_at' => now(),
                    'qr_code_scanned_by' => 'driver_manual',
                    'delivery_confirmation_method' => 'manual',
                    'notes' => $order->notes . '\n' . 'Confirmation manuelle: ' . $reason,
                    'updated_at' => now()
                ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Livraison confirmée manuellement',
                'data' => [
                    'order_id' => $id,
                    'order_number' => $order->order_number,
                    'status' => 'delivered',
                    'delivered_at' => now()->toIso8601String(),
                    'delivered_by' => 'driver',
                    'method' => 'manual',
                    'reason' => $reason
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('DriverQrController confirmManual error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la confirmation'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/driver/deliveries/{id}/qr-data
     * 
     * Get QR code data for a delivery
     */
    public function getQrData($id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }
            
            // Return QR code data (without image for security)
            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'qr_code' => $order->qr_code,
                    'qr_code_security' => $order->qr_code_security,
                    'status' => $order->status,
                    'customer_name' => $order->customer_name,
                    'customer_phone' => $order->customer_phone,
                    'delivery_address' => $order->customer_location . ', ' . $order->quartier
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('DriverQrController getQrData error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données'
            ], 500);
        }
    }
}
