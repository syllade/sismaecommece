import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/api/http';

// Order status workflow
export type OrderStatus = 
  | 'pending'      // Commande reçue, en attente de confirmation
  | 'confirmed'    // Confirmée par le fournisseur
  | 'preparing'    // En cours de préparation
  | 'ready'        // Prête pour ramassage
  | 'shipped'      // Expédiée
  | 'out_for_delivery'  // En livraison
  | 'delivered'    // Livrée
  | 'cancelled';   // Annulée

export interface OrderActivity {
  id: number;
  order_id: number;
  type: 'status_change' | 'driver_assigned' | 'payment' | 'note' | 'delivery';
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  created_by?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

// Workflow status configuration
export const ORDER_WORKFLOW: Array<{
  status: OrderStatus;
  label: string;
  color: string;
  next: OrderStatus[];
  autoAssign?: boolean;
}> = [
  {
    status: 'pending',
    label: 'En attente',
    color: 'bg-orange-100 text-orange-700',
    next: ['confirmed', 'cancelled'],
  },
  {
    status: 'confirmed',
    label: 'Confirmée',
    color: 'bg-blue-100 text-blue-700',
    next: ['preparing', 'cancelled'],
  },
  {
    status: 'preparing',
    label: 'En préparation',
    color: 'bg-purple-100 text-purple-700',
    next: ['ready', 'cancelled'],
  },
  {
    status: 'ready',
    label: 'Prête',
    color: 'bg-indigo-100 text-indigo-700',
    next: ['shipped', 'out_for_delivery'],
  },
  {
    status: 'shipped',
    label: 'Expédiée',
    color: 'bg-cyan-100 text-cyan-700',
    next: ['out_for_delivery'],
  },
  {
    status: 'out_for_delivery',
    label: 'En livraison',
    color: 'bg-yellow-100 text-yellow-700',
    next: ['delivered', 'cancelled'],
  },
  {
    status: 'delivered',
    label: 'Livrée',
    color: 'bg-green-100 text-green-700',
    next: [],
  },
  {
    status: 'cancelled',
    label: 'Annulée',
    color: 'bg-red-100 text-red-700',
    next: [],
  },
];

// API functions
export const orderWorkflowApi = {
  // Get order activity
  getOrderActivity: (orderId: number) =>
    apiGet<OrderActivity[]>(`/api/v1/admin/orders/${orderId}/activity`),

  // Get order timeline
  getOrderTimeline: (orderId: number) =>
    apiGet<OrderTimelineEvent[]>(`/api/v1/admin/orders/${orderId}/timeline`),

  // Update order status
  updateStatus: (orderId: number, status: OrderStatus, note?: string) =>
    apiPut<{ success: boolean }>(`/api/v1/admin/orders/${orderId}/status`, { status, note }),

  // Auto-assign driver to order
  autoAssignDriver: (orderId: number, algorithm?: 'nearest' | 'fastest' | 'round_robin') =>
    apiPost<{ success: boolean; driver_id?: number }>(`/api/v1/admin/orders/${orderId}/auto-assign`, {
      algorithm: algorithm || 'nearest',
    }),

  // Assign driver
  assignDriver: (orderId: number, driverId: number) =>
    apiPost<{ success: boolean }>(`/api/v1/admin/orders/${orderId}/assign-driver`, {
      driver_id: driverId,
    }),

  // Bulk status update
  bulkUpdateStatus: (orderIds: number[], status: OrderStatus) =>
    apiPost<{ affected_count: number }>('/api/v1/admin/orders/bulk-status', {
      order_ids: orderIds,
      status,
    }),

  // Bulk driver assignment
  bulkAssignDriver: (orderIds: number[], driverId: number) =>
    apiPost<{ affected_count: number }>('/api/v1/admin/orders/assign-driver', {
      order_ids: orderIds,
      driver_id: driverId,
    }),

  // Send to WhatsApp
  sendWhatsApp: (orderId: number, type: 'new_order' | 'status_update' | 'delivery_confirmed') =>
    apiPost<{ success: boolean; whatsapp_url: string }>(`/api/v1/admin/orders/${orderId}/send-whatsapp`, {
      type,
    }),

  // Get available drivers for order
  getAvailableDrivers: (orderId: number) =>
    apiGet<Array<{ id: number; name: string; phone: string; zone: string; distance?: number }>>(
      `/api/v1/admin/orders/${orderId}/available-drivers`
    ),
};

// Hooks
export function useOrderActivity(orderId: number) {
  return useQuery({
    queryKey: ['order', orderId, 'activity'],
    queryFn: () => orderWorkflowApi.getOrderActivity(orderId),
    enabled: !!orderId,
    refetchInterval: 30000,
  });
}

export function useOrderTimeline(orderId: number) {
  return useQuery({
    queryKey: ['order', orderId, 'timeline'],
    queryFn: () => orderWorkflowApi.getOrderTimeline(orderId),
    enabled: !!orderId,
  });
}

export function useAvailableDrivers(orderId: number) {
  return useQuery({
    queryKey: ['order', orderId, 'available-drivers'],
    queryFn: () => orderWorkflowApi.getAvailableDrivers(orderId),
    enabled: !!orderId,
  });
}

// Mutations
export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: number; status: OrderStatus; note?: string }) =>
      orderWorkflowApi.updateStatus(orderId, status, note),
  });
}

export function useAutoAssignDriver() {
  return useMutation({
    mutationFn: ({ orderId, algorithm }: { orderId: number; algorithm?: 'nearest' | 'fastest' | 'round_robin' }) =>
      orderWorkflowApi.autoAssignDriver(orderId, algorithm),
  });
}

export function useAssignOrderDriver() {
  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) =>
      orderWorkflowApi.assignDriver(orderId, driverId),
  });
}

export function useBulkUpdateOrderStatus() {
  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: number[]; status: OrderStatus }) =>
      orderWorkflowApi.bulkUpdateStatus(orderIds, status),
  });
}

export function useBulkAssignOrderDriver() {
  return useMutation({
    mutationFn: ({ orderIds, driverId }: { orderIds: number[]; driverId: number }) =>
      orderWorkflowApi.bulkAssignDriver(orderIds, driverId),
  });
}

export function useSendOrderWhatsApp() {
  return useMutation({
    mutationFn: ({ orderId, type }: { orderId: number; type: 'new_order' | 'status_update' | 'delivery_confirmed' }) =>
      orderWorkflowApi.sendWhatsApp(orderId, type),
  });
}

// Helper functions
export function getStatusLabel(status: OrderStatus): string {
  const config = ORDER_WORKFLOW.find(w => w.status === status);
  return config?.label || status;
}

export function getStatusColor(status: OrderStatus): string {
  const config = ORDER_WORKFLOW.find(w => w.status === status);
  return config?.color || 'bg-slate-100 text-slate-700';
}

export function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  const config = ORDER_WORKFLOW.find(w => w.status === currentStatus);
  return config?.next || [];
}

export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return getNextStatuses(currentStatus).includes(targetStatus);
}

export function formatActivityTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}
