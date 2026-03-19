import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { deliveriesApi } from "@/api/deliveries.api";
import { sponsoredApi } from "@/api/sponsored.api";
import { ordersApi, toUiOrderStatus } from "@/api/orders.api";
import { statsApi } from "@/api/stats.api";
import { vendorsApi } from "@/api/vendors.api";
import type {
  CampaignStatus,
  SponsoredCampaign,
  RealtimeAlert,
  SuperAdminDeliveryPerson,
  SuperAdminKpis,
  SuperAdminOrder,
  SuperAdminSupplier,
} from "@/types/super-admin";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value === "1" || value.toLowerCase() === "true";
  return fallback;
}

export function useSuperAdminOrders() {
  return useQuery({
    queryKey: ["super-admin", "orders", "v1"],
    queryFn: () => ordersApi.listAdminOrders({ page: 1, per_page: 250 }),
    refetchInterval: 30000,
  });
}

export function useSuperAdminSuppliers() {
  return useQuery({
    queryKey: ["super-admin", "suppliers", "v1"],
    queryFn: () => vendorsApi.listAdminSuppliers({ status: "all", page: 1, per_page: 200 }),
    select: (rows): SuperAdminSupplier[] =>
      rows.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone || "n/a",
        status: toBoolean(supplier.is_active, true) ? "active" : "blocked",
        productsCount: toNumber(supplier.products_count, 0),
        pendingOrders: toNumber(supplier.pending_orders_count, 0),
      })),
    refetchInterval: 45000,
  });
}

export function useSuperAdminDeliveryPeople(orders: SuperAdminOrder[]) {
  return useQuery({
    queryKey: ["super-admin", "drivers", "v1"],
    queryFn: async () => {
      const rows = await deliveriesApi.listAdminDrivers({ page: 1, per_page: 200 });
      const ordersByDriver = new Map<number, number>();
      for (const order of orders) {
        if (!order.deliveryPersonId) continue;
        ordersByDriver.set(order.deliveryPersonId, (ordersByDriver.get(order.deliveryPersonId) ?? 0) + 1);
      }

      return rows.map((driver): SuperAdminDeliveryPerson => ({
        id: driver.id,
        name: driver.name,
        email: driver.email || "n/a",
        phone: driver.phone || "n/a",
        zone: driver.zone || "Abidjan",
        status: toBoolean(driver.is_active, true) ? "active" : "inactive",
        assignedOrders: ordersByDriver.get(driver.id) ?? 0,
      }));
    },
    refetchInterval: 45000,
  });
}

export function useSponsoredDashboard() {
  return useQuery({
    queryKey: ["super-admin", "sponsored-dashboard", "v1"],
    queryFn: () => sponsoredApi.getDashboard(),
    refetchInterval: 60000,
  });
}

export function useSuperAdminMarketingCampaigns(params?: { status?: CampaignStatus | "all"; search?: string }) {
  return useQuery({
    queryKey: ["super-admin", "sponsored-campaigns", "v1", params?.status ?? "all", params?.search ?? ""],
    queryFn: async (): Promise<SponsoredCampaign[]> => {
      const res = await sponsoredApi.listCampaigns({ status: params?.status ?? "all", search: params?.search, page: 1, per_page: 200 });
      return res.data ?? [];
    },
    refetchInterval: 60000,
  });
}

