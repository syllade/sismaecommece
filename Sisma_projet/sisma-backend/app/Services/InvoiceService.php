<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    /**
     * Generate unique invoice number
     * Format: FAC-YYYY-NNNNNN
     */
    public function generateInvoiceNumber(int $supplierId): string
    {
        $year = date('Y');
        
        // Get the last invoice number for this supplier/year
        $lastInvoice = DB::table('orders')
            ->where('supplier_id', $supplierId)
            ->where('invoice_number', 'like', "FAC-{$year}-%")
            ->orderBy('invoice_number', 'desc')
            ->first();
        
        if ($lastInvoice) {
            // Extract number and increment
            $lastNumber = (int) substr($lastInvoice->invoice_number, -6);
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
        } else {
            // Start from 000001
            $newNumber = '000001';
        }
        
        return "FAC-{$year}-{$newNumber}";
    }

    /**
     * Lock an order (prevents modifications)
     */
    public function lockOrder(Order $order, string $reason = 'delivered'): bool
    {
        if ($order->is_locked) {
            return false;
        }
        
        // Auto-generate invoice number if not exists
        if (!$order->invoice_number) {
            $order->invoice_number = $this->generateInvoiceNumber($order->supplier_id);
        }
        
        $order->is_locked = true;
        $order->locked_at = now();
        $order->lock_reason = $reason;
        $order->save();
        
        return true;
    }

    /**
     * Unlock an order (admin only)
     */
    public function unlockOrder(Order $order, string $unlockedBy = 'admin'): bool
    {
        if (!$order->is_locked) {
            return false;
        }
        
        $order->is_locked = false;
        $order->locked_at = null;
        $order->lock_reason = null;
        $order->save();
        
        // Log unlock action
        \Log::info("Order {$order->order_number} unlocked by {$unlockedBy}");
        
        return true;
    }

    /**
     * Check if order can be modified
     */
    public function canModify(Order $order): bool
    {
        return !$order->is_locked;
    }

    /**
     * Get lock status with details
     */
    public function getLockStatus(Order $order): array
    {
        return [
            'is_locked' => $order->is_locked,
            'locked_at' => $order->locked_at,
            'lock_reason' => $order->lock_reason,
            'can_modify' => $this->canModify($order),
        ];
    }
}
