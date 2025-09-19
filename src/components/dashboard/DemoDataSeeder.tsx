import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DemoDataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "seeding" | "completed">("idle");
  const { toast } = useToast();

  const seedDemoData = async () => {
    setIsSeeding(true);
    setSeedStatus("seeding");

    try {
      // Seed Suppliers
      const suppliers = [
        { name: "Global Tech Components", location: "Shenzhen, China", reliability: 0.92, avg_lead_time: 14 },
        { name: "European Steel Works", location: "Hamburg, Germany", reliability: 0.87, avg_lead_time: 21, current_delay_spike: true },
        { name: "Pacific Logistics Co", location: "Los Angeles, USA", reliability: 0.95, avg_lead_time: 7 },
        { name: "Asian Manufacturing", location: "Bangkok, Thailand", reliability: 0.78, avg_lead_time: 18 },
        { name: "Nordic Materials", location: "Stockholm, Sweden", reliability: 0.89, avg_lead_time: 12 }
      ];

      const { data: supplierData } = await supabase
        .from('suppliers')
        .insert(suppliers)
        .select();

      // Seed Customers
      const customers = [
        { name: "Enterprise Corp", tier: "vip", lifetime_value: 2500000, preferred_channel: "email", language: "en" },
        { name: "Global Solutions Ltd", tier: "premium", lifetime_value: 800000, preferred_channel: "portal", language: "en" },
        { name: "Tech Innovators Inc", tier: "standard", lifetime_value: 150000, preferred_channel: "sms", language: "en" },
        { name: "Manufacturing Plus", tier: "premium", lifetime_value: 950000, preferred_channel: "email", language: "en" },
        { name: "Retail Giant Co", tier: "vip", lifetime_value: 3200000, preferred_channel: "portal", language: "en" }
      ];

      const { data: customerData } = await supabase
        .from('customers')
        .insert(customers)
        .select();

      // Seed Orders with realistic data
      if (supplierData && customerData) {
        const orders = [
          {
            order_number: "ORD-2024-001",
            customer_id: customerData[0].id,
            supplier_id: supplierData[0].id,
            quantity: 500,
            value: 125000,
            expected_delivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            risk_score: 85,
            status: "processing",
            priority: "critical",
            sku: "COMP-001"
          },
          {
            order_number: "ORD-2024-002", 
            customer_id: customerData[1].id,
            supplier_id: supplierData[1].id,
            quantity: 200,
            value: 75000,
            expected_delivery: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            risk_score: 72,
            status: "delayed",
            priority: "high",
            sku: "STEEL-002"
          },
          {
            order_number: "ORD-2024-003",
            customer_id: customerData[2].id,
            supplier_id: supplierData[2].id,
            quantity: 1000,
            value: 45000,
            expected_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            risk_score: 25,
            status: "shipped",
            priority: "medium",
            sku: "LOG-003"
          },
          {
            order_number: "ORD-2024-004",
            customer_id: customerData[3].id,
            supplier_id: supplierData[3].id,
            quantity: 300,
            value: 89000,
            expected_delivery: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            risk_score: 68,
            status: "processing",
            priority: "high",
            sku: "MFG-004"
          },
          {
            order_number: "ORD-2024-005",
            customer_id: customerData[4].id,
            supplier_id: supplierData[4].id,
            quantity: 150,
            value: 195000,
            expected_delivery: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            risk_score: 42,
            status: "confirmed",
            priority: "medium",
            sku: "NOR-005"
          }
        ];

        await supabase.from('orders').insert(orders);
      }

      // Seed Disruptions
      const disruptions = [
        {
          type: "port_congestion",
          supplier_id: supplierData?.[0]?.id,
          location: "Port of Los Angeles",
          severity: "high",
          predicted_impact: 75,
          confidence: 0.89,
          is_active: true
        },
        {
          type: "weather_delay",
          supplier_id: supplierData?.[1]?.id,
          location: "Hamburg Port",
          severity: "medium",
          predicted_impact: 45,
          confidence: 0.92,
          is_active: true
        },
        {
          type: "supplier_delay",
          supplier_id: supplierData?.[3]?.id,
          location: "Bangkok Manufacturing District",
          severity: "critical",
          predicted_impact: 90,
          confidence: 0.95,
          is_active: true
        }
      ];

      await supabase.from('disruptions').insert(disruptions);

      // Seed Agent States
      const agentStates = [
        {
          agent_name: "data_ingestion",
          is_active: true,
          state: { status: "processing", queue_size: 15, last_update: new Date().toISOString() },
          execution_count: 1247,
          last_execution: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        },
        {
          agent_name: "disruption_detection",
          is_active: true,
          state: { status: "analyzing", patterns_found: 3, confidence: 0.89 },
          execution_count: 892,
          last_execution: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          agent_name: "risk_scoring",
          is_active: true,
          state: { status: "scoring", orders_processed: 45, avg_risk: 58 },
          execution_count: 2156,
          last_execution: new Date(Date.now() - 1 * 60 * 1000).toISOString()
        },
        {
          agent_name: "notification_planning",
          is_active: true,
          state: { status: "generating", notifications_queued: 12, templates_used: 8 },
          execution_count: 673,
          last_execution: new Date(Date.now() - 3 * 60 * 1000).toISOString()
        }
      ];

      await supabase.from('agent_states').insert(agentStates);

      // Seed Notifications
      const notifications = [
        {
          order_id: null,
          customer_id: customerData?.[0]?.id,
          message: "Your high-priority order ORD-2024-001 may experience delays due to port congestion. Our team is actively working on alternative routing options to minimize impact.",
          channel: "email",
          urgency: "high",
          scheduled_for: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: "pending"
        },
        {
          order_id: null,
          customer_id: customerData?.[1]?.id,
          message: "Update on your order ORD-2024-002: We've identified potential weather-related delays and have proactively secured backup transportation. Expected delivery remains on schedule.",
          channel: "portal",
          urgency: "medium",
          scheduled_for: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          status: "pending"
        },
        {
          order_id: null,
          customer_id: customerData?.[4]?.id,
          message: "Great news! Your order ORD-2024-005 has been shipped ahead of schedule and will arrive 2 days early.",
          channel: "email",
          urgency: "low",
          scheduled_for: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "sent",
          sent_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        }
      ];

      await supabase.from('notifications').insert(notifications);

      // Seed Knowledge Base
      const knowledgeEntries = [
        {
          category: "port_disruptions",
          title: "Port Congestion Mitigation Strategies",
          content: "Historical analysis shows that rerouting through alternate ports reduces delays by 65% during peak congestion periods. Key alternative routes include: Oakland Port (+2 days), Seattle Port (+3 days), Vancouver Port (+4 days).",
          metadata: { effectiveness: 0.89, cost_impact: "medium", avg_delay_reduction: 65 }
        },
        {
          category: "supplier_management",
          title: "Supplier Reliability Patterns",
          content: "Suppliers with reliability scores below 0.80 show 40% higher risk during Q4 due to increased demand. Recommended actions: diversify supplier base, increase safety stock by 25%, implement daily check-ins.",
          metadata: { reliability_threshold: 0.80, risk_increase: 40, recommended_stock_increase: 25 }
        }
      ];

      await supabase.from('knowledge_base').insert(knowledgeEntries);

      setSeedStatus("completed");
      toast({
        title: "Demo Data Seeded Successfully!",
        description: "The dashboard now shows realistic supply chain data with active disruptions, risk assessments, and notifications.",
      });

    } catch (error) {
      console.error('Error seeding demo data:', error);
      toast({
        title: "Error Seeding Data",
        description: "There was an issue creating demo data. Please check the console for details.",
        variant: "destructive",
      });
      setSeedStatus("idle");
    } finally {
      setIsSeeding(false);
    }
  };

  if (seedStatus === "completed") {
    return (
      <Card className="p-4 border-success/30 bg-success/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <h4 className="font-medium text-success">Demo Data Active</h4>
            <p className="text-sm text-success/80">
              Dashboard is populated with realistic supply chain scenarios
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-electric/30 bg-electric/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-electric" />
          <div>
            <h4 className="font-medium text-electric">Demo Data Seeder</h4>
            <p className="text-sm text-electric/80">
              Populate dashboard with realistic supply chain data
            </p>
          </div>
        </div>
        
        <Button
          onClick={seedDemoData}
          disabled={isSeeding}
          className="bg-gradient-primary"
        >
          {isSeeding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Load Demo Data
            </>
          )}
        </Button>
      </div>
      
      {seedStatus === "seeding" && (
        <div className="mt-3 pt-3 border-t border-electric/20">
          <div className="flex items-center gap-2 text-sm text-electric/80">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Creating suppliers, customers, orders, disruptions & agents...</span>
          </div>
        </div>
      )}
    </Card>
  );
}