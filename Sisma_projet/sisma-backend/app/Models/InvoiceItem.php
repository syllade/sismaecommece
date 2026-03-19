<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $table = 'invoice_items';

    protected $fillable = [
        'invoice_id',
        'order_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function invoice()
    {
        return $this->belongsTo('App\Models\Invoice');
    }
}
