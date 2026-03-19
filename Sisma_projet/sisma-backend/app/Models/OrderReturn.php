<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderReturn extends Model
{
    protected $fillable = [
        'order_id',
        'order_item_id',
        'user_id',
        'supplier_id',
        'reason',
        'description',
        'status',
        'admin_notes',
        'refund_amount',
        'processed_at',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
        'refund_amount' => 'decimal:2',
    ];

    public const REASONS = [
        'defective_product' => 'Produit défectueux',
        'wrong_item' => 'Mauvais article reçu',
        'not_as_described' => 'Non conforme à la description',
        'size_issue' => 'Problème de taille',
        'quality_issue' => 'Problème de qualité',
        'changed_mind' => 'Changement d\'avis',
        'other' => 'Autre',
    ];

    public const STATUS_LABELS = [
        'pending' => 'En attente',
        'approved' => 'Approuvé',
        'rejected' => 'Rejeté',
        'refunded' => 'Remboursé',
        'completed' => 'Terminé',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForSupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['pending']);
    }

    public function canApprove(): bool
    {
        return $this->status === 'pending';
    }

    public function canReject(): bool
    {
        return $this->status === 'pending';
    }

    public function canRefund(): bool
    {
        return in_array($this->status, ['approved']);
    }
}
