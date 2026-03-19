<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\DeliveryFee;
use App\Services\QrCodeService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    protected $qrCodeService;

    public function __construct()
    {
        $this->qrCodeService = new QrCodeService();
    }

    /** ADMIN: Liste des commandes */
    public function index(Request $request)
    {
        try {
            // Utiliser DB::table pour plus de compatibilité Laravel 5.2
            $query = DB::table('orders');
            
            // Colonnes disponibles (pour éviter erreurs si schéma ancien)
            $columnNames = array();
            try {
                $cols = DB::select("SHOW COLUMNS FROM orders");
                foreach ($cols as $col) {
                    if (isset($col->Field)) $columnNames[] = $col->Field;
                }
            } catch (\Exception $e) {
                \Log::warning('Erreur lecture colonnes orders: ' . $e->getMessage());
            }
            $hasColumn = function ($name) use ($columnNames) {
                return in_array($name, $columnNames);
            };

            // Filtres
            if ($request->has('status') && $request->status && $hasColumn('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('search') && $request->search) {
                $search = '%' . $request->search . '%';
                // Utiliser where avec une closure pour éviter les problèmes de logique SQL
                $query->where(function($q) use ($search, $hasColumn) {
                    $added = false;
                    if ($hasColumn('customer_name')) { $q->where('customer_name', 'like', $search); $added = true; }
                    if ($hasColumn('customer_phone')) { $added ? $q->orWhere('customer_phone', 'like', $search) : $q->where('customer_phone', 'like', $search); $added = true; }
                    if ($hasColumn('customer_location')) { $added ? $q->orWhere('customer_location', 'like', $search) : $q->where('customer_location', 'like', $search); $added = true; }
                });
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                try {
                    if ($hasColumn('created_at')) {
                        $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
                    } elseif ($hasColumn('date')) {
                        $query->whereBetween('date', [$request->start_date, $request->end_date]);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur filtre date: ' . $e->getMessage());
                }
            }

            // Tri sécurisé
            $sortBy = $request->get('sort_by', 'created_at');
            $allowedSorts = ['created_at', 'customer_name', 'total', 'status'];
            if (!in_array($sortBy, $allowedSorts) || !$hasColumn($sortBy)) {
                if ($hasColumn('created_at')) $sortBy = 'created_at';
                elseif ($hasColumn('date')) $sortBy = 'date';
                else $sortBy = 'id';
            }
            
            $sortOrder = strtolower($request->get('sort_order', 'desc'));
            $sortOrder = in_array($sortOrder, ['asc', 'desc']) ? $sortOrder : 'desc';
            
            try {
                $query->orderBy($sortBy, $sortOrder);
            } catch (\Exception $e) {
                \Log::warning('Erreur orderBy commandes, fallback sur id: ' . $e->getMessage());
                $query->orderBy('id', 'desc');
            }

            // Pagination sécurisée
            $perPage = (int)$request->get('per_page', 20);
            $perPage = max(1, min(100, $perPage)); // Entre 1 et 100
            
            // Récupérer les commandes avec pagination manuelle
            $page = (int)$request->get('page', 1);
            $page = max(1, $page); // Au moins page 1
            $skip = ($page - 1) * $perPage;
            $orders = $query->skip($skip)->take($perPage)->get();

            $compact = (string)$request->get('compact', '') === '1';

            // --- Optimisation : éviter N+1 queries (polling toutes les 5s côté admin)
            // Mode compact : 1 requête orders + 1 requête order_items (groupée) + 1 requête delivery_persons.
            // Mode complet : 1 requête orders + 1 requête order_items + 1 requête products + 1 requête delivery_persons.
            $orderIds = array();
            $deliveryPersonIds = array();
            foreach ($orders as $o) {
                $orderIds[] = $o->id;
                if (isset($o->delivery_person_id) && $o->delivery_person_id) {
                    $deliveryPersonIds[(int)$o->delivery_person_id] = true;
                }
            }

            $itemsByOrderId = array();
            $itemsCountByOrderId = array();
            $productsById = array();

            if (count($orderIds) > 0) {
                if ($compact) {
                    // En compact, on ne renvoie pas le détail des items, uniquement le nombre total d'articles
                    try {
                        $counts = DB::table('order_items')
                            ->select('order_id', DB::raw('SUM(quantity) as qty'))
                            ->whereIn('order_id', $orderIds)
                            ->groupBy('order_id')
                            ->get();
                        foreach ($counts as $c) {
                            $oid = isset($c->order_id) ? (int)$c->order_id : 0;
                            if (!$oid) continue;
                            $itemsCountByOrderId[$oid] = (int)(isset($c->qty) ? $c->qty : 0);
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Erreur récupération itemsCount (batch): ' . $e->getMessage());
                    }
                } else {
                    $productIds = array();
                    try {
                        $orderItems = DB::table('order_items')->whereIn('order_id', $orderIds)->get();
                        foreach ($orderItems as $item) {
                            $oid = isset($item->order_id) ? (int)$item->order_id : 0;
                            if (!$oid) continue;
                            if (!isset($itemsByOrderId[$oid])) $itemsByOrderId[$oid] = array();
                            $itemsByOrderId[$oid][] = $item;
                            if (isset($item->product_id) && $item->product_id) {
                                $productIds[(int)$item->product_id] = true;
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Erreur récupération items (batch): ' . $e->getMessage());
                    }

                    if (count($productIds) > 0) {
                        try {
                            $products = DB::table('products')->whereIn('id', array_keys($productIds))->get();
                            foreach ($products as $p) {
                                $productsById[(int)$p->id] = $p;
                            }
                        } catch (\Exception $e) {
                            \Log::warning('Erreur récupération produits (batch): ' . $e->getMessage());
                        }
                    }
                }
            }

            $deliveryPersonsById = array();
            if (count($deliveryPersonIds) > 0) {
                try {
                    $persons = DB::table('delivery_persons')->whereIn('id', array_keys($deliveryPersonIds))->get();
                    foreach ($persons as $p) {
                        $deliveryPersonsById[(int)$p->id] = $p;
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur récupération livreurs (batch): ' . $e->getMessage());
                }
            }

            // Transformer les données pour correspondre au format attendu par le frontend
            $transformedData = array();
            foreach ($orders as $order) {
                $items = array();
                $itemsCount = 0;

                if ($compact) {
                    $itemsCount = isset($itemsCountByOrderId[$order->id]) ? (int)$itemsCountByOrderId[$order->id] : 0;
                } else {
                    $rawItems = isset($itemsByOrderId[$order->id]) ? $itemsByOrderId[$order->id] : array();
                    foreach ($rawItems as $item) {
                        $pid = isset($item->product_id) ? (int)$item->product_id : 0;
                        $product = $pid && isset($productsById[$pid]) ? $productsById[$pid] : null;
                        $qty = isset($item->quantity) ? (int)$item->quantity : 0;
                        $itemsCount += $qty;
                        $items[] = array(
                            'productId' => $pid,
                            'name' => isset($item->product_name) ? $item->product_name : '',
                            'color' => isset($item->color) ? $item->color : null,
                            'size' => isset($item->size) ? $item->size : null,
                            'quantity' => $qty,
                            'price' => isset($item->price) ? (float)$item->price : 0,
                            'subtotal' => isset($item->price, $item->quantity) ? (float)($item->price * $item->quantity) : 0,
                            'image' => $product ? (isset($product->image) ? $product->image : '') : '',
                            'isAvailable' => $product ? (bool)(isset($product->is_active) ? $product->is_active : false) : false,
                            'stock' => $product ? (int)(isset($product->stock) ? $product->stock : 0) : 0,
                        );
                    }
                }

                // Récupérer le livreur assigné si disponible
                $deliveryPerson = null;
                if (isset($order->delivery_person_id) && $order->delivery_person_id) {
                    $dpid = (int)$order->delivery_person_id;
                    if ($dpid && isset($deliveryPersonsById[$dpid])) {
                        $person = $deliveryPersonsById[$dpid];
                        $deliveryPerson = array(
                            'id' => $person->id,
                            'name' => isset($person->name) ? $person->name : '',
                            'phone' => isset($person->phone) ? $person->phone : '',
                            'email' => isset($person->email) ? $person->email : null,
                            'vehicle_type' => isset($person->vehicle_type) ? $person->vehicle_type : null,
                        );
                    }
                }

                // Normaliser le statut : "delivered" -> "completed" pour le frontend
                $status = isset($order->status) ? $order->status : 'pending';
                if ($status === 'delivered') {
                    $status = 'completed';
                }
                
                $transformedData[] = array(
                    'id' => $order->id,
                    'customerName' => isset($order->customer_name) ? $order->customer_name : '',
                    'customerPhone' => isset($order->customer_phone) ? $order->customer_phone : '',
                    'customerLocation' => isset($order->customer_location) ? $order->customer_location : '',
                    'deliveryType' => isset($order->delivery_type) ? $order->delivery_type : 'immediate',
                    'deliveryDate' => isset($order->delivery_date) && $order->delivery_date ? (string)$order->delivery_date : null,
                    'status' => $status,
                    'amount' => isset($order->total) ? (float)$order->total : 0,
                    'date' => isset($order->created_at) && $order->created_at ? (string)$order->created_at : null,
                    'items' => $items,
                    'itemsCount' => $itemsCount, // Nombre total d'articles
                    'deliveryPerson' => $deliveryPerson, // Livreur assigné
                );
            }

            // Retourner directement le tableau comme attendu par le frontend
            return response()->json($transformedData);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Erreur base de données liste commandes: ' . $e->getMessage());
            \Log::error('SQL: ' . $e->getSql());
            return response()->json([
                'message' => 'Erreur base de données',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur lors de la récupération des commandes',
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Erreur liste commandes: ' . $e->getMessage());
            \Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Détails d'une commande */
    public function show(Order $order)
    {
        try {
            $order->load('items');
            
            // Transformer les items avec les détails des produits
            $items = $this->transformOrderItems($order->items);
            
            // Récupérer le livreur assigné si disponible
            $deliveryPerson = null;
            if (isset($order->delivery_person_id) && $order->delivery_person_id) {
                try {
                    $person = DB::table('delivery_persons')->where('id', $order->delivery_person_id)->first();
                    if ($person) {
                        $deliveryPerson = array(
                            'id' => $person->id,
                            'name' => isset($person->name) ? $person->name : '',
                            'phone' => isset($person->phone) ? $person->phone : '',
                            'email' => isset($person->email) ? $person->email : null,
                            'vehicle_type' => isset($person->vehicle_type) ? $person->vehicle_type : null,
                        );
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur récupération livreur pour commande ' . $order->id . ': ' . $e->getMessage());
                }
            }
            
            // Normaliser le statut : "delivered" -> "completed" pour le frontend
            $status = $order->status;
            if ($status === 'delivered') {
                $status = 'completed';
            }
            
            return response()->json([
                'id' => $order->id,
                'customerName' => $order->customer_name,
                'customerPhone' => $order->customer_phone,
                'customerLocation' => $order->customer_location,
                'deliveryType' => $order->delivery_type,
                'deliveryDate' => $order->delivery_date ? (string)$order->delivery_date : null,
                'status' => $status,
                'amount' => (float)$order->total,
                'subtotal' => (float)$order->subtotal,
                'deliveryFee' => (float)$order->delivery_fee,
                'notes' => $order->notes,
                'date' => $order->created_at ? (string)$order->created_at : null,
                'items' => $items,
                'itemsCount' => count($items),
                'deliveryPerson' => $deliveryPerson, // Livreur assigné
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur détails commande: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }
    
    /**
     * Transformer les items d'une commande avec les détails des produits
     */
    private function transformOrderItems($items)
    {
        if (!$items) {
            return [];
        }
        
        $transformed = [];
        foreach ($items as $item) {
            $product = null;
            if ($item->product_id) {
                try {
                    $product = DB::table('products')->where('id', $item->product_id)->first();
                } catch (\Exception $e) {
                    \Log::warning('Erreur récupération produit: ' . $e->getMessage());
                }
            }
            
            $transformed[] = [
                'productId' => $item->product_id,
                'name' => $item->product_name,
                'color' => isset($item->color) ? $item->color : null,
                'size' => isset($item->size) ? $item->size : null,
                'quantity' => (int)$item->quantity,
                'price' => (float)$item->price,
                'subtotal' => (float)($item->price * $item->quantity),
                'image' => $product ? (isset($product->image) ? $product->image : '') : '',
                'isAvailable' => $product ? (bool)$product->is_active : false,
                'stock' => $product ? (int)(isset($product->stock) ? $product->stock : 0) : 0,
                'slug' => $product ? (isset($product->slug) ? $product->slug : '') : '',
            ];
        }
        
        return $transformed;
    }
    
    /**
     * Envoyer un message WhatsApp au client
     */
    public function sendWhatsAppMessage(Request $request, $orderId)
    {
        try {
            // Récupérer la commande
            $order = DB::table('orders')->where('id', $orderId)->first();
            if (!$order) {
                return response()->json([
                    'message' => 'Commande introuvable',
                ], 404);
            }
            
            // Récupérer les items
            $items = DB::table('order_items')->where('order_id', $orderId)->get();
            
            // Récupérer le livreur si assigné
            $deliveryPerson = null;
            if (isset($order->delivery_person_id) && $order->delivery_person_id) {
                try {
                    $deliveryPerson = DB::table('delivery_persons')->where('id', $order->delivery_person_id)->first();
                } catch (\Exception $e) {
                    \Log::warning('Erreur récupération livreur: ' . $e->getMessage());
                }
            }
            
            $phone = $order->customer_phone;
            
            // Nettoyer le numéro de téléphone
            $phone = preg_replace('/[^0-9]/', '', $phone);
            if (substr($phone, 0, 1) === '0') {
                $phone = '225' . substr($phone, 1);
            }
            
            // Message personnalisé
            $customMessage = $request->input('message');
            if ($customMessage) {
                $message = $customMessage;
            } else {
                // Construire le message selon le statut
                $itemsList = '';
                if ($items && count($items) > 0) {
                    foreach ($items as $item) {
                        $productName = isset($item->product_name) ? $item->product_name : 'Produit';
                        $quantity = isset($item->quantity) ? $item->quantity : 1;
                        $variantParts = [];
                        if (isset($item->color) && $item->color) $variantParts[] = $item->color;
                        if (isset($item->size) && $item->size) $variantParts[] = $item->size;
                        $variant = count($variantParts) > 0 ? " (" . implode(" / ", $variantParts) . ")" : "";
                        $itemsList .= "• {$productName}{$variant} (x{$quantity})\n";
                    }
                }
                
                $status = $order->status;
                $deliveryType = isset($order->delivery_type) ? $order->delivery_type : 'immediate';
                
                // Message de base
                $message = "Bonjour {$order->customer_name},\n\n";
                
                // Adapter le message selon le statut
                switch ($status) {
                    case 'pending':
                        $message .= "📦 Votre commande #{$order->id} a été reçue et est en attente de traitement.\n\n";
                        $message .= "Produits commandés :\n{$itemsList}\n";
                        $message .= "💰 Montant total : " . number_format($order->total, 0, ',', ' ') . " FCFA\n\n";
                        $message .= "Nous vous contacterons bientôt pour confirmer votre commande.\n\n";
                        break;
                        
                    case 'processing':
                        $message .= "🚚 Votre commande #{$order->id} est en cours de préparation.\n\n";
                        $message .= "Produits commandés :\n{$itemsList}\n";
                        $message .= "💰 Montant total : " . number_format($order->total, 0, ',', ' ') . " FCFA\n\n";
                        
                        if ($deliveryPerson) {
                            $message .= "👤 Votre livreur : {$deliveryPerson->name}\n";
                            if (isset($deliveryPerson->phone)) {
                                $message .= "📞 Téléphone : {$deliveryPerson->phone}\n";
                            }
                            $message .= "\n";
                        }
                        
                        if ($deliveryType === 'scheduled' && isset($order->delivery_date)) {
                            $deliveryDate = date('d/m/Y à H:i', strtotime($order->delivery_date));
                            $message .= "📅 Date de livraison prévue : {$deliveryDate}\n\n";
                        } else {
                            $message .= "⏰ Livraison immédiate - Vous serez contacté(e) sous peu.\n\n";
                        }
                        
                        $message .= "📍 Adresse de livraison : " . (isset($order->customer_location) ? $order->customer_location : 'Non spécifiée') . "\n\n";
                        break;
                        
                    case 'completed':
                    case 'delivered':
                        $message .= "✅ Votre commande #{$order->id} a été livrée avec succès !\n\n";
                        $message .= "Produits livrés :\n{$itemsList}\n";
                        $message .= "💰 Montant total : " . number_format($order->total, 0, ',', ' ') . " FCFA\n\n";
                        $message .= "Merci pour votre confiance ! Nous espérons que vous êtes satisfait(e) de votre achat.\n\n";
                        $message .= "💬 N'hésitez pas à nous laisser un avis sur votre expérience.\n\n";
                        break;
                        
                    case 'cancelled':
                        $message .= "❌ Votre commande #{$order->id} a été annulée.\n\n";
                        $message .= "Si vous avez des questions, n'hésitez pas à nous contacter.\n\n";
                        break;
                        
                    default:
                        $message .= "📦 Votre commande #{$order->id} est en cours de traitement.\n\n";
                        $message .= "Produits commandés :\n{$itemsList}\n";
                        $message .= "💰 Montant total : " . number_format($order->total, 0, ',', ' ') . " FCFA\n\n";
                        break;
                }
                
                // Ajouter les informations du livreur si assigné et en cours de traitement
                if ($deliveryPerson && ($status === 'processing' || $status === 'completed' || $status === 'delivered')) {
                    $message .= "🚚 Informations de livraison :\n";
                    $message .= "👤 Livreur : {$deliveryPerson->name}\n";
                    if (isset($deliveryPerson->phone)) {
                        $message .= "📞 Contact : {$deliveryPerson->phone}\n";
                    }
                    if (isset($deliveryPerson->vehicle_type) && $deliveryPerson->vehicle_type) {
                        $message .= "🚗 Véhicule : {$deliveryPerson->vehicle_type}\n";
                    }
                    $message .= "\n";
                }
                
                $message .= "Cordialement,\nL'équipe Fashop";
            }
            
            // Encoder le message pour l'URL
            $encodedMessage = urlencode($message);
            
            // URL WhatsApp
            $whatsappUrl = "https://wa.me/{$phone}?text={$encodedMessage}";
            
            return response()->json([
                'message' => 'URL WhatsApp générée',
                'url' => $whatsappUrl,
                'phone' => $phone,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur génération WhatsApp: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** PUBLIC: Créer une commande */
    public function store(Request $request)
    {
        try {
            \Log::info('Début création commande', ['data' => $request->all()]);
            
            // Normaliser delivery_type (frontend envoie "programmed", backend attend "scheduled")
            $deliveryType = $request->input('delivery_type');
            if ($deliveryType === 'programmed') {
                $deliveryType = 'scheduled';
            }
            
            // Remplacer delivery_type dans la requête pour la validation
            $request->merge(['delivery_type' => $deliveryType]);
            
            // Laravel 5.2 : $this->validate() ne retourne pas les données, il lance une exception si échec
            // Accepter aussi "programmed" pour compatibilité frontend
            $this->validate($request, [
                'customer_name' => 'required|string|max:255',
                'customer_phone' => 'required|string|max:20',
                'customer_location' => 'required|string|max:255',
                'delivery_type' => 'required|in:immediate,scheduled,programmed',
                'delivery_date' => 'sometimes|date|after:now',
                'delivery_fee' => 'required|numeric|min:0',
                'notes' => 'sometimes|string',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.color' => 'nullable|string|max:50',
                'items.*.size' => 'nullable|string|max:50',
            ]);
            
            // Récupérer les données validées après validation
            $validated = $request->only([
                'customer_name', 'customer_phone', 'customer_location', 
                'delivery_type', 'delivery_date', 'delivery_fee', 'notes', 'items',
                'commune', 'quartier'
            ]);

            // Extraire la commune et le quartier de customer_location si fournis séparément
            $commune = isset($validated['commune']) ? $validated['commune'] : null;
            $quartier = isset($validated['quartier']) ? $validated['quartier'] : null;
            
            // Si pas fournis, essayer de les extraire de customer_location
            if (!$commune && isset($validated['customer_location'])) {
                $locationParts = explode(',', $validated['customer_location']);
                if (count($locationParts) >= 2) {
                    // Format: "Abidjan, Commune, Quartier, Repère"
                    if (trim($locationParts[0]) === 'Abidjan' && count($locationParts) >= 2) {
                        $commune = trim($locationParts[1]);
                        if (count($locationParts) >= 3) {
                            $quartier = trim($locationParts[2]);
                        }
                    }
                }
            }

            // Calculer automatiquement les frais de livraison si non fournis
            $deliveryFee = isset($validated['delivery_fee']) ? (float)$validated['delivery_fee'] : 2000;
            
            // Frais par défaut selon la commune
            $defaultFees = array(
                'Abobo' => 2000,
                'Adjamé' => 1500,
                'Attécoubé' => 2000,
                'Cocody' => 2500,
                'Koumassi' => 2000,
                'Marcory' => 2000,
                'Plateau' => 1500,
                'Port-Bouët' => 2500,
                'Treichville' => 1500,
                'Yopougon' => 3000,
            );
            
            if ($commune) {
                // Utiliser les frais par défaut si la table n'existe pas
                if (isset($defaultFees[$commune])) {
                    $deliveryFee = $defaultFees[$commune];
                }
                
                // Essayer de récupérer depuis la table si elle existe
                try {
                    $tableExists = false;
                    try {
                        DB::table('delivery_fees')->first();
                        $tableExists = true;
                    } catch (\Exception $e) {
                        // Table n'existe pas, on utilise déjà les frais par défaut
                    }
                    
                    if ($tableExists) {
                        if ($quartier) {
                            $specific = DB::table('delivery_fees')
                                ->where('commune', $commune)
                                ->where('quartier', $quartier)
                                ->where('is_active', 1)
                                ->first();
                            if ($specific) {
                                $deliveryFee = (float)$specific->fee;
                            }
                        } else {
                            $general = DB::table('delivery_fees')
                                ->where('commune', $commune)
                                ->whereNull('quartier')
                                ->where('is_active', 1)
                                ->first();
                            if ($general) {
                                $deliveryFee = (float)$general->fee;
                            }
                        }
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur calcul frais depuis table: ' . $e->getMessage());
                    // On garde les frais par défaut déjà définis
                }
            }

            DB::beginTransaction();
            try {
                $subtotal = 0;
                $orderItems = [];

                // Vérifier si les colonnes variantes existent (évite erreur si migration non exécutée)
                $hasColorColumn = false;
                $hasSizeColumn = false;
                try {
                    $hasColorColumn = count(DB::select("SHOW COLUMNS FROM order_items LIKE 'color'")) > 0;
                    $hasSizeColumn = count(DB::select("SHOW COLUMNS FROM order_items LIKE 'size'")) > 0;
                } catch (\Exception $e) {
                    \Log::warning('Colonnes color/size non vérifiées: ' . $e->getMessage());
                }

                // Préparer les items et calculer le subtotal
                foreach ($validated['items'] as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    
                    // Calculer le prix final (avec remise si applicable)
                    $price = $product->price;
                    if ($product->discount && $product->discount > 0) {
                        $price = $price * (1 - ($product->discount / 100));
                    }
                    
                    $itemSubtotal = $price * $item['quantity'];
                    $subtotal += $itemSubtotal;

                    $orderItem = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'price' => $price,
                        'quantity' => $item['quantity'],
                        'subtotal' => $itemSubtotal,
                    ];
                    if ($hasColorColumn) {
                        $orderItem['color'] = isset($item['color']) ? $item['color'] : null;
                    }
                    if ($hasSizeColumn) {
                        $orderItem['size'] = isset($item['size']) ? $item['size'] : null;
                    }
                    $orderItems[] = $orderItem;
                }

                // Créer la commande - gérer les colonnes optionnelles
                $orderData = array(
                    'customer_name' => $validated['customer_name'],
                    'customer_phone' => $validated['customer_phone'],
                    'customer_location' => $validated['customer_location'],
                    'delivery_type' => $validated['delivery_type'],
                    'delivery_date' => isset($validated['delivery_date']) ? $validated['delivery_date'] : null,
                    'subtotal' => $subtotal,
                    'delivery_fee' => $deliveryFee,
                    'total' => $subtotal + $deliveryFee,
                    'notes' => isset($validated['notes']) ? $validated['notes'] : null,
                    'status' => 'pending',
                );

                $currentUser = $request->user();
                if ($currentUser && isset($currentUser->id) && isset($currentUser->role) && $currentUser->role === 'client') {
                    try {
                        if (DB::getSchemaBuilder()->hasColumn('orders', 'customer_user_id')) {
                            $orderData['customer_user_id'] = (int)$currentUser->id;
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Impossible de definir customer_user_id: ' . $e->getMessage());
                    }
                }
                try {
                    if (DB::getSchemaBuilder()->hasColumn('orders', 'supplier_status')) {
                        $orderData['supplier_status'] = 'pending';
                    }
                    if (DB::getSchemaBuilder()->hasColumn('orders', 'delivery_status')) {
                        $orderData['delivery_status'] = 'pending';
                    }
                } catch (\Exception $e) {
                    \Log::warning('Colonnes workflow commandes indisponibles: ' . $e->getMessage());
                }
                
                // Ajouter commune et quartier seulement si les colonnes existent
                try {
                    // Vérifier si les colonnes existent en utilisant une requête plus simple
                    $columns = DB::select("SHOW COLUMNS FROM orders");
                    $columnNames = array();
                    foreach ($columns as $col) {
                        $columnNames[] = $col->Field;
                    }
                    
                    if (in_array('commune', $columnNames) && $commune) {
                        $orderData['commune'] = $commune;
                    }
                    if (in_array('quartier', $columnNames) && $quartier) {
                        $orderData['quartier'] = $quartier;
                    }
                } catch (\Exception $e) {
                    // Si la vérification échoue, continuer sans ces colonnes
                    \Log::warning('Colonnes commune/quartier non disponibles: ' . $e->getMessage());
                }
                
                // Utiliser DB::table pour plus de contrôle
                try {
                    $orderId = DB::table('orders')->insertGetId($orderData);
                    $order = Order::find($orderId);
                    if (!$order) {
                        throw new \Exception('Commande créée mais non récupérée');
                    }
                } catch (\Exception $e) {
                    // Si Order::create échoue à cause de colonnes manquantes, utiliser DB directement
                    \Log::warning('Création via Eloquent échouée, utilisation DB direct: ' . $e->getMessage());
                    $orderId = DB::table('orders')->insertGetId($orderData);
                    $order = Order::find($orderId);
                    if (!$order) {
                        throw new \Exception('Impossible de créer ou récupérer la commande');
                    }
                }

                // Créer les items
                $order->items()->createMany($orderItems);

                // Décrémenter le stock des produits
                foreach ($orderItems as $item) {
                    $productId = $item['product_id'];
                    $quantity = $item['quantity'];
                    
                    try {
                        DB::table('products')
                            ->where('id', $productId)
                            ->decrement('stock', $quantity);
                        
                        // Mettre à jour le statut si stock = 0
                        DB::table('products')
                            ->where('id', $productId)
                            ->where('stock', '<=', 0)
                            ->update(['is_active' => 0]);
                    } catch (\Exception $e) {
                        \Log::warning('Erreur décrémentation stock produit ' . $productId . ': ' . $e->getMessage());
                    }
                }

                // Générer le QR code pour la commande
                try {
                    $supplierId = isset($order->supplier_id) ? (int)$order->supplier_id : 0;
                    $clientId = isset($order->customer_user_id) ? (int)$order->customer_user_id : null;
                    
                    $qrResult = $this->qrCodeService->generateForOrder(
                        (int)$order->id,
                        $supplierId,
                        $clientId
                    );
                    
                    if ($qrResult['success']) {
                        DB::table('orders')
                            ->where('id', $order->id)
                            ->update([
                                'qr_code' => $qrResult['qr_code'] ?? null,
                                'qr_code_security' => $qrResult['security_code'] ?? null
                            ]);
                        
                        // Recharger l'ordre avec les données QR
                        $order = Order::find($order->id);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur génération QR code: ' . $e->getMessage());
                }

                DB::commit();

                \Log::info('Commande créée avec succès', ['order_id' => $order->id]);

                return response()->json([
                    'message' => 'Commande créée avec succès',
                    'order' => $order->load('items'),
                ], 201);

            } catch (\Illuminate\Database\QueryException $e) {
                DB::rollBack();
                \Log::error('Erreur base de données création commande: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Erreur base de données',
                    'error' => config('app.debug') ? $e->getMessage() : 'Erreur lors de la création de la commande',
                ], 500);
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Erreur création commande: ' . $e->getMessage());
                \Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
                \Log::error('Stack trace: ' . $e->getTraceAsString());
                
                return response()->json([
                    'message' => 'Erreur lors de la création de la commande',
                    'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
                ], 500);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : ['message' => [$e->getMessage()]];
            \Log::error('Erreur validation commande', ['errors' => $errors]);
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $errors
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur générale création commande: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Mettre à jour le statut */
    public function updateStatus(Request $request, Order $order)
    {
        $this->validate($request, [
            'status' => 'required|in:pending,processing,delivered,completed,cancelled',
        ]);

        // Normaliser "completed" en "delivered" pour la base de données
        $status = $request->input('status');
        $isCompleted = ($status === 'completed');
        if ($isCompleted) {
            $status = 'delivered';
        }

        $order->update(['status' => $status]);

        // Si la commande vient d'être livrée, mettre à jour les factures fournisseurs
        if ($status === 'delivered') {
            try {
                $this->updateSupplierInvoicesForOrder($order);
            } catch (\Exception $e) {
                \Log::error('Erreur mise à jour factures commande: ' . $e->getMessage());
            }
        }

        // Retourner "completed" au frontend même si on stocke "delivered" en base
        $responseStatus = $isCompleted ? 'completed' : $status;

        AuditLogService::record('admin.order.status_update', $request->user(), array(
            'order_id' => (int)$order->id,
            'status' => $responseStatus,
        ), 'order', (int)$order->id);

        return response()->json([
            'message' => 'Statut mis à jour avec succès',
            'order' => array_merge($order->toArray(), ['status' => $responseStatus]),
        ]);
    }

    /**
     * Met à jour / génère automatiquement les factures fournisseurs
     * lorsqu'une commande est marquée comme livrée.
     */
    private function updateSupplierInvoicesForOrder(Order $order)
    {
        try {
            // Ne rien faire si aucune ligne de commande
            $items = DB::table('order_items')->where('order_id', $order->id)->get();
            if (!$items || count($items) === 0) {
                return;
            }

            // Éviter de facturer deux fois la même commande
            $alreadyInvoiced = DB::table('invoice_items')
                ->where('order_id', $order->id)
                ->exists();
            if ($alreadyInvoiced) {
                return;
            }

            // Charger les produits liés aux items
            $productIds = array();
            foreach ($items as $item) {
                if (isset($item->product_id) && $item->product_id) {
                    $productIds[(int)$item->product_id] = true;
                }
            }

            if (count($productIds) === 0) {
                return;
            }

            $productsById = array();
            try {
                $products = DB::table('products')->whereIn('id', array_keys($productIds))->get();
                foreach ($products as $p) {
                    $productsById[(int)$p->id] = $p;
                }
            } catch (\Exception $e) {
                \Log::warning('Erreur récupération produits pour facturation: ' . $e->getMessage());
                return;
            }

            // Calculer le montant par fournisseur (basé sur le subtotal des items)
            $supplierTotals = array(); // supplier_id => total montant produits
            foreach ($items as $item) {
                $pid = isset($item->product_id) ? (int)$item->product_id : 0;
                if (!$pid || !isset($productsById[$pid])) {
                    continue;
                }
                $product = $productsById[$pid];
                $supplierId = isset($product->supplier_id) ? (int)$product->supplier_id : 0;
                if (!$supplierId) {
                    continue;
                }

                $subtotal = isset($item->subtotal) ? (float)$item->subtotal : 0.0;
                if (!isset($supplierTotals[$supplierId])) {
                    $supplierTotals[$supplierId] = 0.0;
                }
                $supplierTotals[$supplierId] += $subtotal;
            }

            if (count($supplierTotals) === 0) {
                return;
            }

            // Charger les fournisseurs concernés pour récupérer leur taux de commission
            $suppliersById = array();
            try {
                $suppliers = DB::table('suppliers')->whereIn('id', array_keys($supplierTotals))->get();
                foreach ($suppliers as $s) {
                    $suppliersById[(int)$s->id] = $s;
                }
            } catch (\Exception $e) {
                \Log::warning('Erreur récupération fournisseurs pour facturation: ' . $e->getMessage());
            }

            $now = date('Y-m-d H:i:s');

            foreach ($supplierTotals as $supplierId => $amount) {
                if (!isset($suppliersById[$supplierId])) {
                    continue;
                }
                $supplier = $suppliersById[$supplierId];

                // Récupérer une facture "ouverte" (pending) existante pour ce fournisseur
                $invoice = DB::table('invoices')
                    ->where('supplier_id', $supplierId)
                    ->where('status', 'pending')
                    ->orderBy('created_at', 'desc')
                    ->first();

                // Créer une nouvelle facture si nécessaire
                if (!$invoice) {
                    $invoiceId = DB::table('invoices')->insertGetId(array(
                        'supplier_id' => $supplierId,
                        'period_start' => $now,
                        'period_end' => null,
                        'total_amount' => 0,
                        'commission_amount' => 0,
                        'status' => 'pending',
                        'file_path' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ));
                    $invoice = DB::table('invoices')->where('id', $invoiceId)->first();
                }

                if (!$invoice) {
                    continue;
                }

                // Créer la ligne de facture pour cette commande / fournisseur
                DB::table('invoice_items')->insert(array(
                    'invoice_id' => $invoice->id,
                    'order_id' => $order->id,
                    'amount' => $amount,
                    'created_at' => $now,
                    'updated_at' => $now,
                ));

                // Recalculer les totaux de la facture
                $totals = DB::table('invoice_items')
                    ->where('invoice_id', $invoice->id)
                    ->select(DB::raw('SUM(amount) as total_amount'))
                    ->first();

                $totalAmount = $totals && isset($totals->total_amount)
                    ? (float)$totals->total_amount
                    : 0.0;

                $commissionRate = isset($supplier->commission_rate)
                    ? (float)$supplier->commission_rate
                    : 0.0;

                $commissionAmount = $commissionRate > 0
                    ? $totalAmount * ($commissionRate / 100.0)
                    : 0.0;

                DB::table('invoices')->where('id', $invoice->id)->update(array(
                    'total_amount' => $totalAmount,
                    'commission_amount' => $commissionAmount,
                    'updated_at' => date('Y-m-d H:i:s'),
                ));
            }
        } catch (\Exception $e) {
            \Log::error('Erreur globale mise à jour factures commande: ' . $e->getMessage());
        }
    }

    /** ADMIN: Attribuer en masse des commandes à un livreur */
    public function bulkAssign(Request $request)
    {
        try {
            $this->validate($request, [
                'order_ids' => 'required|array|min:1',
                'delivery_person_id' => 'required|integer',
            ]);

            $orderIds = array_values(array_unique(array_map('intval', (array) $request->input('order_ids', []))));
            $deliveryPersonId = (int) $request->input('delivery_person_id');

            if (count($orderIds) === 0) {
                return response()->json([
                    'message' => 'Aucun identifiant de commande valide fourni',
                ], 422);
            }

            $deliveryPerson = DB::table('delivery_persons')->where('id', $deliveryPersonId)->first();
            if (!$deliveryPerson) {
                return response()->json([
                    'message' => 'Livreur introuvable',
                ], 404);
            }

            try {
                $columns = DB::select("SHOW COLUMNS FROM orders LIKE 'delivery_person_id'");
                if (count($columns) === 0) {
                    return response()->json([
                        'message' => 'La colonne delivery_person_id est absente dans orders',
                    ], 500);
                }
            } catch (\Exception $e) {
                \Log::warning('Erreur vérification colonne delivery_person_id (bulk): ' . $e->getMessage());
            }

            $existingIdsRaw = DB::table('orders')->whereIn('id', $orderIds)->pluck('id');
            $existingIds = is_object($existingIdsRaw) && method_exists($existingIdsRaw, 'toArray')
                ? $existingIdsRaw->toArray()
                : (array) $existingIdsRaw;
            $existingIds = array_values(array_unique(array_map('intval', $existingIds)));
            $missingIds = array_values(array_diff($orderIds, $existingIds));

            $updatedCount = 0;
            if (count($existingIds) > 0) {
                $updatedCount = DB::table('orders')
                    ->whereIn('id', $existingIds)
                    ->update([
                        'delivery_person_id' => $deliveryPersonId,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
            }

            AuditLogService::record('admin.order.bulk_assign', $request->user(), array(
                'requested_count' => count($orderIds),
                'updated_count' => (int)$updatedCount,
                'missing_ids' => $missingIds,
                'delivery_person_id' => $deliveryPersonId,
            ), 'order');

            return response()->json([
                'message' => 'Attribution en masse terminee',
                'requested_count' => count($orderIds),
                'updated_count' => (int) $updatedCount,
                'missing_ids' => $missingIds,
                'delivery_person_id' => $deliveryPersonId,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : [];
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $errors,
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur attribution bulk livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Attribuer une commande à un livreur */
    public function assignDeliveryPerson(Request $request, $orderId)
    {
        try {
            // Récupérer la commande par ID (compatible Laravel 5.2)
            $order = DB::table('orders')->where('id', $orderId)->first();
            if (!$order) {
                return response()->json([
                    'message' => 'Commande introuvable',
                ], 404);
            }
            
            // Vérifier si la table delivery_persons existe
            try {
                DB::table('delivery_persons')->first();
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Table des livreurs non disponible. Veuillez exécuter les migrations.',
                    'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
                ], 500);
            }
            
            $this->validate($request, [
                'delivery_person_id' => 'required|integer',
            ]);
            
            // Vérifier que le livreur existe
            $deliveryPerson = DB::table('delivery_persons')->where('id', $request->input('delivery_person_id'))->first();
            if (!$deliveryPerson) {
                return response()->json([
                    'message' => 'Livreur introuvable',
                ], 404);
            }

            $deliveryPersonId = (int)$request->input('delivery_person_id');
            
            // Vérifier si la colonne delivery_person_id existe
            try {
                $columns = DB::select("SHOW COLUMNS FROM orders LIKE 'delivery_person_id'");
                if (count($columns) > 0) {
                    // Mettre à jour la commande
                    DB::table('orders')->where('id', $orderId)->update(array(
                        'delivery_person_id' => $deliveryPersonId,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ));
                } else {
                    \Log::warning('Colonne delivery_person_id non disponible dans orders');
                }
            } catch (\Exception $e) {
                \Log::warning('Erreur vérification colonne delivery_person_id: ' . $e->getMessage());
            }
            
            // Envoyer automatiquement par WhatsApp si demandé
            $sendWhatsApp = $request->input('send_whatsapp', false);
            $sendEmail = $request->input('send_email', false);
            
            $whatsappUrl = null;
            $emailSent = false;
            
            if ($sendWhatsApp && isset($deliveryPerson->phone) && $deliveryPerson->phone) {
                // Créer un objet Order temporaire pour la méthode generateDeliveryPersonWhatsApp
                $orderObj = new Order();
                $orderObj->id = $order->id;
                $orderObj->customer_name = $order->customer_name;
                $orderObj->customer_phone = $order->customer_phone;
                $orderObj->customer_location = $order->customer_location;
                $orderObj->total = $order->total;
                $whatsappUrl = $this->generateDeliveryPersonWhatsApp($orderObj, (object)$deliveryPerson);
            }
            
            if ($sendEmail && isset($deliveryPerson->email) && $deliveryPerson->email) {
                // Créer un objet Order temporaire pour la méthode sendDeliveryPersonEmail
                $orderObj = new Order();
                $orderObj->id = $order->id;
                $orderObj->customer_name = $order->customer_name;
                $orderObj->customer_phone = $order->customer_phone;
                $orderObj->customer_location = $order->customer_location;
                $orderObj->total = $order->total;
                $emailSent = $this->sendDeliveryPersonEmail($orderObj, (object)$deliveryPerson);
            }

            AuditLogService::record('admin.order.assign_delivery', $request->user(), array(
                'order_id' => (int)$orderId,
                'delivery_person_id' => $deliveryPersonId,
                'send_whatsapp' => (bool)$sendWhatsApp,
                'send_email' => (bool)$sendEmail,
            ), 'order', (int)$orderId);

            return response()->json([
                'message' => 'Commande attribuée au livreur avec succès',
                'order' => DB::table('orders')->where('id', $orderId)->first(),
                'deliveryPerson' => $deliveryPerson,
                'whatsappUrl' => $whatsappUrl,
                'emailSent' => $emailSent,
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur attribution livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /**
     * Générer un message WhatsApp pour le livreur
     */
    private function generateDeliveryPersonWhatsApp($order, $deliveryPerson)
    {
        $phone = preg_replace('/[^0-9]/', '', $deliveryPerson->phone);
        if (substr($phone, 0, 1) === '0') {
            $phone = '225' . substr($phone, 1);
        }

        // Construire le message pour le livreur
        $itemsList = '';
        if ($order->items) {
            foreach ($order->items as $item) {
                $variantParts = [];
                if (isset($item->color) && $item->color) $variantParts[] = $item->color;
                if (isset($item->size) && $item->size) $variantParts[] = $item->size;
                $variant = count($variantParts) > 0 ? " (" . implode(" / ", $variantParts) . ")" : "";
                $itemsList .= "• {$item->product_name}{$variant} (x{$item->quantity})\n";
            }
        }

        $message = "Bonjour {$deliveryPerson->name},\n\n";
        $message .= "Une nouvelle commande vous a été attribuée :\n\n";
        $message .= "📦 Commande #{$order->id}\n";
        $message .= "👤 Client : {$order->customer_name}\n";
        $message .= "📞 Téléphone : {$order->customer_phone}\n";
        $message .= "📍 Adresse : {$order->customer_location}\n";
        if ($order->commune) {
            $message .= "🏘️ Commune : {$order->commune}\n";
        }
        if ($order->delivery_date) {
            $message .= "📅 Date de livraison : " . date('d/m/Y H:i', strtotime($order->delivery_date)) . "\n";
        }
        $message .= "\n📋 Produits à livrer :\n{$itemsList}\n";
        $message .= "💰 Montant total : " . number_format($order->total, 0, ',', ' ') . " FCFA\n";
        $message .= "💵 Frais de livraison : " . number_format($order->delivery_fee, 0, ',', ' ') . " FCFA\n\n";
        $message .= "Merci de confirmer la réception de cette commande.\n\n";
        $message .= "Cordialement,\nL'équipe Fashop";

        $encodedMessage = urlencode($message);
        return "https://wa.me/{$phone}?text={$encodedMessage}";
    }

    /**
     * Envoyer un email au livreur (simulation - à implémenter avec un service d'email)
     */
    private function sendDeliveryPersonEmail($order, $deliveryPerson)
    {
        if (!isset($deliveryPerson->email) || !$deliveryPerson->email) {
            return false;
        }

        $token = $this->generateDeliveryStatusToken($order->id);
        $confirmUrl = rtrim(config('app.url'), '/') . '/api/delivery/confirm/' . $token;

        $message = "Bonjour {$deliveryPerson->name},\n\n";
        $message .= "Une commande vous a été attribuée :\n\n";
        $message .= "📦 Commande #{$order->id}\n";
        $message .= "👤 Client : {$order->customer_name}\n";
        $message .= "📞 Téléphone : {$order->customer_phone}\n";
        $message .= "📍 Adresse : {$order->customer_location}\n";
        if ($order->delivery_date) {
            $message .= "📅 Date de livraison : " . date('d/m/Y H:i', strtotime($order->delivery_date)) . "\n";
        }
        $message .= "💰 Montant total : " . number_format($order->total, 0, ',', ' ') . " FCFA\n\n";
        $message .= "✅ Pour marquer cette commande comme livrée, cliquez ici :\n{$confirmUrl}\n\n";
        $message .= "Cordialement,\nL'équipe Fashop";

        try {
            $fromAddress = config('mail.from.address') ?: env('MAIL_FROM_ADDRESS') ?: 'no-reply@fashop.local';
            $fromName = config('mail.from.name') ?: env('MAIL_FROM_NAME') ?: 'Fashop';

            Mail::raw($message, function ($mail) use ($deliveryPerson, $order, $fromAddress, $fromName) {
                $mail->from($fromAddress, $fromName)
                    ->to($deliveryPerson->email)
                    ->subject("Livraison - Commande #{$order->id}");
            });

            \Log::info('Email envoyé au livreur', [
                'delivery_person' => $deliveryPerson->email,
                'order_id' => $order->id,
            ]);
            return true;
        } catch (\Exception $e) {
            \Log::error('Erreur envoi email livreur: ' . $e->getMessage());
            return false;
        }
    }

    /** ADMIN: Regroupement des commandes (par fournisseur ou livreur) */
    public function grouped(Request $request)
    {
        try {
            $by = $request->get('by', 'supplier');
            $date = $request->get('date', null);

            // Colonnes disponibles
            $columnNames = array();
            try {
                $cols = DB::select("SHOW COLUMNS FROM orders");
                foreach ($cols as $col) {
                    if (isset($col->Field)) $columnNames[] = $col->Field;
                }
            } catch (\Exception $e) {
                \Log::warning('Erreur lecture colonnes orders (grouped): ' . $e->getMessage());
            }
            $hasDeliveryDate = in_array('delivery_date', $columnNames);
            $hasCreatedAt = in_array('created_at', $columnNames);

            $ordersQuery = DB::table('orders');
            if ($date && ($hasDeliveryDate || $hasCreatedAt)) {
                $start = $date . ' 00:00:00';
                $end = $date . ' 23:59:59';
                if ($hasDeliveryDate) {
                    $ordersQuery->where(function ($q) use ($start, $end) {
                        $q->whereBetween('delivery_date', array($start, $end))
                          ->orWhereNull('delivery_date');
                    });
                } else {
                    $ordersQuery->whereBetween('created_at', array($start, $end));
                }
            }

            $orders = $ordersQuery->get();
            if (!$orders || count($orders) === 0) {
                return response()->json(array('groups' => array()));
            }

            $orderIds = array();
            foreach ($orders as $o) $orderIds[] = $o->id;

            $itemsByOrderId = array();
            $productIds = array();
            try {
                $orderItems = DB::table('order_items')->whereIn('order_id', $orderIds)->get();
                foreach ($orderItems as $item) {
                    $oid = isset($item->order_id) ? (int)$item->order_id : 0;
                    if (!$oid) continue;
                    if (!isset($itemsByOrderId[$oid])) $itemsByOrderId[$oid] = array();
                    $itemsByOrderId[$oid][] = $item;
                    if (isset($item->product_id) && $item->product_id) {
                        $productIds[(int)$item->product_id] = true;
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Erreur récupération items (grouped): ' . $e->getMessage());
            }

            $productsById = array();
            $supplierIds = array();
            if (count($productIds) > 0) {
                try {
                    $products = DB::table('products')->whereIn('id', array_keys($productIds))->get();
                    foreach ($products as $p) {
                        $productsById[(int)$p->id] = $p;
                        if (isset($p->supplier_id) && $p->supplier_id) {
                            $supplierIds[(int)$p->supplier_id] = true;
                        }
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur récupération produits (grouped): ' . $e->getMessage());
                }
            }

            $suppliersById = array();
            if (count($supplierIds) > 0) {
                try {
                    $suppliers = DB::table('suppliers')->whereIn('id', array_keys($supplierIds))->get();
                    foreach ($suppliers as $s) {
                        $suppliersById[(int)$s->id] = $s;
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur récupération fournisseurs (grouped): ' . $e->getMessage());
                }
            }

            $deliveryPersonsById = array();
            if ($by === 'delivery') {
                try {
                    $deliveryPersons = DB::table('delivery_persons')->get();
                    foreach ($deliveryPersons as $p) {
                        $deliveryPersonsById[(int)$p->id] = $p;
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erreur récupération livreurs (grouped): ' . $e->getMessage());
                }
            }

            $groups = array();
            if ($by === 'delivery') {
                foreach ($orders as $order) {
                    $dpid = isset($order->delivery_person_id) && $order->delivery_person_id ? (int)$order->delivery_person_id : 0;
                    $key = $dpid ? (string)$dpid : 'none';
                    $name = $dpid && isset($deliveryPersonsById[$dpid]) ? $deliveryPersonsById[$dpid]->name : 'Non assigné';
                    if (!isset($groups[$key])) {
                        $groups[$key] = array(
                            'name' => $name,
                            'orders' => array(),
                            'items' => array(),
                            'supplierVisits' => array(),
                        );
                    }
                    $oid = (int)$order->id;
                    $rawItems = isset($itemsByOrderId[$oid]) ? $itemsByOrderId[$oid] : array();
                    $items = array();
                    $itemsCount = 0;
                    foreach ($rawItems as $item) {
                        $qty = isset($item->quantity) ? (int)$item->quantity : 0;
                        $itemsCount += $qty;
                        $items[] = array(
                            'productId' => isset($item->product_id) ? (int)$item->product_id : 0,
                            'name' => isset($item->product_name) ? $item->product_name : '',
                            'color' => isset($item->color) ? $item->color : null,
                            'size' => isset($item->size) ? $item->size : null,
                            'quantity' => $qty,
                            'price' => isset($item->price) ? (float)$item->price : 0,
                        );
                    }
                    $groups[$key]['orders'][] = array(
                        'id' => $order->id,
                        'customerName' => isset($order->customer_name) ? $order->customer_name : '',
                        'customerPhone' => isset($order->customer_phone) ? $order->customer_phone : '',
                        'customerLocation' => isset($order->customer_location) ? $order->customer_location : '',
                        'deliveryType' => isset($order->delivery_type) ? $order->delivery_type : 'immediate',
                        'deliveryDate' => isset($order->delivery_date) && $order->delivery_date ? (string)$order->delivery_date : null,
                        'status' => isset($order->status) ? $order->status : 'pending',
                        'amount' => isset($order->total) ? (float)$order->total : 0,
                        'notes' => isset($order->notes) ? $order->notes : null,
                        'items' => $items,
                        'itemsCount' => $itemsCount,
                    );
                }
            } else {
                foreach ($orders as $order) {
                    $oid = (int)$order->id;
                    $rawItems = isset($itemsByOrderId[$oid]) ? $itemsByOrderId[$oid] : array();
                    foreach ($rawItems as $item) {
                        $pid = isset($item->product_id) ? (int)$item->product_id : 0;
                        $product = $pid && isset($productsById[$pid]) ? $productsById[$pid] : null;
                        $supplierId = $product && isset($product->supplier_id) ? (int)$product->supplier_id : 0;
                        $supplier = $supplierId && isset($suppliersById[$supplierId]) ? $suppliersById[$supplierId] : null;
                        $supplierName = $supplier ? $supplier->name : (isset($item->supplier_name) ? $item->supplier_name : 'Non renseigné');
                        $key = $supplierId ? ('id_' . $supplierId) : ('name_' . $supplierName);
                        if (!isset($groups[$key])) {
                            $groups[$key] = array(
                                'name' => $supplierName,
                                'orders' => array(),
                                'items' => array(),
                                'supplier' => $supplier ? array(
                                    'id' => $supplier->id,
                                    'name' => $supplier->name,
                                    'phone' => isset($supplier->phone) ? $supplier->phone : null,
                                    'address' => isset($supplier->address) ? $supplier->address : null,
                                ) : null,
                                '_orderIds' => array(),
                            );
                        }
                        if (!isset($groups[$key]['_orderIds'][$oid])) {
                            $groups[$key]['_orderIds'][$oid] = true;
                            $groups[$key]['orders'][] = array(
                                'id' => $order->id,
                                'customerName' => isset($order->customer_name) ? $order->customer_name : '',
                                'customerPhone' => isset($order->customer_phone) ? $order->customer_phone : '',
                                'customerLocation' => isset($order->customer_location) ? $order->customer_location : '',
                                'deliveryType' => isset($order->delivery_type) ? $order->delivery_type : 'immediate',
                                'deliveryDate' => isset($order->delivery_date) && $order->delivery_date ? (string)$order->delivery_date : null,
                                'status' => isset($order->status) ? $order->status : 'pending',
                                'amount' => isset($order->total) ? (float)$order->total : 0,
                                'notes' => isset($order->notes) ? $order->notes : null,
                            );
                        }
                        $groups[$key]['items'][] = array(
                            'productId' => $pid,
                            'name' => isset($item->product_name) ? $item->product_name : '',
                            'color' => isset($item->color) ? $item->color : null,
                            'size' => isset($item->size) ? $item->size : null,
                            'quantity' => isset($item->quantity) ? (int)$item->quantity : 0,
                            'price' => isset($item->price) ? (float)$item->price : 0,
                        );
                    }
                }
            }

            $groupsOut = array();
            foreach ($groups as $g) {
                if (isset($g['_orderIds'])) unset($g['_orderIds']);
                $groupsOut[] = $g;
            }

            return response()->json(array('groups' => $groupsOut));
        } catch (\Exception $e) {
            \Log::error('Erreur regroupement commandes: ' . $e->getMessage());
            return response()->json(array('groups' => array()));
        }
    }

    /**
     * Générer un token de confirmation livraison
     */
    private function generateDeliveryStatusToken($orderId)
    {
        $token = Str::random(48);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+3 days'));

        DB::table('orders')->where('id', $orderId)->update([
            'delivery_status_token' => $token,
            'delivery_status_token_expires_at' => $expiresAt,
            'delivery_status_token_used_at' => null,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $token;
    }

    /**
     * PUBLIC: Confirmer la livraison via lien email
     */
    public function confirmDeliveryFromEmail($token)
    {
        try {
            $order = DB::table('orders')
                ->where('delivery_status_token', $token)
                ->first();

            if (!$order) {
                return response($this->renderDeliveryConfirmPage(
                    'Lien invalide',
                    'Ce lien de confirmation est invalide.'
                ), 404)->header('Content-Type', 'text/html');
            }

            if ($order->delivery_status_token_used_at) {
                return response($this->renderDeliveryConfirmPage(
                    'Déjà confirmé',
                    'Cette livraison a déjà été confirmée.'
                ), 200)->header('Content-Type', 'text/html');
            }

            if ($order->delivery_status_token_expires_at &&
                strtotime($order->delivery_status_token_expires_at) < time()) {
                return response($this->renderDeliveryConfirmPage(
                    'Lien expiré',
                    'Ce lien de confirmation a expiré.'
                ), 410)->header('Content-Type', 'text/html');
            }

            DB::table('orders')->where('id', $order->id)->update([
                'status' => 'delivered',
                'delivery_status_token_used_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return response($this->renderDeliveryConfirmPage(
                'Livraison confirmée',
                "La commande #{$order->id} a été marquée comme livrée."
            ), 200)->header('Content-Type', 'text/html');
        } catch (\Exception $e) {
            \Log::error('Erreur confirmation livraison: ' . $e->getMessage());
            return response($this->renderDeliveryConfirmPage(
                'Erreur',
                "Une erreur est survenue lors de la confirmation."
            ), 500)->header('Content-Type', 'text/html');
        }
    }

    /**
     * Rendu simple de page de confirmation
     */
    private function renderDeliveryConfirmPage($title, $message)
    {
        $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

        return "<!doctype html>
<html lang=\"fr\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>{$safeTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; color: #111827; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class=\"card\">
    <h1>{$safeTitle}</h1>
    <p>{$safeMessage}</p>
  </div>
</body>
</html>";
    }

    /** ADMIN: Envoyer les détails de la commande au livreur */
    public function sendToDeliveryPerson(Request $request, Order $order)
    {
        try {
            if (!$order->delivery_person_id) {
                return response()->json([
                    'message' => 'Aucun livreur assigné à cette commande',
                ], 400);
            }

            $deliveryPerson = DB::table('delivery_persons')->where('id', $order->delivery_person_id)->first();
            
            if (!$deliveryPerson) {
                return response()->json([
                    'message' => 'Livreur introuvable',
                ], 404);
            }

            $method = $request->input('method', 'whatsapp'); // 'whatsapp' ou 'email'

            if ($method === 'whatsapp') {
                $whatsappUrl = $this->generateDeliveryPersonWhatsApp($order, $deliveryPerson);
                return response()->json([
                    'message' => 'URL WhatsApp générée',
                    'url' => $whatsappUrl,
                    'phone' => $deliveryPerson->phone,
                ]);
            } elseif ($method === 'email') {
                $emailSent = $this->sendDeliveryPersonEmail($order, $deliveryPerson);
                return response()->json([
                    'message' => 'Email envoyé au livreur',
                    'email' => $deliveryPerson->email,
                    'sent' => $emailSent,
                ]);
            }

            return response()->json([
                'message' => 'Méthode invalide',
            ], 400);
        } catch (\Exception $e) {
            \Log::error('Erreur envoi livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Supprimer */
    public function destroy(Order $order)
    {
        $order->delete();

        return response()->json([
            'message' => 'Commande supprimée avec succès',
        ]);
    }

    /**
     * PUBLIC: Rechercher des commandes par téléphone (pour clients non connectés)
     * GET /api/orders/guest?phone=225XXXXXXXX
     */
    public function guestOrders(Request $request)
    {
        $phone = $request->query('phone');
        
        if (!$phone || strlen($phone) < 8) {
            return response()->json([
                'success' => false,
                'message' => 'Numéro de téléphone requis (minimum 8 chiffres)',
            ], 400);
        }

        // Nettoyer le numéro de téléphone
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        try {
            // Rechercher les commandes par téléphone
            $orders = DB::table('orders')
                ->where(function ($query) use ($phone) {
                    $query->where('customer_phone', 'like', '%' . $phone)
                          ->orWhere('customer_phone', 'like', '%0' . substr($phone, -9));
                })
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            // Formatter les résultats
            $results = $orders->map(function ($order) {
                // Récupérer les items de la commande
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_name' => $item->product_name ?? $item->name ?? 'Produit',
                            'quantity' => $item->quantity ?? 1,
                            'price' => $item->price ?? 0,
                        ];
                    });

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number ?? 'CMD-' . $order->id,
                    'status' => $order->status ?? 'pending',
                    'total' => $order->total ?? $order->grand_total ?? 0,
                    'created_at' => $order->created_at,
                    'customer_name' => $order->customer_name ?? '',
                    'customer_phone' => $order->customer_phone ?? '',
                    'items' => $items,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $results,
                'message' => $results->isEmpty() ? 'Aucune commande trouvée pour ce numéro' : null,
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur recherche commandes invité: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche des commandes',
            ], 500);
        }
    }
}

