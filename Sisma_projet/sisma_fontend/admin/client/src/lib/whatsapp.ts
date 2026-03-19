/**
 * WhatsApp Message Generator
 * Creates WhatsApp message links for vendor communication
 */

interface OrderDetails {
  orderId: number;
  customerName: string;
  customerPhone: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryAddress: string;
  commune: string;
}

/**
 * Generate a WhatsApp message for a new order notification to vendor
 */
export function generateNewOrderMessage(order: OrderDetails): string {
  const productsList = order.products
    .map(p => `• ${p.name} x${p.quantity} - ${formatCurrency(p.price * p.quantity)}`)
    .join('\n');

  return `Bonjour,

Vous avez reçu une nouvelle commande sur SISMA.

📋 *Détails de la commande*
*Commande #${order.orderId}*

👤 *Client:* ${order.customerName}
📞 *Téléphone:* ${order.customerPhone}
📍 *Adresse:* ${order.deliveryAddress}, ${order.commune}

🛒 *Produits:*
${productsList}

💰 *Total:* ${formatCurrency(order.total)}

Merci de confirmer la disponibilité des produits.

— L'équipe SISMA`;
}

/**
 * Generate a WhatsApp message for delivery confirmation
 */
export function generateDeliveryConfirmationMessage(order: OrderDetails): string {
  return `Bonjour,

Votre commande #${order.orderId} a été livrée avec succès ! 🎉

Détails:
• Total payé: ${formatCurrency(order.total)}
• Adresse de livraison: ${order.deliveryAddress}

Merci d'avoir fait confiance à SISMA !

— L'équipe SISMA`;
}

/**
 * Generate a WhatsApp message for order status update
 */
export function generateStatusUpdateMessage(order: OrderDetails, status: string): string {
  const statusMessages: Record<string, string> = {
    confirmed: 'confirmée et sera traitée rapidement',
    preparing: 'en cours de préparation par le fournisseur',
    shipped: 'expédiée et en route vers vous',
    out_for_delivery: 'actuellement en livraison',
  };

  return `Bonjour,

Mise à jour de votre commande #${order.orderId}:

Statut: ${statusMessages[status] || status}

Merci de votre patience !

— L'équipe SISMA`;
}

/**
 * Generate WhatsApp link with encoded message
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Remove any non-digit characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming Ivory Coast +225)
  const formattedPhone = cleanPhone.startsWith('225') ? cleanPhone : `225${cleanPhone}`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp in new tab
 */
export function openWhatsApp(phone: string, message: string): void {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
}

// Format currency helper
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount);
}
