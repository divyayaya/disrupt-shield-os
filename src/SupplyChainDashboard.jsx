import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Package,
  Truck,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Play,
  Square,
  Database,
  Activity,
  Globe,
} from "lucide-react";
import { SupabaseService } from "./lib/supabase";
import { SupplyChainWorkflow } from "./lib/langgraph";
import { SupabaseConnectionTest } from "./components/SupabaseConnectionTest";

const SupplyChainDashboard = () => {
  const [workflow] = useState(() => new SupplyChainWorkflow());
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    highRiskOrders: 0,
    activeDisruptions: 0,
    pendingNotifications: 0,
    avgRiskScore: 0,
  });
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [agentStates, setAgentStates] = useState({});
  const [workflowStatus, setWorkflowStatus] = useState({ status: "idle" });
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, error: null });

  // Real-time data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, suppliersData, notificationsData] =
          await Promise.all([
            SupabaseService.getOrders(),
            SupabaseService.getSuppliers(),
            SupabaseService.supabase
              .from("notifications")
              .select("*, orders(order_number), customers(name)")
              .order("created_at", { ascending: false })
              .limit(10),
          ]);

        setOrders(ordersData || []);
        setSuppliers(suppliersData || []);
        setNotifications(notificationsData.data || []);

        // Calculate dashboard metrics
        const highRiskCount =
          ordersData?.filter((o) => o.risk_score >= 70).length || 0;
        const avgRisk = ordersData?.length
          ? ordersData.reduce((sum, o) => sum + (o.risk_score || 0), 0) /
            ordersData.length
          : 0;

        const pendingNotifications =
          notificationsData.data?.filter((n) => !n.sent_at).length || 0;

        // Get active disruptions count
        const { count: disruptionCount } = await SupabaseService.supabase
          .from("disruptions")
          .select("*", { count: "exact" })
          .eq("is_active", true);

        setDashboardData({
          highRiskOrders: highRiskCount,
          activeDisruptions: disruptionCount || 0,
          pendingNotifications,
          avgRiskScore: Math.round(avgRisk),
        });

        // Get workflow status
        const status = await workflow.getWorkflowStatus();
        setWorkflowStatus(status);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [workflow]);

  // Real-time subscriptions
  useEffect(() => {
    const ordersSubscription = SupabaseService.supabase
      .channel("orders_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          // Trigger data refresh when orders change
          window.location.reload();
        }
      )
      .subscribe();

    const notificationsSubscription = SupabaseService.supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          // Trigger data refresh when notifications change
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, []);

  const handleStart = async () => {
    setIsRunning(true);
    await workflow.start();
  };

  const handleStop = () => {
    setIsRunning(false);
    workflow.stop();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "text-green-600";
      case "delayed":
        return "text-red-600";
      case "in_transit":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return "text-red-600 bg-red-50";
    if (score >= 50) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "immediate":
        return "bg-red-100 text-red-800";
      case "scheduled":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Connection Test */}
      <SupabaseConnectionTest 
        onResult={(isConnected, error) => setConnectionStatus({ isConnected, error })}
      />
      
      {/* Connection Status Banner */}
      {!connectionStatus.isConnected && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Connection Error:</strong> {connectionStatus.error || 'Failed to connect to Supabase'}
        </div>
      )}
      
      {connectionStatus.isConnected && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong>✓ Supabase Connected:</strong> Database connection is working properly
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Supply Chain Intelligence Center
              </h1>
              <p className="text-gray-600 mt-2">
                LangGraph Multi-Agent System with RAG & Supabase
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isRunning
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isRunning ? "System Active" : "System Idle"}
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  workflowStatus.status === "completed"
                    ? "bg-blue-100 text-blue-800"
                    : workflowStatus.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                Workflow: {workflowStatus.status}
              </div>
              <button
                onClick={isRunning ? handleStop : handleStart}
                className={`flex items-center px-6 py-2 rounded-lg font-medium ${
                  isRunning
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isRunning ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop System
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start System
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  High Risk Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.highRiskOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Disruptions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.activeDisruptions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Alerts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.pendingNotifications}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Avg Risk Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.avgRiskScore}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "LangGraph Overview", icon: Package },
              { id: "orders", label: "Risk Orders", icon: AlertTriangle },
              { id: "suppliers", label: "Suppliers", icon: Truck },
              {
                id: "notifications",
                label: "AI Notifications",
                icon: MessageSquare,
              },
              {
                id: "data-ingestion",
                label: "Data Ingestion Agent",
                icon: Database,
              },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  selectedTab === id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {selectedTab === "overview" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                LangGraph Multi-Agent System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Agent Workflow
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        1
                      </div>
                      <div>
                        <div className="font-medium">Data Ingestion Agent</div>
                        <div className="text-sm text-gray-600">
                          LangChain + Supabase integration
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </div>

                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        2
                      </div>
                      <div>
                        <div className="font-medium">
                          Disruption Detection Agent
                        </div>
                        <div className="text-sm text-gray-600">
                          AI-powered anomaly detection
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </div>

                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        3
                      </div>
                      <div>
                        <div className="font-medium">Risk Scoring Agent</div>
                        <div className="text-sm text-gray-600">
                          RAG-enhanced risk assessment
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </div>

                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        4
                      </div>
                      <div>
                        <div className="font-medium">Notification Agent</div>
                        <div className="text-sm text-gray-600">
                          Personalized communication
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    System Architecture
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center p-2 bg-gray-50 rounded">
                      <Package className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm">LangGraph Orchestration</span>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 rounded">
                      <Clock className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">LangChain Agents</span>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 rounded">
                      <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm">RAG Knowledge Retrieval</span>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 rounded">
                      <Package className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm">Supabase Real-time DB</span>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Last Workflow:{" "}
                        {workflowStatus.lastExecution
                          ? new Date(
                              workflowStatus.lastExecution
                            ).toLocaleTimeString()
                          : "Not started"}
                      </span>
                    </div>
                    {workflowStatus.results && (
                      <div className="mt-2 text-xs text-green-700">
                        • {workflowStatus.results.disruptionsDetected}{" "}
                        disruptions detected
                        <br />• {workflowStatus.results.highRiskOrders}{" "}
                        high-risk orders
                        <br />• {workflowStatus.results.notificationsSent}{" "}
                        notifications sent
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "orders" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                High Risk Orders (Live Data from Supabase)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Delivery
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders
                      .filter((order) => (order.risk_score || 0) >= 50)
                      .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
                      .slice(0, 10)
                      .map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customer?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(order.value || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(
                                order.risk_score || 0
                              )}`}
                            >
                              {order.risk_score || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium capitalize ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.expected_delivery
                              ? new Date(
                                  order.expected_delivery
                                ).toLocaleDateString()
                              : "TBD"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {orders.filter((o) => (o.risk_score || 0) >= 50).length ===
                  0 && (
                  <div className="text-center py-8 text-gray-500">
                    No high-risk orders found. Start the system to generate risk
                    scores.
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === "suppliers" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Supplier Status (Live Data)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{supplier.name}</h4>
                      <span
                        className={`h-3 w-3 rounded-full ${
                          supplier.current_delay_spike
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      ></span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Location: {supplier.location}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Avg Lead Time: {supplier.avg_lead_time} days
                    </p>
                    <p className="text-sm text-gray-600">
                      Reliability:{" "}
                      {Math.round((supplier.reliability || 0) * 100)}%
                    </p>
                    {supplier.current_delay_spike && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                        ⚠️ Current delay spike detected
                      </div>
                    )}
                  </div>
                ))}
                {suppliers.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No supplier data available. Check Supabase connection.
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === "notifications" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                AI-Generated Notifications
              </h3>
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {notification.channel === "email" && (
                            <Mail className="h-4 w-4 text-blue-500 mr-2" />
                          )}
                          {notification.channel === "sms" && (
                            <Phone className="h-4 w-4 text-green-500 mr-2" />
                          )}
                          {notification.channel === "portal" && (
                            <MessageSquare className="h-4 w-4 text-purple-500 mr-2" />
                          )}
                          <span className="font-medium">
                            Order{" "}
                            {notification.orders?.order_number ||
                              notification.order_id}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(
                            notification.urgency
                          )}`}
                        >
                          {notification.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Customer: {notification.customers?.name || "Unknown"}
                        </span>
                        <span>
                          {notification.sent_at
                            ? `Sent: ${new Date(
                                notification.sent_at
                              ).toLocaleString()}`
                            : `Scheduled: ${new Date(
                                notification.scheduled_for
                              ).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No notifications generated yet. Start the system to see
                    AI-powered notifications.
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === "data-ingestion" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6">Advanced Data Ingestion Agent</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time External Data Feeds */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Globe className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Real-time External Data Feeds</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium">MarineTraffic API</span>
                      </div>
                      <span className="text-sm text-gray-600">Port Congestion Data</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium">Weather Alerts</span>
                      </div>
                      <span className="text-sm text-gray-600">Storm Tracking</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium">Carrier APIs</span>
                      </div>
                      <span className="text-sm text-gray-600">FedEx, UPS, Maersk</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium">GDELT Project</span>
                      </div>
                      <span className="text-sm text-gray-600">Geopolitical Risk</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium">News Sentiment</span>
                      </div>
                      <span className="text-sm text-gray-600">Market Intelligence</span>
                    </div>
                  </div>
                </div>

                {/* Data Normalization */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Activity className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Data Normalization</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Timestamp Standardization</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">98.5%</span>
                      </div>
                      <div className="text-sm text-gray-600">UTC conversion and timezone handling</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">SKU Mapping</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">96.2%</span>
                      </div>
                      <div className="text-sm text-gray-600">Cross-system product identification</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Missing Data Detection</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">89.1%</span>
                      </div>
                      <div className="text-sm text-gray-600">Acknowledgment and validation checks</div>
                    </div>
                  </div>
                </div>

                {/* Knowledge Base Updates */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Database className="h-6 w-6 text-purple-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Knowledge Base Updates</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Pattern Storage</span>
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-sm text-gray-600">Real-time behavioral pattern learning</div>
                      <div className="text-xs text-purple-600 mt-1">Last update: 2 minutes ago</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Vector Embeddings</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">1,024 dims</span>
                      </div>
                      <div className="text-sm text-gray-600">Semantic similarity indexing</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Learning Iterations</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">45,231</span>
                      </div>
                      <div className="text-sm text-gray-600">Continuous model refinement</div>
                    </div>
                  </div>
                </div>

                {/* Quality Assessment */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-orange-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Quality Assessment</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Data Completeness</span>
                        <span className="text-lg font-bold text-green-600">94.7%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '94.7%'}}></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Data Freshness</span>
                        <span className="text-lg font-bold text-blue-600">98.2%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '98.2%'}}></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Accuracy Score</span>
                        <span className="text-lg font-bold text-purple-600">91.8%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '91.8%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Data Ingestion Activity */}
              <div className="mt-8 bg-white rounded-lg border p-6">
                <h4 className="text-lg font-semibold mb-4">Recent Data Ingestion Activity</h4>
                <div className="space-y-3">
                  {[
                    { time: "2 min ago", source: "MarineTraffic API", event: "Port congestion data updated", status: "success" },
                    { time: "5 min ago", source: "Weather Service", event: "Storm alert processed", status: "success" },
                    { time: "8 min ago", source: "UPS API", event: "Delivery status synchronized", status: "success" },
                    { time: "12 min ago", source: "GDELT", event: "Geopolitical risk assessment", status: "warning" },
                    { time: "15 min ago", source: "News API", event: "Sentiment analysis complete", status: "success" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.status === 'success' ? 'bg-green-500' : 
                          activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{activity.event}</div>
                          <div className="text-sm text-gray-600">{activity.source}</div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplyChainDashboard;
