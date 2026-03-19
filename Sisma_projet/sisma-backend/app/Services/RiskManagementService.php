<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Risk Management Service
 * 
 * Gère :
 * - Système disciplinaire client
 * - Bannissement irréversible
 * - Suspension automatique
 * - Détection fraude
 */
class RiskManagementService
{
    // Thresholds configuration
    const CANCELLATION_WARNING_THRESHOLD = 3;
    const CANCELLATION_RED_ZONE_THRESHOLD = 5;
    
    const RETURN_RATE_WARNING = 15; // %
    const RETURN_RATE_RED_ZONE = 25; // %
    
    const COMPLAINT_WARNING_THRESHOLD = 3;
    const COMPLAINT_RED_ZONE_THRESHOLD = 5;
    
    const SUPPLIER_UNPROCESSED_ORDERS_THRESHOLD = 20;
    const DELIVERY_FAILED_THRESHOLD = 5;
    const DELIVERY_LATE_THRESHOLD = 10;

    /**
     * Mettre à jour le risque client lors d'une annulation
     */
    public function handleClientCancellation(int $userId): void
    {
        try {
            $user = DB::table('users')->where('id', $userId)->first();
            if (!$user || $user->role !== 'client') {
                return;
            }

            // Incrémenter le compteur
            $cancellationCount = ($user->cancellation_count ?? 0) + 1;
            
            // Déterminer le nouveau niveau de risque
            $newRiskLevel = $this->calculateClientRiskLevel($cancellationCount);

            // Mettre à jour l'utilisateur
            DB::table('users')
                ->where('id', $userId)
                ->update([
                    'cancellation_count' => $cancellationCount,
                    'risk_level' => $newRiskLevel,
                    'last_cancellation_at' => now(),
                    'risk_score' => $this->calculateRiskScore($userId, 'client'),
                    'updated_at' => now(),
                ]);

            // Créer notification admin si passage en zone rouge
            if ($newRiskLevel === 'red_zone') {
                $this->createAdminAlert($userId, 'client_red_zone', 'Client en zone rouge', 
                    "Le client {$user->email} a atteint {$cancellationCount} annulations.");
            }

            Log::info("RiskManagement: Client {$userId} cancellation handled", [
                'count' => $cancellationCount,
                'new_level' => $newRiskLevel,
            ]);

        } catch (\Exception $e) {
            Log::error("RiskManagement: Error handling cancellation: " . $e->getMessage());
        }
    }

    /**
     * Calculer le niveau de risque client
     */
    public function calculateClientRiskLevel(int $cancellationCount): string
    {
        if ($cancellationCount >= self::CANCELLATION_RED_ZONE_THRESHOLD) {
            return 'red_zone';
        } elseif ($cancellationCount >= self::CANCELLATION_WARNING_THRESHOLD) {
            return 'warning';
        }
        return 'normal';
    }

    /**
     * Calculer le score de risque global
     */
    public function calculateRiskScore(int $userId, string $role): int
    {
        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return 0;
        }

        $score = 0;

        // Pondérations
        $cancellationWeight = 10;
        $complaintWeight = 15;
        $returnWeight = 5;

        if ($role === 'client') {
            $score += ($user->cancellation_count ?? 0) * $cancellationWeight;
        }

        if ($role === 'supplier') {
            $score += ($user->complaint_count ?? 0) * $complaintWeight;
            $score += ($user->return_rate ?? 0) * $returnWeight;
        }

