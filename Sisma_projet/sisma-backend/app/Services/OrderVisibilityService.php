<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class OrderVisibilityService
{
    private $orderItemColumns = null;

    private function hasOrderItemColumn($name)
    {
        if ($this->orderItemColumns === null) {
            $this->orderItemColumns = array();
            try {
                $cols = DB::select("SHOW COLUMNS FROM order_items");
                foreach ($cols as $col) {
                    if (isset($col->Field)) $this->orderItemColumns[] = $col->Field;
                }
            } catch (\Exception $e) {
                $this->orderItemColumns = array();
            }
        }
        return in_array($name, $this->orderItemColumns);
    }

    public function getSupplierOrderIds($supplierId)
    {
        $ids = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.supplier_id', (int) $supplierId)
            ->groupBy('order_items.order_id')
            ->pluck('order_items.order_id');

        if (is_object($ids) && method_exists($ids, 'toArray')) {
            return array_values(array_unique(array_map('intval', $ids->toArray())));
        }

        return array_values(array_unique(array_map('intval', (array) $ids)));
    }

    public function getSupplierOrders($supplierId, $status = null, $page = 1, $perPage = 20)
    {
        $orderIds = $this->getSupplierOrderIds($supplierId);
        if (count($orderIds) === 0) {
            return array('data' => array(), 'total' => 0);
        }

        $query = DB::table('orders')->whereIn('id', $orderIds);
        if ($status) {
            $query->where('status', $status);
        }

        $total = (int) $query->count();
        $offset = max(0, ($page - 1) * $perPage);

        $rows = $query
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get();

        return array('data' => $rows, 'total' => $total);
    }

    public function getSupplierItemsForOrder($supplierId, $orderId)
    {
        $query = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('order_items.order_id', (int) $orderId)
            ->where('products.supplier_id', (int) $supplierId);

        $columns = array(
            'order_items.id',
            'order_items.order_id',
            'order_items.product_id',
            'order_items.product_name',
            'order_items.quantity',
            'order_items.price',
            'order_items.subtotal',
        );
        if ($this->hasOrderItemColumn('color')) {
            $columns[] = 'order_items.color';
        }
        if ($this->hasOrderItemColumn('size')) {
            $columns[] = 'order_items.size';
        }

        return $query->select($columns)->get();
    }

    public function getDeliveryOrders($deliveryPersonId, $status = null)
    {
        $query = DB::table('orders')
            ->where('delivery_person_id', (int) $deliveryPersonId);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function getClientOrders($clientUserId, $status = null, $page = 1, $perPage = 20)
    {
        $query = DB::table('orders')
            ->where('customer_user_id', (int) $clientUserId);

        if ($status) {
            $query->where('status', $status);
        }

        $total = (int) $query->count();
        $offset = max(0, ($page - 1) * $perPage);

        $rows = $query
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get();

        return array('data' => $rows, 'total' => $total);
    }

    public function getOrderItems($orderId)
    {
        return DB::table('order_items')
            ->where('order_id', (int) $orderId)
            ->orderBy('id', 'asc')
            ->get();
    }

    public function getItemsByOrderIds($orderIds)
    {
        $normalizedIds = array_values(array_unique(array_map('intval', (array)$orderIds)));
        if (count($normalizedIds) === 0) {
            return array();
        }

        $rows = DB::table('order_items')
            ->whereIn('order_id', $normalizedIds)
            ->orderBy('id', 'asc')
            ->get();

        $grouped = array();
        foreach ($rows as $row) {
            $orderId = isset($row->order_id) ? (int)$row->order_id : 0;
            if (!isset($grouped[$orderId])) {
                $grouped[$orderId] = array();
            }
            $grouped[$orderId][] = $row;
        }

        return $grouped;
    }
}
