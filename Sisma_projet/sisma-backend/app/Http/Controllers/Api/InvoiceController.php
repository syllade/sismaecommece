<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceController extends Controller
{
    /** ADMIN: Liste des factures */
    public function index(Request $request)
    {
        try {
            $query = DB::table('invoices')
                ->leftJoin('suppliers', 'invoices.supplier_id', '=', 'suppliers.id')
                ->select(
                    'invoices.*',
                    'suppliers.name as supplier_name',
                    'suppliers.email as supplier_email',
                    'suppliers.phone as supplier_phone'
                );

            if ($request->has('supplier_id') && $request->supplier_id) {
                $query->where('invoices.supplier_id', $request->supplier_id);
            }

            if ($request->has('status') && $request->status) {
                $query->where('invoices.status', $request->status);
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('invoices.period_start', [$request->start_date, $request->end_date]);
            }

            $query->orderBy('invoices.created_at', 'desc');

            $invoices = $query->get();
            return response()->json($invoices);
        } catch (\Exception $e) {
            Log::error('Erreur index invoices: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors du chargement'], 500);
        }
    }

    /** ADMIN: Détails d'une facture */
    public function show($id)
    {
        try {
            $invoice = DB::table('invoices')->where('id', $id)->first();
            if (!$invoice) {
                return response()->json(['message' => 'Facture introuvable'], 404);
            }

            $supplier = DB::table('suppliers')->where('id', $invoice->supplier_id)->first();

            $items = DB::table('invoice_items')
                ->where('invoice_id', $invoice->id)
                ->get();

            return response()->json([
                'invoice' => $invoice,
                'supplier' => $supplier,
                'items' => $items,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur show invoice: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    /** ADMIN: Mettre à jour le statut */
    public function updateStatus(Request $request, $id)
    {
        try {
            $this->validate($request, [
                'status' => 'required|string',
            ]);

            $invoice = DB::table('invoices')->where('id', $id)->first();
            if (!$invoice) {
                return response()->json(['message' => 'Facture introuvable'], 404);
            }

            DB::table('invoices')->where('id', $id)->update([
                'status' => $request->input('status'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $updated = DB::table('invoices')->where('id', $id)->first();
            return response()->json($updated);
        } catch (\Exception $e) {
            Log::error('Erreur update status invoice: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }
}
