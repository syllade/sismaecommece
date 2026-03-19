<?php

namespace App\Http\Middleware;

use Closure;
use App\Support\ApiResponse;

class RoleMiddleware
{
    /**
     * Verifie que l'utilisateur est authentifie et possede un role autorise.
     *
     * Usage route: middleware => 'role:admin' ou 'role:admin,supplier'
     */
    public function handle($request, Closure $next, $roles = '')
    {
        try {
            $user = $request->user();

            if (!$user) {
                return ApiResponse::error('Non authentifie', 401, 'AUTH_REQUIRED');
            }

            $allowedRoles = array();
            foreach (explode(',', (string) $roles) as $role) {
                $role = trim($role);
                if ($role !== '') {
                    $allowedRoles[] = strtolower($role);
                }
            }

            $currentRole = isset($user->role) ? strtolower((string) $user->role) : '';
            $isRoleAllowed = in_array($currentRole, $allowedRoles);

            // A super admin can access endpoints guarded for admin.
            if (!$isRoleAllowed && $currentRole === 'super_admin' && in_array('admin', $allowedRoles)) {
                $isRoleAllowed = true;
            }

            if (count($allowedRoles) > 0 && !$isRoleAllowed) {
                return ApiResponse::error('Acces refuse pour ce role', 403, 'ROLE_FORBIDDEN', array(
                    'required_roles' => $allowedRoles,
                    'current_role' => $currentRole,
                ));
            }

            return $next($request);
        } catch (\Exception $e) {
            \Log::error('RoleMiddleware Error: ' . $e->getMessage());
            return ApiResponse::error('Erreur de verification de role', 500, 'ROLE_ERROR');
        }
    }
}
