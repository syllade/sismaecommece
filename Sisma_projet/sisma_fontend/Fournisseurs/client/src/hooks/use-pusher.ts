import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

// Event types from backend
interface OrderStatusEvent {
  order_id: number;
  order_number: string;
  old_status: string;
  new_status: string;
  message: string;
  timestamp: string;
}

interface NewOrderEvent {
  order_id: number;
  order_number: string;
  client_name: string;
  total: number;
  timestamp: string;
}

interface StockAlertEvent {
  product_id: number;
  product_name: string;
  current_stock: number;
  threshold: number;
  timestamp: string;
}

interface CampaignBudgetEvent {
  campaign_id: number;
  campaign_name: string;
  remaining_budget: number;
  is_low: boolean;
  timestamp: string;
}

// Pusher configuration
const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || 'your-pusher-key';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';
const SUPPLIER_TOKEN_KEY = "sisma_supplier_token";
const LEGACY_SUPPLIER_TOKEN_KEY = "fashop_supplier_token";

export function usePusher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get supplier ID from token (in real app, decode JWT)
  const getSupplierId = useCallback(() => {
    const token =
      localStorage.getItem(SUPPLIER_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY);
    if (!token) return null;
    
    try {
      // Simple JWT decode (in production use proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.supplier_id || payload.sub;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const supplierId = getSupplierId();
    if (!supplierId) return;

    const PusherCtor = (window as any).Pusher as any;
    if (!PusherCtor) {
      console.warn('Pusher SDK not loaded, realtime disabled.');
      return;
    }

    // Initialize Pusher
    const pusher: any = new PusherCtor(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: '/api/broadcasting/auth',
    });

    // Subscribe to supplier channel
    const channel: any = pusher.subscribe(`supplier.${supplierId}`);

    // Order status updated
    channel.bind('order.status.updated', (data: OrderStatusEvent) => {
      console.log('Order status updated:', data);
      
      toast({
        title: 'Commande mise à jour',
        description: `Commande ${data.order_number}: ${data.message}`,
        variant: data.new_status === 'cancelled' ? 'destructive' : 'default',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'dashboard'] });
    });

    // New order received
    channel.bind('order.created', (data: NewOrderEvent) => {
      console.log('New order:', data);
      
      toast({
        title: 'Nouvelle commande !',
        description: `Commande ${data.order_number} de ${data.client_name} - ${data.total}€`,
      });

      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'dashboard'] });
    });

    // Stock alert
    channel.bind('product.stock.low', (data: StockAlertEvent) => {
      console.log('Stock alert:', data);
      
      toast({
        title: 'Alerte stock',
        description: `${data.product_name}: Il ne reste que ${data.current_stock} unités`,
        variant: 'destructive',
      });

      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'dashboard'] });
    });

    // Campaign budget low
    channel.bind('campaign.budget.low', (data: CampaignBudgetEvent) => {
      console.log('Budget alert:', data);
      
      toast({
        title: 'Budget campagne faible',
        description: `Campagne "${data.campaign_name}": Plus que ${data.remaining_budget}€ restants`,
      });

      queryClient.invalidateQueries({ queryKey: ['supplier-v1', 'campaigns'] });
    });

    // Connection status
    pusher.connection.bind('connected', () => {
      console.log('Pusher connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
      toast({
        title: 'Connexion perdue',
        description: 'Reconnexion en cours...',
        variant: 'destructive',
      });
    });

    // Cleanup
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.unsubscribe_all();
    };
  }, [getSupplierId, queryClient, toast]);

  return null;
}

// Hook for campaign click tracking (anti-fraud)
export function useCampaignClick(campaignId: number) {
  const handleClick = useCallback(async (productId: number) => {
    try {
      const token =
        localStorage.getItem(SUPPLIER_TOKEN_KEY) ||
        localStorage.getItem(LEGACY_SUPPLIER_TOKEN_KEY);
      
      const response = await fetch('/api/v1/public/campaigns/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          product_id: productId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return await response.json();
    } catch (error) {
      console.error('Campaign click error:', error);
      throw error;
    }
  }, [campaignId]);

  return { trackClick: handleClick };
}
