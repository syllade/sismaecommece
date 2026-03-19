<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Controller for supplier performance ranking
 * 
 * Endpoints:
 * - GET /api/v1/admin/suppliers/performance - Supplier ranking
 * - GET /api/v1/admin/suppliers/ranking - Ranking by period
 * - GET /api/v1/admin/suppliers/pending-registrations - Pending registrations
 * - POST /api/v1/admin/suppliers/{id}/validate - Validate a supplier
 * - POST /api/v1/admin/suppliers/{id}/reject - Reject a supplier
 */
class AdminSupplierPerformanceController extends Controller
{
    /**
     * GET /api/v1/admin/suppliers/performance
     * 
     * Supplier performance ranking
     */
    public function performance(Request $request)
    {
        try {
            $period = $request->get('period', 'month');
            $sortBy = $request->get('sort_by', 'score');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $dateFilter = $this->getDateFilter($period);
            
            $suppliers = DB::table('suppliers')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.logo,
                    suppliers.email,
                    suppliers.phone,
                    suppliers.is_active,
                    suppliers.created_at,
                    (SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id AND products.is_active = 1) as products_count,
                    COALESCE((
                        SELECT COUNT(*) FROM orders 
                        WHERE orders.supplier_id = suppliers.id 
                        AND orders.status = "delivered"
                        ' . ($dateFilter ? 'AND orders.created_at >= "' . $dateFilter . '"' : '') . '
                    ), 0) as total_orders,
                    COALESCE((
                        SELECT SUM(total) FROM orders 
                        WHERE orders.supplier_id = suppliers.id 
                        AND orders.status = "delivered"
                        ' . ($dateFilter ? 'AND orders.created_at >= "' . $dateFilter . '"' : '') . '
                    ), 0) as revenue,
                    COALESCE((
                        SELECT COUNT(*) FROM orders 
                        WHERE orders.supplier_id = suppliers.id 
                        AND orders.status IN ("pending", "processing")
                    ), 0) as pending_orders,
                    COALESCE((
                        SELECT (COUNT(*) * 100.0 / NULLIF((
                            SELECT COUNT(*) FROM orders 
                            WHERE orders.supplier_id = suppliers.id 
                            AND orders.status IN ("delivered", "failed")
                            ' . ($dateFilter ? 'AND orders.created_at >= "' . $dateFilter . '"' : '') . '
                        ), 0)) FROM orders 
                        WHERE orders.supplier_id = suppliers.id 
                        AND orders.status = "delivered"
                        ' . ($dateFilter ? 'AND orders.created_at >= "' . $dateFilter . '"' : '') . '
                    ), 0) as delivery_success_rate,
                    COALESCE((
                        SELECT AVG(rating) FROM testimonials 
                        WHERE testimonials.supplier_id = suppliers.id
                    ), 0) as avg_rating
                ')
                ->where('suppliers.is_active', 1)
                ->orderBy($sortBy === 'score' ? 'revenue' : $sortBy, $sortOrder)
                ->get();
            
            $suppliers = $suppliers->map(function ($supplier) {
                $supplier = (array) $supplier;
                
                $revenueScore = min($supplier['revenue'] / 10000, 100) * 0.4;
                $ordersScore = min($supplier['total_orders'] / 50, 100) * 0.3;
                $deliveryScore = $supplier['delivery_success_rate'] * 0.2;
                $ratingScore = ($supplier['avg_rating'] / 5) * 100 * 0.1;
                
                $supplier['score'] = round($revenueScore + $ordersScore + $deliveryScore + $ratingScore, 2);
                $supplier['avg_rating'] = round($supplier['avg_rating'], 1);
                $supplier['delivery_success_rate'] = round($supplier['delivery_success_rate'], 1);
                $supplier['revenue'] = round($supplier['revenue'], 2);
                
                // Calculate grading A-F based on score
                $supplier['grade'] = $this->calculateGrade($supplier['score']);
                
                return (object) $supplier;
            });
            
            if ($sortBy === 'score') {
                $suppliers = $suppliers->sortByDesc('score')->values();
            }
            
            $suppliers = $suppliers->map(function ($supplier, $index) {
                $supplier->rank = $index + 1;
                return $supplier;
            });
            
            return response()->json([
                'success' => true,
                'data' => $suppliers,
                'meta' => [
                    'period' => $period,
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder,
                    'total_suppliers' => count($suppliers)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSupplierPerformanceController performance error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading ranking'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/admin/suppliers/pending-registrations
     * 
     * List pending supplier registrations
     */
    public function pendingRegistrations(Request $request)
    {
        try {
            $search = trim($request->get('search', ''));
            
            $query = DB::table('suppliers')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.email,
                    suppliers.phone,
                    suppliers.logo,
                    suppliers.address,
                    suppliers.availability,
                    suppliers.is_active,
                    suppliers.created_at,
                    suppliers.updated_at,
                    (SELECT COUNT(*) FROM products 
                     WHERE products.supplier_id = suppliers.id 
                     AND products.is_active = 0) as pending_products_count,
                    (SELECT users.is_active FROM users WHERE users.supplier_id = suppliers.id LIMIT 1) as user_is_active
                ')
                ->where('suppliers.is_active', 0);
            
            if ($search !== '') {
                $query->where(function ($subQuery) use ($search) {
                    $like = '%' . $search . '%';
                    $subQuery->where('suppliers.name', 'like', $like)
                        ->orWhere('suppliers.email', 'like', $like)
                        ->orWhere('suppliers.phone', 'like', $like);
                });
            }
            
            $page = max(1, (int) $request->get('page', 1));
            $perPage = min(100, max(1, (int) $request->get('per_page', 25)));
            $offset = ($page - 1) * $perPage;
            
            $countQuery = clone $query;
            $total = (int) $countQuery->count();
            
            $suppliers = $query
                ->orderBy('suppliers.created_at', 'desc')
                ->offset($offset)
                ->limit($perPage)
                ->get();
            
            $lastPage = (int) max(1, ceil($total / $perPage));
            
            return response()->json([
                'success' => true,
                'data' => $suppliers,
                'meta' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage,
                    'has_next' => $page < $lastPage,
                    'has_prev' => $page > 1,
                    'search' => $search
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSupplierPerformanceController pendingRegistrations error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading registrations'
            ], 500);
        }
    }
    
    /**
     * POST /api/v1/admin/suppliers/{id}/validate
     * 
     * Validate/Activate a supplier
     */
    public function activateSupplier(Request $request, $id)
    {
        try {
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier not found'
                ], 404);
            }
            
            if ($supplier->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'This supplier is already active'
                ], 400);
            }
            
            DB::table('suppliers')
                ->where('id', $id)
                ->update([
                    'is_active' => 1,
                    'updated_at' => now()
                ]);
            
            DB::table('users')
                ->where('supplier_id', $id)
                ->update([
                    'is_active' => 1,
                    'email_verified_at' => now()
                ]);
            
            DB::table('products')
                ->where('supplier_id', $id)
                ->update([
                    'is_active' => 1,
                    'updated_at' => now()
                ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Supplier validated and activated successfully',
                'data' => [
                    'supplier_id' => $id,
                    'is_active' => 1,
                    'activated_at' => now()->toIso8601String()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSupplierPerformanceController validate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error validating supplier'
            ], 500);
        }
    }
    
    /**
     * POST /api/v1/admin/suppliers/{id}/reject
     * 
     * Reject/Delete a supplier
     */
    public function rejectSupplier(Request $request, $id)
    {
        try {
            $reason = $request->input('reason', '');
            
            $supplier = DB::table('suppliers')->where('id', $id)->first();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier not found'
                ], 404);
            }
            
