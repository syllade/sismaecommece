<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Maintenance Mode Middleware
 * 
 * Checks if maintenance mode is enabled and blocks non-admin users
 */
class MaintenanceMode
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip if in console or debug mode
        if (app()->runningInConsole() || config('app.debug')) {
            return $next($request);
        }

        // Get maintenance mode setting
        try {
            $maintenanceMode = DB::table('settings')
                ->where('key', 'maintenance_mode')
                ->first();
            
            $isMaintenance = filter_var($maintenanceMode->value ?? 'false', FILTER_VALIDATE_BOOLEAN);
            
            if ($isMaintenance) {
                // Check if user is admin/super_admin
                $user = $request->user();
                
                $isAdmin = false;
                if ($user) {
                    $isAdmin = in_array($user->role, ['admin', 'super_admin']);
                }
                
                if (!$isAdmin) {
                    // Get maintenance message
                    $maintenanceMessage = DB::table('settings')
                        ->where('key', 'maintenance_message')
                        ->first();
                    
                    $message = $maintenanceMessage->value ?? 'Le site est en maintenance. Revenez bientôt!';
                    
                    return response()->json([
                        'success' => false,
                        'maintenance' => true,
                        'message' => $message,
                    ], 503);
                }
            }
        } catch (\Exception $e) {
            // If DB error, allow request (fail open)
            \Log::warning('Maintenance mode check failed: ' . $e->getMessage());
        }

        return $next($request);
    }
}
