import { apiGetBlob } from '@/api/http';
import { AdminOrder } from '@/api/orders.api';

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const INVOICE_LOGO_SRC = '/logo%20png.png';

/**
 * Generate HTML invoice for an order
 */
export function generateInvoiceHTML(order: AdminOrder): string {
  const items = order.items || [];
  const itemsTotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture Commande #${order.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      padding: 40px;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #D81918;
    }
    .company-info {
      max-width: 360px;
    }
    .company-info p {
      color: #666;
      font-size: 11px;
    }
    .brand-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .brand-logo {
      width: 200px;
      height: auto;
      display: block;
    }
    .brand-meta p + p {
      margin-top: 3px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 20px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-info p {
      font-size: 11px;
      color: #666;
    }
    .invoice-number {
      font-size: 14px;
      font-weight: bold;
      color: #D81918;
    }
    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .address-block {
      width: 45%;
    }
    .address-block h3 {
      font-size: 10px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 8px;
    }
    .address-block p {
      margin-bottom: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f5f5f5;
      padding: 10px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    .totals {
      width: 250px;
      margin-left: auto;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row.total {
      font-size: 16px;
      font-weight: bold;
      color: #D81918;
      border-bottom: 2px solid #D81918;
      margin-top: 10px;
      padding-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-pending { background: #FFF3CD; color: #856404; }
    .status-processing { background: #CCE5FF; color: #004085; }
    .status-completed { background: #D4EDDA; color: #155724; }
    .status-cancelled { background: #F8D7DA; color: #721C24; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="company-info">
      <div class="brand-stack">
        <img class="brand-logo" src="${INVOICE_LOGO_SRC}" alt="SISMA" />
        <div class="brand-meta">
          <p>Marketplace multi-categories</p>
          <p>Abidjan, Côte d'Ivoire</p>
        </div>
      </div>
    </div>
    <div class="invoice-info">
      <h2>FACTURE</h2>
      <p class="invoice-number">#${order.id}</p>
      <p>Date: ${formatDate(order.created_at)}</p>
      <span class="status-badge status-${order.status === 'livree' || order.status === 'delivered' ? 'completed' : order.status === 'annulee' || order.status === 'cancelled' ? 'cancelled' : order.status === 'pending' ? 'pending' : 'processing'}">
        ${order.status.toUpperCase()}
      </span>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>Informations Client</h3>
      <p><strong>${order.customer_name || 'Client'}</strong></p>
      <p>${order.customer_phone || ''}</p>
    </div>
    <div class="address-block">
      <h3>Adresse de Livraison</h3>
      <p>${order.customer_location || order.commune || 'Non spécifié'}</p>
      <p>${order.commune || ''}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th>Quantité</th>
        <th>Prix Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.product_name || `Produit #${item.product_id}`}</td>
          <td>${item.quantity || 1}</td>
          <td>${formatCurrency(item.price || 0)}</td>
          <td>${formatCurrency(item.subtotal || (item.price || 0) * (item.quantity || 1))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Sous-total</span>
      <span>${formatCurrency(itemsTotal)}</span>
    </div>
    <div class="totals-row">
      <span>Frais de livraison</span>
      <span>${formatCurrency(order.delivery_fee || 0)}</span>
    </div>
    <div class="totals-row total">
      <span>Total</span>
      <span>${formatCurrency(order.total || 0)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Merci pour votre confiance !</p>
    <p>SISMA - Marketplace multi-categories</p>
  </div>
</body>
</html>
  `;
}

/**
 * Export order as PDF using browser print
 */
export function exportOrderAsPDF(order: AdminOrder): void {
  const html = generateInvoiceHTML(order);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Download order invoice from API
 */
export async function downloadOrderInvoiceFromAPI(orderId: number): Promise<void> {
  try {
    const blob = await apiGetBlob(`/api/admin/invoices/${orderId}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-commande-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to download invoice:', error);
    // Fallback to browser print
    throw error;
  }
}
