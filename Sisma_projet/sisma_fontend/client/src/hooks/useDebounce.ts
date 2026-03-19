import { useState, useEffect } from "react";

/**
 * Retourne une valeur debounced : mise à jour après `delay` ms sans changement.
 * Utile pour la recherche en temps réel sans appeler l'API à chaque frappe.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
