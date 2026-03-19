<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Supplier Campaign Policy
 * Enforces strict multi-tenant isolation: $model->supplier_id === auth()->id()
 */
class SupplierCampaignPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view any campaigns
     */
    public function viewAny(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can view the campaign
     */
    public function view(User $user, $campaign): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $campaign->supplier_id === $supplierId;
    }

    /**
     * Determine if user can create campaigns
     */
    public function create(User $user): bool
    {
        return $user->isSupplier();
    }

    /**
     * Determine if user can update the campaign
     */
    public function update(User $user, $campaign): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $campaign->supplier_id === $supplierId;
    }

    /**
     * Determine if user can pause/resume the campaign
     */
    public function toggle(User $user, $campaign): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $campaign->supplier_id === $supplierId;
    }

    /**
     * Determine if user can delete the campaign
     */
    public function delete(User $user, $campaign): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $campaign->supplier_id === $supplierId;
    }

    /**
     * Determine if user can view campaign stats
     */
    public function viewStats(User $user, $campaign): bool
    {
        if (!$user->isSupplier()) {
            return false;
        }

        $supplierId = $this->getSupplierId($user);
        return $campaign->supplier_id === $supplierId;
    }

    /**
     * Determine if user can manage advertising balance
     */
    public function manageBalance(User $user): bool
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
