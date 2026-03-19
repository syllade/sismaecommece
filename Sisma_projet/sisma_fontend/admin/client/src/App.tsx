import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import AdminLoginPage from "@/pages/admin-login";
import AdminProductsPage from "@/pages/admin-products";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminOrdersPage from "@/pages/admin-orders";
import SuperAdminDashboardPage from "@/pages/super-admin-dashboard";
import SuperAdminSuppliersPage from "@/pages/super-admin-suppliers";
import SuperAdminDriversPage from "@/pages/super-admin-delivery";
import SuperAdminOrdersPage from "@/pages/super-admin-orders";
import SuperAdminLogisticsPage from "@/pages/super-admin-logistics";
import SuperAdminMarketingPage from "@/pages/super-admin-marketing";
import SuperAdminReportingPage from "@/pages/super-admin-reporting";
import SuperAdminSettingsPage from "@/pages/super-admin-settings";
import AdminRiskPage from "@/pages/admin-risk";
import LandingPageSettings from "@/pages/admin/LandingPageSettings";
import SupplierPerformancePage from "@/pages/admin/SupplierPerformance";
import PendingSupplierRegistrationsPage from "@/pages/admin/PendingSupplierRegistrations";
import CreateOrderPage from "@/pages/admin/CreateOrder";
import OrderQrCodePage from "@/pages/admin/OrderQrCode";
import CreateProductPage from "@/pages/admin/CreateProduct";
import DriverScanQrPage from "@/pages/driver/DriverScanQr";
import OrderDetailPage from "@/pages/admin/order-detail";
import AdminReturnsPage from "@/pages/admin-returns";
import AdminReviewsPage from "@/pages/admin-reviews";
import { AuthProvider } from "@/context/auth-context";
import { NotificationProvider } from "@/context/notification-context";
import { ProtectedRoute } from "@/components/protected-route";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-outfit text-3xl font-bold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-slate-500">
          Cette route admin n&apos;existe pas ou a ete deplacee.
        </p>
        <a
          href="/admin/dashboard"
          className="mt-6 inline-flex rounded-lg bg-sisma-red px-4 py-2 text-sm font-medium text-white hover:bg-sisma-red/90"
        >
          Retour a l'accueil admin
        </a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={AdminLoginPage} />
      <Route path="/">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <SuperAdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute roles={["admin"]}>
          <SuperAdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute roles={["admin"]}>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute roles={["admin"]}>
          <AdminOrdersPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/orders/create">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <CreateOrderPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/orders/qr">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <OrderQrCodePage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/orders/:id">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <OrderDetailPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/returns">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <AdminReturnsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/reviews">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <AdminReviewsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/products">
        <ProtectedRoute roles={["admin"]}>
          <AdminProductsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/products/create">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <CreateProductPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/suppliers">
        <ProtectedRoute roles={["admin"]}>
          <SuperAdminSuppliersPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/suppliers/pending">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <PendingSupplierRegistrationsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/suppliers/performance">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <SupplierPerformancePage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/drivers">
        <ProtectedRoute roles={["admin"]}>
          <SuperAdminDriversPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/drivers/scan">
        <ProtectedRoute roles={["admin"]}>
          <DriverScanQrPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/logistics">
        <ProtectedRoute roles={["admin"]}>
          <SuperAdminLogisticsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/marketing">
        <ProtectedRoute roles={["admin"]}>
          <SuperAdminMarketingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reporting">
        <ProtectedRoute roles={["admin"]}>
          <SuperAdminReportingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/risk">
        <ProtectedRoute roles={["admin"]}>
          <AdminRiskPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute roles={["admin"]}>
          <SuperAdminSettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings/landing">
        <ProtectedRoute roles={["admin", "super_admin"]}>
          <LandingPageSettings />
        </ProtectedRoute>
      </Route>
      {/* Super Admin Routes */}
      <Route path="/super-admin">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminDashboardPage />
        </ProtectedRoute>
      </Route>

      <Route path="/super-admin/dashboard">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminDashboardPage />
        </ProtectedRoute>
      </Route>

      <Route path="/super-admin/suppliers">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminSuppliersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/drivers">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminDriversPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/orders">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminOrdersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/orders/create">
        <ProtectedRoute roles={["super_admin"]}>
          <CreateOrderPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/orders/qr">
        <ProtectedRoute roles={["super_admin"]}>
          <OrderQrCodePage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/orders/:id">
        <ProtectedRoute roles={["super_admin"]}>
          <OrderDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/returns">
        <ProtectedRoute roles={["super_admin"]}>
          <AdminReturnsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/reviews">
        <ProtectedRoute roles={["super_admin"]}>
          <AdminReviewsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/products">
        <ProtectedRoute roles={["super_admin"]}>
          <AdminProductsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/products/create">
        <ProtectedRoute roles={["super_admin"]}>
          <CreateProductPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/logistics">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminLogisticsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/suppliers/performance">
        <ProtectedRoute roles={["super_admin"]}>
          <SupplierPerformancePage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/suppliers/pending">
        <ProtectedRoute roles={["super_admin"]}>
          <PendingSupplierRegistrationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/marketing">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminMarketingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/reporting">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminReportingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/settings">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdminSettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/risk">
        <ProtectedRoute roles={["super_admin"]}>
          <AdminRiskPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Toaster />
          <Router />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
