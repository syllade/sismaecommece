export type TimeGranularity = "day" | "week" | "month";

export type SupplierStatus = "active" | "blocked";
export type DeliveryStatus = "active" | "inactive";
export type CampaignStatus = "active" | "paused" | "completed" | "expired";

export interface SuperAdminKpis {
  totalOrders: number;
  revenue: number;
  outOfStockProducts: number;
  pendingOrders: number;
}

export interface SuperAdminOrder {
  id: number;
  customer: string;
  supplier: string;
  deliveryPerson: string;
  deliveryPersonId: number | null;
  supplierId: number | null;
  status: string;
  date: string;
  total: number;
  commune: string;
  deliveryType: string;
}

export interface SuperAdminSupplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: SupplierStatus;
  productsCount: number;
  pendingOrders: number;
}

export interface SuperAdminDeliveryPerson {
  id: number;
  name: string;
  email: string;
  phone: string;
  zone: string;
  status: DeliveryStatus;
  assignedOrders: number;
}

export interface RealtimeAlert {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  description: string;
  createdAt: string;
}

export interface SponsoredCampaign {
  id: number;
  name?: string;
  status: CampaignStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversion_rate: number;
  cost_per_click?: number;
  budget_remaining?: number;
  budget_used_percent?: number;
  start_date?: string;
  end_date?: string | null;
  product?: { id: number; name: string; image?: string | null };
  supplier?: { id: number; name: string; logo?: string | null };
}

export interface SponsoredChartPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

export interface SponsoredSupplierSummary {
  supplier_id: number;
  supplier_name?: string;
  supplier_logo?: string | null;
  campaign_count: number;
  total_clicks: number;
  total_impressions: number;
  total_conversions: number;
  total_spent: number;
}

export interface SponsoredDashboard {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    paused_campaigns: number;
    completed_campaigns: number;
    expired_campaigns: number;
  };
  budget: {
    total_budget: number;
    total_spent: number;
    remaining: number;
    spend_percentage: number;
  };
  performance: {
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    overall_ctr: number;
    overall_conversion_rate: number;
  };
  alerts: {
    low_budget: number;
    expiring_soon: number;
    expired: number;
  };
  top_products: SponsoredCampaign[];
  top_suppliers: SponsoredSupplierSummary[];
  chart_data: SponsoredChartPoint[];
}
