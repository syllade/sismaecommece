<?php

namespace App\Http\Middleware;

use App\Services\CommissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSupplierCommissions
{
    /**
     * Handle an incoming request.
     * Blocks order processing if supplier has overdue commissions
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        
        if (!$user) {
            return $next($request);
        }

        // Get supplier ID
        $supplier = \DB::table('suppliers')
            ->where('user_id', $user->id)
            ->first();
        
        if (!$supplier) {
            return $next($request);
        }

        // Check if supplier has overdue commissions
        $commissionService = app(CommissionService::class);
        
        if ($commissionService->hasOverdueCommissions($supplier->id)) {
            // Allow read operations, block write operations
            if ($request->isMethod('post') || $request->isMethod('put') || $request->isMethod('delete')) {
                // Check if it's order status update
                if ($request->is('api/v1/supplier/orders/*/status') || 
                    $request->is('api/v1/supplier/orders/*')) {
                    
                    return response()->json([
                        'message' => 'Votre compte est temporairement restreint pour commission impayée. Veuillez régulariser votre situation.',
                        'code' => 'COMMISSION_OVERDUE',
                        'overdue_commissions' => true,
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
