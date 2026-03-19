<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Contrôleur pour la gestion des adresses clients
 * Endpoints: /api/v1/client/addresses
 */
class ClientAddressController extends Controller
{
    /**
     * Liste des adresses du client connecté
     * GET /api/v1/client/addresses
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !isset($user->id)) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        $addresses = DB::table('customer_addresses')
            ->where('customer_user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses
        ]);
    }

    /**
     * Ajouter une nouvelle adresse
     * POST /api/v1/client/addresses
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !isset($user->id)) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        $validated = $request->validate([
            'label' => 'nullable|string|max:100',
            'address' => 'required|string|max:255',
            'commune' => 'required|string|max:100',
            'quartier' => 'nullable|string|max:100',
            'reference' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        // Si cette adresse doit être par défaut, retirer le statut des autres
        if (!empty($validated['is_default'])) {
            DB::table('customer_addresses')
                ->where('customer_user_id', $user->id)
                ->update(['is_default' => false]);
        }

        $addressId = DB::table('customer_addresses')->insertGetId([
            'customer_user_id' => $user->id,
            'label' => $validated['label'] ?? null,
            'address' => $validated['address'],
            'commune' => $validated['commune'],
            'quartier' => $validated['quartier'] ?? null,
            'reference' => $validated['reference'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'is_default' => $validated['is_default'] ?? false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $address = DB::table('customer_addresses')->where('id', $addressId)->first();

        return response()->json([
            'success' => true,
            'message' => 'Adresse ajoutée avec succès',
            'data' => $address
        ], 201);
    }

    /**
     * Mettre à jour une adresse
     * PUT /api/v1/client/addresses/{id}
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !isset($user->id)) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        // Vérifier que l'adresse appartient au client
        $address = DB::table('customer_addresses')
            ->where('id', (int)$id)
            ->where('customer_user_id', $user->id)
            ->first();

        if (!$address) {
            return response()->json(['success' => false, 'message' => 'Adresse introuvable'], 404);
        }

        $validated = $request->validate([
            'label' => 'nullable|string|max:100',
            'address' => 'sometimes|string|max:255',
            'commune' => 'sometimes|string|max:100',
            'quartier' => 'nullable|string|max:100',
            'reference' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        // Si cette adresse doit être par défaut, retirer le statut des autres
        if (!empty($validated['is_default'])) {
            DB::table('customer_addresses')
                ->where('customer_user_id', $user->id)
                ->where('id', '!=', (int)$id)
                ->update(['is_default' => false]);
        }

        DB::table('customer_addresses')
            ->where('id', (int)$id)
            ->update(array_merge($validated, ['updated_at' => now()]));

        $updatedAddress = DB::table('customer_addresses')->where('id', (int)$id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Adresse mise à jour avec succès',
            'data' => $updatedAddress
        ]);
    }

    /**
     * Supprimer une adresse
     * DELETE /api/v1/client/addresses/{id}
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !isset($user->id)) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        // Vérifier que l'adresse appartient au client
        $address = DB::table('customer_addresses')
            ->where('id', (int)$id)
            ->where('customer_user_id', $user->id)
            ->first();

        if (!$address) {
            return response()->json(['success' => false, 'message' => 'Adresse introuvable'], 404);
        }

        DB::table('customer_addresses')->where('id', (int)$id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Adresse supprimée avec succès'
        ]);
    }

    /**
     * Définir une adresse comme par défaut
     * POST /api/v1/client/addresses/{id}/default
     */
    public function setDefault(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !isset($user->id)) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        // Vérifier que l'adresse appartient au client
        $address = DB::table('customer_addresses')
            ->where('id', (int)$id)
            ->where('customer_user_id', $user->id)
            ->first();

        if (!$address) {
            return response()->json(['success' => false, 'message' => 'Adresse introuvable'], 404);
        }

        // Retirer le statut par défaut de toutes les autres adresses
        DB::table('customer_addresses')
            ->where('customer_user_id', $user->id)
            ->update(['is_default' => false]);

        // Définir cette adresse comme par défaut
        DB::table('customer_addresses')
            ->where('id', (int)$id)
            ->update(['is_default' => true, 'updated_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Adresse définie comme par défaut'
        ]);
    }
}
