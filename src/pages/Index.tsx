import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPICard } from "@/components/dashboard/KPICard";
import { AgentStatusGrid } from "@/components/dashboard/AgentStatusGrid";
import { OrderRiskTable } from "@/components/dashboard/OrderRiskTable";
import { DisruptionMap } from "@/components/dashboard/DisruptionMap";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { RealtimeChart } from "@/components/dashboard/RealtimeChart";
import { DemoDataSeeder } from "@/components/dashboard/DemoDataSeeder";
import { AlertTriangle, Shield, Users, Zap, TrendingUp, Bell } from "lucide-react";

interface DashboardStats {
  highRiskOrders: number;
  activeDisruptions: number;
  pendingNotifications: number;
  systemHealth: number;
  totalOrders: number;
  avgRiskScore: number;
}

const Index = () => {
  const [stats, setStats] = useState<DashboardStats>({
    highRiskOrders: 0,
    activeDisruptions: 0,
    pendingNotifications: 0,
    systemHealth: 98,
    totalOrders: 0,
    avgRiskScore: 0,
  });

  const [realtimeData, setRealtimeData] = useState<any[]>([]);

  useEffect(() => {
    // Load initial dashboard data
    loadDashboardStats();

    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Orders updated:', payload);
        loadDashboardStats();
      })
      .subscribe();

    const disruptionsChannel = supabase
      .channel('disruptions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disruptions' }, (payload) => {
        console.log('Disruptions updated:', payload);
        loadDashboardStats();
      })
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        console.log('Notifications updated:', payload);
        loadDashboardStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(disruptionsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Get high-risk orders (risk_score >= 70)
      const { data: highRiskOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('risk_score', 70);

      // Get active disruptions
      const { data: activeDisruptions } = await supabase
        .from('disruptions')
        .select('*')
        .eq('is_active', true);

      // Get pending notifications
      const { data: pendingNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending');

      // Get total orders and average risk score
      const { data: allOrders } = await supabase
        .from('orders')
        .select('risk_score');

      const avgRisk = allOrders?.length 
        ? Math.round(allOrders.reduce((sum, order) => sum + (order.risk_score || 0), 0) / allOrders.length)
        : 0;

      setStats({
        highRiskOrders: highRiskOrders?.length || 0,
        activeDisruptions: activeDisruptions?.length || 0,
        pendingNotifications: pendingNotifications?.length || 0,
        systemHealth: 98, // This would come from agent monitoring in real implementation
        totalOrders: allOrders?.length || 0,
        avgRiskScore: avgRisk,
      });

      // Update realtime chart data
      const chartData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        orders: Math.floor(Math.random() * 100) + 50,
        risk: Math.floor(Math.random() * 30) + 20,
        disruptions: Math.floor(Math.random() * 5),
      }));
      setRealtimeData(chartData);

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Demo Data Seeder */}
      <DemoDataSeeder />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Supply Chain Command Center
          </h1>
          <p className="text-muted-foreground">
            AI-powered disruption management & proactive communication system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-success-bg px-4 py-2 rounded-lg">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow"></div>
            <span className="text-success font-medium">System Operational</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="High-Risk Orders"
          value={stats.highRiskOrders}
          icon={AlertTriangle}
          trend={"+12% from last hour"}
          variant="critical"
          description="Orders with risk score ≥ 70"
        />
        <KPICard
          title="Active Disruptions"
          value={stats.activeDisruptions}
          icon={Shield}
          trend={"-8% from yesterday"}
          variant="warning"
          description="Real-time supply chain issues"
        />
        <KPICard
          title="Pending Notifications"
          value={stats.pendingNotifications}
          icon={Bell}
          trend={"Processing queue"}
          variant="info"
          description="AI-generated communications"
        />
        <KPICard
          title="System Health"
          value={`${stats.systemHealth}%`}
          icon={Zap}
          trend={"All agents active"}
          variant="success"
          description="Multi-agent orchestration"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status & Workflow */}
        <div className="lg:col-span-1">
          <AgentStatusGrid />
        </div>

        {/* Real-time Analytics */}
        <div className="lg:col-span-2">
          <RealtimeChart data={realtimeData} />
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Risk Management */}
        <div>
          <OrderRiskTable />
        </div>

        {/* Disruption & Notification Center */}
        <div className="space-y-6">
          <DisruptionMap />
          <NotificationCenter />
        </div>
      </div>
    </div>
  );
};

export default Index;
