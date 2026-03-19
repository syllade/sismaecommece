<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = array(
        'user_id',
        'role',
        'action',
        'entity_type',
        'entity_id',
        'status',
        'ip_address',
        'user_agent',
        'metadata',
    );
}
