<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryFee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeliveryFeeController extends Controller
{
    /** ADMIN: Liste des frais de livraison */
    public function index()
    {
        try {
            $fees = DB::table('delivery_fees')
                ->orderBy('commune', 'asc')
                ->orderBy('quartier', 'asc')
                ->get();
            
            return response()->json($fees);
        } catch (\Exception $e) {
            Log::error('Erreur liste frais: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** PUBLIC: Calculer les frais pour une commune/quartier */
    public function calculate(Request $request)
    {
        $commune = $request->input('commune');
        $quartier = $request->input('quartier');
        
        if (!$commune) {
            return response()->json([
                'commune' => '',
                'quartier' => isset($quartier) ? $quartier : null,
                'fee' => 2000, // Frais par défaut
            ]);
        }

        // Frais par défaut selon la commune (si la table n'existe pas)
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
        
        $defaultFee = isset($defaultFees[$commune]) ? $defaultFees[$commune] : 2000;

        try {
            // Vérifier si la table existe
            try {
                DB::table('delivery_fees')->first();
            } catch (\Exception $e) {
                // Table n'existe pas, utiliser les frais par défaut
                return response()->json([
                    'commune' => $commune,
                    'quartier' => $quartier,
                    'fee' => $defaultFee,
                ]);
            }

            // Chercher un frais spécifique pour le quartier
            if ($quartier) {
                $specific = DB::table('delivery_fees')
                    ->where('commune', $commune)
                    ->where('quartier', $quartier)
                    ->where('is_active', 1)
                    ->first();
                
                if ($specific) {
                    return response()->json([
                        'commune' => $commune,
                        'quartier' => $quartier,
                        'fee' => (float)$specific->fee,
                    ]);
                }
            }

            // Chercher un frais général pour la commune
            $general = DB::table('delivery_fees')
                ->where('commune', $commune)
                ->whereNull('quartier')
                ->where('is_active', 1)
                ->first();
            
            $fee = $general ? (float)$general->fee : $defaultFee;
            
            return response()->json([
                'commune' => $commune,
                'quartier' => $quartier,
                'fee' => $fee,
            ]);
        } catch (\Exception $e) {
            Log::warning('Erreur calcul frais: ' . $e->getMessage());
            // Toujours retourner un frais, même en cas d'erreur
            return response()->json([
                'commune' => $commune,
                'quartier' => $quartier,
                'fee' => $defaultFee,
            ]);
        }
    }

    /** ADMIN: Créer/Mettre à jour un frais */
    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'commune' => 'required|string|max:255',
                'quartier' => 'sometimes|string|max:255',
                'fee' => 'required|numeric|min:0',
                'estimated_distance_km' => 'sometimes|integer|min:0',
                'is_active' => 'sometimes|boolean',
            ]);

            $data = array(
                'commune' => $request->input('commune'),
                'quartier' => $request->input('quartier', null),
                'fee' => (float)$request->input('fee'),
                'estimated_distance_km' => $request->has('estimated_distance_km') ? (int)$request->input('estimated_distance_km') : null,
                'is_active' => filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            );

            // Vérifier si un frais existe déjà pour cette commune/quartier
            $existing = DB::table('delivery_fees')
                ->where('commune', $data['commune'])
                ->where(function($q) use ($data) {
                    if ($data['quartier']) {
                        $q->where('quartier', $data['quartier']);
                    } else {
                        $q->whereNull('quartier');
                    }
                })
                ->first();

            if ($existing) {
                // Mettre à jour
                DB::table('delivery_fees')->where('id', $existing->id)->update($data);
                $fee = DB::table('delivery_fees')->where('id', $existing->id)->first();
            } else {
                // Créer
                $id = DB::table('delivery_fees')->insertGetId($data);
                $fee = DB::table('delivery_fees')->where('id', $id)->first();
            }

            return response()->json([
                'message' => 'Frais de livraison enregistré avec succès',
                'fee' => $fee,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur enregistrement frais: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }
}

