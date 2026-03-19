<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use PragmaRX\Google2FA\Google2FA;

/**
 * Zero-Trust Security Service
 * 
 * Features:
 * - Two-Factor Authentication (2FA)
 * - Device Fingerprinting
 * - Suspicious Login Detection
 * - IP Whitelist Management
 */
class ZeroTrustSecurityService
{
    protected $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Enable 2FA for a supplier
     */
    public function enable2FA(int $supplierId): array
    {
        $secret = $this->google2fa->generateSecretKey();
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            "supplier_{$supplierId}@fashop.com",
            $secret
        );

        // Store temporarily - will confirm on next login
        Cache::put("2fa_setup_{$supplierId}", $secret, now()->addMinutes(10));

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'message' => 'Scan QR code with your authenticator app',
        ];
    }

    /**
     * Confirm 2FA setup
     */
    public function confirm2FA(int $supplierId, string $code): bool
    {
        $secret = Cache::get("2fa_setup_{$supplierId}");
        
        if (!$secret) {
            return false;
        }

        $valid = $this->google2fa->verifyKey($secret, $code);

        if ($valid) {
            // Store the secret permanently
            DB::table('suppliers')
                ->where('id', $supplierId)
                ->update([
                    'two_factor_secret' => encrypt($secret),
                    'two_factor_enabled' => true,
                    'two_factor_confirmed_at' => now(),
                ]);

            Cache::forget("2fa_setup_{$supplierId}");
            
            // Log security event
            $this->logSecurityEvent($supplierId, '2fa_enabled', [
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        return $valid;
    }

    /**
     * Disable 2FA
     */
    public function disable2FA(int $supplierId, string $code): bool
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

        if (!$supplier || !$supplier->two_factor_enabled) {
            return false;
        }

        $secret = decrypt($supplier->two_factor_secret);
        
        if (!$this->google2fa->verifyKey($secret, $code)) {
            return false;
        }

        DB::table('suppliers')
            ->where('id', $supplierId)
            ->update([
                'two_factor_secret' => null,
                'two_factor_enabled' => false,
                'two_factor_disabled_at' => now(),
            ]);

        $this->logSecurityEvent($supplierId, '2fa_disabled', [
            'timestamp' => now()->toIso8601String(),
        ]);

        return true;
    }

    /**
     * Verify 2FA code during login
     */
    public function verify2FA(int $supplierId, string $code): bool
    {
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

        if (!$supplier || !$supplier->two_factor_enabled) {
            return true; // No 2FA required
        }

        try {
            $secret = decrypt($supplier->two_factor_secret);
            return $this->google2fa->verifyKey($secret, $code);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Generate device fingerprint
     */
    public function generateDeviceFingerprint(): string
    {
        $data = [
            'user_agent' => request()->userAgent(),
            'ip' => request()->ip(),
            'accept_language' => request()->header('Accept-Language'),
            'platform' => $this->getPlatform(),
            'browser' => $this->getBrowser(),
            'screen_resolution' => request()->header('Screen-Resolution'),
            'timezone' => request()->header('Timezone'),
        ];

        return hash('sha256', json_encode($data));
    }

    /**
     * Register a trusted device
     */
    public function registerTrustedDevice(int $supplierId, string $fingerprint, string $deviceName = null): void
    {
        $trustedDevices = DB::table('supplier_trusted_devices')
            ->where('supplier_id', $supplierId)
            ->where('fingerprint', $fingerprint)
            ->first();

        if (!$trustedDevices) {
            DB::table('supplier_trusted_devices')->insert([
                'supplier_id' => $supplierId,
                'fingerprint' => $fingerprint,
                'device_name' => $deviceName ?? $this->getDeviceDescription(),
                'ip_address' => request()->ip(),
                'last_used_at' => now(),
                'created_at' => now(),
            ]);

            $this->logSecurityEvent($supplierId, 'device_trusted', [
                'fingerprint' => $fingerprint,
                'device_name' => $deviceName,
            ]);
        } else {
            DB::table('supplier_trusted_devices')
                ->where('id', $trustedDevices->id)
                ->update(['last_used_at' => now()]);
        }
    }

    /**
     * Check if device is trusted
     */
    public function isDeviceTrusted(int $supplierId, string $fingerprint): bool
    {
        return DB::table('supplier_trusted_devices')
            ->where('supplier_id', $supplierId)
            ->where('fingerprint', $fingerprint)
            ->where('is_revoked', false)
            ->exists();
    }

    /**
     * Revoke trusted device
     */
    public function revokeDevice(int $supplierId, int $deviceId): bool
    {
        $result = DB::table('supplier_trusted_devices')
            ->where('id', $deviceId)
            ->where('supplier_id', $supplierId)
            ->update(['is_revoked' => true, 'revoked_at' => now()]);

        if ($result) {
            $this->logSecurityEvent($supplierId, 'device_revoked', [
                'device_id' => $deviceId,
            ]);
        }

        return $result > 0;
    }

    /**
     * Get trusted devices
     */
    public function getTrustedDevices(int $supplierId): array
    {
        return DB::table('supplier_trusted_devices')
            ->where('supplier_id', $supplierId)
            ->where('is_revoked', false)
            ->orderByDesc('last_used_at')
            ->get()
            ->toArray();
    }

    /**
     * Check IP whitelist
     */
    public function isIpAllowed(int $supplierId, string $ip = null): bool
    {
        $ip = $ip ?? request()->ip();

        // Get supplier's IP whitelist
        $whitelist = DB::table('supplier_ip_whitelist')
            ->where('supplier_id', $supplierId)
            ->where('is_active', true)
            ->pluck('ip_address')
            ->toArray();

        if (empty($whitelist)) {
            return true; // No whitelist = allow all
        }

        // Check if IP matches any whitelist entry
        foreach ($whitelist as $allowedIp) {
            if ($this->ipMatches($ip, $allowedIp)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Add IP to whitelist
     */
    public function addToWhitelist(int $supplierId, string $ip, string $description = null): void
    {
        DB::table('supplier_ip_whitelist')->updateOrInsert(
            ['supplier_id' => $supplierId, 'ip_address' => $ip],
            [
                'description' => $description,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $this->logSecurityEvent($supplierId, 'ip_whitelisted', [
            'ip' => $ip,
        ]);
    }

    /**
     * Remove IP from whitelist
     */
    public function removeFromWhitelist(int $supplierId, string $ip): void
    {
        DB::table('supplier_ip_whitelist')
            ->where('supplier_id', $supplierId)
            ->where('ip_address', $ip)
            ->update(['is_active' => false]);

        $this->logSecurityEvent($supplierId, 'ip_removed', [
            'ip' => $ip,
        ]);
    }

    /**
     * Detect suspicious login
     */
    public function detectSuspiciousLogin(int $supplierId, string $fingerprint): array
    {
        $lastLogin = DB::table('supplier_login_logs')
            ->where('supplier_id', $supplierId)
            ->orderByDesc('created_at')
            ->first();

        $suspicious = false;
        $reasons = [];

        // Check IP change
        if ($lastLogin && $lastLogin->ip_address !== request()->ip()) {
            // Check if new IP is from different country (simplified)
            if (!$this->isIpAllowed($supplierId, request()->ip())) {
                $suspicious = true;
                $reasons[] = 'New IP address not in whitelist';
            }
        }

        // Check device change
        if ($lastLogin && $lastLogin->device_fingerprint !== $fingerprint) {
            if (!$this->isDeviceTrusted($supplierId, $fingerprint)) {
                $suspicious = true;
                $reasons[] = 'Untrusted device';
            }
        }

        // Check multiple failed attempts
        $failedAttempts = DB::table('supplier_login_logs')
            ->where('supplier_id', $supplierId)
            ->where('created_at', '>=', now()->subMinutes(15))
            ->where('is_successful', false)
            ->count();

        if ($failedAttempts >= 5) {
            $suspicious = true;
            $reasons[] = 'Multiple failed login attempts';
        }

        // Check impossible travel (simplified)
        if ($lastLogin && $lastLogin->created_at > now()->subMinutes(30)) {
            $suspicious = true;
            $reasons[] = 'Impossible travel detected';
        }

        return [
            'suspicious' => $suspicious,
            'reasons' => $reasons,
            'requires_verification' => $suspicious || !$this->isDeviceTrusted($supplierId, $fingerprint),
        ];
    }

    /**
     * Log security event
     */
    protected function logSecurityEvent(int $supplierId, string $event, array $data = []): void
    {
        DB::table('supplier_security_events')->insert([
            'supplier_id' => $supplierId,
            'event' => $event,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'data' => json_encode($data),
            'created_at' => now(),
        ]);
    }

    /**
     * IP pattern matching (supports CIDR)
     */
    protected function ipMatches(string $ip, string $pattern): bool
    {
        if ($pattern === $ip) {
            return true;
        }

        if (strpos($pattern, '/') !== false) {
            return $this->ipInCidr($ip, $pattern);
        }

        return false;
    }

    /**
     * Check if IP is in CIDR range
     */
    protected function ipInCidr(string $ip, string $cidr): bool
    {
        [$subnet, $bits] = explode('/', $cidr);
        
        $ip = ip2long($ip);
        $subnet = ip2long($subnet);
        $mask = -1 << (32 - $bits);
        
        return ($ip & $mask) == ($subnet & $mask);
    }

    /**
     * Get device description
     */
    protected function getDeviceDescription(): string
    {
        return sprintf(
            '%s - %s',
            $this->getPlatform(),
            $this->getBrowser()
        );
    }

    /**
     * Get platform
     */
    protected function getPlatform(): string
    {
        $userAgent = request()->userAgent();
        
        if (stripos($userAgent, 'Windows') !== false) return 'Windows';
        if (stripos($userAgent, 'Mac') !== false) return 'macOS';
        if (stripos($userAgent, 'Linux') !== false) return 'Linux';
        if (stripos($userAgent, 'Android') !== false) return 'Android';
        if (stripos($userAgent, 'iOS') !== false || stripos($userAgent, 'iPhone') !== false) return 'iOS';
        
        return 'Unknown';
    }

    /**
     * Get browser
     */
    protected function getBrowser(): string
    {
        $userAgent = request()->userAgent();
        
        if (stripos($userAgent, 'Chrome') !== false) return 'Chrome';
        if (stripos($userAgent, 'Firefox') !== false) return 'Firefox';
        if (stripos($userAgent, 'Safari') !== false) return 'Safari';
        if (stripos($userAgent, 'Edge') !== false) return 'Edge';
        
        return 'Unknown';
    }
}