export function useSuperAdminDashboardData() {
  const statsQuery = useQuery({
    queryKey: ["super-admin", "stats", "v1"],
    queryFn: () => statsApi.getAdminStats(),
    refetchInterval: 30000,
  });
  const suppliersQuery = useSuperAdminSuppliers();
  const rawOrdersQuery = useSuperAdminOrders();

  const suppliers = suppliersQuery.data ?? [];
  const supplierNameById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers]);

  const orders = useMemo<SuperAdminOrder[]>(() => {
    const rows = rawOrdersQuery.data ?? [];
    return rows.map((order) => {
      const supplierId = order.supplier_id ?? null;
      const deliveryPersonId = order.delivery_person_id ?? null;

      const supplierName =
        toStringValue(order.supplier_name) ||
        (supplierId ? supplierNameById.get(supplierId) || "" : "") ||
        "Multi";

      const deliveryPersonName =
        toStringValue(order.delivery_person?.name) ||
        toStringValue((order as { delivery_person_name?: string }).delivery_person_name) ||
        "Attribuer";

      return {
        id: order.id,
        customer: toStringValue(order.customer_name, "Client"),
        supplier: supplierName,
        supplierId,
        deliveryPerson: deliveryPersonName,
        deliveryPersonId,
        status: toUiOrderStatus(order.status),
        date: toStringValue(order.created_at, new Date().toISOString()),
        total: toNumber(order.total, 0),
        commune: toStringValue(order.commune, "Abidjan"),
        deliveryType: toStringValue(order.delivery_type, "forward"),
      };
    });
  }, [rawOrdersQuery.data, supplierNameById]);

  const deliveryPeopleQuery = useSuperAdminDeliveryPeople(orders);
  const deliveryPeople = deliveryPeopleQuery.data ?? [];

  const kpis = useMemo<SuperAdminKpis>(() => {
    const stats = statsQuery.data;
    if (!stats) {
      return {
        totalOrders: orders.length,
        revenue: orders.reduce((sum, item) => sum + item.total, 0),
        outOfStockProducts: 0,
        pendingOrders: orders.filter((item) => item.status === "pending").length,
      };
    }

    return {
      totalOrders: toNumber(stats.orders_month, 0) || orders.length,
      revenue: toNumber(stats.revenue_total, 0),
      outOfStockProducts: toNumber(stats.out_of_stock_products, 0),
      pendingOrders: toNumber(stats.unassigned_orders, 0) || orders.filter((item) => item.status === "pending").length,
    };
  }, [statsQuery.data, orders]);

  const salesSeries = useMemo(() => {
    const rows = statsQuery.data?.charts?.orders_over_time ?? [];
    return rows.map((item) => ({
      label: item.date.length >= 10 ? item.date.slice(5, 10) : item.date,
      date: item.date,
      total: toNumber(item.revenue, 0),
    }));
  }, [statsQuery.data]);

  const ordersSeries = useMemo(() => {
    const rows = statsQuery.data?.charts?.orders_over_time ?? [];
    return rows.map((item) => ({
      label: item.date.length >= 10 ? item.date.slice(5, 10) : item.date,
      date: item.date,
      total: toNumber(item.orders, 0),
    }));
  }, [statsQuery.data]);

  const ordersByStatus = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const order of orders) {
      grouped.set(order.status, (grouped.get(order.status) ?? 0) + 1);
    }
    return Array.from(grouped.entries()).map(([status, total]) => ({ status, total }));
  }, [orders]);

  const alerts = useMemo<RealtimeAlert[]>(() => {
    const now = new Date().toISOString();
    const stats = statsQuery.data;
    if (!stats) return [];

    const list: RealtimeAlert[] = [];
    if (toNumber(stats.pending_suppliers, 0) > 0) {
      list.push({
        id: "pending-suppliers",
        level: "warning",
        title: "Fournisseurs en attente",
        description: `${toNumber(stats.pending_suppliers, 0)} fournisseur(s) a valider.`,
        createdAt: now,
      });
    }
    if (toNumber(stats.pending_drivers, 0) > 0) {
      list.push({
        id: "pending-drivers",
        level: "info",
        title: "Livreurs inactifs",
        description: `${toNumber(stats.pending_drivers, 0)} profil(s) livreur a activer.`,
        createdAt: now,
      });
    }
    if (toNumber(stats.unassigned_orders, 0) > 0) {
      const unassigned = toNumber(stats.unassigned_orders, 0);
      list.push({
        id: "unassigned-orders",
        level: unassigned > 15 ? "critical" : "warning",
        title: "Commandes non attribuees",
        description: `${unassigned} commande(s) sans livreur assigne.`,
        createdAt: now,
      });
    }
    return list;
  }, [statsQuery.data]);

  const activeSuppliers = useMemo(() => suppliers.filter((supplier) => supplier.status === "active").length, [suppliers]);

  return {
    orders,
    suppliers,
    deliveryPeople,
    salesSeries,
    ordersSeries,
    ordersByStatus,
    kpis,
    alerts,
    activeSuppliers,
    isLoading: rawOrdersQuery.isLoading || suppliersQuery.isLoading || deliveryPeopleQuery.isLoading || statsQuery.isLoading,
    refetchAll: async () => {
      await Promise.all([rawOrdersQuery.refetch(), suppliersQuery.refetch(), deliveryPeopleQuery.refetch(), statsQuery.refetch()]);
    },
  };
}
