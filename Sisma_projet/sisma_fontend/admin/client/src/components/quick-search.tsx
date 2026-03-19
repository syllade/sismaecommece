import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Search, X, ShoppingCart, Package, Users, Truck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ordersApi } from '@/api/orders.api';
import { vendorsApi } from '@/api/vendors.api';
import { deliveriesApi } from '@/api/deliveries.api';

interface SearchResult {
  type: 'order' | 'product' | 'vendor' | 'driver';
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// Real search function using API calls
async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  
  const results: SearchResult[] = [];
  
  try {
    // Search orders
    const orders = await ordersApi.listAdminOrders({ search: query, per_page: 3 });
    orders.forEach((order: any) => {
      results.push({
        type: 'order',
        id: order.id,
        title: `#${order.id} - ${order.customer_name || 'Client'}`,
        subtitle: `${order.total || 0} CFA - ${order.status}`,
        url: `/admin/orders/${order.id}`,
      });
    });
    
    // Search vendors/suppliers
    const vendors = await vendorsApi.listAdminSuppliers({ search: query, per_page: 3 });
    vendors.forEach((vendor: any) => {
      results.push({
        type: 'vendor',
        id: vendor.id,
        title: vendor.name,
        subtitle: vendor.email,
        url: `/admin/suppliers`,
      });
    });
    
    // Search drivers
    const drivers = await deliveriesApi.listAdminDrivers({ search: query, per_page: 3 });
    drivers.forEach((driver: any) => {
      results.push({
        type: 'driver',
        id: driver.id,
        title: driver.name,
        subtitle: `${driver.phone || ''} - Zone: ${driver.zone || 'N/A'}`,
        url: `/admin/drivers`,
      });
    });
  } catch (error) {
    console.error('Search error:', error);
  }
  
  return results;
}

export function QuickSearch({ isOpen, onClose }: QuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // Trigger search open
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const data = await searchAll(query);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'vendor':
        return <Users className="w-4 h-4" />;
      case 'driver':
        return <Truck className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'order':
        return 'Commande';
      case 'product':
        return 'Produit';
      case 'vendor':
        return 'Fournisseur';
      case 'driver':
        return 'Livreur';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-[10vh]">
        <div
          className={cn(
            "relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden",
            "animate-in fade-in slide-in-from-top-4 duration-200"
          )}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher commandes, produits, fournisseurs..."
              className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              data-search-input
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-sisma-red border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-slate-500 mt-2">Recherche en cours...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.url}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {result.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{result.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucun résultat pour "{query}"</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">
                  Tapez au moins 2 caractères pour rechercher
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Commandes', 'Produits', 'Fournisseurs', 'Livreurs'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded">↵</kbd>
                  Sélectionner
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded">↑↓</kbd>
                  Naviguer
                </span>
              </div>
              <span>Recherche rapide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
