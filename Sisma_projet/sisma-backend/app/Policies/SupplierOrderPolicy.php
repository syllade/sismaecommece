<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Supplier Order Policy
 * Enforces strict multi-tenant isolation: $model->supplier_id === auth()->id()
 */
class SupplierOrderPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view any orders
     */
    public function viewAny(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can view the order
     */
    public function view(User $user, $order): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $order->supplier_id === $supplierId;
    }

    /**
     * Determine if user can update order status
     */
    public function updateStatus(User $user, $order): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $order->supplier_id === $supplierId;
    }

    /**
     * Determine if user can create manual order
     */
    public function createManual(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can bulk update orders
     */
    public function bulkUpdate(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can assign driver to order
     */
    public function assignDriver(User $user, $order): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $order->supplier_id === $supplierId;
    }

    /**
     * Get supplier ID from user
     */
    private function getSupplierId(User $user): int
    {
        if (isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        $supplier = \DB::table('suppliers')->where('user_id', $user->id)->first();
        return $supplier ? $supplier->id : 0;
    }
}
