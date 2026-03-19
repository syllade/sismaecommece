import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MapPin, ChevronDown, Download } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { format, isToday, isTomorrow, isThisWeek, isThisMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "En attente", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  confirmed: { label: "Confirmée", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  preparing: { label: "Préparation", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  ready: { label: "Prête", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  prepared: { label: "Prête", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  shipped: { label: "Expédiée", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  delivered: { label: "Livrée", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  cancelled: { label: "Annulée", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

export default function DashboardOrders() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  // Filter orders based on criteria
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchTerm) {
      result = result.filter(o => 
        o.id.toString().includes(searchTerm) || 
        (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customerAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      result = result.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();
        switch (dateFilter) {
          case "today": return isToday(orderDate);
          case "tomorrow": return isTomorrow(orderDate);
          case "week": return isThisWeek(orderDate);
          case "month": return isThisMonth(orderDate);
          default: return true;
        }
      });
    }

    return result;
  }, [orders, searchTerm, statusFilter, dateFilter]);

  // Select/deselect all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  // Toggle individual order selection
  const toggleOrderSelection = (id: number) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  // Bulk update status
  const handleBulkStatusUpdate = (newStatus: string) => {
    selectedOrders.forEach(orderId => {
      updateStatus.mutate({ id: orderId, status: newStatus as any }, {
        onSuccess: () => {
          setSelectedOrders([]);
          toast({
            title: "Succès",
            description: `${selectedOrders.length} commande(s) mise(s) à jour`,
          });
        }
      });
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <Badge variant="outline" className={`${config.bg} ${config.color} ${config.border}`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return format(date, "dd MMM yyyy", { locale: fr });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 h-full">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
            <p className="text-gray-600 mt-1">Notifications temps réel et attribution logistique</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher par n° commande, client ou adresse..." 
              className="pl-10 border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-40 border-gray-300">
              <SelectValue placeholder="Filtrer par date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 border-gray-300">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmée</SelectItem>
              <SelectItem value="preparing">Préparation</SelectItem>
              <SelectItem value="ready">Prête</SelectItem>
              <SelectItem value="shipped">Expédiée</SelectItem>
              <SelectItem value="delivered">Livrée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="font-semibold text-blue-900">
              {selectedOrders.length} commande(s) sélectionnée(s)
            </p>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Changeur le statut
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => handleBulkStatusUpdate(key)}>
                      <Badge className={`${config.bg} ${config.color} mr-2`}>{config.label}</Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setSelectedOrders([])}
                className="text-gray-600 hover:text-gray-900"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">Commande</TableHead>
                  <TableHead className="font-semibold text-gray-700">Client</TableHead>
                  <TableHead className="font-semibold text-gray-700">Destination</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      Chargement des commandes...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">#{order.id}</TableCell>
                      <TableCell className="text-gray-700">{order.customerName || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {order.customerAddress || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 h-auto">
                              {getStatusBadge(order.status)}
                              <ChevronDown className="ml-1 w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <DropdownMenuItem 
                                key={key} 
                                onClick={() => updateStatus.mutate({ id: order.id, status: key as any })}
                              >
                                {config.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Affichage de {filteredOrders.length} sur {orders.length} commande(s)
        </p>
      </div>
    </DashboardLayout>
  );
}
