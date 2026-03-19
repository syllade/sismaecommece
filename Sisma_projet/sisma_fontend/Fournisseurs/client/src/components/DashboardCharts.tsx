import { useState } from 'react';
import { useRevenueChart, useTopProducts, RevenueChartData, TopProductData } from '@/hooks/use-v1-supplier';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

function KPICard({ title, value, change, icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        {icon && (
          <div className="text-sisma-red">
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs période précédente
        </p>
      )}
    </div>
  );
}

function RevenueChart({ data, isLoading }: { data?: RevenueChartData[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Chargement du graphique...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const width = 100 / data.length;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between h-48 gap-1">
        {data.map((item, index) => {
          const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center"
              style={{ height: '100%' }}
            >
              <div
                className="w-full bg-sisma-red/80 hover:bg-sisma-red rounded-t transition-all cursor-pointer relative group"
                style={{ height: `${height}%`, minHeight: '4px' }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                  {item.revenue.toLocaleString()} F
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function OrdersChart({ data, isLoading }: { data?: RevenueChartData[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Chargement du graphique...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  const maxOrders = Math.max(...data.map(d => d.orders_count));

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between h-48 gap-1">
        {data.map((item, index) => {
          const height = maxOrders > 0 ? (item.orders_count / maxOrders) * 100 : 0;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center"
              style={{ height: '100%' }}
            >
              <div
                className="w-full bg-sisma-orange/80 hover:bg-sisma-orange rounded-t transition-all cursor-pointer relative group"
                style={{ height: `${height}%`, minHeight: '4px' }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                  {item.orders_count} commandes
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function TopProductsChart({ data, isLoading }: { data?: TopProductData[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Aucun produit</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((product, index) => {
        const width = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
        return (
          <div key={product.product_id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="truncate flex-1">{index + 1}. {product.product_name}</span>
              <span className="text-gray-500">{product.revenue.toLocaleString()} F</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sisma-red to-sisma-orange rounded-full"
                style={{ width: `${width}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{product.total_sold} ventes</p>
          </div>
        );
      })}
    </div>
  );
}

interface DashboardChartsProps {
  className?: string;
}

export function DashboardCharts({ className = '' }: DashboardChartsProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const days = period === 'day' ? 30 : period === 'week' ? 12 : 12;
  
  const { data: revenueData, isLoading: revenueLoading } = useRevenueChart(period, days);
  const { data: topProductsData, isLoading: topProductsLoading } = useTopProducts(5, days);

  // Calculate totals
  const totalRevenue = revenueData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalOrders = revenueData?.reduce((sum, item) => sum + item.orders_count, 0) || 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Period Selector */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setPeriod('day')}
          className={`px-3 py-1 text-sm rounded ${period === 'day' ? 'bg-sisma-red text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Jours
        </button>
        <button
          onClick={() => setPeriod('week')}
          className={`px-3 py-1 text-sm rounded ${period === 'week' ? 'bg-sisma-red text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Semaines
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-3 py-1 text-sm rounded ${period === 'month' ? 'bg-sisma-red text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Mois
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Chiffre d'affaires"
          value={totalRevenue.toLocaleString() + ' F'}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Commandes"
          value={totalOrders}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <KPICard
          title="Panier moyen"
          value={totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() + ' F' : '0 F'}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Chiffre d'affaires</h3>
          <RevenueChart data={revenueData} isLoading={revenueLoading} />
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Commandes</h3>
          <OrdersChart data={revenueData} isLoading={revenueLoading} />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Top 5 Produits</h3>
          <TopProductsChart data={topProductsData} isLoading={topProductsLoading} />
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
