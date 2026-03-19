import { cn } from '@/lib/utils';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  out_for_delivery: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; border: string; text: string; icon: string }> = {
  pending: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', icon: 'bg-orange-400' },
  confirmed: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', icon: 'bg-blue-400' },
  preparing: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', icon: 'bg-purple-400' },
  shipped: { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700', icon: 'bg-indigo-400' },
  out_for_delivery: { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700', icon: 'bg-cyan-400' },
  delivered: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', icon: 'bg-green-400' },
  cancelled: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', icon: 'bg-red-400' },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered'];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderTimeline({ currentStatus, statusHistory }: OrderTimelineProps) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="space-y-4">
      {/* Status Flow */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
        
        <div className="space-y-6">
          {STATUS_FLOW.map((status, index) => {
            const isCompleted = !isCancelled && index < currentIndex;
            const isCurrent = status === currentStatus;
            const colors = STATUS_COLORS[status];
            
            // Skip showing future statuses if cancelled
            if (isCancelled && index > currentIndex) return null;

            return (
              <div key={status} className="relative flex items-start gap-4">
                {/* Icon Circle */}
                <div
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                    isCompleted || isCurrent ? colors.bg : "bg-slate-100",
                    isCompleted && "ring-4 ring-white dark:ring-slate-900"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full",
                      isCompleted || isCurrent ? colors.icon : "bg-slate-300"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        isCurrent ? colors.text : isCompleted ? "text-slate-700" : "text-slate-400"
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                    {isCurrent && (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                        Actuel
                      </span>
                    )}
                  </div>
                  
                  {/* Show timestamp if in history */}
                  {statusHistory && statusHistory.find(h => h.status === status) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(statusHistory.find(h => h.status === status)?.timestamp || '')}
                      {statusHistory.find(h => h.status === status)?.note && (
                        <span className="ml-2 text-slate-400">
                          - {statusHistory.find(h => h.status === status)?.note}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancelled Status Special Display */}
      {isCancelled && (
        <div className={cn("p-4 rounded-lg", STATUS_COLORS.cancelled.bg)}>
          <p className={cn("font-medium", STATUS_COLORS.cancelled.text)}>
            Commande annulée
          </p>
          {statusHistory && statusHistory.find(h => h.status === 'cancelled') && (
            <p className="text-xs text-slate-500 mt-1">
              {formatDate(statusHistory.find(h => h.status === 'cancelled')?.timestamp || '')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for tables
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const colors = STATUS_COLORS[status];
  const isCancelled = status === 'cancelled';
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        colors.bg,
        colors.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", colors.icon)} />
      {STATUS_LABELS[status]}
    </span>
  );
}
