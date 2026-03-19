import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Trash2, QrCode, Package, User, MapPin, CheckCircle } from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders, buildApiUrl, API_BASE_URL } from "@/lib/apiConfig";

interface Product {
  id: number;
  name: string;
  price: number;
  supplier_id: number;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export default function CreateOrderPage() {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_location: "",
    commune: "",
    quartier: "",
    delivery_type: "standard",
    notes: "",
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-active"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/v1/admin/suppliers?is_active=1&per_page=100"), {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
  });

  // Fetch products for selected supplier
  const { data: productsData } = useQuery({
    queryKey: ["supplier-products", selectedSupplier],
    queryFn: async () => {
      if (!selectedSupplier) return { data: [] };
      // Use public endpoint for supplier products - doesn't require auth
      const response = await fetch(`${API_BASE_URL}/api/suppliers/${selectedSupplier}/products`);
      return response.json();
    },
    enabled: !!selectedSupplier,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(buildApiUrl("/api/v1/admin/orders/create"), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customerInfo,
          supplier_id: parseInt(selectedSupplier),
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Commande créée",
          description: `Commande ${data.data.order.order_number} créée avec succès`,
        });
        // Reset form
        setItems([]);
        setSelectedSupplier("");
        setCustomerInfo({
          customer_name: "",
          customer_phone: "",
          customer_location: "",
          commune: "",
          quartier: "",
          delivery_type: "standard",
          notes: "",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const addItem = (product: Product) => {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
        },
      ]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter((i) => i.product_id !== productId));
    } else {
      setItems(
        items.map((i) =>
          i.product_id === productId ? { ...i, quantity } : i
        )
      );
    }
  };

  const removeItem = (productId: number) => {
    setItems(items.filter((i) => i.product_id !== productId));
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = customerInfo.delivery_type === "express" ? 1500 : 500;
  const total = subtotal + deliveryFee;

  const suppliers = suppliersData?.data ?? [];
  const products: Product[] = productsData?.data ?? [];

  const isValid =
    selectedSupplier &&
    items.length > 0 &&
    customerInfo.customer_name &&
    customerInfo.customer_phone;

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Créer une Commande</h1>
            <p className="text-gray-500">Pour les clients qui ne peuvent pas commander</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Info & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Nom du client *</Label>
                    <Input
                      id="customer_name"
                      value={customerInfo.customer_name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, customer_name: e.target.value })
                      }
                      placeholder="Nom complet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Téléphone *</Label>
                    <Input
                      id="customer_phone"
                      value={customerInfo.customer_phone}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, customer_phone: e.target.value })
                      }
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_location">Adresse</Label>
                  <Input
                    id="customer_location"
                    value={customerInfo.customer_location}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, customer_location: e.target.value })
                    }
                    placeholder="Adresse de livraison"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commune">Commune</Label>
                    <Input
                      id="commune"
                      value={customerInfo.commune}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, commune: e.target.value })
                      }
                      placeholder="Commune"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quartier">Quartier</Label>
                    <Input
                      id="quartier"
                      value={customerInfo.quartier}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, quartier: e.target.value })
                      }
                      placeholder="Quartier"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="delivery_type">Type de livraison</Label>
                  <Select
                    value={customerInfo.delivery_type}
                    onValueChange={(value) =>
                      setCustomerInfo({ ...customerInfo, delivery_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (500 CFA)</SelectItem>
                      <SelectItem value="express">Express (1500 CFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, notes: e.target.value })
                    }
                    placeholder="Notes supplémentaires"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Supplier Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Products */}
            {selectedSupplier && (
              <Card>
                <CardHeader>
                  <CardTitle>Produits Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {products.map((product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        className="h-auto py-3 flex flex-col items-start"
                        onClick={() => addItem(product)}
                      >
                        <span className="font-medium text-sm">{product.name}</span>
                        <span className="text-green-600 font-bold">
                          {product.price.toLocaleString()} CFA
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Résumé de la Commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Aucun produit sélectionné
                    </p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-gray-500 text-sm">
                            {item.price.toLocaleString()} CFA x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.product_id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{subtotal.toLocaleString()} CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livraison ({customerInfo.delivery_type})</span>
                    <span>{deliveryFee.toLocaleString()} CFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{total.toLocaleString()} CFA</span>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!isValid || createOrderMutation.isPending}
                  onClick={() => createOrderMutation.mutate()}
                >
                  {createOrderMutation.isPending ? (
                    <span className="animate-pulse">Création...</span>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Créer la Commande
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
