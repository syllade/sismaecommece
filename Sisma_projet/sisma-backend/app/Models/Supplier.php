<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $table = 'suppliers';

    protected $fillable = [
        'name',
        'logo',
        'phone',
        'email',
        'address',
        'availability',
        'is_active',
        'commission_rate',
        'invoice_frequency',
    ];
}
