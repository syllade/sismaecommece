<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public static function record($action, $user = null, $meta = array(), $entityType = null, $entityId = null, $status = 'success')
    {
        $userId = ($user && isset($user->id)) ? (int)$user->id : null;
        $role = ($user && isset($user->role)) ? (string)$user->role : null;
        $ip = null;
        $userAgent = null;

        try {
            $request = Request::instance();
            if ($request) {
                $ip = method_exists($request, 'ip') ? $request->ip() : null;
                $userAgent = $request->header('User-Agent');
            }
        } catch (\Exception $e) {
            // No-op
        }

        $payload = array(
            'event' => 'audit',
            'action' => $action,
            'status' => $status,
            'user_id' => $userId,
            'role' => $role,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip' => $ip,
            'meta' => $meta,
        );

        Log::info('AUDIT', $payload);

        try {
            $tableExists = true;
            try {
                DB::table('audit_logs')->limit(1)->get();
            } catch (\Exception $e) {
                $tableExists = false;
            }

            if ($tableExists) {
                DB::table('audit_logs')->insert(array(
                    'user_id' => $userId,
                    'role' => $role,
                    'action' => $action,
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'status' => $status,
                    'ip_address' => $ip,
                    'user_agent' => $userAgent,
                    'metadata' => !empty($meta) ? json_encode($meta) : null,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ));
            }
        } catch (\Exception $e) {
            Log::warning('Audit DB write failed', array(
                'action' => $action,
                'error' => $e->getMessage(),
            ));
        }
    }
}
