import type { ComponentType, ReactNode } from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings,
  Megaphone,
  Route as RouteIcon,
  FileText,
  Shield,
  Trophy,
  UserPlus,
  QrCode,
  PlusCircle,
  Menu,
  X,
  ChevronRight,
  RotateCcw,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { SismaAdminLogo } from "@/components/sisma-admin-logo";

interface LayoutProps {
  children: ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Vue d'ensemble",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Commandes",
    items: [
      { href: "/admin/orders", label: "Toutes les commandes", icon: ShoppingCart },
      { href: "/admin/orders/create", label: "Créer commande", icon: PlusCircle },
      { href: "/admin/orders/qr", label: "QR Codes", icon: QrCode },
      { href: "/admin/returns", label: "Retours", icon: RotateCcw },
    ],
  },

  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Produits", icon: Package },
      { href: "/admin/products/create", label: "Créer produit", icon: PlusCircle },
    ],
  },
  {
    label: "Fournisseurs",
    items: [
      { href: "/admin/suppliers", label: "Tous les fournisseurs", icon: Users },
      { href: "/admin/suppliers/performance", label: "Classement", icon: Trophy },
      { href: "/admin/suppliers/pending", label: "En attente", icon: UserPlus },
    ],
  },
  {
    label: "Logistique",
    items: [
      { href: "/admin/drivers", label: "Livreurs", icon: Truck },
      { href: "/admin/drivers/scan", label: "Scanner QR", icon: QrCode },
      { href: "/admin/logistics", label: "Suivi logistique", icon: RouteIcon },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/marketing", label: "Campagnes CPC", icon: Megaphone },
      { href: "/admin/reporting", label: "Reporting", icon: FileText },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/reviews", label: "Avis & Notes", icon: Star },
      { href: "/admin/risk", label: "Gestion des risques", icon: Shield },
      { href: "/admin/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

const SUPER_ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Vue d'ensemble",
    items: [{ href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Commandes",
    items: [
      { href: "/super-admin/orders", label: "Toutes les commandes", icon: ShoppingCart },
      { href: "/super-admin/orders/create", label: "Créer commande", icon: PlusCircle },
      { href: "/super-admin/orders/qr", label: "QR Codes", icon: QrCode },
      { href: "/super-admin/returns", label: "Retours", icon: RotateCcw },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/super-admin/products", label: "Produits", icon: Package },
      { href: "/super-admin/products/create", label: "Créer produit", icon: PlusCircle },
    ],
  },
  
  {
    label: "Fournisseurs",
    items: [
      { href: "/super-admin/suppliers", label: "Tous les fournisseurs", icon: Users },
      { href: "/super-admin/suppliers/performance", label: "Classement", icon: Trophy },
      { href: "/super-admin/suppliers/pending", label: "En attente", icon: UserPlus },
    ],
  },
  {
    label: "Logistique",
    items: [
      { href: "/super-admin/drivers", label: "Livreurs", icon: Truck },
      { href: "/super-admin/logistics", label: "Suivi logistique", icon: RouteIcon },
    ],
  },

  {
    label: "Marketing",
    items: [
      { href: "/super-admin/marketing", label: "Campagnes CPC", icon: Megaphone },
      { href: "/super-admin/reporting", label: "Reporting", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/super-admin/reviews", label: "Avis & Notes", icon: Star },
      { href: "/super-admin/risk", label: "Gestion des risques", icon: Shield },
      { href: "/super-admin/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

function getNavGroups(role: string | undefined): NavGroup[] {
  return role === "super_admin" ? SUPER_ADMIN_NAV_GROUPS : ADMIN_NAV_GROUPS;
}

function isActive(currentPath: string, itemHref: string): boolean {
  if (["/admin/dashboard", "/super-admin/dashboard"].includes(itemHref)) {
    return currentPath === "/" || currentPath === itemHref;
  }
  // Exact match for leaf routes (create, qr, performance, pending, etc.)
  if (/\/(create|qr|performance|pending)$/.test(itemHref)) {
    return currentPath === itemHref;
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold",
        role === "super_admin" ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-700"
      )}
    >
      {role === "super_admin" ? "Super Admin" : "Admin"}
    </span>
  );
}

function NavSection({ group, currentPath }: { group: NavGroup; currentPath: string }) {
  return (
    <div>
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 select-none">
        {group.label}
      </p>
      <ul className="space-y-0.5">
        {group.items.map((item) => {
          const active = isActive(currentPath, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href}>
                <span
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer select-none",
                    active
                      ? "border-sisma-red bg-red-50 text-red-700"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-sisma-red" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sisma-red" />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarContent({
  user,
  navGroups,
  currentPath,
  onNavigate,
  onLogout,
}: {
  user: any;
  navGroups: NavGroup[];
  currentPath: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-4">
        <SismaAdminLogo
          title={user?.role === "super_admin" ? "SISMA Super Admin" : "SISMA Admin"}
          subtitle="Panneau de gestion"
          size="md"
          className="min-w-0"
          href={user?.role === "super_admin" ? "/super-admin/dashboard" : "/admin/dashboard"}
        />
      </div>

      {/* User card */}
      <div className="shrink-0 px-3 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-[13px] font-bold text-sisma-red">
            {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">
              {user?.name || user?.email || "Admin"}
            </p>
            <RoleBadge role={user?.role || "admin"} />
          </div>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-3 space-y-4"
        aria-label="Navigation principale"
        onClick={onNavigate}
      >
        {navGroups.map((group) => (
          <NavSection key={group.label} group={group} currentPath={currentPath} />
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-3">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 text-slate-400 transition-colors group-hover:text-red-600" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navGroups = getNavGroups(user?.role);

  useEffect(() => { setMobileOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = () => void logout();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
        <div className="flex items-center gap-2.5">
          <SismaAdminLogo
            title={user?.role === "super_admin" ? "SISMA Super" : "SISMA Admin"}
            size="sm"
            href={user?.role === "super_admin" ? "/super-admin/dashboard" : "/admin/dashboard"}
          />
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          user={user}
          navGroups={navGroups}
          currentPath={location}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Desktop layout */}
      <div className="hidden lg:flex">
        <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white shadow-sm">
          <SidebarContent
            user={user}
            navGroups={navGroups}
            currentPath={location}
            onLogout={handleLogout}
          />
        </aside>
        <main className="ml-64 flex-1 min-h-screen bg-slate-50 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile main content */}
      <main className="lg:hidden min-h-[calc(100vh-56px)] bg-slate-50 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
