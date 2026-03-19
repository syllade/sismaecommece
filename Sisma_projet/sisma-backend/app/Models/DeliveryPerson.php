<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryPerson extends Model
{
    protected $table = 'delivery_persons';
    protected $fillable = [
        'name',
        'phone',
        'email',
        'vehicle_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relation avec les commandes
     */
    public function orders()
    {
        return $this->hasMany('App\Models\Order', 'delivery_person_id');
    }
}

