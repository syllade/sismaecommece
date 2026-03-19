<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Supplier Settings Controller - Merchant Space
 * Handles supplier-specific settings and profile management
 */
class SupplierSettingsController extends Controller
{
    /**
     * Get supplier profile
     * GET /api/v1/supplier/settings/profile
     */
    public function profile()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

            if (!$supplier) {
                return response()->json(['message' => 'Fournisseur non trouvé'], 404);
            }

            // Get user info
            $user = DB::table('users')->where('id', $supplier->user_id)->first();

            return response()->json([
                'supplier' => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'address' => $supplier->address,
                    'logo' => $supplier->logo,
                    'banner' => $supplier->banner,
                    'description' => $supplier->description,
                    'commission_rate' => (float) $supplier->commission_rate,
                    'is_approved' => (bool) $supplier->is_approved,
                    'is_active' => (bool) $supplier->is_active,
                    'created_at' => $supplier->created_at,
                ],
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@profile error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Update supplier profile
     * PUT /api/v1/supplier/settings/profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'description' => 'nullable|string|max:2000',
                'logo' => 'nullable|string',
                'banner' => 'nullable|string',
            ]);

            $updateData = ['updated_at' => now()];

            if ($request->has('name')) $updateData['name'] = $request->name;
            if ($request->has('phone')) $updateData['phone'] = $request->phone;
            if ($request->has('address')) $updateData['address'] = $request->address;
            if ($request->has('description')) $updateData['description'] = $request->description;
            if ($request->has('logo')) $updateData['logo'] = $request->logo;
            if ($request->has('banner')) $updateData['banner'] = $request->banner;

            DB::table('suppliers')->where('id', $supplierId)->update($updateData);

            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

            return response()->json([
                'message' => 'Profil mis à jour',
                'supplier' => $supplier,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@updateProfile error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get notification settings
     * GET /api/v1/supplier/settings/notifications
     */
    public function notifications()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get supplier notification preferences
            $settings = DB::table('supplier_settings')
                ->where('supplier_id', $supplierId)
                ->where('key', 'like', 'notification_%')
                ->pluck('value', 'key')
                ->toArray();

            $defaults = [
                'notification_new_order' => true,
                'notification_order_cancelled' => true,
                'notification_low_stock' => true,
                'notification_payment_received' => true,
                'notification_marketing' => false,
                'notification_email_enabled' => true,
                'notification_sms_enabled' => false,
                'notification_push_enabled' => true,
            ];

            $settings = array_merge($defaults, $settings);

            return response()->json([
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@notifications error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Update notification settings
     * PUT /api/v1/supplier/settings/notifications
     */
    public function updateNotifications(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $allowedKeys = [
                'notification_new_order',
                'notification_order_cancelled',
                'notification_low_stock',
                'notification_payment_received',
                'notification_marketing',
                'notification_email_enabled',
                'notification_sms_enabled',
                'notification_push_enabled',
            ];

            foreach ($allowedKeys as $key) {
                if ($request->has($key)) {
                    DB::table('supplier_settings')->updateOrInsert(
                        ['supplier_id' => $supplierId, 'key' => $key],
                        ['value' => $request->boolean($key) ? '1' : '0', 'updated_at' => now()]
                    );
                }
            }

            return response()->json([
                'message' => 'Paramètres de notification mis à jour',
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@updateNotifications error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get billing/payment info
     * GET /api/v1/supplier/settings/billing
     */
    public function billing()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

            // Get billing settings
            $settings = DB::table('supplier_settings')
                ->where('supplier_id', $supplierId)
                ->where('key', 'like', 'billing_%')
                ->pluck('value', 'key')
                ->toArray();

            // Get payment history
            $payments = DB::table('supplier_payments')
                ->where('supplier_id', $supplierId)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            return response()->json([
                'balance' => (float) ($supplier->advertising_balance ?? 0),
                'commission_rate' => (float) $supplier->commission_rate,
                'settings' => $settings,
                'recent_payments' => $payments,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@billing error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get delivery settings
     * GET /api/v1/supplier/settings/delivery
     */
    public function delivery()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get supplier delivery settings
            $settings = DB::table('supplier_settings')
                ->where('supplier_id', $supplierId)
                ->where('key', 'like', 'delivery_%')
                ->pluck('value', 'key')
                ->toArray();

            $defaults = [
                'delivery_free_threshold' => 0,
                'delivery_default_fee' => 0,
                'delivery_processing_time' => 24, // hours
                'delivery_self_pickup' => false,
                'delivery_shipping_zones' => [],
            ];

            // Parse JSON fields
            if (isset($settings['delivery_shipping_zones'])) {
                $settings['delivery_shipping_zones'] = json_decode($settings['delivery_shipping_zones'], true) ?? [];
            }

            $settings = array_merge($defaults, $settings);

            return response()->json([
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@delivery error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Update delivery settings
     * PUT /api/v1/supplier/settings/delivery
     */
    public function updateDelivery(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $allowedKeys = [
                'delivery_free_threshold',
                'delivery_default_fee',
                'delivery_processing_time',
                'delivery_self_pickup',
                'delivery_shipping_zones',
            ];

            foreach ($allowedKeys as $key) {
                if ($request->has($key)) {
                    $value = $request->$key;
                    if (is_array($value)) {
                        $value = json_encode($value);
                    }
                    
                    DB::table('supplier_settings')->updateOrInsert(
                        ['supplier_id' => $supplierId, 'key' => $key],
                        ['value' => $value, 'updated_at' => now()]
                    );
                }
            }

            return response()->json([
                'message' => 'Paramètres de livraison mis à jour',
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@updateDelivery error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get API keys
     * GET /api/v1/supplier/settings/api
     */
    public function apiKeys()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get supplier API keys
            $keys = DB::table('supplier_api_keys')
                ->where('supplier_id', $supplierId)
                ->select('id', 'name', 'prefix', 'last_used_at', 'created_at')
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'keys' => $keys,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@apiKeys error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Generate new API key
     * POST /api/v1/supplier/settings/api/generate
     */
    public function generateApiKey(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'name' => 'required|string|max:100',
            ]);

            $key = 'sk_' . bin2hex(random_bytes(32));
            $prefix = substr($key, 0, 12);

            DB::table('supplier_api_keys')->insert([
                'supplier_id' => $supplierId,
                'name' => $request->name,
                'key_hash' => hash('sha256', $key),
                'prefix' => $prefix,
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'Clé API générée',
                'key' => $key,
                'name' => $request->name,
                'prefix' => $prefix,
                'warning' => 'Conservez cette clé en lieu sûr. Elle ne sera plus affichée.',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@generateApiKey error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Delete API key
     * DELETE /api/v1/supplier/settings/api/{id}
     */
    public function deleteApiKey($id)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $deleted = DB::table('supplier_api_keys')
                ->where('id', $id)
                ->where('supplier_id', $supplierId)
                ->delete();

            if (!$deleted) {
                return response()->json(['message' => 'Clé API non trouvée'], 404);
            }

            return response()->json(['message' => 'Clé API supprimée']);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@deleteApiKey error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get all settings
     * GET /api/v1/supplier/settings
     */
    public function index()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get all supplier settings
            $settings = DB::table('supplier_settings')
                ->where('supplier_id', $supplierId)
                ->pluck('value', 'key')
                ->toArray();

            return response()->json([
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSettingsController@index error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get supplier ID from authenticated user
     */
    private function getSupplierId()
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        if (isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        if ($user->role === 'supplier') {
            $supplier = DB::table('suppliers')->where('user_id', $user->id)->first();
            return $supplier ? $supplier->id : null;
        }

        return null;
    }
}
