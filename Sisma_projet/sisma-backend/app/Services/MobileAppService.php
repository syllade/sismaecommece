<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Mobile App Service
 * 
 * Features:
 * - JWT refresh token strategy
 * - FCM push notifications
 * - Device registration
 * - Mobile API versioning
 */
class MobileAppService
{
    protected $jwtSecret;
    protected $jwtTtl = 3600; // 1 hour
    protected $refreshTtl = 2592000; // 30 days

    public function __construct()
    {
        $this->jwtSecret = config('app.key');
    }

    /**
     * Generate access token for mobile
     */
    public function generateAccessToken(int $userId, string $userType, array $extraClaims = []): string
    {
        $now = time();
        
        $payload = [
            'iss' => config('app.url'),
            'aud' => 'fashop-mobile',
            'iat' => $now,
            'exp' => $now + $this->jwtTtl,
            'sub' => $userId,
            'type' => $userType,
            'jti' => $this->generateTokenId(),
            'device' => [
                'id' => request()->header('X-Device-Id'),
                'type' => request()->header('X-Device-Type'),
            ],
            ...$extraClaims,
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /**
     * Generate refresh token
     */
    public function generateRefreshToken(int $userId, string $userType): string
    {
        $token = bin2hex(random_bytes(32));
        
        // Store in database
        DB::table('mobile_refresh_tokens')->insert([
            'user_id' => $userId,
            'user_type' => $userType,
            'token' => hash('sha256', $token),
            'device_id' => request()->header('X-Device-Id'),
            'device_name' => request()->header('X-Device-Name'),
            'expires_at' => now()->addSeconds($this->refreshTtl),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $token;
    }

    /**
     * Refresh access token
     */
    public function refreshToken(string $refreshToken): array
    {
        $tokenHash = hash('sha256', $refreshToken);
        
        $stored = DB::table('mobile_refresh_tokens')
            ->where('token', $tokenHash)
            ->where('expires_at', '>', now())
            ->where('is_revoked', false)
            ->first();

        if (!$stored) {
            return ['success' => false, 'message' => 'Token invalide ou expiré'];
        }

        // Generate new tokens
        $accessToken = $this->generateAccessToken($stored->user_id, $stored->user_type);
        $newRefreshToken = $this->generateRefreshToken($stored->user_id, $stored->user_type);

        // Revoke old refresh token
        DB::table('mobile_refresh_tokens')
            ->where('id', $stored->id)
            ->update(['is_revoked' => true, 'revoked_at' => now()]);

        return [
            'success' => true,
            'access_token' => $accessToken,
            'refresh_token' => $newRefreshToken,
            'expires_in' => $this->jwtTtl,
        ];
    }

    /**
     * Revoke all tokens for a user
     */
    public function revokeAllTokens(int $userId): void
    {
        DB::table('mobile_refresh_tokens')
            ->where('user_id', $userId)
            ->update(['is_revoked' => true, 'revoked_at' => now()]);
    }

    /**
     * Revoke specific device tokens
     */
    public function revokeDeviceTokens(int $userId, string $deviceId): void
    {
        DB::table('mobile_refresh_tokens')
            ->where('user_id', $userId)
            ->where('device_id', $deviceId)
            ->update(['is_revoked' => true, 'revoked_at' => now()]);
    }

    /**
     * Verify access token
     */
    public function verifyToken(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Register device for push notifications
     */
    public function registerDevice(int $userId, string $userType, array $deviceData): void
    {
        DB::table('mobile_devices')->updateOrInsert(
            [
                'user_id' => $userId,
                'user_type' => $userType,
                'device_id' => $deviceData['device_id'],
            ],
            [
                'device_type' => $deviceData['device_type'] ?? 'android',
                'fcm_token' => $deviceData['fcm_token'] ?? null,
                'device_name' => $deviceData['device_name'] ?? null,
                'app_version' => $deviceData['app_version'] ?? null,
                'os_version' => $deviceData['os_version'] ?? null,
                'is_active' => true,
                'last_active_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Send push notification via FCM
     */
    public function sendPushNotification(
        int $userId,
        string $title,
        string $body,
        array $data = [],
        string $userType = 'supplier'
    ): array {
        $devices = DB::table('mobile_devices')
            ->where('user_id', $userId)
            ->where('user_type', $userType)
            ->where('is_active', true)
            ->whereNotNull('fcm_token')
            ->get();

        if ($devices->isEmpty()) {
            return ['success' => false, 'message' => 'Aucun appareil enregistré'];
        }

        $fcmTokens = $devices->pluck('fcm_token')->toArray();
        
        return $this->sendToFCM($fcmTokens, $title, $body, $data);
    }

    /**
     * Send to Firebase Cloud Messaging
     */
    protected function sendToFCM(array $tokens, string $title, string $body, array $data): array
    {
        $fcmKey = config('services.fcm.server_key');
        
        if (!$fcmKey) {
            // Log instead of sending if no key configured
            \Log::info('FCM notification (not sent - no key)', [
                'tokens' => count($tokens),
                'title' => $title,
                'body' => $body,
            ]);
            
            return ['success' => true, 'sent' => 0, 'message' => 'FCM not configured'];
        }

        // Split tokens into chunks of 500 (FCM limit)
        $chunks = array_chunk($tokens, 500);
        $successCount = 0;
        $failureCount = 0;

        foreach ($chunks as $chunk) {
            $response = Http::withHeaders([
                'Authorization' => "key={$fcmKey}",
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'registration_ids' => $chunk,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'sound' => 'default',
                ],
                'data' => $data,
                'priority' => 'high',
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $successCount += $result['success'] ?? 0;
                $failureCount += $result['failure'] ?? 0;
            } else {
                $failureCount += count($chunk);
            }
        }

        // Log notification
        DB::table('push_notifications_log')->insert([
            'user_id' => $data['user_id'] ?? null,
            'title' => $title,
            'body' => $body,
            'data' => json_encode($data),
            'tokens_count' => count($tokens),
            'success_count' => $successCount,
            'failure_count' => $failureCount,
            'created_at' => now(),
        ]);

        return [
            'success' => $successCount > 0,
            'sent' => $successCount,
            'failed' => $failureCount,
        ];
    }

    /**
     * Send order notification
     */
    public function notifyOrderUpdate(int $supplierId, int $orderId, string $status, string $orderNumber): void
    {
        $titles = [
            'pending' => 'Nouvelle commande !',
            'preparing' => 'Commande en préparation',
            'ready' => 'Commande prête',
            'shipped' => 'Commande expédiée',
            'delivered' => 'Commande livrée',
            'cancelled' => 'Commande annulée',
        ];

        $title = $titles[$status] ?? 'Mise à jour commande';
        $body = "Commande #{$orderNumber} : " . $this->getStatusLabel($status);

        $this->sendPushNotification(
            $supplierId,
            $title,
            $body,
            [
                'type' => 'order_update',
                'order_id' => $orderId,
                'status' => $status,
            ],
            'supplier'
        );
    }

    /**
     * Get status label in French
     */
    protected function getStatusLabel(string $status): string
    {
        $labels = [
            'pending' => 'En attente',
            'preparing' => 'En préparation',
            'ready' => 'Prête',
            'shipped' => 'Expédiée',
            'delivered' => 'Livrée',
            'cancelled' => 'Annulée',
        ];

        return $labels[$status] ?? $status;
    }

    /**
     * Generate unique token ID
     */
    protected function generateTokenId(): string
    {
        return sprintf(
            '%s-%s-%s',
            date('YmdHis'),
            substr(md5(uniqid()), 0, 8),
            random_int(1000, 9999)
        );
    }

    /**
     * Clean up expired refresh tokens
     */
    public function cleanupExpiredTokens(): int
    {
        return DB::table('mobile_refresh_tokens')
            ->where('expires_at', '<', now())
            ->where('is_revoked', false)
            ->update(['is_revoked' => true, 'revoked_at' => now()]);
    }

    /**
     * Get active sessions for a user
     */
    public function getActiveSessions(int $userId): array
    {
        return DB::table('mobile_refresh_tokens')
            ->where('user_id', $userId)
            ->where('is_revoked', false)
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get()
            ->toArray();
    }
}
