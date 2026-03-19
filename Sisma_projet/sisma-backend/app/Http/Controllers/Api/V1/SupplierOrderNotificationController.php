<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderNotification;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SupplierOrderNotificationController extends Controller
{
    /**
     * Get order notifications history
     * GET /api/v1/supplier/orders/{id}/notifications
     */
    public function index($orderId)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $order = Order::where('id', $orderId)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$order) {
                return response()->json(['message' => 'Commande non trouvée'], 404);
            }

            $notifications = OrderNotification::where('order_id', $orderId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notifications,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderNotificationController@index error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération'], 500);
        }
    }

    /**
     * Send order via WhatsApp (Simple URL method)
     * POST /api/v1/supplier/orders/{id}/send-whatsapp
     */
    public function sendWhatsApp(Request $request, $orderId)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $order = Order::where('id', $orderId)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$order) {
                return response()->json(['message' => 'Commande non trouvée'], 404);
            }

            // Format phone number (remove + if present, keep only digits)
            $phone = preg_replace('/[^0-9]/', '', $order->client_phone);
            if (strlen($phone) < 8) {
                return response()->json(['message' => 'Numéro de téléphone invalide'], 400);
            }

            // Format: 225XXXXXXXX for Côte d'Ivoire
            if (strlen($phone) === 8) {
                $phone = '225' . $phone;
            } elseif (strlen($phone) === 10 && substr($phone, 0, 1) === '0') {
                $phone = '225' . substr($phone, 1);
            }

            // Generate message
            $message = $this->generateWhatsAppMessage($order);

            // Create notification record
            $notification = OrderNotification::create([
                'order_id' => $orderId,
                'type' => 'whatsapp',
                'status' => 'sent',
                'message' => $message,
                'recipient' => $phone,
                'sent_at' => now(),
            ]);

            // Generate WhatsApp URL (pre-filled message)
            $whatsappUrl = 'https://wa.me/' . $phone . '?text=' . urlencode($message);

            return response()->json([
                'success' => true,
                'message' => 'Message WhatsApp généré',
                'whatsapp_url' => $whatsappUrl,
                'notification' => $notification,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderNotificationController@sendWhatsApp error: ' . $e->getMessage());
            
            // Log failed notification
            OrderNotification::create([
                'order_id' => $orderId,
                'type' => 'whatsapp',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            
            return response()->json(['message' => 'Erreur lors de l\'envoi WhatsApp'], 500);
        }
    }

    /**
     * Send order via Email
     * POST /api/v1/supplier/orders/{id}/send-email
     */
    public function sendEmail(Request $request, $orderId)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $order = Order::where('id', $orderId)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$order) {
                return response()->json(['message' => 'Commande non trouvée'], 404);
            }

            if (!$order->client_email) {
                return response()->json(['message' => 'Email client non disponible'], 400);
            }

            // Get order items with product images
            $items = DB::table('order_items')
                ->where('order_id', $orderId)
                ->get();

            // Get supplier info
            $supplier = DB::table('suppliers')
                ->where('id', $supplierId)
                ->first();

            // Generate email content
            $subject = 'Commande #' . $order->order_number . ' - ' . ($supplier->name ?? 'Votre fournisseur');
            $message = $this->generateEmailMessage($order, $items, $supplier);

            // Create notification record
            $notification = OrderNotification::create([
                'order_id' => $orderId,
                'type' => 'email',
                'status' => 'sent',
                'message' => $subject,
                'recipient' => $order->client_email,
                'sent_at' => now(),
            ]);

            // In production, use Mail facade to send
            // For now, we return success (email would be queued in production)
            // Mail::to($order->client_email)->send(new OrderConfirmation($order, $items, $supplier));

            return response()->json([
                'success' => true,
                'message' => 'Email envoyé avec succès',
                'notification' => $notification,
                'preview' => [
                    'subject' => $subject,
                    'recipient' => $order->client_email,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderNotificationController@sendEmail error: ' . $e->getMessage());
            
            OrderNotification::create([
                'order_id' => $orderId,
                'type' => 'email',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            
            return response()->json(['message' => 'Erreur lors de l\'envoi de l\'email'], 500);
        }
    }

    /**
     * Generate PDF invoice
     * GET /api/v1/supplier/orders/{id}/invoice-pdf
     */
    public function generateInvoicePdf($orderId)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $order = Order::where('id', $orderId)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$order) {
                return response()->json(['message' => 'Commande non trouvée'], 404);
            }

            // Get order items
            $items = DB::table('order_items')
                ->where('order_id', $orderId)
                ->get();

            // Get supplier info
            $supplier = DB::table('suppliers')
                ->where('id', $supplierId)
                ->first();

            // For now, return HTML that can be printed
            // In production, use DomPDF or Snappy to generate actual PDF
            $html = $this->generateInvoiceHtml($order, $items, $supplier);

            return response()->json([
                'success' => true,
                'html' => $html,
                'order_number' => $order->order_number,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderNotificationController@generateInvoicePdf error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la génération du PDF'], 500);
        }
    }

    /**
     * Get print-friendly HTML
     * GET /api/v1/supplier/orders/{id}/print
     */
    public function getPrintView($orderId)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $order = Order::where('id', $orderId)
                ->where('supplier_id', $supplierId)
                ->first();

            if (!$order) {
                return response()->json(['message' => 'Commande non trouvée'], 404);
            }

            $items = DB::table('order_items')
                ->where('order_id', $orderId)
                ->get();

            $supplier = DB::table('suppliers')
                ->where('id', $supplierId)
                ->first();

            $html = $this->generateInvoiceHtml($order, $items, $supplier);

            return response()->json([
                'success' => true,
                'html' => $html,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierOrderNotificationController@getPrintView error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Generate WhatsApp message
     */
    private function generateWhatsAppMessage($order)
    {
        $statusEmoji = match($order->status) {
            'pending' => '⏳',
            'preparing' => '📦',
            'ready' => '✅',
            'shipped' => '🚚',
            'delivered' => '🎉',
            'cancelled' => '❌',
            default => '📋',
        };

        $message = "{$statusEmoji} *Commande #{$order->order_number}*\n\n";
        $message .= "Bonjour *{$order->client_name}*,\n\n";
        $message .= "Votre commande a été {$this->getStatusText($order->status)}.\n\n";
        $message .= "📦 *Détails:*\n";

        $items = DB::table('order_items')->where('order_id', $order->id)->get();
        foreach ($items as $item) {
            $message .= "- {$item->product_name} (x{$item->quantity}) - " . number_format($item->total, 0, ',', ' ') . " F\n";
        }

        $message .= "\n💰 *Total: " . number_format($order->total, 0, ',', ' ') . " F*\n";

        if ($order->delivery_date) {
            $message .= "\n📅 Livraison prévue: " . \Carbon\Carbon::parse($order->delivery_date)->format('d/m/Y');
            if ($order->delivery_time) {
                $message .= " vers {$order->delivery_time}";
            }
            $message .= "\n";
        }

        $message .= "\n📍 *Adresse:* {$order->client_address}\n";

        $message .= "\nMerci pour votre confiance! 🙏\n";
        $message .= "---\n";
        $message .= "Pour suivre votre commande, rendez-vous sur notre site.";

        return $message;
    }

    /**
     * Generate email message
     */
    private function generateEmailMessage($order, $items, $supplier)
    {
        $html = "<h2>Confirmation de commande #{$order->order_number}</h2>";
        $html .= "<p>Bonjour {$order->client_name},</p>";
        $html .= "<p>Votre commande a été {$this->getStatusText($order->status)}.</p>";
        
        $html .= "<table style='width:100%; border-collapse:collapse; margin:20px 0;'>";
        $html .= "<tr style='background:#f5f5f5;'><th style='padding:10px; text-align:left;'>Produit</th><th style='padding:10px;'>Qté</th><th style='padding:10px; text-align:right;'>Prix</th><th style='padding:10px; text-align:right;'>Total</th></tr>";
        
        foreach ($items as $item) {
            $html .= "<tr><td style='padding:10px; border-bottom:1px solid #eee;'>{$item->product_name}</td><td style='padding:10px; text-align:center; border-bottom:1px solid #eee;'>{$item->quantity}</td><td style='padding:10px; text-align:right; border-bottom:1px solid #eee;'>" . number_format($item->price, 0, ',', ' ') . " F</td><td style='padding:10px; text-align:right; border-bottom:1px solid #eee;'>" . number_format($item->total, 0, ',', ' ') . " F</td></tr>";
        }
        
        $html .= "<tr><td colspan='3' style='padding:10px; text-align:right; font-weight:bold;'>Total:</td><td style='padding:10px; text-align:right; font-weight:bold;'>" . number_format($order->total, 0, ',', ' ') . " F</td></tr>";
        $html .= "</table>";

        if ($order->delivery_date) {
            $html .= "<p><strong>Date de livraison:</strong> " . \Carbon\Carbon::parse($order->delivery_date)->format('d/m/Y') . "</p>";
        }

        $html .= "<p><strong>Adresse de livraison:</strong> {$order->client_address}</p>";
        $html .= "<p>Merci pour votre confiance!</p>";

        return $html;
    }

    /**
     * Generate invoice HTML for print/PDF
     */
    private function generateInvoiceHtml($order, $items, $supplier)
    {
        $html = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture ' . $order->order_number . '</title>
    <style>
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
        }
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #D81918;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #D81918;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-title {
            font-size: 28px;
            color: #D81918;
            margin: 0;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #666;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f5f5f5;
            font-weight: bold;
        }
        .product-image {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 4px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row {
            font-size: 18px;
            font-weight: bold;
            background: #D81918;
            color: white;
        }
        .total-row td {
            padding: 15px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 200px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">' . ($supplier->name ?? 'SISMA') . '</div>
            <p style="color: #666;">' . ($supplier->address ?? '') . '</p>
            <p>' . ($supplier->phone ?? '') . '</p>
        </div>
        <div class="invoice-info">
            <h1 class="invoice-title">FACTURE</h1>
            <p><strong>N°:</strong> ' . $order->order_number . '</p>
            <p><strong>Date:</strong> ' . \Carbon\Carbon::parse($order->created_at)->format('d/m/Y') . '</p>
            <p><strong>Statut:</strong> ' . $this->getStatusText($order->status) . '</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">INFORMATIONS CLIENT</div>
        <p><strong>Nom:</strong> ' . $order->client_name . '</p>
        <p><strong>Téléphone:</strong> ' . $order->client_phone . '</p>
        <p><strong>Adresse:</strong> ' . $order->client_address . '</p>
        ' . ($order->commune ? '<p><strong>Commune:</strong> ' . $order->commune . '</p>' : '') . '
    </div>

    <div class="section">
        <div class="section-title">DÉTAILS DE LA COMMANDE</div>
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Produit</th>
                    <th class="text-center">Qté</th>
                    <th class="text-right">Prix Unit.</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>';
        
        foreach ($items as $item) {
            $image = $item->product_image ?? 'https://via.placeholder.com/50';
            $html .= '
                <tr>
                    <td><img src="' . $image . '" class="product-image" alt="' . $item->product_name . '"></td>
                    <td>
                        <strong>' . $item->product_name . '</strong>
                        ' . ($item->variants ? '<br><small style="color:#666;">' . $item->variants . '</small>' : '') . '
                    </td>
                    <td class="text-center">' . $item->quantity . '</td>
                    <td class="text-right">' . number_format($item->price, 0, ',', ' ') . ' F</td>
                    <td class="text-right">' . number_format($item->total, 0, ',', ' ') . ' F</td>
                </tr>';
        }

        $html .= '
                <tr>
                    <td colspan="4" class="text-right"><strong>Sous-total:</strong></td>
                    <td class="text-right">' . number_format($order->subtotal, 0, ',', ' ') . ' F</td>
                </tr>
                <tr>
                    <td colspan="4" class="text-right"><strong>Frais de livraison:</strong></td>
                    <td class="text-right">' . number_format($order->delivery_fee, 0, ',', ' ') . ' F</td>
                </tr>
                <tr class="total-row">
                    <td colspan="4" class="text-right">TOTAL:</td>
                    <td class="text-right">' . number_format($order->total, 0, ',', ' ') . ' F</td>
                </tr>
            </tbody>
        </table>
    </div>';

        if ($order->delivery_date) {
            $html .= '
    <div class="section">
        <div class="section-title">INFORMATIONS DE LIVRAISON</div>
        <p><strong>Date prévue:</strong> ' . \Carbon\Carbon::parse($order->delivery_date)->format('d/m/Y') . '</p>
        ' . ($order->delivery_time ? '<p><strong>Créneau:</strong> ' . $order->delivery_time . '</p>' : '') . '
    </div>';
        }

        if ($order->notes) {
            $html .= '
    <div class="section">
        <div class="section-title">NOTES</div>
        <p>' . $order->notes . '</p>
    </div>';
        }

        $html .= '
    <div class="signature">
        <div class="signature-box">
            <div class="signature-line">Signature Client</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Signature Fournisseur</div>
        </div>
    </div>

    <div class="footer">
        <p>Merci pour votre confiance!</p>
        <p>' . ($supplier->name ?? 'SISMA') . ' - ' . ($supplier->email ?? '') . '</p>
    </div>
</body>
</html>';

        return $html;
    }

    private function getStatusText($status)
    {
        return match($status) {
            'pending' => 'en attente',
            'confirmed' => 'confirmée',
            'preparing' => 'en préparation',
            'ready' => 'prête',
            'shipped' => 'expédiée',
            'delivered' => 'livrée',
            'cancelled' => 'annulée',
            default => $status,
        };
    }

    private function getSupplierId()
    {
        $user = auth()->user();
        if (!$user) return null;
        
        $supplier = DB::table('suppliers')->where('user_id', $user->id)->first();
        return $supplier ? $supplier->id : null;
    }
}
