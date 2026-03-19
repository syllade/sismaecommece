<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccountInvitationService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SuppliersController extends Controller
{
    /**
     * Liste fournisseurs.
     * Compatible legacy: sans params, renvoie le tableau brut.
     * Avec page/per_page/status/search, renvoie un payload paginé.
     */
    public function index(Request $request)
    {
        try {
            $status = strtolower((string) $request->get('status', 'all'));
            $search = trim((string) $request->get('search', ''));
            $isPaginatedRequest = $request->has('page') || $request->has('per_page') || $request->has('status') || $request->has('search');

            $query = DB::table('suppliers');

            if ($status === 'active') {
                $query->where('is_active', 1);
            } elseif ($status === 'inactive') {
                $query->where('is_active', 0);
            }

            if ($search !== '') {
                $query->where(function ($subQuery) use ($search) {
                    $like = '%' . $search . '%';
                    $subQuery->where('name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like);
                });
            }

            if (!$isPaginatedRequest) {
                return response()->json($query->orderBy('created_at', 'desc')->get());
            }

            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            $offset = ($page - 1) * $perPage;

            $countQuery = clone $query;
            $total = (int) $countQuery->count();

            $suppliers = $query
                ->orderBy('created_at', 'desc')
                ->skip($offset)
                ->take($perPage)
                ->get();

            $lastPage = (int) max(1, ceil($total / $perPage));

            return response()->json([
                'data' => $suppliers,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage,
                    'has_next' => $page < $lastPage,
                ],
                'filters' => [
                    'status' => $status,
                    'search' => $search,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur index suppliers: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors du chargement'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'logo' => 'sometimes|string',
                'phone' => 'sometimes|string',
                'email' => 'sometimes|email',
                'address' => 'sometimes|string',
                'availability' => 'sometimes|string',
                'is_active' => 'sometimes|boolean',
                'commission_rate' => 'sometimes|numeric|min:0|max:100',
                'invoice_frequency' => 'sometimes|string',
                'create_user' => 'sometimes|boolean',
                'send_invite' => 'sometimes|boolean',
            ]);

            $data = [
                'name' => $request->input('name'),
                'logo' => $request->input('logo'),
                'phone' => $request->input('phone'),
                'email' => $request->input('email'),
                'address' => $request->input('address'),
                'availability' => $request->input('availability'),
                'commission_rate' => $request->has('commission_rate') ? $request->input('commission_rate') : 0,
                'invoice_frequency' => $request->has('invoice_frequency') ? $request->input('invoice_frequency') : 'weekly',
                'is_active' => $request->has('is_active')
                    ? (filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0)
                    : 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $id = DB::table('suppliers')->insertGetId($data);
            $supplier = DB::table('suppliers')->where('id', $id)->first();

            $createUser = !$request->has('create_user') || filter_var($request->input('create_user'), FILTER_VALIDATE_BOOLEAN);
            $invitePayload = null;
            if ($createUser && isset($supplier->email) && $supplier->email) {
                $invitationService = new AccountInvitationService();
                $invitePayload = $invitationService->createOrUpdateInvitedUser(array(
                    'name' => isset($supplier->name) ? $supplier->name : 'Fournisseur',
                    'email' => $supplier->email,
                    'role' => 'supplier',
                    'supplier_id' => (int)$supplier->id,
                    'send_invite' => !$request->has('send_invite') || filter_var($request->input('send_invite'), FILTER_VALIDATE_BOOLEAN),
                ));
            }

            $response = (array) $supplier;
            $response['invite_sent'] = $invitePayload ? (bool)$invitePayload['invite_sent'] : false;
            AuditLogService::record('admin.supplier.create', $request->user(), array(
                'supplier_id' => (int)$supplier->id,
                'supplier_email' => isset($supplier->email) ? $supplier->email : null,
                'invite_sent' => $response['invite_sent'],
            ), 'supplier', (int)$supplier->id);

            return response()->json($response, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : [];
            return response()->json(['message' => 'Erreur de validation', 'errors' => $errors], 422);
        } catch (\Exception $e) {
            Log::error('Erreur store supplier: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la creation'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            if (!$supplier) {
                return response()->json(['message' => 'Fournisseur non trouve'], 404);
            }

            $this->validate($request, [
                'name' => 'sometimes|string|max:255',
                'logo' => 'sometimes|string',
                'phone' => 'sometimes|string',
                'email' => 'sometimes|email',
                'address' => 'sometimes|string',
                'availability' => 'sometimes|string',
                'is_active' => 'sometimes|boolean',
                'commission_rate' => 'sometimes|numeric|min:0|max:100',
                'invoice_frequency' => 'sometimes|string',
            ]);

            $data = ['updated_at' => date('Y-m-d H:i:s')];
            foreach (['name', 'logo', 'phone', 'email', 'address', 'availability', 'commission_rate', 'invoice_frequency'] as $field) {
                if ($request->has($field)) {
                    $data[$field] = $request->input($field);
                }
            }

            if ($request->has('is_active')) {
                $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }

            DB::table('suppliers')->where('id', $id)->update($data);
            $updated = DB::table('suppliers')->where('id', $id)->first();

            // Synchroniser activation du compte fournisseur si user lié.
            if ($request->has('is_active') && isset($updated->email) && $updated->email) {
                DB::table('users')
                    ->where('email', $updated->email)
                    ->where('role', 'supplier')
                    ->update([
                        'is_active' => (int)$data['is_active'],
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
            }

            AuditLogService::record('admin.supplier.update', $request->user(), array(
                'supplier_id' => (int)$id,
                'fields' => array_keys($data),
            ), 'supplier', (int)$id);

            return response()->json($updated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : [];
            return response()->json(['message' => 'Erreur de validation', 'errors' => $errors], 422);
        } catch (\Exception $e) {
            Log::error('Erreur update supplier: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise a jour'], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            if (!$supplier) {
                return response()->json(['message' => 'Fournisseur non trouve'], 404);
            }

            DB::table('suppliers')->where('id', $id)->delete();
            AuditLogService::record('admin.supplier.delete', $request->user(), array(
                'supplier_id' => (int)$id,
            ), 'supplier', (int)$id);
            return response()->json(['message' => 'Fournisseur supprime']);
        } catch (\Exception $e) {
            Log::error('Erreur delete supplier: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }

    public function bulkStatus(Request $request)
    {
        try {
            $this->validate($request, [
                'supplier_ids' => 'required|array|min:1',
                'is_active' => 'required|boolean',
            ]);

            $supplierIds = array_values(array_unique(array_map('intval', (array) $request->input('supplier_ids', []))));
            if (count($supplierIds) === 0) {
                return response()->json(['message' => 'Aucun fournisseur valide fourni'], 422);
            }

            $isActive = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            $updatedCount = DB::table('suppliers')
                ->whereIn('id', $supplierIds)
                ->update([
                    'is_active' => $isActive,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);

            $supplierEmails = DB::table('suppliers')
                ->whereIn('id', $supplierIds)
                ->whereNotNull('email')
                ->pluck('email');
            if (is_object($supplierEmails) && method_exists($supplierEmails, 'toArray')) {
                $supplierEmails = $supplierEmails->toArray();
            } else {
                $supplierEmails = (array)$supplierEmails;
            }
            if (count($supplierEmails) > 0) {
                DB::table('users')
                    ->whereIn('email', $supplierEmails)
                    ->where('role', 'supplier')
                    ->update([
                        'is_active' => $isActive,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
            }

            AuditLogService::record('admin.supplier.bulk_status', $request->user(), array(
                'supplier_ids' => $supplierIds,
                'is_active' => (bool)$isActive,
                'updated_count' => (int)$updatedCount,
            ), 'supplier');

            return response()->json([
                'message' => 'Mise a jour en masse terminee',
                'updated_count' => (int) $updatedCount,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : [];
            return response()->json(['message' => 'Erreur de validation', 'errors' => $errors], 422);
        } catch (\Exception $e) {
            Log::error('Erreur bulkStatus suppliers: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise a jour bulk'], 500);
        }
    }

    /**
     * PUBLIC: Liste des fournisseurs approuvés
     * GET /api/suppliers
     */
    public function publicIndex(Request $request)
    {
        try {
            $suppliers = DB::table('suppliers')
                ->where('is_approved', 1)
                ->where('is_active', 1)
                ->select(['id', 'name', 'slug', 'logo', 'banner', 'description', 'phone', 'email'])
                ->orderBy('name', 'asc')
                ->get();

            // Ajouter le nombre de produits pour chaque fournisseur
            $suppliers = $suppliers->map(function ($supplier) {
                $supplier->totalProducts = DB::table('products')
                    ->where('supplier_id', $supplier->id)
                    ->where('status', 'active')
                    ->count();
                return $supplier;
            });

            return response()->json([
                'success' => true,
                'data' => $suppliers,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur publicIndex suppliers: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors du chargement'], 500);
        }
    }

    /**
     * PUBLIC: Détail d'un fournisseur par slug
     * GET /api/suppliers/{slug}
     */
    public function publicShow($slug)
    {
        try {
            $supplier = DB::table('suppliers')
                ->where('slug', $slug)
                ->where('is_approved', 1)
                ->where('is_active', 1)
                ->first();

            if (!$supplier) {
                return response()->json(['message' => 'Fournisseur non trouvé'], 404);
            }

            // Ajouter le nombre de produits
            $supplier->totalProducts = DB::table('products')
                ->where('supplier_id', $supplier->id)
                ->where('status', 'active')
                ->count();

            // Catégories du fournisseur
            $supplier->categories = DB::table('products')
                ->where('supplier_id', $supplier->id)
                ->where('status', 'active')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->select('categories.id', 'categories.name', 'categories.slug')
                ->distinct()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $supplier,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur publicShow supplier: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors du chargement'], 500);
        }
    }

    /**
     * PUBLIC: Produits d'un fournisseur
     * GET /api/suppliers/{id}/products
     */
    public function publicProducts(Request $request, $id)
    {
        try {
            $categoryId = $request->get('category_id');
            
            $query = DB::table('products')
                ->where('supplier_id', $id)
                ->where('status', 'active');

            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }

            $products = $query
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur publicProducts supplier: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors du chargement'], 500);
        }
    }
}
