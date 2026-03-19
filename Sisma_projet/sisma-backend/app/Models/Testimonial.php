<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{

    protected $fillable = [
        'customer_name',
        'customer_location',
        'rating',
        'content',
        'avatar_initials',
        'is_active',
        'order',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Scope pour les témoignages actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour trier par ordre
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc')->orderBy('created_at', 'desc');
    }
}

