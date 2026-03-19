import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiGet } from '@/api/http';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 'vendor' | 'order' | 'delivery' | 'stock' | 'revenue';

export interface SmartAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedEntity: {
    type: 'vendor' | 'order' | 'product' | 'driver';
    id: number;
    name: string;
  };
  recommendation: string;
  createdAt: string;
  dismissed: boolean;
  actionUrl?: string;
}

interface AlertsResponse {
  alerts: SmartAlert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
}

// Threshold configuration
const ALERT_THRESHOLDS = {
  vendor: {
    inactivityDays: 14, // Alert if no activity for 14 days
    cancellationRate: 15, // Alert if cancellation rate > 15%
    lowRating: 3.0, // Alert if rating < 3.0
  },
  order: {
    unassignedHours: 4, // Alert if order unassigned for > 4 hours
    delayedPreparationHours: 24, // Alert if order in preparation for > 24 hours
  },
  delivery: {
    delayedHours: 2, // Alert if delivery delayed by > 2 hours
    failedRate: 10, // Alert if failed delivery rate > 10%
  },
  stock: {
    lowStockThreshold: 5, // Alert if stock < 5
    outOfStockHours: 24, // Alert if out of stock for > 24 hours
  },
  revenue: {
    dailyDropPercent: 30, // Alert if daily revenue drops by > 30%
  },
};

export function useSmartAlerts() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['smart-alerts'],
    queryFn: () => apiGet<AlertsResponse>('/api/v1/admin/alerts/smart'),
    refetchInterval: 60000, // Check every minute
  });

  const alerts = useMemo(() => {
    if (!data?.alerts) return [];
    return data.alerts.filter(a => !a.dismissed);
  }, [data]);

  const summary = useMemo(() => {
    if (!data?.summary) {
      return { total: 0, critical: 0, warning: 0, info: 0 };
    }
    return data.summary;
  }, [data]);

  const dismissAlert = async (alertId: string) => {
    try {
      await apiGet(`/api/v1/admin/alerts/${alertId}/dismiss`);
      refetch();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  return {
    alerts,
    summary,
    isLoading,
    dismissAlert,
    refetch,
  };
}

// Generate contextual recommendations based on alert type
export function getRecommendation(alert: SmartAlert): string {
  const recommendations: Record<string, string> = {
    vendor_inactive: 'Contacter le fournisseur pour identifier les problèmes. Envisager une formation ou un accompagnement.',
    vendor_high_cancellation: 'Analyser les raisons des annulations. Discuter avec le fournisseur pour améliorer le processus.',
    vendor_low_rating: 'Demander un retour clients. Aider le fournisseur à améliorer la qualité de ses produits/service.',
    order_unassigned: 'Assigner immédiatement un livreur ou relancer les livreurs disponibles.',
    order_delayed: 'Contacter le fournisseur pour accélérer la préparation. Envisager une livraison prioritaire.',
    delivery_delayed: 'Contacter le livreur pour obtenir une mise à jour. Informer le client du retard.',
    delivery_failed: 'Analyser la raison de l\'échec. Planifier une nouvelle tentative de livraison.',
    stock_low: 'Contacter le fournisseur pour un réapprovisionnement urgent.',
    stock_out: 'Suspendre temporairement les ventes du produit ou afficher \"rupture de stock\".',
    revenue_drop: 'Analyser les causes (saisonnalité, problèmes techniques, concurrence). Ajuster les stratégies marketing.',
  };

  const key = `${alert.category}_${alert.severity}`;
  return recommendations[key] || 'Examiner la situation et prendre les mesures appropriées.';
}

// Check if alert requires immediate action
export function requiresImmediateAction(alert: SmartAlert): boolean {
  return alert.severity === 'critical' && 
    (alert.category === 'order' || alert.category === 'delivery');
}
