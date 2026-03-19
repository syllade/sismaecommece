<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryFee extends Model
{
    protected $fillable = [
        'commune',
        'quartier',
        'fee',
        'estimated_distance_km',
        'is_active',
    ];

    protected $casts = [
        'fee' => 'float',
        'estimated_distance_km' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Scope pour les frais actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Trouver les frais pour une commune/quartier
     */
    public static function findFee($commune, $quartier = null)
    {
        $query = static::active()->where('commune', $commune);
        
        if ($quartier) {
            $specific = $query->where('quartier', $quartier)->first();
            if ($specific) {
                return $specific->fee;
            }
        }
        
        $general = $query->whereNull('quartier')->first();
        return $general ? $general->fee : 2000; // Par défaut 2000 FCFA
    }
}

