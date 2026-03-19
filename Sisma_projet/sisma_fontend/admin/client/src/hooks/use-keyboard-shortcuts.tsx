import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'action' | 'search';
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !shortcut.ctrl;
        const shiftMatch = shortcut.shift ? event.shiftKey : !shortcut.shift;
        const altMatch = shortcut.alt ? event.altKey : !shortcut.alt;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined keyboard shortcuts for admin
export function useAdminKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: '1',
      ctrl: true,
      action: () => setLocation('/admin/dashboard'),
      description: 'Aller au Dashboard',
      category: 'navigation',
    },
    {
      key: '2',
      ctrl: true,
      action: () => setLocation('/admin/orders'),
      description: 'Aller aux Commandes',
      category: 'navigation',
    },
    {
      key: '3',
      ctrl: true,
      action: () => setLocation('/admin/products'),
      description: 'Aller aux Produits',
      category: 'navigation',
    },
    {
      key: '4',
      ctrl: true,
      action: () => setLocation('/admin/suppliers'),
      description: 'Aller aux Fournisseurs',
      category: 'navigation',
    },
    {
      key: '5',
      ctrl: true,
      action: () => setLocation('/admin/drivers'),
      description: 'Aller aux Livreurs',
      category: 'navigation',
    },
    {
      key: '6',
      ctrl: true,
      action: () => setLocation('/admin/marketing'),
      description: 'Aller au Marketing',
      category: 'navigation',
    },
    {
      key: '7',
      ctrl: true,
      action: () => setLocation('/admin/reporting'),
      description: 'Aller au Reporting',
      category: 'navigation',
    },
    {
      key: '8',
      ctrl: true,
      action: () => setLocation('/admin/settings'),
      description: 'Aller aux Paramètres',
      category: 'navigation',
    },
    // Actions
    {
      key: 'n',
      ctrl: true,
      action: () => setLocation('/admin/orders/create'),
      description: 'Nouvelle commande',
      category: 'action',
    },
    {
      key: 'p',
      ctrl: true,
      action: () => setLocation('/admin/products/create'),
      description: 'Nouveau produit',
      category: 'action',
    },
    {
      key: '/',
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Recherche rapide',
      category: 'search',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or dropdowns
        const modal = document.querySelector('[data-modal]');
        if (modal) {
          modal.remove();
        }
      },
      description: 'Fermer les modales',
      category: 'action',
    },
    // Refresh
    {
      key: 'r',
      ctrl: true,
      action: () => window.location.reload(),
      description: 'Actualiser la page',
      category: 'action',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: ['Ctrl', '1-8'], action: 'Navigation rapide' },
    { keys: ['Ctrl', 'N'], action: 'Nouvelle commande' },
    { keys: ['Ctrl', 'P'], action: 'Nouveau produit' },
    { keys: ['Ctrl', '/'], action: 'Recherche' },
    { keys: ['Ctrl', 'R'], action: 'Actualiser' },
    { keys: ['Esc'], action: 'Fermer' },
  ];

  return (
    <div className="text-xs text-slate-500 space-y-1">
      {shortcuts.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
            {s.keys.join(' + ')}
          </kbd>
          <span>{s.action}</span>
        </div>
      ))}
    </div>
  );
}
