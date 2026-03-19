<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Supplier Product Policy
 * Enforces strict multi-tenant isolation: $model->supplier_id === auth()->id()
 */
class SupplierProductPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view any products
     */
    public function viewAny(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can view the product
     */
    public function view(User $user, $product): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $product->supplier_id === $supplierId;
    }

    /**
     * Determine if user can create products
     */
    public function create(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can update the product
     */
    public function update(User $user, $product): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $product->supplier_id === $supplierId;
    }

    /**
     * Determine if user can delete the product
     */
    public function delete(User $user, $product): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $product->supplier_id === $supplierId;
    }

    /**
     * Determine if user can import products
     */
    public function import(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can export products
     */
    public function export(User $user): bool
    {
        return $user->isSupplier();
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
