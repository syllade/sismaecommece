/**
 * XOF (West African CFA franc) Currency Utilities
 * Official currency for Côte d'Ivoire
 */

// Format amount as XOF currency (no decimals)
export function formatXOF(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 XOF';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Format amount with compact notation (for large numbers)
export function formatCompactXOF(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 XOF';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.', ',') + ' M XOF';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.', ',') + ' K XOF';
  }
  return formatXOF(num);
}

// Parse XOF string to number
export function parseXOF(value: string): number {
  // Remove XOF, spaces, and other characters
  const cleaned = value.replace(/[^0-9,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Format with separators (French format)
export function formatNumberXOF(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('fr-FR').format(num);
}

// Display price in product cards
export function displayPrice(price: number, compareAtPrice?: number): string {
  const formatted = formatXOF(price);
  
  if (compareAtPrice && compareAtPrice > price) {
    const discount = Math.round((1 - price / compareAtPrice) * 100);
    return `${formatted} (-${discount}%)`;
  }
  
  return formatted;
}

// Format price for input fields
export function formatPriceInput(value: string): string {
  const num = parseXOF(value);
  return formatNumberXOF(num);
}

// Common price presets for quick selection
export const PRICE_PRESETS = [
  { label: '1 000', value: 1000 },
  { label: '2 500', value: 2500 },
  { label: '5 000', value: 5000 },
  { label: '10 000', value: 10000 },
  { label: '25 000', value: 25000 },
  { label: '50 000', value: 50000 },
  { label: '100 000', value: 100000 },
];
