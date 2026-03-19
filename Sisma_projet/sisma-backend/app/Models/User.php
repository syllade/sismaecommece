<?php

namespace App;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'supplier_id',
        'delivery_person_id',
        'activation_token',
        'activation_token_expires_at',
        'password_set_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $dates = [
        'email_verified_at',
        'deleted_at',
        'activation_token_expires_at',
        'password_set_at',
    ];

    public function isAdmin()
    {
        return isset($this->role) && $this->role === 'admin';
    }

    public function isSupplier()
    {
        return isset($this->role) && $this->role === 'supplier';
    }

    public function isDelivery()
    {
        return isset($this->role) && $this->role === 'delivery';
    }

    public function isClient()
    {
        return isset($this->role) && $this->role === 'client';
    }

    public function redirectPathByRole()
    {
        $role = isset($this->role) ? $this->role : 'client';
        if ($role === 'admin') return '/admin/dashboard';
        if ($role === 'supplier') return '/supplier/dashboard';
        if ($role === 'delivery') return '/delivery/dashboard';
        return '/account';
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function apiTokens()
    {
        return $this->hasMany('App\Models\ApiToken');
    }

    public function createApiToken($expiresInDays = 30)
    {
        $apiToken = \App\Models\ApiToken::generateToken();
        $expiresAt = $expiresInDays ? \Carbon\Carbon::now()->addDays($expiresInDays) : null;
        
        return $this->apiTokens()->create([
            'token' => $apiToken,
            'expires_at' => $expiresAt,
        ]);
    }
}
