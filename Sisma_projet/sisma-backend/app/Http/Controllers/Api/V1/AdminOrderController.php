<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Admin Order Controller V1
 * 
 * API Version 1 - Gestion des commandes Admin
 * CRUD + assign driver + bulk assign + filtres + groupement
 */
class AdminOrderController extends Controller
{
    /**
     * GET /api/v1/admin/orders
     * 
     * Liste des commandes avec filtres obligatoires
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('orders');

            // Colonnes disponibles
            $columnNames = $this->getColumnNames('orders');
            $hasColumn = fn($name) => in_array($name, $columnNames);

            // ========== FILTRES OBLIGATOIRES ==========
            
            // Filtre par date (range)
            if ($request->has('start_date') && $request->has('end_date') && $hasColumn('created_at')) {
                $query->whereBetween('created_at', [
                    Carbon::parse($request->start_date)->startOfDay(),
                    Carbon::parse($request->end_date)->endOfDay(),
                ]);
            }

            // Filtre par fournisseur
            if ($request->has('supplier_id') && $hasColumn('supplier_id')) {
                $query->where('supplier_id', $request->supplier_id);
            }

            // Filtre par livreur
            if ($request->has('driver_id') && $hasColumn('delivery_person_id')) {
                $query->where('delivery_person_id', $request->driver_id);
            }

            // Filtre par statut
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Filtre par commune
            if ($request->has('commune') && $request->commune) {
                $query->where('commune', $request->commune);
            }

            // Recherche (nom client, téléphone)
            if ($request->has('search') && $request->search) {
                $search = '%' . $request->search . '%';
                $query->where(function ($q) use ($search, $hasColumn) {
                    if ($hasColumn('customer_name')) {
                        $q->orWhere('customer_name', 'like', $search);
                    }
                    if ($hasColumn('customer_phone')) {
                        $q->orWhere('customer_phone', 'like', $search);
                    }
                });
            }

            // ========== TRI ==========
            $sortBy = $request->get('sort_by', 'created_at');
            $allowedSorts = ['created_at', 'updated_at', 'customer_name', 'total', 'status'];
            if (!in_array($sortBy, $allowedSorts) || !$hasColumn($sortBy)) {
                $sortBy = 'created_at';
            }
            $sortOrder = in_array($request->get('sort_order', 'desc'), ['asc', 'desc']) 
                ? $request->sort_order 
                : 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // ========== PAGINATION ==========
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            $offset = ($page - 1) * $perPage;

            $countQuery = clone $query;
            $total = (int) $countQuery->count();

            $orders = $query->offset($offset)->limit($perPage)->get();

            // Enrichir avec items et livreur
            $orderIds = $orders->pluck('id')->toArray();
            $deliveryPersonIds = $orders->whereNotNull('delivery_person_id')->pluck('delivery_person_id')->unique()->toArray();
            
            $itemsByOrder = $this->getOrderItems($orderIds);
            $deliveryPersons = $this->getDeliveryPersons($deliveryPersonIds);
            $suppliers = $this->getSuppliers($orders);

            $enrichedOrders = $orders->map(function ($order) use ($itemsByOrder, $deliveryPersons, $suppliers) {
                $orderArray = (array) $order;
                $orderArray['items'] = $itemsByOrder[$order->id] ?? [];
                $orderArray['items_count'] = count($itemsByOrder[$order->id] ?? []);
                
                if ($order->delivery_person_id && isset($deliveryPersons[$order->delivery_person_id])) {
                    $orderArray['delivery_person'] = $deliveryPersons[$order->delivery_person_id];
                } else {
                    $orderArray['delivery_person'] = null;
                }

                // Normaliser le statut
                if ($order->status === 'delivered') {
                    $orderArray['status'] = 'completed';
                }

                return $orderArray;
            });

            return response()->json([
                'success' => true,
                'data' => $enrichedOrders,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => (int) ceil($total / $perPage),
                ],
                'filters' => $request->only(['status', 'supplier_id', 'driver_id', 'commune', 'start_date', 'end_date', 'search']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => [],
                'meta' => [
                    'page' => 1,
                    'per_page' => 25,
                    'total' => 0,
                    'last_page' => 1,
                ],
            ], 200);
        }
    }

    /**
     * GET /api/v1/admin/orders/{id}
     * 
     * Détails d'une commande
     */
    public function show($id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée',
                ], 404);
            }

            // Items
            $items = DB::table('order_items')
                ->where('order_id', $id)
                ->get();

            // Livreur
            $deliveryPerson = null;
            if ($order->delivery_person_id) {
                $deliveryPerson = DB::table('delivery_persons')
                    ->where('id', $order->delivery_person_id)
                    ->first();
            }

            // Normaliser le statut
            $status = $order->status;
            if ($status === 'delivered') {
                $status = 'completed';
            }

            return response()->json([
                'success' => true,
                'data' => [
                    ...(array) $order,
                    'status' => $status,
                    'items' => $items,
                    'delivery_person' => $deliveryPerson,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/orders/{id}
     * 
     * Modifier une commande
     */
    public function update(Request $request, $id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée',
                ], 404);
            }

            $data = ['updated_at' => now()];
            $fillable = ['customer_name', 'customer_phone', 'customer_location', 'commune', 'quartier', 'notes', 'delivery_date'];
            
            foreach ($fillable as $field) {
                if ($request->has($field)) {
                    $data[$field] = $request->input($field);
                }
            }

            if ($request->has('delivery_fee')) {
                $data['delivery_fee'] = $request->delivery_fee;
            }

            DB::table('orders')->where('id', $id)->update($data);
            $updated = DB::table('orders')->where('id', $id)->first();

            AuditLogService::record('admin.order.update', $request->user(), [
                'order_id' => (int) $id,
                'fields' => array_keys($data),
            ], 'order', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Commande mise à jour',
                'data' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/orders/{id}/status
     * 
     * Modifier le statut de la commande (workflow contrôlé)
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée',
                ], 404);
            }

            $request->validate([
                'status' => 'required|string|in:pending,preparee,expediee,livree,annulee',
            ]);

            $newStatus = $request->status;
            $currentStatus = $order->status;

            // Vérifier la transition
            $allowedTransitions = $this->getAllowedTransitions($currentStatus);
            if (!in_array($newStatus, $allowedTransitions)) {
                return response()->json([
                    'success' => false,
                    'message' => "Transition de '$currentStatus' vers '$newStatus' non autorisée",
                ], 422);
            }

            DB::table('orders')->where('id', $id)->update([
                'status' => $newStatus,
                'updated_at' => now(),
            ]);

            AuditLogService::record('admin.order.update_status', $request->user(), [
                'order_id' => (int) $id,
                'old_status' => $currentStatus,
                'new_status' => $newStatus,
            ], 'order', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Statut mis à jour',
                'data' => [
                    'id' => $id,
                    'status' => $newStatus,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/orders/{id}/assign-driver
     * 
     * Assigner un livreur à une commande
     */
    public function assignDriver(Request $request, $id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée',
                ], 404);
            }

            $request->validate([
                'driver_id' => 'required|integer',
            ]);

            $driver = DB::table('delivery_persons')->where('id', $request->driver_id)->first();
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                ], 404);
            }

            // Mettre à jour la commande
            $newStatus = $order->status === 'pending' ? 'preparee' : $order->status;
            
            DB::table('orders')->where('id', $id)->update([
                'delivery_person_id' => $request->driver_id,
                'status' => $newStatus,
                'updated_at' => now(),
            ]);

            AuditLogService::record('admin.order.assign_driver', $request->user(), [
                'order_id' => (int) $id,
                'driver_id' => (int) $request->driver_id,
            ], 'order', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Livreur assigné',
                'data' => [
                    'id' => $id,
                    'delivery_person_id' => $request->driver_id,
                    'status' => $newStatus,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'assignation',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/orders/assign-driver
     * 
     * Bulk assign driver - assigner un livreur à plusieurs commandes
     */
    public function bulkAssign(Request $request)
    {
        try {
            $request->validate([
                'order_ids' => 'required|array|min:1',
                'driver_id' => 'required|integer',
            ]);

            $orderIds = array_map('intval', $request->order_ids);
            $driverId = $request->driver_id;

            $driver = DB::table('delivery_persons')->where('id', $driverId)->first();
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Livreur non trouvé',
                ], 404);
            }

            // Mettre à jour les commandes
            DB::table('orders')
                ->whereIn('id', $orderIds)
                ->whereNull('delivery_person_id')
                ->update([
                    'delivery_person_id' => $driverId,
                    'status' => 'preparee',
                    'updated_at' => now(),
                ]);

            AuditLogService::record('admin.order.bulk_assign_driver', $request->user(), [
                'order_ids' => $orderIds,
                'driver_id' => $driverId,
                'count' => count($orderIds),
            ]);

            return response()->json([
                'success' => true,
                'message' => count($orderIds) . ' commande(s) assignée(s)',
                'data' => [
                    'affected_count' => count($orderIds),
                    'driver_id' => $driverId,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'assignation groupée',
            ], 500);
        }
    }
    
    /**
     * POST /api/v1/admin/orders/auto-assign
     * 
     * Auto-assigner un livreur disponible aux commandes sans livreur
     */
    public function autoAssign(Request $request)
    {
        try {
            $zone = $request->input('zone');
            $maxOrders = $request->input('max_orders', 5);
            
            // Trouver les commandes sans livreur
            $query = DB::table('orders')
                ->whereNull('delivery_person_id')
                ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready']);
            
            if ($zone) {
                $query->where('commune', $zone);
            }
            
            $orders = $query->orderBy('created_at', 'asc')
                ->limit($maxOrders)
                ->get();
            
            if ($orders->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune commande à assigner'
                ], 404);
            }
            
            // Trouver le livreur le moins occupé
            $driver = DB::table('delivery_persons')
                ->where('is_active', 1)
                ->when($zone, function ($q) use ($zone) {
                    return $q->where('zone', $zone);
                })
                ->selectRaw('*, (SELECT COUNT(*) FROM orders WHERE delivery_person_id = delivery_persons.id AND status NOT IN ("delivered", "cancelled")) as active_orders')
                ->orderBy('active_orders', 'asc')
                ->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun livreur disponible'
                ], 404);
            }
            
            // Assigner les commandes au livreur
            $orderIds = $orders->pluck('id')->toArray();
            DB::table('orders')
                ->whereIn('id', $orderIds)
                ->update([
                    'delivery_person_id' => $driver->id,
                    'status' => 'ready',
                    'updated_at' => now(),
                ]);
            
            AuditLogService::record('admin.order.auto_assign', $request->user(), [
                'order_ids' => $orderIds,
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'assigned_count' => count($orderIds),
            ]);
            
            return response()->json([
                'success' => true,
                'message' => count($orderIds) . ' commande(s) assignée(s) à ' . $driver->name,
                'data' => [
                    'order_ids' => $orderIds,
                    'driver' => [
                        'id' => $driver->id,
                        'name' => $driver->name,
                    ],
                    'assigned_count' => count($orderIds),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'assignation automatique',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/orders/grouped
     * 
     * Groupement des livraisons par commune / heure / tournée
     */
    public function grouped(Request $request)
    {
        try {
            $groupBy = $request->get('group_by', 'commune'); // commune, hour, zone
            $status = $request->get('status', 'pending');

            $orders = DB::table('orders')
                ->where('status', $status)
                ->whereNotNull('delivery_person_id')
                ->get();

            $grouped = [];

            if ($groupBy === 'commune') {
                $grouped = $orders->groupBy(fn($o) => $o->commune ?? 'Inconnue')
                    ->map(fn($items, $key) => [
                        'group' => $key,
                        'count' => $items->count(),
                        'orders' => $items->pluck('id')->toArray(),
                    ])
                    ->values()
                    ->toArray();
            } elseif ($groupBy === 'hour') {
                $grouped = $orders->groupBy(fn($o) => date('H:00', strtotime($o->created_at)))
                    ->map(fn($items, $key) => [
                        'group' => $key,
                        'count' => $items->count(),
                        'orders' => $items->pluck('id')->toArray(),
                    ])
                    ->values()
                    ->toArray();
            }

            return response()->json([
                'success' => true,
                'data' => $grouped,
                'group_by' => $groupBy,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du groupement',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/orders/unprocessed
     * 
     * Détection commandes non traitées depuis plus de X heures
     */
    public function unprocessed(Request $request)
    {
        try {
            $hours = $request->get('hours', 24);
            $threshold = now()->subHours($hours);

            $orders = DB::table('orders')
                ->whereIn('status', ['pending', 'preparee', 'expediee'])
                ->where('created_at', '<', $threshold)
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $orders,
                'meta' => [
                    'hours_threshold' => $hours,
                    'count' => count($orders),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la détection',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/orders/{id}
     * 
     * Supprimer/annuler une commande
     */
    public function destroy(Request $request, $id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée',
                ], 404);
            }

            // Soft delete - changer le statut à annulé
            DB::table('orders')->where('id', $id)->update([
                'status' => 'cancelled',
                'updated_at' => now(),
            ]);

            AuditLogService::record('admin.order.cancel', $request->user(), [
                'order_id' => (int) $id,
            ], 'order', (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Commande annulée',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
            ], 500);
        }
    }

    // ========== HELPERS ==========

    private function getColumnNames(string $table): array
    {
        try {
            $cols = DB::select("SHOW COLUMNS FROM $table");
            return array_column($cols, 'Field');
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getOrderItems(array $orderIds): array
    {
        if (empty($orderIds)) {
            return [];
        }

        $items = DB::table('order_items')
            ->whereIn('order_id', $orderIds)
            ->get();

        return $items->groupBy('order_id')->toArray();
    }

    private function getDeliveryPersons(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        $persons = DB::table('delivery_persons')
            ->whereIn('id', $ids)
            ->get();

        return $persons->keyBy('id')->toArray();
    }

    private function getSuppliers($orders): array
    {
        $supplierIds = $orders->whereNotNull('supplier_id')->pluck('supplier_id')->unique()->toArray();
        if (empty($supplierIds)) {
            return [];
        }

        $suppliers = DB::table('suppliers')
            ->whereIn('id', $supplierIds)
            ->get();

        return $suppliers->keyBy('id')->toArray();
    }

    private function getAllowedTransitions(string $currentStatus): array
    {
        $transitions = [
            'pending' => ['preparee', 'annulee'],
            'preparee' => ['expediee', 'annulee'],
            'expediee' => ['livree', 'annulee'],
            'livree' => [],
            'annulee' => [],
            'cancelled' => [],
            'completed' => [],
        ];

        return $transitions[$currentStatus] ?? [];
    }

    /**
     * Generate WhatsApp URL for supplier
     * POST /api/v1/admin/orders/{id}/whatsapp-supplier
     */
    public function whatsappSupplier(Request $request, $id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }

            // Get supplier
            $supplier = DB::table('suppliers')->where('id', $order->supplier_id)->first();
            
            if (!$supplier || !$supplier->phone) {
                return response()->json([
                    'success' => false,
                    'message' => 'Numéro de téléphone du fournisseur non disponible'
                ], 400);
            }

            // Generate message
            $message = $request->input('message', $this->getDefaultSupplierMessage($order));
            $phone = $this->formatPhoneNumber($supplier->phone);
            $whatsappUrl = "https://wa.me/{$phone}?text=" . urlencode($message);

            return response()->json([
                'success' => true,
                'message' => 'URL WhatsApp générée',
                'data' => [
                    'url' => $whatsappUrl,
                    'phone' => $phone,
                    'message' => $message,
                    'supplier_name' => $supplier->name
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération WhatsApp: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate WhatsApp URL for delivery driver
     * POST /api/v1/admin/orders/{id}/whatsapp-driver
     */
    public function whatsappDriver(Request $request, $id)
    {
        try {
            $order = DB::table('orders')->where('id', $id)->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée'
                ], 404);
            }

            // Get delivery person
            $driver = DB::table('delivery_persons')->where('id', $order->delivery_person_id)->first();
            
            if (!$driver || !$driver->phone) {
                return response()->json([
                    'success' => false,
                    'message' => 'Numéro de téléphone du livreur non disponible'
                ], 400);
            }

            // Generate message
            $message = $request->input('message', $this->getDefaultDriverMessage($order));
            $phone = $this->formatPhoneNumber($driver->phone);
            $whatsappUrl = "https://wa.me/{$phone}?text=" . urlencode($message);

            return response()->json([
                'success' => true,
                'message' => 'URL WhatsApp générée',
                'data' => [
                    'url' => $whatsappUrl,
                    'phone' => $phone,
                    'message' => $message,
                    'driver_name' => $driver->name
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération WhatsApp: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format phone number for WhatsApp
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Add country code if not present (Côte d'Ivoire: 225)
        if (strlen($phone) === 10 && strpos($phone, '0') === 0) {
            $phone = '225' . substr($phone, 1);
        } elseif (strlen($phone) === 9) {
            $phone = '225' . $phone;
        }
        
        return $phone;
    }

    /**
     * Get default WhatsApp message for supplier
     */
    private function getDefaultSupplierMessage($order): string
    {
        $statusMessages = [
            'pending' => 'Nouvelle commande reçue',
            'preparee' => 'Commande en préparation',
            'expediee' => 'Commande expédiée',
            'livree' => 'Commande livrée',
            'annulee' => 'Commande annulée'
        ];

        $status = $statusMessages[$order->status] ?? 'Mise à jour de commande';
        
        return "Bonjour {$order->customer_name},\n\n" .
               "{$status} - Commande #{$order->id}\n" .
               "Total: " . number_format($order->total, 0, ',', ' ') . " FCA\n" .
               "Merci pour votre confiance!";
    }

    /**
     * Get default WhatsApp message for driver
     */
    private function getDefaultDriverMessage($order): string
    {
        return "Bonjour,\n\n" .
               "Nouvelle livraison - Commande #{$order->id}\n" .
               "Client: {$order->customer_name}\n" .
               "Téléphone: {$order->customer_phone}\n" .
               "Adresse: {$order->customer_location}\n" .
               "Total: " . number_format($order->total, 0, ',', ' ') . " FCA\n\n" .
               "Merci!";
    }
}