            DB::table('suppliers')->where('id', $id)->delete();
            DB::table('users')->where('supplier_id', $id)->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Supplier rejected and deleted',
                'data' => [
                    'supplier_id' => $id,
                    'reason' => $reason,
                    'deleted_at' => now()->toIso8601String()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSupplierPerformanceController reject error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error rejecting supplier'
            ], 500);
        }
    }
    
    /**
     * GET /api/v1/admin/suppliers/stats
     * 
     * Global supplier statistics
     */
    public function stats(Request $request)
    {
        try {
            $period = $request->get('period', 'month');
            $dateFilter = $this->getDateFilter($period);
            
            $totalSuppliers = DB::table('suppliers')->count();
            $activeSuppliers = DB::table('suppliers')->where('is_active', 1)->count();
            $pendingSuppliers = DB::table('suppliers')->where('is_active', 0)->count();
            
            $newSuppliers = DB::table('suppliers')
                ->where('created_at', '>=', $dateFilter)
                ->count();
            
            $totalRevenue = DB::table('orders')
                ->where('status', 'delivered')
                ->when($dateFilter, function ($query) use ($dateFilter) {
                    return $query->where('created_at', '>=', $dateFilter);
                })
                ->sum('total');
            
            $totalOrders = DB::table('orders')
                ->when($dateFilter, function ($query) use ($dateFilter) {
                    return $query->where('created_at', '>=', $dateFilter);
                })
                ->count();
            
            $topSuppliers = DB::table('suppliers')
                ->selectRaw('
                    suppliers.id,
                    suppliers.name,
                    suppliers.logo,
                    (SELECT SUM(total) FROM orders WHERE orders.supplier_id = suppliers.id AND orders.status = "delivered"' . ($dateFilter ? ' AND orders.created_at >= "' . $dateFilter . '"' : '') . ') as revenue
                ')
                ->where('suppliers.is_active', 1)
                ->orderBy('revenue', 'desc')
                ->limit(5)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_suppliers' => $totalSuppliers,
                    'active_suppliers' => $activeSuppliers,
                    'pending_suppliers' => $pendingSuppliers,
                    'new_suppliers' => $newSuppliers,
                    'total_revenue' => round($totalRevenue, 2),
                    'total_orders' => $totalOrders,
                    'period' => $period,
                    'top_suppliers' => $topSuppliers
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSupplierPerformanceController stats error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading statistics'
            ], 500);
        }
    }
    
    /**
     * Helper: Get date filter by period
     */
    private function getDateFilter(string $period): ?string
    {
        switch ($period) {
            case 'day':
                return Carbon::today()->toDateTimeString();
            case 'week':
                return Carbon::now()->subWeek()->toDateTimeString();
            case 'month':
                return Carbon::now()->subMonth()->toDateTimeString();
            case 'year':
                return Carbon::now()->subYear()->toDateTimeString();
            case 'all':
            default:
                return null;
        }
    }
    
    /**
     * Helper: Calculate grade A-F based on score
     * A: 80-100, B: 60-79, C: 40-59, D: 20-39, F: 0-19
     */
    private function calculateGrade(float $score): string
    {
        if ($score >= 80) return 'A';
        if ($score >= 60) return 'B';
        if ($score >= 40) return 'C';
        if ($score >= 20) return 'D';
        return 'F';
    }
}
