import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin,
  AlertTriangle, 
  Shield,
  Clock,
  TrendingDown,
  ExternalLink,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Disruption {
  id: string;
  type: string;
  supplier_id: string | null;
  location: string | null;
  severity: string | null;
  predicted_impact: number | null;
  confidence: number | null;
  is_active: boolean | null;
  created_at: string;
  resolved_at: string | null;
}

interface Supplier {
  id: string;
  name: string;
  location: string | null;
}

const severityConfig = {
  low: { color: "text-info", bg: "bg-info/10", icon: "🟢" },
  medium: { color: "text-warning", bg: "bg-warning/10", icon: "🟡" },
  high: { color: "text-critical", bg: "bg-critical/10", icon: "🔴" },
  critical: { color: "text-critical", bg: "bg-critical/20", icon: "🚨" }
};

export function DisruptionMap() {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

  useEffect(() => {
    loadDisruptions();
    loadSuppliers();

    // Real-time subscription
    const channel = supabase
      .channel('disruptions-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'disruptions' 
      }, (payload) => {
        console.log('Disruption updated:', payload);
        loadDisruptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const loadDisruptions = async () => {
    try {
      let query = supabase
        .from('disruptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === "active") {
        query = query.eq('is_active', true);
      } else if (filter === "resolved") {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      if (data) setDisruptions(data);
    } catch (error) {
      console.error('Error loading disruptions:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, location');

      if (error) throw error;
      if (data) setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "Unknown Source";
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || "Unknown Supplier";
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  const activeDisruptions = disruptions.filter(d => d.is_active).length;
  const criticalDisruptions = disruptions.filter(d => d.severity === "critical" && d.is_active).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Disruption Monitor
            </h3>
            <p className="text-sm text-muted-foreground">
              Real-time supply chain issue tracking
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-critical border-critical/30">
            {criticalDisruptions} Critical
          </Badge>
          <Badge variant="outline" className="text-warning border-warning/30">
            {activeDisruptions} Active
          </Badge>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex bg-muted rounded-lg p-1">
          {[
            { key: "active", label: "Active", count: activeDisruptions },
            { key: "all", label: "All", count: disruptions.length },
            { key: "resolved", label: "Resolved" }
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(key as any)}
              className={cn(
                "text-xs",
                filter === key && "bg-background shadow-sm"
              )}
            >
              {label} {count !== undefined && `(${count})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Disruption List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {disruptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 text-success" />
            <p>No disruptions found</p>
            <p className="text-sm">All systems operating normally</p>
          </div>
        ) : (
          disruptions.map((disruption) => {
            const severity = disruption.severity || "low";
            const config = severityConfig[severity as keyof typeof severityConfig];
            
            return (
              <div
                key={disruption.id}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200 hover:shadow-custom-md",
                  config.bg,
                  disruption.severity === "critical" && disruption.is_active && "animate-pulse-critical"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{config.icon}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("capitalize", config.color)}
                        >
                          {severity} severity
                        </Badge>
                        {!disruption.is_active && (
                          <Badge variant="outline" className="text-success border-success/30">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-card-foreground mb-1 capitalize">
                      {disruption.type.replace(/_/g, ' ')} Disruption
                    </h4>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{disruption.location || "Location TBD"}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Impact: {disruption.predicted_impact || "Unknown"}%</span>
                        </div>
                        
                        {disruption.confidence && (
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            <span>Confidence: {Math.round(disruption.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Supplier: {getSupplierName(disruption.supplier_id)}
                          {" • "}
                          {formatTimeAgo(disruption.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-electric hover:text-electric-dark"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress indicator for active disruptions */}
                {disruption.is_active && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Response in progress...</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-electric rounded-full animate-pulse"></div>
                        <span>Live monitoring</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}