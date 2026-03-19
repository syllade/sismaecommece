<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Pdf\Dompdf;
use Dompdf\Dompdf as PDFDocument;

/**
 * Admin Reports Controller V1
 * 
 * API Version 1 - Statistiques et exports
 * Graphiques interactifs, export CSV/PDF
 */
class AdminReportsController extends Controller
{
    /**
     * GET /api/v1/admin/reports/orders
     * 
     * Statistiques détaillées des commandes
     */
    public function orders(Request $request)
    {
        try {
            $from = $request->get('from', Carbon::now()->subDays(30)->format('Y-m-d'));
            $to = $request->get('to', Carbon::now()->format('Y-m-d'));

            $orders = DB::table('orders')
                ->whereBetween('created_at', [
                    Carbon::parse($from)->startOfDay(),
                    Carbon::parse($to)->endOfDay(),
                ])
                ->where('status', '!=', 'cancelled')
                ->selectRaw('
                    DATE(created_at) as date,
                    COUNT(*) as orders_count,
                    SUM(total) as revenue,
                    AVG(total) as avg_order_value
                ')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Statistiques par jour
            $dailyStats = $orders->map(function ($day) {
                return [
                    'date' => $day->date,
                    'orders' => (int) $day->orders_count,
                    'revenue' => (float) $day->revenue,
                    'avg_order_value' => (float) $day->avg_order_value,
                ];
            });

            // Statistiques globales
            $totalOrders = $orders->sum('orders_count');
            $totalRevenue = $orders->sum('revenue');
            $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $from,
                        'to' => $to,
                    ],
                    'daily' => $dailyStats,
                    'summary' => [
                        'total_orders' => $totalOrders,
                        'total_revenue' => $totalRevenue,
                        'avg_order_value' => round($avgOrderValue, 2),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/reports/suppliers
     * 
     * Statistiques par fournisseur
     */
    public function suppliers(Request $request)
    {
        try {
            $from = $request->get('from', Carbon::now()->subDays(30)->format('Y-m-d'));
            $to = $request->get('to', Carbon::now()->format('Y-m-d'));

            $suppliers = DB::table('suppliers')
                ->leftJoin('orders', 'suppliers.id', '=', 'orders.supplier_id')
                ->whereBetween('orders.created_at', [
                    Carbon::parse($from)->startOfDay(),
                    Carbon::parse($to)->endOfDay(),
                ])
                ->where('orders.status', '!=', 'cancelled')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.commission_rate,
                    COUNT(orders.id) as orders_count,
                    SUM(orders.total) as revenue,
                    SUM(orders.total * (suppliers.commission_rate / 100)) as commission
                ')
                ->groupBy('suppliers.id', 'suppliers.name', 'suppliers.commission_rate')
                ->orderByDesc('revenue')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $suppliers->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'commission_rate' => (float) $s->commission_rate,
                        'orders_count' => (int) $s->orders_count,
                        'revenue' => (float) $s->revenue,
                        'commission' => (float) $s->commission,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/reports/deliveries
     * 
     * Statistiques des livraisons
     */
    public function deliveries(Request $request)
    {
        try {
            $from = $request->get('from', Carbon::now()->subDays(30)->format('Y-m-d'));
            $to = $request->get('to', Carbon::now()->format('Y-m-d'));

            // Statistiques globales
            $stats = DB::table('orders')
                ->whereBetween('created_at', [
                    Carbon::parse($from)->startOfDay(),
                    Carbon::parse($to)->endOfDay(),
                ])
                ->whereNotNull('delivery_person_id')
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ("delivered", "completed") THEN 1 ELSE 0 END) as delivered,
                    SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN status IN ("pending", "preparee", "expediee") THEN 1 ELSE 0 END) as in_progress
                ')
                ->first();

            // Par livreur
            $byDriver = DB::table('orders')
                ->join('delivery_persons', 'orders.delivery_person_id', '=', 'delivery_persons.id')
                ->whereBetween('orders.created_at', [
                    Carbon::parse($from)->startOfDay(),
                    Carbon::parse($to)->endOfDay(),
                ])
                ->selectRaw('
                    delivery_persons.id,
                    delivery_persons.name,
                    COUNT(orders.id) as total_orders,
                    SUM(CASE WHEN orders.status IN ("delivered", "completed") THEN 1 ELSE 0 END) as delivered,
                    SUM(orders.total) as revenue
                ')
                ->groupBy('delivery_persons.id', 'delivery_persons.name')
                ->orderByDesc('delivered')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total' => (int) $stats->total,
                        'delivered' => (int) $stats->delivered,
                        'cancelled' => (int) $stats->cancelled,
                        'in_progress' => (int) $stats->in_progress,
                        'success_rate' => $stats->total > 0 
                            ? round(($stats->delivered / $stats->total) * 100, 2) 
                            : 0,
                    ],
                    'by_driver' => $byDriver,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/reports/export/csv
     * 
     * Export CSV des commandes
     */
    public function exportCsv(Request $request)
    {
        try {
            $from = $request->get('from', Carbon::now()->subDays(30)->format('Y-m-d'));
            $to = $request->get('to', Carbon::now()->format('Y-m-d'));

            $orders = DB::table('orders')
                ->whereBetween('created_at', [
                    Carbon::parse($from)->startOfDay(),
                    Carbon::parse($to)->endOfDay(),
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            // Créer le CSV
            $filename = 'fashop-orders-' . $from . '-to-' . $to . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function () use ($orders) {
                $handle = fopen('php://output', 'w');
                
                // En-tête
                fputcsv($handle, [
                    'ID', 'Client', 'Téléphone', 'Email', 'Adresse', 'Commune',
                    'Statut', 'Montant', 'Frais livraison', 'Total', 'Date création'
                ]);

                // Données
                foreach ($orders as $order) {
                    fputcsv($handle, [
                        $order->id,
                        $order->customer_name ?? '',
                        $order->customer_phone ?? '',
                        $order->customer_email ?? '',
                        $order->customer_location ?? '',
                        $order->commune ?? '',
                        $order->status,
                        $order->subtotal ?? 0,
                        $order->delivery_fee ?? 0,
                        $order->total,
                        $order->created_at,
                    ]);
                }

                fclose($handle);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export CSV',
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/reports/export/pdf
     * 
     * Export PDF des commandes
     */
    public function exportPdf(Request $request)
    {
        try {
            $from = $request->get('from', Carbon::now()->subDays(30)->format('Y-m-d'));
            $to = $request->get('to', Carbon::now()->format('Y-m-d'));

            $orders = DB::table('orders')
                ->whereBetween('created_at', [
                    Carbon::parse($from)->startOfDay(),
                    Carbon::parse($to)->endOfDay(),
                ])
                ->orderBy('created_at', 'desc')
                ->limit(200)
                ->get();

            // Calculer le total
            $totalRevenue = $orders->sum('total');
            $totalOrders = count($orders);

            // Générer le HTML pour le PDF
            $html = view('reports.orders', [
                'orders' => $orders,
                'from' => $from,
                'to' => $to,
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
            ])->render();

            // Générer le PDF
            $dompdf = new PDFDocument();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'landscape');
            $dompdf->render();

            // Retourner le PDF
            $filename = 'fashop-orders-' . $from . '-to-' . $to . '.pdf';
            
            return response()->make($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/reports/top-products
     * 
     * Top produits vendus
     */
    public function topProducts(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);
            $from = $request->get('from', Carbon::now()->subDays(30)->format('Y-m-d'));
            $to = $request->get('to', Carbon::now()->format('Y-m-d'));

            $topProducts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->whereBetween('orders.created_at', [
                    Carbon::parse($from)->startOfDay(),
                    Carbon::parse($to)->endOfDay(),
                ])
                ->where('orders.status', '!=', 'cancelled')
                ->selectRaw('
                    products.id,
                    products.name,
                    products.image,
                    SUM(order_items.quantity) as quantity_sold,
                    SUM(order_items.subtotal) as revenue
                ')
                ->groupBy('products.id', 'products.name', 'products.image')
                ->orderByDesc('quantity_sold')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $topProducts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des top produits',
            ], 500);
        }
    }
}
