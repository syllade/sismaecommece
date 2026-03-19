<?php

namespace App\Services;

use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Log;

/**
 * Service de génération et validation des QR codes pour les commandes
 */
class QrCodeService
{
    /**
     * Génère un QR code unique pour une commande
     * 
     * @param int $orderId
     * @param int $supplierId
     * @param int $clientId
     * @return array
     */
    public function generateForOrder(int $orderId, int $supplierId, int $clientId = null): array
    {
        try {
            // Générer un code de sécurité unique
            $securityCode = Str::random(32);
            
            // Créer les données du QR code (JSON encodé)
            $qrData = [
                'order_id' => $orderId,
                'supplier_id' => $supplierId,
                'client_id' => $clientId,
                'security' => $securityCode,
                'timestamp' => time(),
                'checksum' => md5($orderId . $supplierId . $securityCode)
            ];
            
            // Encoder en base64 pour générer le QR code
            $qrDataString = base64_encode(json_encode($qrData));
            
            // Générer le QR code en image base64
            $qrCodeImage = $this->generateQrCodeImage($qrDataString);
            
            return [
                'success' => true,
                'qr_code' => $qrDataString,
                'security_code' => $securityCode,
                'qr_image' => $qrCodeImage,
                'qr_data' => $qrData
            ];
        } catch (\Exception $e) {
            Log::error('QrCodeService generateForOrder error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors de la génération du QR code'
            ];
        }
    }
    
    /**
     * Génère l'image QR code en base64
     * 
     * @param string $data
     * @return string
     */
    private function generateQrCodeImage(string $data): string
    {
        try {
            // Générer le QR code avec SimpleSoftwareIO\QrCode
            $qrCodeSvg = QrCode::format('svg')
                ->size(300)
                ->errorCorrection('H')
                ->generate($data);
            
            // Convertir en base64
            return 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg);
        } catch (\Exception $e) {
            Log::error('QrCodeService generateQrCodeImage error: ' . $e->getMessage());
            return '';
        }
    }
    
    /**
     * Valide un QR code scanné
     * 
     * @param string $qrCodeData
     * @param int $orderId
     * @return array
     */
    public function validateScan(string $qrCodeData, int $orderId): array
    {
        try {
            // Décoder les données QR
            $decoded = json_decode(base64_decode($qrCodeData), true);
            
            if (!$decoded) {
                return [
                    'success' => false,
                    'valid' => false,
                    'message' => 'Format QR code invalide'
                ];
            }
            
            // Vérifier que l'ID de commande correspond
            if (!isset($decoded['order_id']) || $decoded['order_id'] != $orderId) {
                return [
                    'success' => false,
                    'valid' => false,
                    'message' => 'Le QR code ne correspond pas à cette commande'
                ];
            }
            
            // Vérifier le checksum
            $expectedChecksum = md5(
                $decoded['order_id'] . 
                $decoded['supplier_id'] . 
                $decoded['security']
            );
            
            if (!isset($decoded['checksum']) || $decoded['checksum'] !== $expectedChecksum) {
                return [
                    'success' => false,
                    'valid' => false,
                    'message' => 'Code de sécurité invalide'
                ];
            }
            
            return [
                'success' => true,
                'valid' => true,
                'order_id' => $decoded['order_id'],
                'supplier_id' => $decoded['supplier_id'],
                'client_id' => $decoded['client_id'] ?? null,
                'message' => 'QR code valide'
            ];
        } catch (\Exception $e) {
            Log::error('QrCodeService validateScan error: ' . $e->getMessage());
            return [
                'success' => false,
                'valid' => false,
                'message' => 'Erreur lors de la validation du QR code'
            ];
        }
    }
    
    /**
     * Valide le QR code par code de sécurité uniquement
     * 
     * @param string $securityCode
     * @param int $orderId
     * @return array
     */
    public function validateBySecurityCode(string $securityCode, int $orderId): array
    {
        try {
            // Chercher la commande avec ce code de sécurité
            $order = \DB::table('orders')
                ->where('id', $orderId)
                ->where('qr_code_security', $securityCode)
                ->first();
            
            if (!$order) {
                return [
                    'success' => false,
                    'valid' => false,
                    'message' => 'Code de sécurité invalide pour cette commande'
                ];
            }
            
            // Vérifier si déjà utilisé
            if ($order->qr_code_scanned_at) {
                return [
                    'success' => false,
                    'valid' => false,
                    'message' => 'Ce code a déjà été utilisé',
                    'scanned_at' => $order->qr_code_scanned_at
                ];
            }
            
            return [
                'success' => true,
                'valid' => true,
                'order_id' => $order->id,
                'message' => 'Code valide'
            ];
        } catch (\Exception $e) {
            Log::error('QrCodeService validateBySecurityCode error: ' . $e->getMessage());
            return [
                'success' => false,
                'valid' => false,
                'message' => 'Erreur lors de la validation'
            ];
        }
    }
}