        return min(100, $score); // Max 100
    }

    /**
     * Bannir définitivement un utilisateur
     */
    public function banPermanently(int $userId, int $adminId, string $reason): bool
    {
        try {
            DB::transaction(function () use ($userId, $adminId, $reason) {
                // Mettre à jour l'utilisateur
                DB::table('users')
                    ->where('id', $userId)
                    ->update([
                        'suspended_permanently' => true,
                        'is_active' => false,
                        'banned_at' => now(),
                        'banned_by' => $adminId,
                        'ban_reason' => $reason,
                        'risk_level' => 'red_zone',
                        'updated_at' => now(),
                    ]);

                // Ajouter à la blacklist
                $user = DB::table('users')->where('id', $userId)->first();
                if ($user) {
                    $this->addToBlacklist($user->email, 'email', $adminId, 'Compte banni définitivement');
                    if ($user->phone) {
                        $this->addToBlacklist($user->phone, 'phone', $adminId, 'Compte banni définitivement');
                    }
                    if ($user->device_hash) {
                        $this->addToBlacklist($user->device_hash, 'device_hash', $adminId, 'Compte banni définitivement');
                    }
                }

                // Désactiver les produits si fournisseur
                if ($user->role === 'supplier') {
                    DB::table('products')
                        ->where('supplier_id', $user->supplier_id)
                        ->update([
                            'status' => 'inactive',
                            'updated_at' => now(),
                        ]);
                }

                // Loguer l'action
                AuditLogService::record('risk.ban.permanent', null, [
                    'user_id' => $userId,
                    'banned_by' => $adminId,
                    'reason' => $reason,
                ], 'security');
            });

            return true;

        } catch (\Exception $e) {
            Log::error("RiskManagement: Error banning user: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Vérifier si un utilisateur est banni
     */
    public function isBanned(int $userId): bool
    {
        $user = DB::table('users')->where('id', $userId)->first();
        return $user && $user->suspended_permanently === true;
    }

    /**
     * Vérifier si un identifiant est blacklisté
     */
    public function isBlacklisted(string $type, string $value): bool
    {
        return DB::table('blacklisted_identifiers')
            ->where('type', $type)
            ->where('value', $value)
            ->exists();
    }

    /**
     * Ajouter à la blacklist
     */
    public function addToBlacklist(string $value, string $type, int $by, string $reason): void
    {
        try {
            DB::table('blacklisted_identifiers')->updateOrInsert(
                ['type' => $type, 'value' => $value],
                [
                    'reason' => $reason,
                    'blacklisted_by' => $by,
                    'blacklisted_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        } catch (\Exception $e) {
            Log::error("RiskManagement: Error adding to blacklist: " . $e->getMessage());
        }
    }

    /**
     * Suspension automatique fournisseur
     */
    public function checkAndSuspendSupplier(int $supplierId): bool
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
            if (!$supplier || $supplier->suspended_permanently) {
                return false;
            }

            // Compter les commandes non traitées
            $unprocessedOrders = DB::table('orders')
                ->where('supplier_id', $supplierId)
                ->whereIn('status', ['pending', 'processing'])
                ->where('created_at', '>=', now()->subHours(24))
                ->count();

            // Calculer le taux de retour
            $returnRate = $supplier->return_rate ?? 0;

            // Vérifier les seuils
            $shouldSuspend = false;
            $reason = '';

            if ($unprocessedOrders >= self::SUPPLIER_UNPROCESSED_ORDERS_THRESHOLD) {
                $shouldSuspend = true;
                $reason = "Trop de commandes non traitées ({$unprocessedOrders} en 24h)";
            }

            if ($returnRate >= self::RETURN_RATE_RED_ZONE) {
                $shouldSuspend = true;
                $reason = "Taux de retour trop élevé ({$returnRate}%)";
            }

            if ($shouldSuspend) {
                DB::table('suppliers')
                    ->where('id', $supplierId)
                    ->update([
                        'is_active' => false,
                        'status' => 'suspended',
                        'suspended_at' => now(),
                        'risk_level' => 'red_zone',
                        'updated_at' => now(),
                    ]);

                // Notification admin
                $this->createAdminAlert($supplierId, 'supplier_auto_suspended', 'Fournisseur suspendu automatiquement', $reason);

                Log::warning("RiskManagement: Supplier {$supplierId} auto-suspended", [
                    'reason' => $reason,
                    'unprocessed_orders' => $unprocessedOrders,
                    'return_rate' => $returnRate,
                ]);

                return true;
            }

            return false;

        } catch (\Exception $e) {
            Log::error("RiskManagement: Error checking supplier suspension: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Suspension automatique livreur
     */
    public function checkAndSuspendDeliveryPerson(int $deliveryPersonId): bool
    {
        try {
            $deliveryPerson = DB::table('delivery_persons')->where('id', $deliveryPersonId)->first();
            if (!$deliveryPerson || $deliveryPerson->suspended_permanently) {
                return false;
            }

            // Compter les livraisons échouées
            $failedDeliveries = DB::table('orders')
                ->where('delivery_person_id', $deliveryPersonId)
                ->where('status', 'failed')
                ->where('updated_at', '>=', now()->subHours(24))
                ->count();

            // Compter les retards
            $lateDeliveries = DB::table('orders')
                ->where('delivery_person_id', $deliveryPersonId)
                ->where('status', 'delivered')
                ->whereRaw('TIMESTAMPDIFF(HOUR, scheduled_delivery_at, delivered_at) > 2')
                ->where('delivered_at', '>=', now()->subHours(24))
                ->count();

            $shouldSuspend = false;
            $reason = '';

            if ($failedDeliveries >= self::DELIVERY_FAILED_THRESHOLD) {
                $shouldSuspend = true;
                $reason = "Trop de livraisons échouées ({$failedDeliveries} en 24h)";
            }

            if ($lateDeliveries >= self::DELIVERY_LATE_THRESHOLD) {
                $shouldSuspend = true;
                $reason = "Trop de retards ({$lateDeliveries} en 24h)";
            }

            if ($shouldSuspend) {
                DB::table('delivery_persons')
                    ->where('id', $deliveryPersonId)
                    ->update([
                        'is_active' => false,
                        'risk_level' => 'red_zone',
                        'suspended_permanently' => false, // Suspension temporaire
                        'updated_at' => now(),
                    ]);

                $this->createAdminAlert($deliveryPersonId, 'delivery_auto_suspended', 'Livreur suspendu automatiquement', $reason);

                return true;
            }

            return false;

        } catch (\Exception $e) {
            Log::error("RiskManagement: Error checking delivery suspension: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Créer une alerte admin
     */
    private function createAdminAlert(int $entityId, string $type, string $title, string $message): void
    {
        try {
            DB::table('admin_notifications')->insert([
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'priority' => 'high',
                'data' => json_encode(['entity_id' => $entityId]),
                'read' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error("RiskManagement: Error creating admin alert: " . $e->getMessage());
        }
    }

    /**
     * Enregistrer un événement de sécurité
     */
    public function logSecurityEvent(int $userId, string $eventType, string $description, array $metadata = []): void
    {
        try {
            $request = request();
            
            DB::table('security_events')->insert([
                'user_id' => $userId,
                'event_type' => $eventType,
                'description' => $description,
                'metadata' => json_encode($metadata),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'resolved' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error("RiskManagement: Error logging security event: " . $e->getMessage());
        }
    }

    /**
     * Obtenir les clients à risque
     */
    public function getAtRiskClients(int $perPage = 25)
    {
        return DB::table('users')
            ->where('role', 'client')
            ->whereIn('risk_level', ['warning', 'red_zone'])
            ->orderBy('risk_score', 'desc')
            ->paginate($perPage);
    }

    /**
     * Obtenir les fournisseurs à risque
     */
    public function getAtRiskSuppliers(int $perPage = 25)
    {
        return DB::table('suppliers')
            ->whereIn('risk_level', ['warning', 'red_zone'])
            ->orderBy('return_rate', 'desc')
            ->paginate($perPage);
    }
}
