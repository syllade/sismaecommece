import { useState, useMemo } from 'react';
import { useSupplierProducts } from '@/hooks/use-v1-supplier';
import { useCreateManualOrder, ManualOrderData } from '@/hooks/use-v1-supplier';

interface ProductSelectItem {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

interface ReviewStepProps {
  onNext?: () => void;
  onBack?: () => void;
  orderData: ManualOrderData;
  items: OrderItem[];
  isLoading: boolean;
  onConfirm: () => void;
}

function ClientInfoStep({ onNext, onBack }: StepProps) {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_address: '',
    commune: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.client_name.trim()) newErrors.client_name = 'Le nom est requis';
    if (!formData.client_phone.trim()) newErrors.client_phone = 'Le téléphone est requis';
    if (!formData.client_address.trim()) newErrors.client_address = 'L\'adresse est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Informations client</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Nom complet *</label>
        <input
          type="text"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sisma-red ${errors.client_name ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Ex: Jean Dupont"
        />
        {errors.client_name && <p className="text-sm text-red-500">{errors.client_name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
        <input
          type="tel"
          value={formData.client_phone}
          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sisma-red ${errors.client_phone ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Ex: +225 07 12 34 56 78"
        />
        {errors.client_phone && <p className="text-sm text-red-500">{errors.client_phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Adresse de livraison *</label>
        <textarea
          value={formData.client_address}
          onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sisma-red ${errors.client_address ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Rue, quartier, villa..."
          rows={3}
        />
        {errors.client_address && <p className="text-sm text-red-500">{errors.client_address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Commune</label>
        <input
          type="text"
          value={formData.commune}
          onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sisma-red"
          placeholder="Ex: Marcory, Plateau..."
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90"
        >
          Suivant
        </button>
      </div>
    </form>
  );
}

function ProductSelectionStep({ onNext, onBack }: StepProps & { 
  onUpdateItems: (items: OrderItem[]) => void;
  items: OrderItem[];
}) {
  const [search, setSearch] = useState('');
  const { data: productsData, isLoading } = useSupplierProducts({ 
    search, 
    status: 'active',
    per_page: 20 
  });
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

  const products: ProductSelectItem[] = ((productsData as any)?.data || (productsData as any)?.products || []) as ProductSelectItem[];

  const addProduct = (product: ProductSelectItem) => {
    const existing = selectedItems.find(item => item.product_id === product.id);
    if (existing) {
      setSelectedItems(selectedItems.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total: product.price,
      }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
    } else {
      setSelectedItems(selectedItems.map(item => 
        item.product_id === productId 
          ? { ...item, quantity, total: quantity * item.unit_price }
          : item
      ));
    }
  };

  const removeItem = (productId: number) => {
    setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Sélectionner les produits</h3>
      
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sisma-red"
          placeholder="Rechercher un produit..."
        />
        <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
          <h4 className="font-medium text-sm text-gray-500 mb-2">Produits disponibles</h4>
          {isLoading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : (
            <div className="space-y-2">
              {products.map(product => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="w-full text-left p-2 rounded hover:bg-gray-50 border flex justify-between items-center"
                >
                  <span className="truncate">{product.name}</span>
                  <span className="text-sisma-red font-medium">{product.price.toLocaleString()} F</span>
                </button>
              ))}
              {products.length === 0 && (
                <p className="text-gray-400 text-sm">Aucun produit trouvé</p>
              )}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-sm text-gray-500 mb-2">Panier</h4>
          {selectedItems.length === 0 ? (
            <p className="text-gray-400 text-sm">Ajoutez des produits</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedItems.map(item => (
                <div key={item.product_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.unit_price.toLocaleString()} F / unité</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedItems.length > 0 && (
            <div className="mt-4 pt-2 border-t flex justify-between font-semibold">
              <span>Sous-total:</span>
              <span className="text-sisma-red">{subtotal.toLocaleString()} F</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={selectedItems.length === 0}
          className="px-6 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </form>
  );
}

function DeliveryStep({ onNext, onBack }: StepProps) {
  const [formData, setFormData] = useState({
    delivery_date: '',
    delivery_time: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Détails de livraison</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date de livraison</label>
          <input
            type="date"
            value={formData.delivery_date}
            onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sisma-red"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Créneau horaire</label>
          <select
            value={formData.delivery_time}
            onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sisma-red"
          >
            <option value="">Sélectionner...</option>
            <option value="matin">Matin (8h-12h)</option>
            <option value="aprèm">Après-midi (14h-18h)</option>
            <option value="soir">Soir (18h-21h)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes / Instructions</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sisma-red"
          placeholder="Instructions spéciales pour la livraison..."
          rows={3}
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Retour
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90"
        >
          Suivant
        </button>
      </div>
    </form>
  );
}

function ReviewStep({ onBack, onConfirm, isLoading, orderData, items }: ReviewStepProps) {
  const subtotal = items.reduce((sum: number, item: OrderItem) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Vérifier la commande</h3>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <h4 className="font-medium text-sm text-gray-500">Client</h4>
          <p>{orderData.client_name}</p>
          <p className="text-sm">{orderData.client_phone}</p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-500">Adresse</h4>
          <p>{orderData.client_address}</p>
          {orderData.commune && <p className="text-sm">{orderData.commune}</p>}
        </div>

        {orderData.delivery_date && (
          <div>
            <h4 className="font-medium text-sm text-gray-500">Livraison</h4>
            <p>{orderData.delivery_date} {orderData.delivery_time && `(${orderData.delivery_time})`}</p>
          </div>
        )}

        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">Produits</h4>
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span>{item.product_name} x{item.quantity}</span>
                <span>{item.total.toLocaleString()} F</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
            <span>Total:</span>
            <span className="text-sisma-red">{subtotal.toLocaleString()} F</span>
          </div>
        </div>

        {orderData.notes && (
          <div>
            <h4 className="font-medium text-sm text-gray-500">Notes</h4>
            <p className="text-sm">{orderData.notes}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Création...' : 'Confirmer la commande'}
        </button>
      </div>
    </div>
  );
}

interface ManualOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManualOrderWizard({ isOpen, onClose, onSuccess }: ManualOrderWizardProps) {
  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState({
    client_name: '',
    client_phone: '',
    client_address: '',
    commune: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryData, setDeliveryData] = useState({
    delivery_date: '',
    delivery_time: '',
    notes: '',
  });

  const createOrder = useCreateManualOrder();

  const orderData: ManualOrderData = {
    ...clientData,
    ...deliveryData,
    products: orderItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price_override: item.unit_price,
    })),
  };

  const handleConfirm = async () => {
    try {
      await createOrder.mutateAsync(orderData);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  const handleClose = () => {
    setStep(1);
    setClientData({ client_name: '', client_phone: '', client_address: '', commune: '' });
    setOrderItems([]);
    setDeliveryData({ delivery_date: '', delivery_time: '', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { num: 1, label: 'Client' },
    { num: 2, label: 'Produits' },
    { num: 3, label: 'Livraison' },
    { num: 4, label: 'Confirmer' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Nouvelle commande manuelle</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex justify-between">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.num ? 'bg-sisma-red text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s.num}
                </div>
                <span className={`ml-2 text-sm ${step >= s.num ? 'text-gray-800' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${step > s.num ? 'bg-sisma-red' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <ClientInfoStep
              onNext={() => setStep(2)}
              onBack={handleClose}
            />
          )}
          {step === 2 && (
            <ProductSelectionStep
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              items={orderItems}
              onUpdateItems={setOrderItems}
            />
          )}
          {step === 3 && (
            <DeliveryStep
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <ReviewStep
              onBack={() => setStep(3)}
              onConfirm={handleConfirm}
              orderData={orderData}
              items={orderItems}
              isLoading={createOrder.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ManualOrderWizard;
