<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'supplier_id',
        'created_by',
        'priority',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function markAsRead()
    {
        $this->update(['is_read' => true]);
    }

    public static function notifyProductThreshold(int $supplierId, int $productCount, int $newProductId): self
    {
        $supplier = \DB::table('suppliers')->where('id', $supplierId)->first();
        
        return self::create([
            'type' => 'product_threshold',
            'title' => 'Fournisseur dépasse le seuil de 10 produits',
            'message' => "Le fournisseur \"{$supplier->name}\" a désormais {$productCount} produits publiés. Les nouvelles ventes seront commissionnées à 10%.",
            'data' => [
                'supplier_id' => $supplierId,
                'product_count' => $productCount,
                'new_product_id' => $newProductId,
                'old_rate' => '5%',
                'new_rate' => '10%',
            ],
            'supplier_id' => $supplierId,
        ]);
    }

    public static function notifyCommissionOverdue(int $supplierId, float $amount): self
    {
        $supplier = \DB::table('suppliers')->where('id', $supplierId)->first();
        
        return self::create([
            'type' => 'commission_overdue',
            'title' => 'Commission impayée',
            'message' => "Le fournisseur \"{$supplier->name}\" a une commission impayée de " . number_format($amount, 0, ',', ' ') . " XOF.",
            'data' => [
                'supplier_id' => $supplierId,
                'amount' => $amount,
            ],
            'supplier_id' => $supplierId,
        ]);
    }
}
