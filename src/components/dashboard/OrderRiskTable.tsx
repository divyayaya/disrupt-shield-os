import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowUpRight,
  Filter,
  TrendingUp,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  supplier_id: string;
  quantity: number;
  value: number;
  expected_delivery: string | null;
  risk_score: number | null;
  status: string | null;
  priority: string | null;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  tier: string | null;
}

interface Supplier {
  id: string;
  name: string;
  reliability: number | null;
}

const getRiskLevel = (score: number | null) => {
  if (!score) return { level: "unknown", color: "text-muted-foreground" };
  if (score >= 80) return { level: "critical", color: "text-critical" };
  if (score >= 60) return { level: "high", color: "text-warning" };
  if (score >= 40) return { level: "medium", color: "text-info" };
  return { level: "low", color: "text-success" };
};

const getPriorityColor = (priority: string | null) => {
  switch (priority?.toLowerCase()) {
    case "critical": return "text-critical";
    case "high": return "text-warning";  
    case "medium": return "text-info";
    case "low": return "text-success";
    default: return "text-muted-foreground";
  }
};

export function OrderRiskTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"risk_score" | "value" | "created_at">("risk_score");
  const [filterRisk, setFilterRisk] = useState<string>("all");

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadSuppliers();

    // Real-time subscription
    const channel = supabase
      .channel('orders-risk-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, (payload) => {
        console.log('Order updated:', payload);
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('risk_score', { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;
      if (data) setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, tier');

      if (error) throw error;
      if (data) setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, reliability');

      if (error) throw error;
      if (data) setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "Unknown";
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown";
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "Unknown";
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || "Unknown";
  };

  const getCustomerTier = (customerId: string | null) => {
    if (!customerId) return null;
    const customer = customers.find(c => c.id === customerId);
    return customer?.tier || null;
  };

  const filteredOrders = orders
    .filter(order => {
      // Search filter
      const searchMatch = !searchTerm || 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCustomerName(order.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSupplierName(order.supplier_id).toLowerCase().includes(searchTerm.toLowerCase());

      // Risk filter  
      const riskMatch = filterRisk === "all" || 
        (filterRisk === "high" && (order.risk_score || 0) >= 70) ||
        (filterRisk === "medium" && (order.risk_score || 0) >= 40 && (order.risk_score || 0) < 70) ||
        (filterRisk === "low" && (order.risk_score || 0) < 40);

      return searchMatch && riskMatch;
    })
    .slice(0, 20); // Limit display

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDeliveryDate = (date: string | null) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-electric/10">
            <TrendingUp className="h-5 w-5 text-electric" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Order Risk Assessment
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered predictive risk scoring & mitigation
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search orders, customers, suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (70+)</option>
            <option value="medium">Medium Risk (40-69)</option>
            <option value="low">Low Risk (&lt;40)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Order</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold">Risk Score</TableHead>
              <TableHead className="font-semibold">Value</TableHead>
              <TableHead className="font-semibold">Delivery</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const riskInfo = getRiskLevel(order.risk_score);
              const customerTier = getCustomerTier(order.customer_id);
              
              return (
                <TableRow 
                  key={order.id} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-card-foreground">
                        {order.order_number}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPriorityColor(order.priority))}
                      >
                        {order.priority || "standard"}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-card-foreground">
                        {getCustomerName(order.customer_id)}
                      </div>
                      {customerTier && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          <Users className="h-3 w-3 mr-1" />
                          {customerTier}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-card-foreground">
                      {getSupplierName(order.supplier_id)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "text-lg font-bold",
                        riskInfo.color
                      )}>
                        {order.risk_score || "—"}
                      </div>
                      {(order.risk_score || 0) >= 70 && (
                        <AlertTriangle className="h-4 w-4 text-critical animate-pulse" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {riskInfo.level} risk
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(order.value)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {order.quantity}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDeliveryDate(order.expected_delivery)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-electric hover:text-electric-dark"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {filteredOrders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No orders match your current filters
        </div>
      )}
    </Card>
  );
}