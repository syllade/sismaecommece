<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPerson;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Driver Profile Controller V1
 * 
 * Profile management endpoints
 * - Get profile
 * - Update profile
 * - Change password
 */
class DriverProfileController extends Controller
{
    /**
     * GET /api/v1/driver/profile
     * 
     * Get driver profile
     */
    public function show(Request $request)
    {
        try {
            $driverId = $this->getDriverId($request);
            
            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non identifié',
                ], 401);
            }

            $driver = DeliveryPerson::find($driverId);

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil non trouvé',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $driver->id,
                    'name' => $driver->name,
                    'phone' => $driver->phone,
                    'email' => $driver->email,
                    'zone' => $driver->zone,
                    'vehicle_type' => $driver->vehicle_type,
                    'is_active' => $driver->is_active,
                    'photo' => $driver->photo,
                    'created_at' => $driver->created_at,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverProfileController show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/driver/profile
     * 
     * Update driver profile
     */
    public function update(Request $request)
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
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20|unique:delivery_persons,phone,' . $driverId,
                'photo' => 'sometimes|string', // Base64 encoded
            ]);

            $driver = DeliveryPerson::find($driverId);

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil non trouvé',
                ], 404);
            }

            $updateData = ['updated_at' => now()];

            // Update name
            if ($request->has('name')) {
                // Sanitize input
                $name = strip_tags(trim($request->input('name')));
                $updateData['name'] = $name;
                $driver->name = $name;
            }

            // Update phone
            if ($request->has('phone')) {
                $phone = preg_replace('/[^0-9]/', '', $request->input('phone'));
                $updateData['phone'] = $phone;
                $driver->phone = $phone;
            }

            // Handle photo upload
            if ($request->has('photo') && $request->input('photo')) {
                $photoBase64 = $request->input('photo');
                
                // Remove data URL prefix if present
                if (strpos($photoBase64, 'data:') !== false) {
                    $photoBase64 = explode(',', $photoBase64)[1] ?? $photoBase64;
                }

                // Decode and validate
                $imageData = base64_decode($photoBase64);
                if ($imageData === false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Image invalide',
                    ], 422);
                }

                // Check size (max 2MB)
                if (strlen($imageData) > 2000000) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Image trop volumineuse. Taille maximale: 2MB',
                    ], 422);
                }

                // Save to S3 or local
                $filename = 'drivers/' . $driverId . '/photo_' . time() . '.jpg';
                
                if (config('filesystems.default') === 's3') {
                    Storage::disk('s3')->put($filename, $imageData);
                    $updateData['photo'] = $filename;
                } else {
                    Storage::put('public/' . $filename, $imageData);
                    $updateData['photo'] = 'storage/' . $filename;
                }

                $driver->photo = $updateData['photo'];
            }

            // Update driver
            DeliveryPerson::where('id', $driverId)->update($updateData);

            // Also update user table if email is associated
            if ($driver->email) {
                DB::table('users')
                    ->where('delivery_person_id', $driverId)
                    ->where('role', 'delivery')
                    ->update([
                        'name' => $driver->name,
                        'updated_at' => now(),
                    ]);
            }

            AuditLogService::record('driver.profile.update', null, [
                'driver_id' => $driverId,
            ], 'driver', $driverId);

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour',
                'data' => [
                    'id' => $driver->id,
                    'name' => $driver->name,
                    'phone' => $driver->phone,
                    'email' => $driver->email,
                    'photo' => $driver->photo,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverProfileController update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/driver/change-password
     * 
     * Change driver password
     */
    public function changePassword(Request $request)
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
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            $currentPassword = $request->input('current_password');
            $newPassword = $request->input('new_password');

            // Get user
            $user = DB::table('users')
                ->where('delivery_person_id', $driverId)
                ->where('role', 'delivery')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte utilisateur non trouvé',
                ], 404);
            }

            // Verify current password
            if (!Hash::check($currentPassword, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe actuel incorrect',
                ], 422);
            }

            // Update password
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'password' => Hash::make($newPassword),
                    'updated_at' => now(),
                ]);

            AuditLogService::record('driver.password.change', null, [
                'driver_id' => $driverId,
            ], 'driver', $driverId);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe modifié avec succès',
            ]);
        } catch (\Exception $e) {
            Log::error('DriverProfileController changePassword error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de mot de passe',
            ], 500);
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
}
