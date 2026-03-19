<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPerson;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Driver Delivery Controller V1
 * 
 * Handles driver delivery operations
 * - List deliveries assigned to driver
 * - Update delivery status
 * - Complete delivery with proof
 * - Bulk status updates
 */
class DriverDeliveryController extends Controller
{
    /**
     * GET /api/v1/driver/deliveries
     * 
     * List deliveries assigned to current driver
     */
    public function index(Request $request)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            // Filters
            $status = $request->get('status', 'all');
            $date = $request->get('date', date('Y-m-d'));
            $deliveryType = $request->get('delivery_type', 'all');

            $query = DB::table('orders')
                ->selectRaw('
                    orders.id,
                    orders.order_number,
                    orders.client_name,
                    orders.client_phone,
                    orders.client_address,
                    orders.delivery_notes,
                    orders.status as delivery_status,
                    orders.total as total_amount,
                    orders.created_at as order_date,
                    orders.scheduled_date,
                    orders.scheduled_time,
                    orders.delivered_at,
                    orders.delivery_photo,
                    orders.delivery_signature,
                    orders.delivery_gps_lat,
                    orders.delivery_gps_lng,
                    orders.delivery_type
                ')
                ->where('orders.delivery_person_id', $driverId);

            // Filter by status
            if ($status !== 'all') {
                $query->where('orders.status', $status);
            }

            // Filter by date
            if ($date) {
                $query->whereDate('orders.scheduled_date', $date);
            }

            // Filter by delivery type
            if ($deliveryType !== 'all') {
                $query->where('orders.delivery_type', $deliveryType);
            }

            // Order by scheduled date/time
            $query->orderBy('orders.scheduled_date', 'asc')
                  ->orderBy('orders.scheduled_time', 'asc');

            // Pagination
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(50, max(1, (int) $request->get('per_page', 25)));
            $offset = ($page - 1) * $perPage;

            $countQuery = clone $query;
            $total = (int) $countQuery->count();

            $deliveries = $query
                ->offset($offset)
                ->limit($perPage)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $deliveries,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => (int) ceil($total / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des livraisons',
            ], 500);
        }
    }

    /**
     * GET /api/v1/driver/deliveries/{id}
     * 
     * Get single delivery details
     */
    public function show(Request $request, $id)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $delivery = DB::table('orders')
                ->where('id', $id)
                ->where('delivery_person_id', $driverId)
                ->first();

            if (!$delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livraison non trouvée',
                ], 404);
            }

            // Get order items
            $items = DB::table('order_items')
                ->where('order_id', $id)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    ...(array) $delivery,
                    'items' => $items,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/deliveries/{id}/update-status
     * 
     * Update delivery status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $request->validate([
                'status' => 'required|string|in:pending,processing,shipped,in_transit,delivered,completed,cancelled,exception',
                'exception_reason' => 'required_if:status,exception|string|nullable',
            ]);

            $newStatus = $request->input('status');
            $exceptionReason = $request->input('exception_reason');

            // Get current delivery
            $delivery = DB::table('orders')
                ->where('id', $id)
                ->where('delivery_person_id', $driverId)
                ->first();

            if (!$delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livraison non trouvée',
                ], 404);
            }

            // Validate status transition
            $allowedTransitions = $this->getAllowedTransitions($delivery->status);
            
            if (!in_array($newStatus, $allowedTransitions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transition de statut non autorisée. Statut actuel: ' . $delivery->status,
                ], 422);
            }

            // Update status
            $updateData = [
                'status' => $newStatus,
                'updated_at' => now(),
            ];

            if ($newStatus === 'in_transit') {
                $updateData['shipped_at'] = now();
            }

            if ($newStatus === 'delivered' || $newStatus === 'completed') {
                $updateData['delivered_at'] = now();
            }

            if ($newStatus === 'exception') {
                $updateData['delivery_notes'] = $exceptionReason;
            }

            DB::table('orders')
                ->where('id', $id)
                ->update($updateData);

            AuditLogService::record('driver.delivery.status_update', null, [
                'order_id' => $id,
                'driver_id' => $driverId,
                'old_status' => $delivery->status,
                'new_status' => $newStatus,
            ], 'order', $id);

            return response()->json([
                'success' => true,
                'message' => 'Statut mis à jour',
                'data' => [
                    'id' => $id,
                    'status' => $newStatus,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController updateStatus error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du statut',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/deliveries/bulk-update
     * 
     * Bulk update delivery status
     */
    public function bulkUpdate(Request $request)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $request->validate([
                'delivery_ids' => 'required|array|min:1',
                'status' => 'required|string|in:pending,processing,shipped,in_transit,delivered,completed,exception',
            ]);

            $deliveryIds = array_map('intval', $request->input('delivery_ids'));
            $newStatus = $request->input('status');

            // Get deliveries and validate they belong to driver
            $deliveries = DB::table('orders')
                ->whereIn('id', $deliveryIds)
                ->where('delivery_person_id', $driverId)
                ->get();

            if ($deliveries->count() !== count($deliveryIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certaines livraisons n\'existent pas ou ne vous appartiennent pas',
                ], 422);
            }

            // Validate all transitions
            $invalidTransitions = [];
            foreach ($deliveries as $delivery) {
                $allowedTransitions = $this->getAllowedTransitions($delivery->status);
                if (!in_array($newStatus, $allowedTransitions)) {
                    $invalidTransitions[] = $delivery->id;
                }
            }

            if (!empty($invalidTransitions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certaines transitions de statut ne sont pas autorisées',
                    'invalid_ids' => $invalidTransitions,
                ], 422);
            }

            // Update all deliveries
            $updateData = [
                'status' => $newStatus,
                'updated_at' => now(),
            ];

            if ($newStatus === 'in_transit') {
                $updateData['shipped_at'] = now();
            }

            if ($newStatus === 'delivered' || $newStatus === 'completed') {
                $updateData['delivered_at'] = now();
            }

            DB::table('orders')
                ->whereIn('id', $deliveryIds)
                ->update($updateData);

            AuditLogService::record('driver.delivery.bulk_status_update', null, [
                'order_ids' => $deliveryIds,
                'driver_id' => $driverId,
                'new_status' => $newStatus,
            ], 'order');

            return response()->json([
                'success' => true,
                'message' => count($deliveryIds) . ' livraisons mises à jour',
                'data' => [
                    'updated_count' => count($deliveryIds),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController bulkUpdate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour groupée',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/deliveries/{id}/complete
     * 
     * Complete delivery with proof (photo, signature, GPS)
     */
    public function complete(Request $request, $id)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            // Rate limiting: 20 completions per hour
            $rateKey = 'driver_complete_' . $driverId;
            $rateLimit = DB::table('rate_limits')
                ->where('key', $rateKey)
                ->where('created_at', '>=', now()->subHour())
                ->count();

            if ($rateLimit >= 20) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trop de demandes. Veuillez patienter.',
                ], 429);
            }

            // Validate request - photo and signature are required
            $request->validate([
                'photo_base64' => 'required|string',
                'signature_base64' => 'required|string',
                'gps_lat' => 'required|numeric|between:-90,90',
                'gps_lng' => 'required|numeric|between:-180,180',
            ]);

            // Get delivery
            $delivery = DB::table('orders')
                ->where('id', $id)
                ->where('delivery_person_id', $driverId)
                ->first();

            if (!$delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livraison non trouvée',
                ], 404);
            }

            // Validate status allows completion
            $allowedTransitions = $this->getAllowedTransitions($delivery->status);
            if (!in_array('delivered', $allowedTransitions) && !in_array('completed', $allowedTransitions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette livraison ne peut pas être complétée dans son état actuel',
                ], 422);
            }

            // Validate GPS distance (anti-fraud)
            if ($delivery->delivery_gps_lat && $delivery->delivery_gps_lng) {
                $gpsValidation = $this->validateGpsDistance(
                    $request->input('gps_lat'),
                    $request->input('gps_lng'),
                    $delivery->delivery_gps_lat,
                    $delivery->delivery_gps_lng
                );
                
                // Block if > 1000m
                if (!$gpsValidation['valid']) {
                    Log::warning('DriverDeliveryController: GPS validation BLOCKED', [
                        'order_id' => $id,
                        'driver_id' => $driverId,
                        'distance' => $gpsValidation['distance'],
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Position GPS trop éloignée. Veuillez être à moins de 1km de l\'adresse de livraison.',
                        'gps_validation' => $gpsValidation,
                    ], 422);
                }
                
                // Log warning if 500-1000m
                if ($gpsValidation['level'] === 'warning') {
                    Log::warning('DriverDeliveryController: GPS validation warning', [
                        'order_id' => $id,
                        'driver_id' => $driverId,
                        'distance' => $gpsValidation['distance'],
                    ]);
                }
            }

            // Decode and save photo
            $photoPath = $this->saveBase64Image(
                $request->input('photo_base64'),
                'deliveries/' . $id . '/proof.jpg',
                5000000 // 5MB max
            );

            // Decode and save signature
            $signaturePath = $this->saveBase64Image(
                $request->input('signature_base64'),
                'deliveries/' . $id . '/signature.png',
                2000000 // 2MB max
            );

            // Update delivery with proof
            DB::table('orders')
                ->where('id', $id)
                ->update([
                    'status' => 'completed',
                    'delivered_at' => now(),
                    'delivery_photo' => $photoPath,
                    'delivery_signature' => $signaturePath,
                    'delivery_gps_lat' => $request->input('gps_lat'),
                    'delivery_gps_lng' => $request->input('gps_lng'),
                    'delivery_notes' => $request->input('notes', $delivery->delivery_notes),
                    'updated_at' => now(),
                ]);

            // Log rate limit
            DB::table('rate_limits')->insert([
                'key' => $rateKey,
                'created_at' => now(),
            ]);

            AuditLogService::record('driver.delivery.complete', null, [
                'order_id' => $id,
                'driver_id' => $driverId,
                'gps_lat' => $request->input('gps_lat'),
                'gps_lng' => $request->input('gps_lng'),
            ], 'order', $id);

            return response()->json([
                'success' => true,
                'message' => 'Livraison complétée avec succès',
                'data' => [
                    'id' => $id,
                    'status' => 'completed',
                    'delivered_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController complete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la complétion de la livraison',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/deliveries/{id}/fail
     * 
     * Mark delivery as failed with reason
     */
    public function fail(Request $request, $id)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $request->validate([
                'reason' => 'required|string|in:client_absent,unreachable_phone,incorrect_address,refused,other',
                'client_contacted' => 'sometimes|boolean',
                'attempt_count' => 'sometimes|integer|min:1|max:5',
                'notes' => 'sometimes|string|max:500',
            ]);

            $reason = $request->input('reason');
            $clientContacted = $request->input('client_contacted', false);
            $attemptCount = $request->input('attempt_count', 1);
            $notes = $request->input('notes', '');

            // Get delivery
            $delivery = DB::table('orders')
                ->where('id', $id)
                ->where('delivery_person_id', $driverId)
                ->first();

            if (!$delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livraison non trouvée',
                ], 404);
            }

            // Validate transition - FAIL only allowed from pre-delivery states
            $allowedTransitions = $this->getAllowedTransitions($delivery->status);
            if (!in_array('failed', $allowedTransitions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de marquer cette livraison comme échouée',
                ], 422);
            }

            // Map reason to French description
            $reasonDescriptions = [
                'client_absent' => 'Client absent',
                'unreachable_phone' => 'Numéro injoignable',
                'incorrect_address' => 'Adresse incorrecte',
                'refused' => 'Refus du client',
                'other' => 'Autre',
            ];

            $reasonText = $reasonDescriptions[$reason] ?? 'Autre';
            $fullNotes = $reasonText . ($notes ? ' - ' . $notes : '');
            if ($clientContacted) {
                $fullNotes .= ' [Client contacté] #' . $attemptCount;
            }

            // Update delivery
            DB::table('orders')
                ->where('id', $id)
                ->update([
                    'status' => 'failed',
                    'delivery_notes' => $fullNotes,
                    'failed_at' => now(),
                    'failure_reason' => $reason,
                    'client_contacted' => $clientContacted,
                    'attempt_count' => $attemptCount,
                    'updated_at' => now(),
                ]);

            AuditLogService::record('driver.delivery.failed', null, [
                'order_id' => $id,
                'driver_id' => $driverId,
                'reason' => $reason,
                'client_contacted' => $clientContacted,
                'attempt_count' => $attemptCount,
                'notes' => $notes,
            ], 'order', $id);


            // TODO: Send notification to admin/supplier about failed delivery

            return response()->json([
                'success' => true,
                'message' => 'Livraison marquée comme échouée',
                'data' => [
                    'id' => $id,
                    'status' => 'failed',
                    'reason' => $reason,
                    'client_contacted' => $clientContacted,
                    'attempt_count' => $attemptCount,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController fail error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/deliveries/{id}/accept
     * 
     * Accept delivery assignment
     */
    public function accept(Request $request, $id)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $delivery = DB::table('orders')
                ->where('id', $id)
                ->where('delivery_person_id', $driverId)
                ->first();

            if (!$delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livraison non trouvée',
                ], 404);
            }

            // Validate transition
            $allowedTransitions = $this->getAllowedTransitions($delivery->status);
            if (!in_array('accepted', $allowedTransitions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible d\'accepter cette livraison',
                ], 422);
            }

            // Update status
            DB::table('orders')
                ->where('id', $id)
                ->update([
                    'status' => 'accepted',
                    'accepted_at' => now(),
                    'updated_at' => now(),
                ]);

            AuditLogService::record('driver.delivery.accepted', null, [
                'order_id' => $id,
                'driver_id' => $driverId,
            ], 'order', $id);

            return response()->json([
                'success' => true,
                'message' => 'Livraison acceptée',
                'data' => [
                    'id' => $id,
                    'status' => 'accepted',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController accept error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'acceptation',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/deliveries/{id}/pickup
     * 
     * Mark delivery as picked up from supplier
     */
    public function pickup(Request $request, $id)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $request->validate([
                'gps_lat' => 'sometimes|numeric|between:-90,90',
                'gps_lng' => 'sometimes|numeric|between:-180,180',
            ]);

            $delivery = DB::table('orders')
                ->where('id', $id)
                ->where('delivery_person_id', $driverId)
                ->first();

            if (!$delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livraison non trouvée',
                ], 404);
            }

            // Validate transition
            $allowedTransitions = $this->getAllowedTransitions($delivery->status);
            if (!in_array('picked_up', $allowedTransitions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de collecter cette livraison',
                ], 422);
            }

            // Build update data
            $updateData = [
                'status' => 'picked_up',
                'picked_up_at' => now(),
                'updated_at' => now(),
            ];

            // Store pickup GPS if provided
            if ($request->has('gps_lat') && $request->has('gps_lng')) {
                $updateData['pickup_gps_lat'] = $request->input('gps_lat');
                $updateData['pickup_gps_lng'] = $request->input('gps_lng');
            }

            // Update status
            DB::table('orders')
                ->where('id', $id)
                ->update($updateData);

            AuditLogService::record('driver.delivery.picked_up', null, [
                'order_id' => $id,
                'driver_id' => $driverId,
                'gps_lat' => $request->input('gps_lat'),
                'gps_lng' => $request->input('gps_lng'),
            ], 'order', $id);

            return response()->json([
                'success' => true,
                'message' => 'Colis collecté',
                'data' => [
                    'id' => $id,
                    'status' => 'picked_up',
                    'picked_up_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverDeliveryController pickup error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la collecte',
            ], 500);
        }
    }

    /**
     * Validate GPS distance from delivery location
     * Anti-fraud: ensure driver is near delivery address
     * 
     * Returns: ['valid' => bool, 'distance' => float, 'level' => 'normal'|'warning'|'blocked']
     */
    private function validateGpsDistance($driverLat, $driverLng, $deliveryLat, $deliveryLng)
    {
        // Haversine formula for distance calculation
        $earthRadius = 6371000; // meters

        $lat1 = deg2rad($driverLat);
        $lat2 = deg2rad($deliveryLat);
        $deltaLat = deg2rad($deliveryLat - $driverLat);
        $deltaLng = deg2rad($deliveryLng - $driverLng);

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
            cos($lat1) * cos($lat2) *
            sin($deltaLng / 2) * sin($deltaLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        $distance = $earthRadius * $c;

        // Tiered validation
        if ($distance <= 500) {
            return [
                'valid' => true,
                'distance' => round($distance),
                'level' => 'normal',
            ];
        } elseif ($distance <= 1000) {
            return [
                'valid' => true,
                'distance' => round($distance),
                'level' => 'warning',
            ];
        } else {
            return [
                'valid' => false,
                'distance' => round($distance),
                'level' => 'blocked',
            ];
        }
    }

    /**
     * Get driver ID from authenticated user
     */
    private function getDriverId(Request $request)
    {
        $user = $request->user();
        return $user->delivery_person_id ?? null;
    }

    /**
     * Get allowed status transitions (strict workflow)
     * 
     * Workflow: assigned → accepted → picked_up → out_for_delivery → delivered
     *                              ↘ failed
     */
    private function getAllowedTransitions($currentStatus)
    {
        // Strict workflow transitions
        $transitions = [
            // Initial states (admin assigned)
            'assigned' => ['accepted', 'failed'],
            'pending' => ['accepted', 'failed'],
            
            // Driver accepted
            'accepted' => ['picked_up', 'failed'],
            'processing' => ['picked_up', 'failed'],
            
            // Package picked up
            'picked_up' => ['out_for_delivery', 'failed'],
            'shipped' => ['out_for_delivery', 'failed'],
            
            // Out for delivery
            'out_for_delivery' => ['delivered', 'failed'],
            'in_transit' => ['delivered', 'failed'],
            
            // Final states (no transitions allowed)
            'delivered' => [],
            'completed' => [],
            'failed' => [],
            'cancelled' => [],
            'exception' => [],
        ];

        return $transitions[$currentStatus] ?? [];
    }

    /**
     * Save base64 image to storage
     */
    private function saveBase64Image($base64Data, $path, $maxSize)
    {
        // Remove data URL prefix if present
        if (strpos($base64Data, 'data:') !== false) {
            $base64Data = explode(',', $base64Data)[1] ?? $base64Data;
        }

        // Validate size
        $size = strlen(base64_decode($base64Data));
        if ($size > $maxSize) {
            throw new \Exception('Image trop volumineuse. Taille maximale: ' . ($maxSize / 1000000) . 'MB');
        }

        // Decode and save
        $imageData = base64_decode($base64Data);
        
        // Use S3 if configured, otherwise local storage
        if (config('filesystems.default') === 's3') {
            Storage::disk('s3')->put($path, $imageData);
            return $path;
        } else {
            Storage::put('public/' . $path, $imageData);
            return 'storage/' . $path;
        }
    }
}
