import { useState } from 'react';
import { useOrderNotifications, useSendWhatsApp, useSendEmail, useInvoiceHtml, OrderNotification } from '@/hooks/use-v1-supplier';

interface OrderCommunicationPanelProps {
  orderId: number;
  clientPhone?: string;
  clientEmail?: string;
}

export function OrderCommunicationPanel({ orderId, clientPhone, clientEmail }: OrderCommunicationPanelProps) {
  const [showPanel, setShowPanel] = useState(false);
  const { data: notifications, isLoading } = useOrderNotifications(orderId);
  const sendWhatsApp = useSendWhatsApp();
  const sendEmail = useSendEmail();
  const { data: invoiceData, isLoading: invoiceLoading } = useInvoiceHtml(orderId);

  const handleSendWhatsApp = () => {
    sendWhatsApp.mutate(orderId);
  };

  const handleSendEmail = () => {
    sendEmail.mutate(orderId);
  };

  const handlePrint = () => {
    if (invoiceData?.html) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceData.html);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPdf = () => {
    if (invoiceData?.html) {
      const blob = new Blob([invoiceData.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceData.order_number}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="text-green-500">✓</span>;
      case 'pending':
        return <span className="text-yellow-500">⏳</span>;
      case 'failed':
        return <span className="text-red-500">✕</span>;
      default:
        return <span className="text-gray-500">?</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        );
      case 'email':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return <span className="text-gray-500">📨</span>;
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="flex items-center gap-2 px-4 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Communiquer
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-800">Communication Client</h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <button
          onClick={handleSendWhatsApp}
          disabled={!clientPhone || sendWhatsApp.isPending}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-sm font-medium text-green-700">WhatsApp</span>
        </button>

        <button
          onClick={handleSendEmail}
          disabled={!clientEmail || sendEmail.isPending}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-blue-700">Email</span>
        </button>

        <button
          onClick={handlePrint}
          disabled={invoiceLoading}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Imprimer</span>
        </button>
      </div>

      {/* Download PDF Button */}
      {invoiceData && (
        <div className="px-4 pb-3">
          <button
            onClick={handleDownloadPdf}
            className="w-full text-sm text-sisma-red hover:underline"
          >
            Télécharger la facture
          </button>
        </div>
      )}

      {/* Notifications History */}
      <div className="border-t">
        <div className="px-4 py-2 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-600">Historique des notifications</h4>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">Chargement...</div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification: OrderNotification) => (
                <div key={notification.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(notification.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notification.type)}
                      <span className="font-medium text-sm text-gray-800 capitalize">
                        {notification.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        notification.status === 'sent' ? 'bg-green-100 text-green-700' :
                        notification.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {notification.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.recipient}
                    </p>
                    {notification.error_message && (
                      <p className="text-xs text-red-500 mt-1">
                        {notification.error_message}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(notification.sent_at || notification.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              Aucune notification envoyée
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderCommunicationPanel;
