<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SupplierController extends Controller
{
    public function index()
    {
        try {
            $suppliers = DB::table('suppliers')->orderBy('created_at', 'desc')->get();
            return response()->json($suppliers);
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
            return response()->json($supplier, 201);
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
            foreach (['name','logo','phone','email','address','availability','commission_rate','invoice_frequency'] as $field) {
                if ($request->has($field)) {
                    $data[$field] = $request->input($field);
                }
            }
            if ($request->has('is_active')) {
                $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }

            DB::table('suppliers')->where('id', $id)->update($data);
            $updated = DB::table('suppliers')->where('id', $id)->first();
            return response()->json($updated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'errors') ? $e->errors() : [];
            return response()->json(['message' => 'Erreur de validation', 'errors' => $errors], 422);
        } catch (\Exception $e) {
            Log::error('Erreur update supplier: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise a jour'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            if (!$supplier) {
                return response()->json(['message' => 'Fournisseur non trouve'], 404);
            }
            DB::table('suppliers')->where('id', $id)->delete();
            return response()->json(['message' => 'Fournisseur supprime']);
        } catch (\Exception $e) {
            Log::error('Erreur delete supplier: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}
