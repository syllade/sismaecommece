<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Supplier Registration Controller V1
 * 
 * Inscription fournisseur complète avec :
 * - Validation stricte anti-doublons
 * - Upload documents
 * - Statut pending_validation
 * - Notification admin automatique
 */
class SupplierRegistrationController extends Controller
{
    /**
     * POST /api/supplier/register
     * 
     * Inscription publique fournisseur
     * Statut par défaut: pending_validation
     */
    public function register(Request $request)
    {
        try {
            // Validation des informations personnelles
            $this->validate($request, [
                // Personal info
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'email' => 'required|email|unique:users,email',
                'phone' => 'required|string|unique:users,phone',
                'password' => 'required|string|min:8|confirmed',
                
                // Company info
                'company_name' => 'required|string|max:255|unique:suppliers,name',
                'company_rccm' => 'nullable|string|max:50|unique:suppliers,rccm',
                'company_nif' => 'nullable|string|max:50',
                'address' => 'required|string|max:500',
                'city' => 'required|string|max:100',
                'country' => 'required|string|max:100',
                'description' => 'nullable|string|max:1000',
                'category_ids' => 'nullable|array|min:1|max:5',
                'category_ids.*' => 'integer|exists:categories,id',
                
                // Documents (optional for initial registration)
                'id_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
                'business_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
                'logo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            ]);

            DB::beginTransaction();

            // Créer le supplier
            $supplierData = [
                'name' => $request->input('company_name'),
                'rccm' => $request->input('company_rccm'),
                'nif' => $request->input('company_nif'),
                'address' => $request->input('address'),
                'city' => $request->input('city'),
                'country' => $request->input('country'),
                'description' => $request->input('description'),
                'phone' => $request->input('phone'),
                'email' => $request->input('email'),
                'status' => 'pending_validation',
                'is_active' => 0,
                'commission_rate' => config('fashop.default_commission_rate', 10),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('suppliers/logos', 'public');
                $supplierData['logo'] = $logoPath;
            }

            // Handle ID document upload
            if ($request->hasFile('id_document')) {
                $idDocPath = $request->file('id_document')->store('suppliers/documents/id', 'public');
                $supplierData['id_document_path'] = $idDocPath;
            }

            // Handle business document upload
            if ($request->hasFile('business_document')) {
                $businessDocPath = $request->file('business_document')->store('suppliers/documents/business', 'public');
                $supplierData['business_document_path'] = $businessDocPath;
            }

            $supplierId = DB::table('suppliers')->insertGetId($supplierData);
            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
            $selectedCategoryIds = $request->input('category_ids', []);
            if (!is_array($selectedCategoryIds)) {
                $selectedCategoryIds = [];
            }
            $selectedCategoryIds = array_values(array_unique(array_map('intval', $selectedCategoryIds)));

            if (!empty($selectedCategoryIds)) {
                // Save to supplier_categories table
                foreach ($selectedCategoryIds as $categoryId) {
                    DB::table('supplier_categories')->insert([
                        'supplier_id' => $supplierId,
                        'category_id' => $categoryId,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
                // Also set primary category (first one)
                DB::table('suppliers')
                    ->where('id', $supplierId)
                    ->update(['primary_category_id' => $selectedCategoryIds[0]]);
            }

            // Créer l'utilisateur associated
            $userData = [
                'name' => $request->input('first_name') . ' ' . $request->input('last_name'),
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'password' => Hash::make($request->input('password')),
                'role' => 'supplier',
                'supplier_id' => $supplierId,
                'is_active' => 0,
                'status' => 'pending_validation',
                'activation_token' => Str::random(64),
                'activation_token_expires_at' => now()->addHours(72),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $userId = DB::table('users')->insertGetId($userData);
            $user = DB::table('users')->where('id', $userId)->first();

            // Créer notification admin
            $this->createAdminNotification($supplier, $user);

            DB::commit();

            // Audit log
            AuditLogService::record('supplier.register', $user, [
                'supplier_id' => $supplierId,
                'company_name' => $supplier->name,
                'email' => $supplier->email,
            ], 'supplier');

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie. Votre compte est en attente de validation par notre équipe.',
                'data' => [
                    'supplier' => [
                        'id' => $supplier->id,
                        'company_name' => $supplier->name,
                        'status' => $supplier->status,
                        'category_ids' => $selectedCategoryIds,
                    ],
                    'user' => [
                        'email' => $user->email,
                    ],
                ],
                'next_steps' => [
                    'Un email de confirmation a été envoyé à votre adresse.',
                    'Notre équipe examinera votre demande sous 24-48h.',
                    'Vous recevrez un email une fois votre compte validé.',
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            $errors = $e->errors();
            
            // Identifier les erreurs de doublons
            $duplicateErrors = [];
            foreach ($errors as $field => $messages) {
                if (strpos($messages[0], 'unique') !== false) {
                    $duplicateErrors[$field] = 'Cette valeur est déjà utilisée. Veuillez utiliser une autre.';
                } else {
                    $duplicateErrors[$field] = $messages;
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $errors,
                'error_type' => 'validation_error',
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Supplier registration error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription. Veuillez réessayer.',
                'error_type' => 'server_error',
            ], 500);
        }
    }

    /**
     * GET /api/supplier/register/status/{token}
     * 
     * Vérifier le statut de la demande
     */
    public function checkStatus(Request $request, $token)
    {
        try {
            $user = DB::table('users')
                ->where('activation_token', $token)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide',
                ], 404);
            }

            $supplier = DB::table('suppliers')
                ->where('id', $user->supplier_id)
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => $supplier->status ?? $user->status,
                    'company_name' => $supplier->name ?? null,
                    'submitted_at' => $supplier->created_at ?? $user->created_at,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Check status error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification',
            ], 500);
        }
    }

    /**
     * POST /api/supplier/resend-activation
     * 
     * Renvoyer l'email d'activation
     */
    public function resendActivation(Request $request)
    {
        try {
            $this->validate($request, [
                'email' => 'required|email',
            ]);

            $email = $request->input('email');
            $user = DB::table('users')
                ->where('email', $email)
                ->where('role', 'supplier')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun compte fournisseur trouvé avec cet email',
                ], 404);
            }

            if ($user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce compte est déjà actif',
                ], 400);
            }

            // Générer nouveau token
            $newToken = Str::random(64);
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'activation_token' => $newToken,
                    'activation_token_expires_at' => now()->addHours(72),
                    'updated_at' => now(),
                ]);

            // Envoyer email (à implémenter avec Mail facade)
            // $this->sendActivationEmail($user, $newToken);

            return response()->json([
                'success' => true,
                'message' => 'Email d\'activation renvoyé',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Créer notification pour admin
     */
    private function createAdminNotification($supplier, $user)
    {
        try {
            $notificationData = [
                'type' => 'supplier_registration',
                'title' => 'Nouvelle inscription fournisseur',
                'message' => "Nouvelle demande d'inscription de {$supplier->name}",
                'data' => json_encode([
                    'supplier_id' => $supplier->id,
                    'company_name' => $supplier->name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'city' => $supplier->city,
                    'submitted_at' => $supplier->created_at,
                ]),
                'is_read' => false,
                'supplier_id' => $supplier->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            DB::table('admin_notifications')->insert($notificationData);
        } catch (\Exception $e) {
            Log::error('Admin notification error: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/supplier/requirements
     * 
     * Retourne les exigences pour inscription
     */
    public function requirements()
    {
        $categories = [];
        try {
            $query = DB::table('categories')->select('id', 'name', 'slug');
            try {
                $query->where('is_active', 1);
            } catch (\Exception $e) {
                // Column may not exist on some instances
            }
            $categories = $query->orderBy('name', 'asc')->get()->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'name' => (string) $row->name,
                    'slug' => isset($row->slug) ? (string) $row->slug : null,
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::warning('Supplier requirements categories fetch failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'required_fields' => [
                    'first_name' => 'Prénom',
                    'last_name' => 'Nom',
                    'email' => 'Email (unique)',
                    'phone' => 'Téléphone (unique)',
                    'password' => 'Mot de passe (min. 8 caractères)',
                    'company_name' => 'Nom de la société (unique)',
                    'address' => 'Adresse',
                    'city' => 'Ville',
                    'country' => 'Pays',
                ],
                'optional_fields' => [
                    'company_rccm' => 'Numéro RCCM',
                    'company_nif' => 'Numéro NIF',
                    'description' => 'Description de la boutique',
                    'logo' => 'Logo (jpg, png - max 2MB)',
                    'id_document' => 'Pièce d\'identité',
                    'business_document' => 'Registre de commerce',
                ],
                'documents_info' => [
                    'id_document' => 'Formats acceptés: JPG, PNG, PDF (max 5MB)',
                    'business_document' => 'Formats acceptés: JPG, PNG, PDF (max 5MB)',
                ],
                'validation_rules' => [
                    'email_unique' => 'Un email ne peut être utilisé que pour un seul compte',
                    'phone_unique' => 'Un téléphone ne peut être utilisé que pour un seul compte',
                    'company_unique' => 'Le nom de société doit être unique',
                ],
                'available_categories' => $categories,
            ],
        ]);
    }
}
