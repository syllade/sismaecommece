<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPerson;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

/**
 * Driver Auth Controller V1
 * 
 * Authentication endpoints for delivery drivers
 * - Login
 * - Forgot Password
 * - Reset Password
 * - Logout
 */
class DriverAuthController extends Controller
{
    /**
     * POST /api/v1/driver/login
     * 
     * Driver login with email/phone and password
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string',
                'password' => 'required|string',
            ]);

            $email = $request->input('email');
            $password = $request->input('password');

            // Find driver by email or phone
            $driver = DeliveryPerson::where('email', $email)
                ->orWhere('phone', $email)
                ->first();

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants incorrects',
                ], 422);
            }

            // Check if driver has a user account
            $user = DB::table('users')
                ->where('delivery_person_id', $driver->id)
                ->where('role', 'delivery')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte non activé. Veuillez activer votre compte.',
                ], 422);
            }

            // Check password
            if (!Hash::check($password, $user->password)) {
                AuditLogService::record('driver.login.failed', null, [
                    'driver_id' => $driver->id,
                    'reason' => 'bad_password',
                ], 'driver', $driver->id);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants incorrects',
                ], 422);
            }

            // Check if account is active
            if (!$driver->is_active || !$user->is_active) {
                AuditLogService::record('driver.login.failed', null, [
                    'driver_id' => $driver->id,
                    'reason' => 'inactive_account',
                ], 'driver', $driver->id);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé. Veuillez contacter l\'administrateur.',
                ], 422);
            }

            // Generate API token
            $token = bin2hex(openssl_random_pseudo_bytes(30));
            $expiresAt = now()->addDays(30);

            // Store token
            DB::table('api_tokens')->insert([
                'user_id' => $user->id,
                'token' => $token,
                'expires_at' => $expiresAt,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            AuditLogService::record('driver.login.success', null, [
                'driver_id' => $driver->id,
            ], 'driver', $driver->id);

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => [
                    'driver' => [
                        'id' => $driver->id,
                        'name' => $driver->name,
                        'phone' => $driver->phone,
                        'email' => $driver->email,
                        'zone' => $driver->zone,
                        'vehicle_type' => $driver->vehicle_type,
                        'is_active' => $driver->is_active,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_at' => $expiresAt->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverAuthController login error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/forgot-password
     * 
     * Send password reset link via Signed URL
     */
    public function forgotPassword(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
            ]);

            $email = $request->input('email');

            // Find driver by email
            $driver = DeliveryPerson::where('email', $email)->first();

            if (!$driver) {
                // Don't reveal if email exists
                return response()->json([
                    'success' => true,
                    'message' => 'Si cet email existe, un lien de réinitialisation sera envoyé.',
                ]);
            }

            // Find associated user
            $user = DB::table('users')
                ->where('delivery_person_id', $driver->id)
                ->where('role', 'delivery')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => true,
                    'message' => 'Si cet email existe, un lien de réinitialisation sera envoyé.',
                ]);
            }

            // Generate signed URL for password reset (1 hour expiration)
            $signedUrl = URL::temporarySignedRoute(
                'driver.password.reset',
                now()->addHour(),
                ['driver' => $driver->id]
            );

            // Store reset token in database
            $resetToken = bin2hex(openssl_random_pseudo_bytes(20));
            DB::table('password_resets')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($resetToken),
                    'created_at' => now(),
                ]
            );

            // In production, send email with reset link
            // For now, return the signed URL in response (dev mode)
            AuditLogService::record('driver.password.reset_requested', null, [
                'driver_id' => $driver->id,
            ], 'driver', $driver->id);

            return response()->json([
                'success' => true,
                'message' => 'Si cet email existe, un lien de réinitialisation sera envoyé.',
                'debug' => [
                    // Remove in production
                    'reset_link' => $signedUrl,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DriverAuthController forgotPassword error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la demande de réinitialisation',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/reset-password
     * 
     * Reset password with token
     */
    public function resetPassword(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|string|min:8|confirmed',
                'token' => 'required|string',
            ]);

            $email = $request->input('email');
            $password = $request->input('password');
            $token = $request->input('token');

            // Find driver
            $driver = DeliveryPerson::where('email', $email)->first();

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide',
                ], 422);
            }

            // Verify reset token
            $resetRecord = DB::table('password_resets')
                ->where('email', $email)
                ->first();

            if (!$resetRecord || !Hash::check($token, $resetRecord->token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide ou expiré',
                ], 422);
            }

            // Check token expiration (1 hour)
            if (now()->diffInMinutes($resetRecord->created_at) > 60) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token expiré',
                ], 422);
            }

            // Find and update user
            $user = DB::table('users')
                ->where('delivery_person_id', $driver->id)
                ->where('role', 'delivery')
                ->first();

            if ($user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'password' => Hash::make($password),
                        'updated_at' => now(),
                    ]);
            }

            // Delete reset token
            DB::table('password_resets')->where('email', $email)->delete();

            AuditLogService::record('driver.password.reset_success', null, [
                'driver_id' => $driver->id,
            ], 'driver', $driver->id);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès',
            ]);
        } catch (\Exception $e) {
            Log::error('DriverAuthController resetPassword error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation',
            ], 500);
        }
    }

    /**
     * POST /api/v1/driver/logout
     * 
     * Revoke current token
     */
    public function logout(Request $request)
    {
        try {
            $token = $request->bearerToken();
            
            if ($token) {
                DB::table('api_tokens')->where('token', $token)->delete();
            }

            $driverId = $request->user()->delivery_person_id ?? null;
            
            if ($driverId) {
                AuditLogService::record('driver.logout', null, [
                    'driver_id' => $driverId,
                ], 'driver', $driverId);
            }

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie',
            ]);
        } catch (\Exception $e) {
            Log::error('DriverAuthController logout error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion',
            ], 500);
        }
    }

    /**
     * GET /api/v1/driver/me
     * 
     * Get current driver profile
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            $driverId = $user->delivery_person_id;

            if (!$driverId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil livreur non trouvé',
                ], 404);
            }

            $driver = DeliveryPerson::find($driverId);

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
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
            Log::error('DriverAuthController me error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil',
            ], 500);
        }
    }
}
