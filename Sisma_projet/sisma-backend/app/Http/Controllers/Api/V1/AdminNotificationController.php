<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminNotificationController extends Controller
{
    /**
     * Get all notifications
     * GET /api/v1/admin/notifications
     */
    public function index(Request $request)
    {
        $query = AdminNotification::query()
            ->with('supplier')
            ->orderBy('created_at', 'desc');

        // Filter by type
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        // Filter read/unread
        if ($request->has('unread') && $request->unread) {
            $query->unread();
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => AdminNotification::unread()->count(),
        ]);
    }

    /**
     * Get unread count
     * GET /api/v1/admin/notifications/unread-count
     */
    public function unreadCount()
    {
        return response()->json([
            'success' => true,
            'count' => AdminNotification::unread()->count(),
        ]);
    }

    /**
     * Mark notification as read
     * PUT /api/v1/admin/notifications/{id}/read
     */
    public function markAsRead($id)
    {
        $notification = AdminNotification::findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
        ]);
    }

    /**
     * Mark all as read
     * PUT /api/v1/admin/notifications/read-all
     */
    public function markAllAsRead()
    {
        AdminNotification::where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues',
        ]);
    }

    /**
     * Delete notification
     * DELETE /api/v1/admin/notifications/{id}
     */
    public function destroy($id)
    {
        $notification = AdminNotification::findOrFail($id);
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée',
        ]);
    }

    /**
     * Get suppliers at threshold (exactly 10 products)
     * GET /api/v1/admin/suppliers/threshold-alert
     */
    public function thresholdAlerts()
    {
        // Get suppliers who just crossed or are near the threshold
        $suppliers = DB::table('suppliers')
            ->select([
                'suppliers.id',
                'suppliers.name',
                'suppliers.email',
                'suppliers.phone',
                'suppliers.is_approved',
                DB::raw('(SELECT COUNT(*) FROM products WHERE products.supplier_id = suppliers.id AND products.status = "active") as product_count'),
            ])
            ->having('product_count', '>=', 8)
            ->orderBy('product_count', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $suppliers->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'email' => $s->email,
                    'phone' => $s->phone,
                    'product_count' => $s->product_count,
                    'threshold_status' => $s->product_count >= 10 ? 'at_10_percent' : 'near_threshold',
                    'current_rate' => $s->product_count >= 10 ? '10%' : '5%',
                    'products_to_threshold' => max(0, 10 - $s->product_count),
                ];
            }),
        ]);
    }

    /**
     * Get notification stats for dashboard
     * GET /api/v1/admin/notifications/stats
     */
    public function stats()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'unread_total' => AdminNotification::unread()->count(),
                'product_threshold_alerts' => AdminNotification::unread()->byType('product_threshold')->count(),
                'commission_overdue_alerts' => AdminNotification::unread()->byType('commission_overdue')->count(),
                'recent_notifications' => AdminNotification::orderBy('created_at', 'desc')->limit(5)->get(),
            ],
        ]);
    }
}
