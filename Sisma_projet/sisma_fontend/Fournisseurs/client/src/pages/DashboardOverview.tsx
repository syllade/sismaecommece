import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ArrowRight
} from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "wouter";

const chartData = [
  { name: "Lun", revenue: 4000, commandes: 2 },
  { name: "Mar", revenue: 3000, commandes: 1 },
  { name: "Mer", revenue: 5000, commandes: 3 },
  { name: "Jeu", revenue: 2780, commandes: 2 },
  { name: "Ven", revenue: 6890, commandes: 5 },
  { name: "Sam", revenue: 8390, commandes: 4 },
  { name: "Dim", revenue: 7490, commandes: 3 },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  validated: { bg: "bg-blue-50", text: "text-blue-700", icon: CheckCircle },
  preparing: { bg: "bg-purple-50", text: "text-purple-700", icon: Package },
  ready: { bg: "bg-green-50", text: "text-green-700", icon: CheckCircle },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
};

export default function DashboardOverview() {
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalOrders = orders.length;
  const publishedProducts = products.filter(p => p.status === 'published').length;
  const lowStockProducts = products.filter(p => {
    const stock = p.stock || 0;
    return p.status === 'published' && stock > 0 && stock <= 10;
  });
  
  const unvalidatedProducts = products.filter(p => p.status === 'draft').length;

  // Calculate conversion rate
  const conversionRate = totalOrders > 0 ? ((totalOrders / (publishedProducts || 1)) * 100).toFixed(1) : "0";

  // Get recent orders
  const recentOrders = orders.slice(0, 5).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Get notifications
  const notifications = [
    ...(pendingOrders > 0 ? [{ type: 'warning', icon: Clock, message: `${pendingOrders} commandes en attente de traitement` }] : []),
    ...(lowStockProducts.length > 0 ? [{ type: 'alert', icon: AlertTriangle, message: `${lowStockProducts.length} produits ont un stock faible` }] : []),
    ...(unvalidatedProducts > 0 ? [{ type: 'info', icon: Eye, message: `${unvalidatedProducts} produits en validation` }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-1">Aperçu temps réel de votre boutique SISMA</p>
        </div>

        {/* Bento Grid Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#D81918]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Chiffre d'Affaires Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-green-600 mt-2 flex items-center font-semibold">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">{pendingOrders}</div>
              <p className="text-xs text-gray-600 mt-2">À traiter immédiatement</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-bold text-emerald-600">{totalOrders}</div>
              <p className="text-xs text-gray-600 mt-2">Taux de conversion: {conversionRate}%</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Produits Publiés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-bold text-orange-600">{publishedProducts}</div>
              <p className="text-xs text-gray-600 mt-2">{unvalidatedProducts} en préparation</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Tendance des Revenus</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D81918" 
                    strokeWidth={3} 
                    dot={{ fill: '#D81918', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Alertes & Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Tout est en ordre!</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${notif.type === 'warning' ? 'bg-amber-50 border border-amber-200' : notif.type === 'alert' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-sm font-medium ${notif.type === 'warning' ? 'text-amber-700' : notif.type === 'alert' ? 'text-red-700' : 'text-blue-700'}`}>
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <Card className="border-l-4 border-l-[#F7941D] hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F7941D]" />
                Produits en Rupture de Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {lowStockProducts.slice(0, 6).map((product, idx) => (
                  <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="font-semibold text-gray-900 text-sm">{product.title || 'Produit sans titre'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                        Stock: {product.stock || 0}
                      </Badge>
                      <Link href="/dashboard/products" className="text-xs text-[#D81918] hover:underline font-medium">
                        Modifier
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockProducts.length > 6 && (
                <p className="text-sm text-gray-600 mt-4">
                  Et {lowStockProducts.length - 6} autres produits...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Commandes Récentes</CardTitle>
            <Link href="/dashboard/orders" className="text-xs text-[#D81918] font-semibold hover:underline flex items-center gap-1">
              Voir toutes <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-6">Aucune commande pour le moment</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">Commande #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customerName || 'Client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${Number(order.totalAmount || 0).toFixed(2)}</p>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${STATUS_COLORS[order.status]?.bg || 'bg-gray-50'} ${STATUS_COLORS[order.status]?.text || 'text-gray-700'}`}
                      >
                        {order.status === 'pending' ? 'En attente' : order.status === 'prepared' ? 'Préparée' : order.status === 'shipped' ? 'Expédiée' : 'Livrée'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
