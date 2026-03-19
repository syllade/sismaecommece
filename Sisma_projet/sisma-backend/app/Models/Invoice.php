<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';

    protected $fillable = [
        'supplier_id',
        'period_start',
        'period_end',
        'total_amount',
        'commission_amount',
        'status',
        'file_path',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'commission_amount' => 'float',
    ];

    public function supplier()
    {
        return $this->belongsTo('App\Models\Supplier');
    }

    public function items()
    {
        return $this->hasMany('App\Models\InvoiceItem');
    }
}
