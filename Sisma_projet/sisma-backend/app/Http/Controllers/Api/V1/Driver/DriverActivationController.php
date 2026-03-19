<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPerson;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * Driver Activation Controller V1
 * 
 * Handles driver account activation via Signed URLs
 * - GET /api/v1/driver/activate/{id} - Check activation status
 * - POST /api/v1/driver/activate/{id} - Activate account with password
 */
class DriverActivationController extends Controller
{
    /**
     * GET /api/v1/driver/activate/{id}
     * 
     * Verify signed URL and return activation status
     */
    public function show(Request $request, $id)
    {
        try {
            // Verify signed URL
            if (!$request->hasValidSignature()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lien d\'activation invalide ou expiré',
                    'valid' => false,
                ], 403);
            }

            // Find driver
            $driver = DeliveryPerson::find($id);

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                    'valid' => false,
                ], 404);
            }

            // Check if already activated
            $user = DB::table('users')
                ->where('delivery_person_id', $driver->id)
                ->where('role', 'delivery')
                ->first();

            if ($user && $user->is_active && $user->password) {
                return response()->json([
                    'success' => true,
                    'valid' => true,
                    'already_activated' => true,
                    'message' => 'Ce compte est déjà activé',
                    'data' => [
                        'driver_id' => $driver->id,
                        'name' => $driver->name,
                        'email' => $driver->email,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'valid' => true,
                'already_activated' => false,
                'message' => 'Prêt pour l\'activation',
                'data' => [
                    'driver_id' => $driver->id,
                    'name' => $driver->name,
                    'email' => $driver->email,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverActivationController show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/activate/{id}
     * 
     * Activate driver account with password
     */
    public function activate(Request $request, $id)
    {
        try {
            // Verify signed URL
            if (!$request->hasValidSignature()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lien d\'activation invalide ou expiré',
                ], 403);
            }

            // Validate request
            $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ]);

            // Find driver
            $driver = DeliveryPerson::find($id);

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                ], 404);
            }

            // Check if user exists
            $user = DB::table('users')
                ->where('delivery_person_id', $driver->id)
                ->where('role', 'delivery')
                ->first();

            if (!$user) {
                // Create user account if doesn't exist
                $userId = DB::table('users')->insertGetId([
                    'name' => $driver->name,
                    'email' => $driver->email,
                    'password' => Hash::make($request->password),
                    'role' => 'delivery',
                    'delivery_person_id' => $driver->id,
                    'is_active' => 1,
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Activate driver
                $driver->is_active = 1;
                $driver->save();

                AuditLogService::record('driver.activate', null, [
                    'driver_id' => $driver->id,
                    'user_id' => $userId,
                ], 'driver', $driver->id);

                return response()->json([
                    'success' => true,
                    'message' => 'Compte activé avec succès',
                    'data' => [
                        'driver_id' => $driver->id,
                        'name' => $driver->name,
                        'email' => $driver->email,
                    ],
                ], 201);
            }

            // If user already has password, prevent re-activation
            if ($user->password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce compte est déjà activé',
                ], 422);
            }

            // Update user with password
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'password' => Hash::make($request->password),
                    'is_active' => 1,
                    'email_verified_at' => now(),
                    'updated_at' => now(),
                ]);

            // Activate driver
            $driver->is_active = 1;
            $driver->save();

            AuditLogService::record('driver.activate', null, [
                'driver_id' => $driver->id,
                'user_id' => $user->id,
            ], 'driver', $driver->id);

            return response()->json([
                'success' => true,
                'message' => 'Compte activé avec succès',
                'data' => [
                    'driver_id' => $driver->id,
                    'name' => $driver->name,
                    'email' => $driver->email,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverActivationController activate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'activation',
            ], 500);
        }
    }
}
