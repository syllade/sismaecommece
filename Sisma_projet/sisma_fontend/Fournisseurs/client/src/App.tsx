import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import DashboardOverview from "@/pages/DashboardOverview";
import DashboardProducts from "@/pages/DashboardProducts";
import DashboardOrders from "@/pages/DashboardOrders";
import DashboardSettings from "@/pages/DashboardSettings";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/login";
import SupplierRegisterPage from "@/pages/supplier-register";
import RegistrationSuccess from "@/components/RegistrationSuccess";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={SupplierRegisterPage} />
      <Route path="/supplier-register" component={SupplierRegisterPage} />
      <Route path="/supplier/register" component={SupplierRegisterPage} />
      <Route path="/register/success" component={RegistrationSuccess} />
      <Route path="/dashboard">
        <ProtectedRoute roles={["supplier"]}>
          <DashboardOverview />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/products">
        <ProtectedRoute roles={["supplier"]}>
          <DashboardProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/orders">
        <ProtectedRoute roles={["supplier"]}>
          <DashboardOrders />
        </ProtectedRoute>
      </Route>
      {/* Settings placeholders */}
      <Route path="/dashboard/settings">
        <ProtectedRoute roles={["supplier"]}>
          <DashboardSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/preferences">
        <ProtectedRoute roles={["supplier"]}>
          <DashboardSettings />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
