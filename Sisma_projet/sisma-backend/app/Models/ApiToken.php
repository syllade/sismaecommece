<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ApiToken extends Model
{
    protected $table = 'api_tokens';
    
    protected $fillable = [
        'user_id',
        'token',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo('App\User');
    }

    /**
     * Generer un token unique
     */
    public static function generateToken()
    {
        return bin2hex(openssl_random_pseudo_bytes(30));
    }

    /**
     * Verifier si le token est valide
     */
    public function isValid()
    {
        if (!$this->expires_at) {
            return true; // No expiration
        }
        
        // Ensure expires_at is a Carbon instance
        $expiresAt = $this->expires_at;
        if (is_string($expiresAt)) {
            $expiresAt = Carbon::parse($expiresAt);
        }
        
        if ($expiresAt->isPast()) {
            return false;
        }
        return true;
    }
}
