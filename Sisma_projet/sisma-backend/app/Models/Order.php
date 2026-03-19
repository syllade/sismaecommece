<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Order extends Model
{

    protected $fillable = [
        'customer_name',
        'customer_phone',
        'customer_location',
        'commune',
        'quartier',
        'delivery_type',
        'delivery_date',
        'delivery_person_id',
        'subtotal',
        'delivery_fee',
        'total',
        'status',
        'notes',
    ];

    protected $casts = [
        'delivery_date' => 'datetime',
        'subtotal' => 'float',
        'delivery_fee' => 'float',
        'total' => 'float',
    ];

    /**
     * Scope pour filtrer par statut
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope pour la recherche
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('customer_name', 'like', "%{$search}%")
              ->orWhere('customer_phone', 'like', "%{$search}%")
              ->orWhere('customer_location', 'like', "%{$search}%");
        });
    }

    /**
     * Scope pour filtrer par période
     */
    public function scopeByPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay()
        ]);
    }

    /**
     * Relation avec les items de commande
     */
    public function items()
    {
        return $this->hasMany('App\Models\OrderItem');
    }

    /**
     * Relation avec le livreur
     */
    public function deliveryPerson()
    {
        return $this->belongsTo('App\Models\DeliveryPerson', 'delivery_person_id');
    }
}

