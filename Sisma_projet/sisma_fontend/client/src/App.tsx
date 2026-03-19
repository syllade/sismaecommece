import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingCart } from "@/components/FloatingCart";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import SupplierStore from "@/pages/SupplierStore";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Marketplace from "@/pages/Marketplace";
import Categories from "@/pages/Categories";
import CategoryMarketplace from "@/pages/CategoryMarketplace";
import Account from "@/pages/Account";
import { AuthProvider } from "@/context/ClientAuthContext";


function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow sm:pt-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/categories/:category" component={CategoryMarketplace} />
          <Route path="/categories" component={Categories} />
          <Route path="/shops" component={Marketplace} />
          <Route path="/products" component={Products} />
          <Route path="/product/:slug" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/contact" component={Contact} />
          <Route path="/account" component={Account} />
          <Route path="/login" component={Account} />
          <Route path="/register" component={Account} />
          <Route path="/shop/:id" component={SupplierStore} />
          <Route path="/orders/:id" component={OrderDetail} />
          <Route path="/orders" component={Orders} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <FloatingCart />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Router />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
