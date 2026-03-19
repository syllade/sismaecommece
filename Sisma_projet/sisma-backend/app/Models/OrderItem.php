<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{

    protected $fillable = [
        'order_id',
        'product_id',
        'supplier_id',
        'product_name',
        'price',
        'quantity',
        'subtotal',
        'color',
        'size',
    ];

    protected $casts = [
        'price' => 'float',
        'quantity' => 'integer',
        'subtotal' => 'float',
        'color' => 'string',
        'size' => 'string',
    ];

    /**
     * Relation avec la commande
     */
    public function order()
    {
        return $this->belongsTo('App\Models\Order');
    }

    /**
     * Relation avec le produit
     */
    public function product()
    {
        return $this->belongsTo('App\Models\Product');
    }
}

