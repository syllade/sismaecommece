<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierCommission extends Model
{
    protected $fillable = [
        'supplier_id',
        'order_id',
        'order_total',
        'commission_rate',
        'commission_amount',
        'earning_supplier',
        'status',
        'due_date',
        'paid_date',
        'payment_method',
        'payment_reference',
        'notes',
        'created_by',
        'paid_by',
    ];

    protected $casts = [
        'order_total' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'earning_supplier' => 'decimal:2',
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
