<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ActorResolverService
{
    private $userColumns = null;

    private function getUserColumns()
    {
        if ($this->userColumns !== null) {
            return $this->userColumns;
        }

        $this->userColumns = array();
        try {
            $columns = DB::select("SHOW COLUMNS FROM users");
            foreach ($columns as $column) {
                if (isset($column->Field)) {
                    $this->userColumns[] = $column->Field;
                }
            }
        } catch (\Exception $e) {
            $this->userColumns = array();
        }

        return $this->userColumns;
    }

    private function hasUserColumn($name)
    {
        return in_array($name, $this->getUserColumns());
    }

    public function resolveSupplierIdForUser($user)
    {
        if (!$user) return null;

        if ($this->hasUserColumn('supplier_id') && isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        if (isset($user->email) && $user->email) {
            $supplier = DB::table('suppliers')->where('email', $user->email)->first();
            if ($supplier && isset($supplier->id)) {
                return (int) $supplier->id;
            }
        }

        return null;
    }

    public function resolveDeliveryPersonIdForUser($user)
    {
        if (!$user) return null;

        if ($this->hasUserColumn('delivery_person_id') && isset($user->delivery_person_id) && $user->delivery_person_id) {
            return (int) $user->delivery_person_id;
        }

        if (isset($user->email) && $user->email) {
            $deliveryPerson = DB::table('delivery_persons')->where('email', $user->email)->first();
            if ($deliveryPerson && isset($deliveryPerson->id)) {
                return (int) $deliveryPerson->id;
            }
        }

        return null;
    }
}
