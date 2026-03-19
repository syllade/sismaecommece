<?php

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Private Channels (Authenticated)
|--------------------------------------------------------------------------
|
| Private channels require authentication. The user must be authorized
| to listen to these channels.
|
*/

// Supplier channel - only the owner can listen
Broadcast::channel('supplier.{supplierId}', function ($user, $supplierId) {
    // Must be authenticated
    if (!$user) {
        return false;
    }

    // Get supplier ID from user
    $userSupplierId = null;
    
    if (isset($user->supplier_id) && $user->supplier_id) {
        $userSupplierId = (int) $user->supplier_id;
    } elseif ($user->role === 'supplier') {
        $supplier = \DB::table('suppliers')->where('user_id', $user->id)->first();
        if ($supplier) {
            $userSupplierId = $supplier->id;
        }
    }

    // Admin can listen to all supplier channels
    if ($user->role === 'admin' || $user->role === 'super_admin') {
        return true;
    }

    // Supplier can only listen to their own channel
    return (int) $userSupplierId === (int) $supplierId;
});

// Admin channel - only admins can listen
Broadcast::channel('admin', function ($user) {
    return $user && ($user->role === 'admin' || $user->role === 'super_admin');
});

// Delivery person channel
Broadcast::channel('delivery.{deliveryPersonId}', function ($user, $deliveryPersonId) {
    if (!$user) {
        return false;
    }

    if ($user->role === 'admin' || $user->role === 'super_admin') {
        return true;
    }

    if ($user->role === 'delivery') {
        $person = \DB::table('delivery_persons')->where('user_id', $user->id)->first();
        return $person && (int) $person->id === (int) $deliveryPersonId;
    }

    return false;
});

// Global supplier broadcasts (for admins)
Broadcast::channel('suppliers', function ($user) {
    return $user && ($user->role === 'admin' || $user->role === 'super_admin');
});

/*
|--------------------------------------------------------------------------
| Presence Channels
|--------------------------------------------------------------------------
|
| Presence channels show who is currently viewing a channel, useful for
| collaborative features.
|
*/

// Supplier dashboard presence
Broadcast::channel('presence-supplier.{supplierId}', function ($user, $supplierId) {
    if (!$user) {
        return false;
    }

    // Get supplier info
    $userSupplierId = null;
    if (isset($user->supplier_id) && $user->supplier_id) {
        $userSupplierId = (int) $user->supplier_id;
    } elseif ($user->role === 'supplier') {
        $supplier = \DB::table('suppliers')->where('user_id', $user->id)->first();
        if ($supplier) {
            $userSupplierId = $supplier->id;
        }
    }

    // Must be owner or admin
    $isAdmin = $user->role === 'admin' || $user->role === 'super_admin';
    if ((int) $userSupplierId !== (int) $supplierId && !$isAdmin) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
    ];
});
