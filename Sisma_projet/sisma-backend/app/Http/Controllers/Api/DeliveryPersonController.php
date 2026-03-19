<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPerson;
use App\Services\AccountInvitationService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class DeliveryPersonController extends Controller
{
    /** ADMIN: Liste des livreurs */
    public function index()
    {
        try {
            Log::info('Début récupération livreurs');
            
            // Essayer de récupérer les livreurs
            $deliveryPersons = DB::table('delivery_persons')
                ->orderBy('name', 'asc')
                ->get();
            
            Log::info('Livreurs récupérés: ' . count($deliveryPersons));
            
            // Convertir en tableau pour s'assurer que c'est un tableau JSON
            $result = [];
            if ($deliveryPersons && count($deliveryPersons) > 0) {
                foreach ($deliveryPersons as $person) {
                    $result[] = (array)$person;
                }
            }
            
            Log::info('Retour de ' . count($result) . ' livreurs');
            return response()->json($result);
            
        } catch (\Illuminate\Database\QueryException $e) {
            $errorMsg = $e->getMessage();
            $errorCode = $e->getCode();
            $errorMsgLower = strtolower($errorMsg);
            
            Log::error('QueryException liste livreurs: ' . $errorMsg);
            Log::error('Code erreur: ' . $errorCode);
            Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            
            // Si la table n'existe pas (code 42S02 pour MySQL), retourner un tableau vide
            if ($errorCode == '42S02' || 
                strpos($errorMsgLower, "doesn't exist") !== false || 
                strpos($errorMsgLower, "n'existe pas") !== false ||
                strpos($errorMsgLower, "unknown table") !== false ||
                strpos($errorMsgLower, "base table or view not found") !== false ||
                (strpos($errorMsgLower, "table") !== false && strpos($errorMsgLower, "not found") !== false) ||
                strpos($errorMsgLower, "sqlstate[42s02]") !== false) {
                Log::warning('Table delivery_persons n\'existe pas: ' . $errorMsg);
                return response()->json([]);
            }
            
            return response()->json([
                'message' => 'Erreur base de données',
                'error' => config('app.debug') ? $errorMsg : 'Erreur lors de la récupération des livreurs',
            ], 500);
            
        } catch (\Exception $e) {
            $errorMsg = $e->getMessage();
            $errorMsgLower = strtolower($errorMsg);
            
            Log::error('Exception liste livreurs: ' . $errorMsg);
            Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Type: ' . get_class($e));
            
            // Si la table n'existe pas, retourner un tableau vide
            if (strpos($errorMsgLower, "doesn't exist") !== false || 
                strpos($errorMsgLower, "n'existe pas") !== false ||
                strpos($errorMsgLower, "unknown table") !== false ||
                strpos($errorMsgLower, "base table or view not found") !== false ||
                (strpos($errorMsgLower, "table") !== false && strpos($errorMsgLower, "not found") !== false) ||
                strpos($errorMsgLower, "sqlstate[42s02]") !== false) {
                Log::warning('Table delivery_persons n\'existe pas (Exception): ' . $errorMsg);
                return response()->json([]);
            }
            
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $errorMsg : 'Erreur lors de la récupération des livreurs',
            ], 500);
        }
    }

    /** ADMIN: Créer un livreur */
    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'phone' => 'required|string|max:20|unique:delivery_persons,phone',
                'email' => 'sometimes|email|max:255',
                'vehicle_type' => 'sometimes|string|max:50',
                'is_active' => 'sometimes|boolean',
                'create_user' => 'sometimes|boolean',
                'send_invite' => 'sometimes|boolean',
            ]);

            $data = array(
                'name' => $request->input('name'),
                'phone' => $request->input('phone'),
                'email' => $request->input('email', ''),
                'vehicle_type' => $request->input('vehicle_type', ''),
                'is_active' => filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            );

            $id = DB::table('delivery_persons')->insertGetId($data);
            $deliveryPerson = DB::table('delivery_persons')->where('id', $id)->first();
            $createUser = !$request->has('create_user') || filter_var($request->input('create_user'), FILTER_VALIDATE_BOOLEAN);
            $invitePayload = null;
            if ($createUser && isset($deliveryPerson->email) && $deliveryPerson->email) {
                $invitationService = new AccountInvitationService();
                $invitePayload = $invitationService->createOrUpdateInvitedUser(array(
                    'name' => isset($deliveryPerson->name) ? $deliveryPerson->name : 'Livreur',
                    'email' => $deliveryPerson->email,
                    'role' => 'delivery',
                    'delivery_person_id' => (int)$deliveryPerson->id,
                    'send_invite' => !$request->has('send_invite') || filter_var($request->input('send_invite'), FILTER_VALIDATE_BOOLEAN),
                ));
            }

            AuditLogService::record('admin.delivery_person.create', $request->user(), array(
                'delivery_person_id' => (int)$deliveryPerson->id,
                'invite_sent' => $invitePayload ? (bool)$invitePayload['invite_sent'] : false,
            ), 'delivery_person', (int)$deliveryPerson->id);
            return response()->json([
                'message' => 'Livreur créé avec succès',
                'deliveryPerson' => $deliveryPerson,
                'invite_sent' => $invitePayload ? (bool)$invitePayload['invite_sent'] : false,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'getMessageBag') ? $e->getMessageBag()->toArray() : array('message' => array($e->getMessage()));
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $errors
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur création livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Mettre à jour */
    public function update(Request $request, $id)
    {
        try {
            $this->validate($request, [
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'email' => 'sometimes|email|max:255',
                'vehicle_type' => 'sometimes|string|max:50',
                'is_active' => 'sometimes|boolean',
            ]);

            $data = array('updated_at' => date('Y-m-d H:i:s'));
            if ($request->has('name')) $data['name'] = $request->input('name');
            if ($request->has('phone')) $data['phone'] = $request->input('phone');
            if ($request->has('email')) $data['email'] = $request->input('email');
            if ($request->has('vehicle_type')) $data['vehicle_type'] = $request->input('vehicle_type');
            if ($request->has('is_active')) $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

            DB::table('delivery_persons')->where('id', $id)->update($data);
            $deliveryPerson = DB::table('delivery_persons')->where('id', $id)->first();

            if ($request->has('is_active') && isset($deliveryPerson->email) && $deliveryPerson->email) {
                DB::table('users')
                    ->where('email', $deliveryPerson->email)
                    ->where('role', 'delivery')
                    ->update([
                        'is_active' => (int)$data['is_active'],
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
            }

            AuditLogService::record('admin.delivery_person.update', $request->user(), array(
                'delivery_person_id' => (int)$id,
                'fields' => array_keys($data),
            ), 'delivery_person', (int)$id);
            return response()->json([
                'message' => 'Livreur mis à jour avec succès',
                'deliveryPerson' => $deliveryPerson,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Supprimer */
    public function destroy(Request $request, $id)
    {
        try {
            DB::table('delivery_persons')->where('id', $id)->delete();
            AuditLogService::record('admin.delivery_person.delete', $request->user(), array(
                'delivery_person_id' => (int)$id,
            ), 'delivery_person', (int)$id);
            return response()->json([
                'message' => 'Livreur supprimé avec succès',
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur suppression livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Récupérer les commandes d'un livreur */
    public function getOrders($id)
    {
        try {
            // Vérifier que le livreur existe
            $deliveryPerson = DB::table('delivery_persons')->where('id', $id)->first();
            if (!$deliveryPerson) {
                return response()->json([
                    'message' => 'Livreur introuvable',
                ], 404);
            }

            // Récupérer les commandes assignées à ce livreur
            $orders = DB::table('orders')
                ->where('delivery_person_id', $id)
                ->orderBy('created_at', 'desc')
                ->get();

            // Enrichir avec les items
            $enrichedOrders = [];
            $statsByStatus = [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'delivered' => 0,
                'cancelled' => 0,
            ];
            
            foreach ($orders as $order) {
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                
                $orderArray = (array)$order;
                $orderArray['items'] = $items;
                $orderArray['itemsCount'] = count($items);
                $enrichedOrders[] = $orderArray;
                
                // Compter par statut
                $status = isset($order->status) ? $order->status : 'pending';
                if (isset($statsByStatus[$status])) {
                    $statsByStatus[$status]++;
                } else {
                    $statsByStatus['pending']++;
                }
            }

            return response()->json([
                'deliveryPerson' => $deliveryPerson,
                'orders' => $enrichedOrders,
                'count' => count($enrichedOrders),
                'statsByStatus' => $statsByStatus,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur récupération commandes livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Envoyer la liste des commandes du jour par WhatsApp ou Email */
    public function sendDailyOrders(Request $request, $id)
    {
        try {
            // Vérifier que le livreur existe
            $deliveryPerson = DB::table('delivery_persons')->where('id', $id)->first();
            if (!$deliveryPerson) {
                return response()->json([
                    'message' => 'Livreur introuvable',
                ], 404);
            }

            // Récupérer les commandes du jour assignées à ce livreur (tous statuts)
            $today = date('Y-m-d');
            $orders = DB::table('orders')
                ->where('delivery_person_id', $id)
                ->whereRaw("DATE(created_at) = ?", [$today])
                ->orderBy('created_at', 'asc')
                ->get();

            // Compter par statut
            $statsByStatus = [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'delivered' => 0,
                'cancelled' => 0,
            ];
            
            foreach ($orders as $order) {
                $status = isset($order->status) ? $order->status : 'pending';
                if (isset($statsByStatus[$status])) {
                    $statsByStatus[$status]++;
                } else {
                    $statsByStatus['pending']++;
                }
            }

            // Filtrer seulement les commandes à livrer (pending, processing)
            $ordersToDeliver = [];
            foreach ($orders as $order) {
                if (in_array($order->status, ['pending', 'processing'])) {
                    $ordersToDeliver[] = $order;
                }
            }

            if (count($ordersToDeliver) === 0 && count($orders) === 0) {
                return response()->json([
                    'message' => 'Aucune commande aujourd\'hui',
                    'orders' => [],
                    'statsByStatus' => $statsByStatus,
                ]);
            }

            // Enrichir avec les items (seulement les commandes à livrer)
            $enrichedOrders = [];
            foreach ($ordersToDeliver as $order) {
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                
                $orderArray = (array)$order;
                $orderArray['items'] = $items;
                $orderArray['itemsCount'] = count($items);
                $enrichedOrders[] = $orderArray;
            }

            $sendWhatsApp = $request->input('send_whatsapp', false);
            $sendEmail = $request->input('send_email', false);
            
            $whatsappUrl = null;
            $emailSent = false;

            // Générer le message WhatsApp
            if ($sendWhatsApp && isset($deliveryPerson->phone) && $deliveryPerson->phone) {
                $phone = preg_replace('/[^0-9]/', '', $deliveryPerson->phone);
                if (substr($phone, 0, 1) === '0') {
                    $phone = '225' . substr($phone, 1);
                }

                $message = "Bonjour {$deliveryPerson->name},\n\n";
                $message .= "📋 Résumé de vos livraisons aujourd'hui ({$today}) :\n\n";
                
                // Statistiques par statut
                $totalToday = count($orders);
                $message .= "📊 Statistiques :\n";
                $message .= "• Total : {$totalToday} commande(s)\n";
                if ($statsByStatus['pending'] > 0) {
                    $message .= "• ⏳ En attente : {$statsByStatus['pending']}\n";
                }
                if ($statsByStatus['processing'] > 0) {
                    $message .= "• 🚚 En cours : {$statsByStatus['processing']}\n";
                }
                if ($statsByStatus['completed'] > 0 || $statsByStatus['delivered'] > 0) {
                    $completed = $statsByStatus['completed'] + $statsByStatus['delivered'];
                    $message .= "• ✅ Livrées : {$completed}\n";
                }
                if ($statsByStatus['cancelled'] > 0) {
                    $message .= "• ❌ Annulées : {$statsByStatus['cancelled']}\n";
                }
                
                $message .= "\n";
                
                if (count($enrichedOrders) > 0) {
                    $message .= "📦 Commandes à livrer : " . count($enrichedOrders) . "\n\n";
                    $message .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

                    foreach ($enrichedOrders as $index => $order) {
                        $itemsList = '';
                        if (isset($order['items']) && count($order['items']) > 0) {
                            foreach ($order['items'] as $item) {
                                $productName = isset($item->product_name) ? $item->product_name : 'Produit';
                                $quantity = isset($item->quantity) ? $item->quantity : 1;
                                $variantParts = [];
                                if (isset($item->color) && $item->color) $variantParts[] = $item->color;
                                if (isset($item->size) && $item->size) $variantParts[] = $item->size;
                                $variant = count($variantParts) > 0 ? " (" . implode(" / ", $variantParts) . ")" : "";
                                $itemsList .= "  • {$productName}{$variant} (x{$quantity})\n";
                            }
                        }

                        $message .= "📦 Commande #{$order['id']}\n";
                        $message .= "👤 Client : {$order['customer_name']}\n";
                        $message .= "📞 Téléphone : {$order['customer_phone']}\n";
                        $message .= "📍 Adresse : " . (isset($order['customer_location']) ? $order['customer_location'] : 'Non spécifiée') . "\n";
                        
                        if (isset($order['commune']) && $order['commune']) {
                            $message .= "🏘️ Commune : {$order['commune']}\n";
                        }
                        if (isset($order['quartier']) && $order['quartier']) {
                            $message .= "🏘️ Quartier : {$order['quartier']}\n";
                        }
                        
                        if (isset($order['delivery_date']) && $order['delivery_date']) {
                            $deliveryDate = date('d/m/Y à H:i', strtotime($order['delivery_date']));
                            $message .= "📅 Date de livraison : {$deliveryDate}\n";
                        }
                        
                        $message .= "📋 Produits :\n{$itemsList}";
                        $message .= "💰 Montant : " . number_format($order['total'], 0, ',', ' ') . " FCFA\n";
                        $message .= "💵 Frais de livraison : " . number_format(isset($order['delivery_fee']) ? $order['delivery_fee'] : 0, 0, ',', ' ') . " FCFA\n";
                        
                        if ($index < count($enrichedOrders) - 1) {
                            $message .= "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
                        }
                    }
                }

                $message .= "\n\nMerci de confirmer la réception de ces commandes.\n\n";
                $message .= "Cordialement,\nL'équipe Fashop";

                $encodedMessage = urlencode($message);
                $whatsappUrl = "https://wa.me/{$phone}?text={$encodedMessage}";
            }

            // Envoyer par email (simulation)
            if ($sendEmail && isset($deliveryPerson->email) && $deliveryPerson->email) {
                $emailSent = $this->sendDailyOrdersEmail($deliveryPerson, $enrichedOrders);
            }

            return response()->json([
                'message' => 'Liste des commandes récupérée',
                'deliveryPerson' => $deliveryPerson,
                'orders' => $enrichedOrders,
                'count' => count($enrichedOrders),
                'totalToday' => count($orders),
                'statsByStatus' => $statsByStatus,
                'whatsappUrl' => $whatsappUrl,
                'emailSent' => $emailSent,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi commandes livreur: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
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
     * Envoyer un email avec la liste des commandes et liens de confirmation
     */
    private function sendDailyOrdersEmail($deliveryPerson, $orders)
    {
        try {
            $baseUrl = rtrim(config('app.url'), '/');

            $message = "Bonjour {$deliveryPerson->name},\n\n";
            $message .= "Voici la liste de vos commandes à livrer aujourd'hui :\n\n";

            if (!$orders || count($orders) === 0) {
                $message .= "Aucune commande à livrer.\n\n";
            } else {
                foreach ($orders as $order) {
                    $token = $this->generateDeliveryStatusToken($order['id']);
                    $confirmUrl = $baseUrl . '/api/delivery/confirm/' . $token;

                    $message .= "📦 Commande #{$order['id']}\n";
                    $message .= "👤 Client : {$order['customer_name']}\n";
                    $message .= "📞 Téléphone : {$order['customer_phone']}\n";
                    $message .= "📍 Adresse : " . (isset($order['customer_location']) ? $order['customer_location'] : 'Non spécifiée') . "\n";
                    if (isset($order['delivery_date']) && $order['delivery_date']) {
                        $message .= "📅 Date de livraison : " . date('d/m/Y H:i', strtotime($order['delivery_date'])) . "\n";
                    }
                    $message .= "💰 Montant : " . number_format($order['total'], 0, ',', ' ') . " FCFA\n";
                    $message .= "✅ Marquer comme livrée : {$confirmUrl}\n\n";
                }
            }

            $message .= "Cordialement,\nL'équipe Fashop";

            $fromAddress = config('mail.from.address') ?: env('MAIL_FROM_ADDRESS') ?: 'no-reply@fashop.local';
            $fromName = config('mail.from.name') ?: env('MAIL_FROM_NAME') ?: 'Fashop';

            Mail::raw($message, function ($mail) use ($deliveryPerson, $fromAddress, $fromName) {
                $mail->from($fromAddress, $fromName)
                    ->to($deliveryPerson->email)
                    ->subject("Vos livraisons du jour");
            });

            Log::info('Email envoyé au livreur avec liste des commandes', [
                'delivery_person' => $deliveryPerson->email,
                'orders_count' => count($orders),
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email commandes livreur: ' . $e->getMessage());
            return false;
        }
    }
}
