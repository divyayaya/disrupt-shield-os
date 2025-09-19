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
  Shield,
  Target,
  Zap,
  Users,
  DollarSign,
  BarChart3,
  Brain,
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
  
  // Data Ingestion Agent Real-time State
  const [dataIngestionMetrics, setDataIngestionMetrics] = useState({
    dataFeeds: {
      marineTraffic: { status: 'active', lastUpdate: new Date(), dataPoints: 1247 },
      weatherAlerts: { status: 'active', lastUpdate: new Date(), dataPoints: 892 },
      carrierAPIs: { status: 'active', lastUpdate: new Date(), dataPoints: 2156 },
      gdeltProject: { status: 'active', lastUpdate: new Date(), dataPoints: 445 },
      newsSentiment: { status: 'active', lastUpdate: new Date(), dataPoints: 1789 }
    },
    normalization: {
      timestampStandardization: 98.5,
      skuMapping: 96.2,
      missingDataDetection: 89.1
    },
    quality: {
      completeness: 94.7,
      freshness: 98.2,
      accuracy: 91.8
    },
    activity: []
  });

  // Enhanced Disruption Detection Agent State
  const [disruptionDetectionMetrics, setDisruptionDetectionMetrics] = useState({
    anomalyDetection: {
      zScoreAnalysis: { alertsGenerated: 12, threshold: 2.5, status: 'active' },
      ewmaAnalysis: { trendAccuracy: 94.2, deviations: 3, status: 'active' }
    },
    predictiveAnalytics: {
      etaVarianceForecasting: { accuracy: 89.7, predictions: 156, status: 'active' },
      supplierDelaySpikes: { detected: 4, prevented: 11, status: 'warning' }
    },
    ruleBasedEngine: {
      slaMonitoring: { breaches: 2, warnings: 7, status: 'active' },
      supplierAlerts: { critical: 1, warnings: 5, status: 'active' }
    },
    realTimeIndicators: {
      portCongestion: { level: 'moderate', impact: 15, ports: ['LA', 'Long Beach'] },
      weatherImpact: { severity: 'low', affectedRoutes: 3, status: 'monitoring' },
      carrierPerformance: { avgDelay: 2.3, onTimeRate: 94.1, status: 'good' }
    },
    activity: []
  });

  // Risk Scoring Agent State
  const [riskScoringMetrics, setRiskScoringMetrics] = useState({
    riskModel: {
      revenueAtRisk: 145680,
      slaBreach: 23400,
      customerLifetimeValue: 890000,
      totalRiskExposure: 1059080
    },
    multiFactorAnalysis: {
      priorityWeighting: 87.3,
      supplierHealth: 91.5,
      inventoryBuffers: 76.8,
      overallScore: 85.2
    },
    thresholds: {
      immediateResponse: 7,
      emergencyEscalation: 2,
      totalOrders: 45
    },
    mitigationCosts: {
      airFreight: 45600,
      alternativeSuppliers: 12300,
      partialShipments: 8900,
      totalOptions: 66800
    },
    activity: []
  });

  // Notification Agent State
  const [notificationMetrics, setNotificationMetrics] = useState({
    segmentation: {
      vip: { count: 12, responseRate: 98.5, avgResponseTime: '2m' },
      premium: { count: 34, responseRate: 94.2, avgResponseTime: '8m' },
      standard: { count: 89, responseRate: 87.6, avgResponseTime: '15m' }
    },
    channelSelection: {
      phone: { sent: 15, delivered: 14, effectiveness: 93.3 },
      email: { sent: 67, opened: 58, effectiveness: 86.6 },
      sms: { sent: 23, delivered: 23, effectiveness: 100 }
    },
    personalization: {
      toneAdaptation: 96.7,
      detailLevel: 91.4,
      customerSatisfaction: 4.6
    },
    escalation: {
      executiveInvolvements: 3,
      criticalOrders: 5,
      resolutionRate: 100
    },
    activity: []
  });

  // Mitigation Recommendation Agent State
  const [mitigationMetrics, setMitigationMetrics] = useState({
    costOptimization: {
      shippingCosts: 67800,
      inventoryCosts: 23400,
      penaltyCosts: 15600,
      totalOptimized: 106800
    },
    optionsAnalysis: {
      airFreight: { cost: 45600, timeline: '2 days', probability: 95 },
      alternateSuppliers: { cost: 12300, timeline: '5 days', probability: 87 },
      inventoryReallocation: { cost: 8900, timeline: '1 day', probability: 92 }
    },
    roiCalculations: {
      implementationCost: 66800,
      riskReduction: 89400,
      netBenefit: 22600,
      roiPercentage: 33.8
    },
    feasibilityScoring: {
      avgSuccessProbability: 91.3,
      avgTimeline: 2.7,
      recommendationsGenerated: 23
    },
    activity: []
  });

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

  // Real-time Data Ingestion Agent Updates
  useEffect(() => {
    const updateDataIngestionMetrics = () => {
      setDataIngestionMetrics(prev => {
        const newActivity = {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          source: ['MarineTraffic API', 'Weather Service', 'UPS API', 'GDELT Project', 'News API'][Math.floor(Math.random() * 5)],
          event: [
            'Port congestion data updated',
            'Storm alert processed', 
            'Delivery status synchronized',
            'Geopolitical risk assessment',
            'Sentiment analysis complete',
            'SKU mapping updated',
            'Timestamp normalization complete',
            'Data quality check performed'
          ][Math.floor(Math.random() * 8)],
          status: Math.random() > 0.1 ? 'success' : 'warning'
        };

        return {
          ...prev,
          dataFeeds: {
            marineTraffic: { 
              ...prev.dataFeeds.marineTraffic, 
              lastUpdate: new Date(), 
              dataPoints: prev.dataFeeds.marineTraffic.dataPoints + Math.floor(Math.random() * 5),
              status: Math.random() > 0.05 ? 'active' : 'warning'
            },
            weatherAlerts: { 
              ...prev.dataFeeds.weatherAlerts, 
              lastUpdate: new Date(), 
              dataPoints: prev.dataFeeds.weatherAlerts.dataPoints + Math.floor(Math.random() * 3),
              status: Math.random() > 0.05 ? 'active' : 'warning'
            },
            carrierAPIs: { 
              ...prev.dataFeeds.carrierAPIs, 
              lastUpdate: new Date(), 
              dataPoints: prev.dataFeeds.carrierAPIs.dataPoints + Math.floor(Math.random() * 8),
              status: Math.random() > 0.05 ? 'active' : 'warning'
            },
            gdeltProject: { 
              ...prev.dataFeeds.gdeltProject, 
              lastUpdate: new Date(), 
              dataPoints: prev.dataFeeds.gdeltProject.dataPoints + Math.floor(Math.random() * 2),
              status: Math.random() > 0.05 ? 'active' : 'warning'
            },
            newsSentiment: { 
              ...prev.dataFeeds.newsSentiment, 
              lastUpdate: new Date(), 
              dataPoints: prev.dataFeeds.newsSentiment.dataPoints + Math.floor(Math.random() * 6),
              status: Math.random() > 0.05 ? 'active' : 'warning'
            }
          },
          normalization: {
            timestampStandardization: Math.max(85, Math.min(99.5, prev.normalization.timestampStandardization + (Math.random() - 0.5) * 0.5)),
            skuMapping: Math.max(85, Math.min(99, prev.normalization.skuMapping + (Math.random() - 0.5) * 0.3)),
            missingDataDetection: Math.max(80, Math.min(95, prev.normalization.missingDataDetection + (Math.random() - 0.5) * 0.8))
          },
          quality: {
            completeness: Math.max(85, Math.min(99, prev.quality.completeness + (Math.random() - 0.5) * 0.6)),
            freshness: Math.max(90, Math.min(99.9, prev.quality.freshness + (Math.random() - 0.5) * 0.4)),
            accuracy: Math.max(85, Math.min(98, prev.quality.accuracy + (Math.random() - 0.5) * 0.7))
          },
          activity: [newActivity, ...prev.activity.slice(0, 9)]
        };
      });
    };

    const interval = setInterval(updateDataIngestionMetrics, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time updates for all agent metrics
  useEffect(() => {
    const updateAgentMetrics = () => {
      // Update Disruption Detection Agent
      setDisruptionDetectionMetrics(prev => ({
        ...prev,
        anomalyDetection: {
          ...prev.anomalyDetection,
          zScoreAnalysis: {
            ...prev.anomalyDetection.zScoreAnalysis,
            alertsGenerated: prev.anomalyDetection.zScoreAnalysis.alertsGenerated + (Math.random() > 0.8 ? 1 : 0)
          }
        },
        predictiveAnalytics: {
          ...prev.predictiveAnalytics,
          etaVarianceForecasting: {
            ...prev.predictiveAnalytics.etaVarianceForecasting,
            accuracy: Math.max(85, Math.min(95, prev.predictiveAnalytics.etaVarianceForecasting.accuracy + (Math.random() - 0.5) * 0.5))
          }
        },
        activity: [{
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          type: ['Anomaly Detected', 'ETA Variance Alert', 'SLA Warning', 'Supplier Alert'][Math.floor(Math.random() * 4)],
          details: ['High Z-score deviation detected', 'ETA variance exceeds threshold', 'SLA breach imminent', 'Supplier delay spike predicted'][Math.floor(Math.random() * 4)],
          severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        }, ...prev.activity.slice(0, 9)]
      }));

      // Update Risk Scoring Agent
      setRiskScoringMetrics(prev => ({
        ...prev,
        riskModel: {
          ...prev.riskModel,
          revenueAtRisk: prev.riskModel.revenueAtRisk + Math.floor((Math.random() - 0.5) * 10000)
        },
        multiFactorAnalysis: {
          ...prev.multiFactorAnalysis,
          overallScore: Math.max(70, Math.min(95, prev.multiFactorAnalysis.overallScore + (Math.random() - 0.5) * 1.2))
        },
        activity: [{
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          type: ['Risk Assessment', 'Score Update', 'Threshold Breach', 'Cost Analysis'][Math.floor(Math.random() * 4)],
          details: ['Order risk recalculated', 'Multi-factor analysis updated', 'Emergency threshold exceeded', 'Mitigation costs analyzed'][Math.floor(Math.random() * 4)],
          riskLevel: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
        }, ...prev.activity.slice(0, 9)]
      }));

      // Update Notification Agent
      setNotificationMetrics(prev => ({
        ...prev,
        channelSelection: {
          phone: {
            ...prev.channelSelection.phone,
            sent: prev.channelSelection.phone.sent + (Math.random() > 0.9 ? 1 : 0)
          },
          email: {
            ...prev.channelSelection.email,
            sent: prev.channelSelection.email.sent + (Math.random() > 0.7 ? 1 : 0)
          },
          sms: {
            ...prev.channelSelection.sms,
            sent: prev.channelSelection.sms.sent + (Math.random() > 0.8 ? 1 : 0)
          }
        },
        activity: [{
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          type: ['Notification Sent', 'Channel Selected', 'Escalation Triggered', 'Response Received'][Math.floor(Math.random() * 4)],
          details: ['VIP customer notified via phone', 'Email selected for premium customer', 'Executive escalation initiated', 'Customer acknowledged notification'][Math.floor(Math.random() * 4)],
          channel: ['phone', 'email', 'sms'][Math.floor(Math.random() * 3)]
        }, ...prev.activity.slice(0, 9)]
      }));

      // Update Mitigation Recommendation Agent
      setMitigationMetrics(prev => ({
        ...prev,
        roiCalculations: {
          ...prev.roiCalculations,
          roiPercentage: Math.max(15, Math.min(50, prev.roiCalculations.roiPercentage + (Math.random() - 0.5) * 2))
        },
        feasibilityScoring: {
          ...prev.feasibilityScoring,
          avgSuccessProbability: Math.max(80, Math.min(98, prev.feasibilityScoring.avgSuccessProbability + (Math.random() - 0.5) * 0.8)),
          recommendationsGenerated: prev.feasibilityScoring.recommendationsGenerated + (Math.random() > 0.8 ? 1 : 0)
        },
        activity: [{
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          type: ['Recommendation Generated', 'Cost Optimized', 'ROI Calculated', 'Feasibility Assessed'][Math.floor(Math.random() * 4)],
          details: ['Air freight option analyzed', 'Cost optimization completed', 'ROI calculation updated', 'Feasibility score improved'][Math.floor(Math.random() * 4)],
          impact: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
        }, ...prev.activity.slice(0, 9)]
      }));
    };

    const interval = setInterval(updateAgentMetrics, 4000); // Update every 4 seconds
    return () => clearInterval(interval);
  }, []);

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
              {
                id: "disruption-detection",
                label: "Disruption Detection",
                icon: Shield,
              },
              {
                id: "risk-scoring",
                label: "Risk Scoring",
                icon: Target,
              },
              {
                id: "intelligent-notification",
                label: "Intelligent Notification",
                icon: Users,
              },
              {
                id: "mitigation-recommendation",
                label: "Mitigation Engine",
                icon: Brain,
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
              <h3 className="text-lg font-semibold mb-6">
                LangGraph Multi-Agent System - Real-Time Flow
              </h3>
              
              {/* Real-time Visual Graph */}
              <div className="mb-8">
                <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 min-h-[600px] border-2 border-blue-100">
                  <svg width="100%" height="500" className="overflow-visible">
                    {/* Background Grid */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
                      </pattern>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                      </marker>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Central Shared Database (LangGraph State) */}
                    <g transform="translate(400, 250)">
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="60" 
                        fill="#f8fafc" 
                        stroke="#475569" 
                        strokeWidth="4"
                        className="animate-pulse"
                      />
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="45" 
                        fill="#e2e8f0" 
                        stroke="#64748b" 
                        strokeWidth="2"
                      />
                      <Database className="h-10 w-10 text-slate-700" x="-20" y="-20" />
                      <text x="0" y="80" textAnchor="middle" className="text-base font-bold fill-gray-800">
                        LangGraph State
                      </text>
                      <text x="0" y="95" textAnchor="middle" className="text-sm fill-gray-600">
                        Supabase Database
                      </text>
                    </g>
                    
                    {/* Connection Lines from Agents to Central Database */}
                    {/* Data Ingestion Agent to Database */}
                    <path
                      d="M 100 100 L 340 190"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      fill="none"
                      className={`${dataIngestionMetrics.activity.length > 0 ? 'animate-pulse' : 'opacity-50'}`}
                      strokeDasharray={dataIngestionMetrics.activity.length > 0 ? "0" : "5,5"}
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* Disruption Detection Agent to Database */}
                    <path
                      d="M 250 80 L 360 190"
                      stroke="#10b981"
                      strokeWidth="3"
                      fill="none"
                      className={`${disruptionDetectionMetrics.activity.length > 0 ? 'animate-pulse' : 'opacity-50'}`}
                      strokeDasharray={disruptionDetectionMetrics.activity.length > 0 ? "0" : "5,5"}
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* Risk Scoring Agent to Database */}
                    <path
                      d="M 700 100 L 460 190"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      fill="none"
                      className={`${riskScoringMetrics.activity.length > 0 ? 'animate-pulse' : 'opacity-50'}`}
                      strokeDasharray={riskScoringMetrics.activity.length > 0 ? "0" : "5,5"}
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* Notification Agent to Database */}
                    <path
                      d="M 700 400 L 460 310"
                      stroke="#6366f1"
                      strokeWidth="3"
                      fill="none"
                      className={`${notificationMetrics.activity.length > 0 ? 'animate-pulse' : 'opacity-50'}`}
                      strokeDasharray={notificationMetrics.activity.length > 0 ? "0" : "5,5"}
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* Mitigation Agent to Database */}
                    <path
                      d="M 100 400 L 340 310"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      fill="none"
                      className={`${mitigationMetrics.activity.length > 0 ? 'animate-pulse' : 'opacity-50'}`}
                      strokeDasharray={mitigationMetrics.activity.length > 0 ? "0" : "5,5"}
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* Agent Nodes - Spread out in pentagon formation around center */}
                    {/* Data Ingestion Agent - Top Left */}
                    <g transform="translate(50, 50)">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="#dbeafe" 
                        stroke="#3b82f6" 
                        strokeWidth="3"
                        className={`${dataIngestionMetrics.activity.length > 0 ? 'animate-pulse' : ''}`}
                      />
                      <Activity className="h-7 w-7 text-blue-600" x="43" y="43" />
                      <text x="50" y="100" textAnchor="middle" className="text-sm font-semibold fill-gray-800">
                        Data Ingestion
                      </text>
                      <text x="50" y="115" textAnchor="middle" className="text-xs fill-gray-600">
                        {dataIngestionMetrics.quality.freshness.toFixed(1)}% Fresh
                      </text>
                    </g>
                    
                    {/* Disruption Detection Agent - Top Center */}
                    <g transform="translate(200, 30)">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="#dcfce7" 
                        stroke="#10b981" 
                        strokeWidth="3"
                        className={`${disruptionDetectionMetrics.activity.length > 0 ? 'animate-pulse' : ''}`}
                      />
                      <Shield className="h-7 w-7 text-green-600" x="43" y="43" />
                      <text x="50" y="100" textAnchor="middle" className="text-sm font-semibold fill-gray-800">
                        Disruption Detection
                      </text>
                      <text x="50" y="115" textAnchor="middle" className="text-xs fill-gray-600">
                        {disruptionDetectionMetrics.anomalyDetection.zScoreAnalysis.alertsGenerated} Alerts
                      </text>
                    </g>
                    
                    {/* Risk Scoring Agent - Top Right */}
                    <g transform="translate(650, 50)">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="#fef3c7" 
                        stroke="#f59e0b" 
                        strokeWidth="3"
                        className={`${riskScoringMetrics.activity.length > 0 ? 'animate-pulse' : ''}`}
                      />
                      <Target className="h-7 w-7 text-yellow-600" x="43" y="43" />
                      <text x="50" y="100" textAnchor="middle" className="text-sm font-semibold fill-gray-800">
                        Risk Scoring
                      </text>
                      <text x="50" y="115" textAnchor="middle" className="text-xs fill-gray-600">
                        Score: {riskScoringMetrics.multiFactorAnalysis.overallScore.toFixed(1)}
                      </text>
                    </g>
                    
                    {/* Notification Agent - Bottom Right */}
                    <g transform="translate(650, 350)">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="#e0e7ff" 
                        stroke="#6366f1" 
                        strokeWidth="3"
                        className={`${notificationMetrics.activity.length > 0 ? 'animate-pulse' : ''}`}
                      />
                      <Bell className="h-7 w-7 text-indigo-600" x="43" y="43" />
                      <text x="50" y="100" textAnchor="middle" className="text-sm font-semibold fill-gray-800">
                        Notification
                      </text>
                      <text x="50" y="115" textAnchor="middle" className="text-xs fill-gray-600">
                        {notificationMetrics.channelSelection.phone.sent + notificationMetrics.channelSelection.email.sent} Sent
                      </text>
                    </g>
                    
                    {/* Mitigation Recommendation Agent - Bottom Left */}
                    <g transform="translate(50, 350)">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="#f3e8ff" 
                        stroke="#8b5cf6" 
                        strokeWidth="3"
                        className={`${mitigationMetrics.activity.length > 0 ? 'animate-pulse' : ''}`}
                      />
                      <Brain className="h-7 w-7 text-purple-600" x="43" y="43" />
                      <text x="50" y="100" textAnchor="middle" className="text-sm font-semibold fill-gray-800">
                        Mitigation
                      </text>
                      <text x="50" y="115" textAnchor="middle" className="text-xs fill-gray-600">
                        {mitigationMetrics.feasibilityScoring.recommendationsGenerated} Recs
                      </text>
                    </g>
                    
                    {/* Database Access Indicators - Only show along the connection paths */}
                    {dataIngestionMetrics.activity.length > 0 && (
                      <>
                        <circle cx="220" cy="145" r="4" fill="#3b82f6" className="animate-ping">
                          <animate attributeName="r" values="2;8;2" dur="1.5s" repeatCount="indefinite"/>
                          <animateMotion dur="3s" repeatCount="indefinite" path="M 100 100 L 340 190" />
                        </circle>
                        <text x="220" y="130" textAnchor="middle" className="text-xs fill-blue-600 font-semibold">WRITE</text>
                      </>
                    )}
                    
                    {disruptionDetectionMetrics.activity.length > 0 && (
                      <>
                        <circle cx="305" cy="135" r="4" fill="#10b981" className="animate-ping">
                          <animate attributeName="r" values="2;8;2" dur="1.5s" repeatCount="indefinite"/>
                          <animateMotion dur="3s" repeatCount="indefinite" path="M 250 80 L 360 190" />
                        </circle>
                        <text x="305" y="120" textAnchor="middle" className="text-xs fill-green-600 font-semibold">READ</text>
                      </>
                    )}
                    
                    {riskScoringMetrics.activity.length > 0 && (
                      <>
                        <circle cx="580" cy="145" r="4" fill="#f59e0b" className="animate-ping">
                          <animate attributeName="r" values="2;8;2" dur="1.5s" repeatCount="indefinite"/>
                          <animateMotion dur="3s" repeatCount="indefinite" path="M 700 100 L 460 190" />
                        </circle>
                        <text x="580" y="130" textAnchor="middle" className="text-xs fill-yellow-600 font-semibold">UPDATE</text>
                      </>
                    )}
                    
                    {notificationMetrics.activity.length > 0 && (
                      <>
                        <circle cx="580" cy="355" r="4" fill="#6366f1" className="animate-ping">
                          <animate attributeName="r" values="2;8;2" dur="1.5s" repeatCount="indefinite"/>
                          <animateMotion dur="3s" repeatCount="indefinite" path="M 700 400 L 460 310" />
                        </circle>
                        <text x="580" y="370" textAnchor="middle" className="text-xs fill-indigo-600 font-semibold">READ</text>
                      </>
                    )}
                    
                    {mitigationMetrics.activity.length > 0 && (
                      <>
                        <circle cx="220" cy="355" r="4" fill="#8b5cf6" className="animate-ping">
                          <animate attributeName="r" values="2;8;2" dur="1.5s" repeatCount="indefinite"/>
                          <animateMotion dur="3s" repeatCount="indefinite" path="M 100 400 L 340 310" />
                        </circle>
                        <text x="220" y="370" textAnchor="middle" className="text-xs fill-purple-600 font-semibold">READ</text>
                      </>
                    )}
                  </svg>
                  
                  {/* Real-time Status Legend */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                    <h4 className="font-semibold text-sm mb-3 text-gray-800">LangGraph Data Flow</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-slate-600 rounded-full mr-2 animate-pulse"></div>
                        <span>Shared Database State</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span>DB Write Operations</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>DB Read Operations</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span>DB Update Operations</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 border-t pt-2">
                        <div>• Agents communicate via shared state</div>
                        <div>• No direct agent-to-agent messaging</div>
                        <div>• Database is the coordination hub</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Real-time Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    System Health
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data Quality</span>
                      <span className="text-sm font-semibold text-green-600">
                        {dataIngestionMetrics.quality.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Risk Score</span>
                      <span className="text-sm font-semibold text-yellow-600">
                        {riskScoringMetrics.multiFactorAnalysis.overallScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Notifications</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {notificationMetrics.channelSelection.phone.sent + 
                         notificationMetrics.channelSelection.email.sent + 
                         notificationMetrics.channelSelection.sms.sent}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ROI</span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {mitigationMetrics.roiCalculations.roiPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Recent Agent Activity */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    Agent Activity
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {[
                      ...dataIngestionMetrics.activity.slice(0, 1),
                      ...disruptionDetectionMetrics.activity.slice(0, 1),
                      ...riskScoringMetrics.activity.slice(0, 1),
                      ...notificationMetrics.activity.slice(0, 1),
                      ...mitigationMetrics.activity.slice(0, 1)
                    ]
                      .sort((a, b) => b.id - a.id)
                      .slice(0, 5)
                      .map(activity => (
                        <div key={activity.id} className="text-xs text-gray-600 border-l-2 border-blue-300 pl-2">
                          <div className="font-medium">{activity.type || activity.event}</div>
                          <div className="text-gray-500">{activity.time}</div>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Workflow Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Workflow Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isRunning ? 'Active' : 'Stopped'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Run</span>
                      <span className="text-xs text-gray-500">
                        {workflowStatus.lastExecution
                          ? new Date(workflowStatus.lastExecution).toLocaleTimeString()
                          : "Not started"}
                      </span>
                    </div>
                    {workflowStatus.results && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Disruptions</span>
                          <span className="text-xs font-semibold text-red-600">
                            {workflowStatus.results.disruptionsDetected}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">High Risk Orders</span>
                          <span className="text-xs font-semibold text-orange-600">
                            {workflowStatus.results.highRiskOrders}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Notifications</span>
                          <span className="text-xs font-semibold text-blue-600">
                            {workflowStatus.results.notificationsSent}
                          </span>
                        </div>
                      </>
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
              <h3 className="text-lg font-semibold mb-6">Advanced Data Ingestion Agent - Real-time Monitor</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time External Data Feeds */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Globe className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Real-time External Data Feeds</h4>
                    <div className="ml-auto flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs text-gray-600">Live</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(dataIngestionMetrics.dataFeeds).map(([key, feed]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            feed.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                          } ${feed.status === 'active' ? 'animate-pulse' : ''}`}></div>
                          <div>
                            <span className="font-medium">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <div className="text-xs text-gray-500">
                              {feed.dataPoints.toLocaleString()} data points
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-600">
                            {feed.lastUpdate.toLocaleTimeString()}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            feed.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {feed.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Normalization with Live Metrics */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Activity className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Data Normalization</h4>
                    <div className="ml-auto">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Real-time
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(dataIngestionMetrics.normalization).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            value > 95 ? 'bg-green-100 text-green-800' : 
                            value > 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {value.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              value > 95 ? 'bg-green-500' : 
                              value > 90 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{width: `${value}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knowledge Base Updates with Live Stats */}
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
                      <div className="text-xs text-purple-600 mt-1">
                        Last update: {new Date().toLocaleTimeString()}
                      </div>
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
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-mono">
                          {(45231 + Math.floor(Date.now() / 10000) % 1000).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">Continuous model refinement</div>
                    </div>
                  </div>
                </div>

                {/* Quality Assessment with Real-time Metrics */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-orange-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Quality Assessment</h4>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(dataIngestionMetrics.quality).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className={`text-lg font-bold ${
                            value > 95 ? 'text-green-600' : 
                            value > 90 ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {value.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              value > 95 ? 'bg-green-500' : 
                              value > 90 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                            style={{width: `${value}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Data Ingestion Activity Stream */}
              <div className="mt-8 bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Live Data Ingestion Activity</h4>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-gray-600">Live Stream</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dataIngestionMetrics.activity.length > 0 ? (
                    dataIngestionMetrics.activity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">{activity.time}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            activity.status === 'success' ? 'bg-green-100 text-green-800' : 
                            activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Waiting for data ingestion activities...
                    </div>
                  )}
                </div>
              </div>

              {/* System Performance Indicators */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">Throughput</div>
                      <div className="text-2xl font-bold">
                        {Math.floor(Math.random() * 50) + 150}/sec
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 opacity-80" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">Latency</div>
                      <div className="text-2xl font-bold">
                        {Math.floor(Math.random() * 20) + 15}ms
                      </div>
                    </div>
                    <Activity className="h-8 w-8 opacity-80" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">Memory Usage</div>
                      <div className="text-2xl font-bold">
                        {Math.floor(Math.random() * 20) + 65}%
                      </div>
                    </div>
                    <Database className="h-8 w-8 opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "disruption-detection" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6">Enhanced Disruption Detection Agent - Real-time Monitor</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ML-Based Anomaly Detection */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Shield className="h-6 w-6 text-red-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">ML-Based Anomaly Detection</h4>
                    <div className="ml-auto flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs text-gray-600">Active</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Z-Score Analysis</span>
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">{disruptionDetectionMetrics.anomalyDetection.zScoreAnalysis.alertsGenerated} alerts</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">Threshold: {disruptionDetectionMetrics.anomalyDetection.zScoreAnalysis.threshold}σ</div>
                      <div className={`mt-2 px-2 py-1 text-xs rounded-full inline-block ${
                        disruptionDetectionMetrics.anomalyDetection.zScoreAnalysis.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {disruptionDetectionMetrics.anomalyDetection.zScoreAnalysis.status}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">EWMA Trend Analysis</span>
                        <span className="text-lg font-bold text-blue-600">{disruptionDetectionMetrics.anomalyDetection.ewmaAnalysis.trendAccuracy.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm text-gray-600">Deviations detected: {disruptionDetectionMetrics.anomalyDetection.ewmaAnalysis.deviations}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{width: `${disruptionDetectionMetrics.anomalyDetection.ewmaAnalysis.trendAccuracy}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Predictive Analytics */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Brain className="h-6 w-6 text-purple-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Predictive Analytics</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">ETA Variance Forecasting</span>
                        <span className="text-lg font-bold text-purple-600">{disruptionDetectionMetrics.predictiveAnalytics.etaVarianceForecasting.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm text-gray-600">Predictions: {disruptionDetectionMetrics.predictiveAnalytics.etaVarianceForecasting.predictions}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Supplier Delay Spike Detection</span>
                        <div className="flex space-x-2">
                          <span className="text-sm text-red-600">{disruptionDetectionMetrics.predictiveAnalytics.supplierDelaySpikes.detected} detected</span>
                          <span className="text-sm text-green-600">{disruptionDetectionMetrics.predictiveAnalytics.supplierDelaySpikes.prevented} prevented</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rule-Based Decision Engine */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Zap className="h-6 w-6 text-yellow-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Rule-Based Decision Engine</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">SLA Threshold Monitoring</span>
                        <div className="flex space-x-2">
                          <span className="text-sm text-red-600">{disruptionDetectionMetrics.ruleBasedEngine.slaMonitoring.breaches} breaches</span>
                          <span className="text-sm text-yellow-600">{disruptionDetectionMetrics.ruleBasedEngine.slaMonitoring.warnings} warnings</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Supplier Alerts</span>
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">{disruptionDetectionMetrics.ruleBasedEngine.supplierAlerts.critical} critical</span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{disruptionDetectionMetrics.ruleBasedEngine.supplierAlerts.warnings} warnings</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Indicators */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Activity className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Real-time Indicators</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Port Congestion</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          disruptionDetectionMetrics.realTimeIndicators.portCongestion.level === 'high' ? 'bg-red-100 text-red-800' :
                          disruptionDetectionMetrics.realTimeIndicators.portCongestion.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {disruptionDetectionMetrics.realTimeIndicators.portCongestion.level}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">Impact: {disruptionDetectionMetrics.realTimeIndicators.portCongestion.impact}% delay</div>
                      <div className="text-xs text-gray-500">Affected: {disruptionDetectionMetrics.realTimeIndicators.portCongestion.ports.join(', ')}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Carrier Performance</span>
                        <span className="text-lg font-bold text-green-600">{disruptionDetectionMetrics.realTimeIndicators.carrierPerformance.onTimeRate}%</span>
                      </div>
                      <div className="text-sm text-gray-600">Avg Delay: {disruptionDetectionMetrics.realTimeIndicators.carrierPerformance.avgDelay} hours</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Activity Stream */}
              <div className="mt-8 bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Live Disruption Detection Activity</h4>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-gray-600">Real-time</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {disruptionDetectionMetrics.activity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.severity === 'high' ? 'bg-red-500' : 
                          activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{activity.type}</div>
                          <div className="text-sm text-gray-600">{activity.details}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{activity.time}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.severity === 'high' ? 'bg-red-100 text-red-800' : 
                          activity.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {activity.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === "risk-scoring" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6">Sophisticated Risk Scoring Agent - Live Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comprehensive Risk Model */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Target className="h-6 w-6 text-red-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Comprehensive Risk Model</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Revenue at Risk</span>
                        <span className="text-lg font-bold text-red-600">${riskScoringMetrics.riskModel.revenueAtRisk.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">SLA Breach Costs</span>
                        <span className="text-lg font-bold text-orange-600">${riskScoringMetrics.riskModel.slaBreach.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Customer Lifetime Value</span>
                        <span className="text-lg font-bold text-green-600">${riskScoringMetrics.riskModel.customerLifetimeValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Risk Exposure</span>
                        <span className="text-xl font-bold">${riskScoringMetrics.riskModel.totalRiskExposure.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-factor Analysis */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Multi-factor Analysis</h4>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(riskScoringMetrics.multiFactorAnalysis).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className={`text-lg font-bold ${
                            value > 90 ? 'text-green-600' : 
                            value > 80 ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {value.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              value > 90 ? 'bg-green-500' : 
                              value > 80 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                            style={{width: `${value}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Thresholds */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Dynamic Thresholds</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Immediate Response (70+)</span>
                        <span className="text-lg font-bold text-orange-600">{riskScoringMetrics.thresholds.immediateResponse} orders</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Emergency Escalation (85+)</span>
                        <span className="text-lg font-bold text-red-600">{riskScoringMetrics.thresholds.emergencyEscalation} orders</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Total Orders Analyzed</span>
                        <span className="text-lg font-bold text-gray-700">{riskScoringMetrics.thresholds.totalOrders}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mitigation Cost-Benefit */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Mitigation Cost-Benefit</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Air Freight Options</span>
                        <span className="text-lg font-bold text-blue-600">${riskScoringMetrics.mitigationCosts.airFreight.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Alternative Suppliers</span>
                        <span className="text-lg font-bold text-orange-600">${riskScoringMetrics.mitigationCosts.alternativeSuppliers.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Partial Shipments</span>
                        <span className="text-lg font-bold text-green-600">${riskScoringMetrics.mitigationCosts.partialShipments.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Activity Stream */}
              <div className="mt-8 bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Live Risk Scoring Activity</h4>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-gray-600">Real-time Analysis</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {riskScoringMetrics.activity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.riskLevel === 'high' ? 'bg-red-500' : 
                          activity.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{activity.type}</div>
                          <div className="text-sm text-gray-600">{activity.details}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{activity.time}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 
                          activity.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {activity.riskLevel} risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === "intelligent-notification" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6">Intelligent Notification Agent - Communication Hub</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tiered Communication Strategy */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Users className="h-6 w-6 text-purple-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Tiered Communication Strategy</h4>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(notificationMetrics.segmentation).map(([tier, data]) => (
                      <div key={tier} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-medium text-gray-900 px-2 py-1 rounded-full text-sm ${
                            tier === 'vip' ? 'bg-gold-100 text-gold-800' :
                            tier === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tier.toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-gray-700">{data.count} customers</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Response Rate: {data.responseRate}%</span>
                          <span className="text-gray-600">Avg Response: {data.avgResponseTime}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-purple-500 h-2 rounded-full transition-all duration-1000" style={{width: `${data.responseRate}%`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Channel Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Smart Channel Selection</h4>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(notificationMetrics.channelSelection).map(([channel, data]) => (
                      <div key={channel} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {channel === 'phone' && <Phone className="h-4 w-4 text-green-600 mr-2" />}
                            {channel === 'email' && <Mail className="h-4 w-4 text-blue-600 mr-2" />}
                            {channel === 'sms' && <MessageSquare className="h-4 w-4 text-purple-600 mr-2" />}
                            <span className="font-medium text-gray-900 capitalize">{channel}</span>
                          </div>
                          <span className="text-lg font-bold text-gray-700">{data.sent} sent</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {channel === 'phone' ? `${data.delivered} answered` : 
                             channel === 'email' ? `${data.opened || data.delivered} opened` : 
                             `${data.delivered} delivered`}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            data.effectiveness > 95 ? 'bg-green-100 text-green-800' :
                            data.effectiveness > 90 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {data.effectiveness.toFixed(1)}% effective
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personalized Messaging */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <Target className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Personalized Messaging</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Tone Adaptation</span>
                        <span className="text-lg font-bold text-green-600">{notificationMetrics.personalization.toneAdaptation}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{width: `${notificationMetrics.personalization.toneAdaptation}%`}}></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Detail Level Optimization</span>
                        <span className="text-lg font-bold text-blue-600">{notificationMetrics.personalization.detailLevel}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{width: `${notificationMetrics.personalization.detailLevel}%`}}></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Customer Satisfaction</span>
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-purple-600">{notificationMetrics.personalization.customerSatisfaction}/5.0</span>
                          <span className="text-yellow-500 ml-1">★</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Escalation Protocols */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Escalation Protocols</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Executive Involvements</span>
                        <span className="text-lg font-bold text-red-600">{notificationMetrics.escalation.executiveInvolvements}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Critical Orders</span>
                        <span className="text-lg font-bold text-orange-600">{notificationMetrics.escalation.criticalOrders}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Resolution Rate</span>
                        <span className="text-xl font-bold">{notificationMetrics.escalation.resolutionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Activity Stream */}
              <div className="mt-8 bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Live Notification Activity</h4>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-gray-600">Real-time</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notificationMetrics.activity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.channel === 'phone' ? 'bg-green-500' : 
                          activity.channel === 'email' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{activity.type}</div>
                          <div className="text-sm text-gray-600">{activity.details}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{activity.time}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.channel === 'phone' ? 'bg-green-100 text-green-800' : 
                          activity.channel === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {activity.channel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === "mitigation-recommendation" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6">Mitigation Recommendation Agent - Optimization Engine</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Optimization Engine */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Cost Optimization Engine</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Shipping Costs</span>
                        <span className="text-lg font-bold text-blue-600">${mitigationMetrics.costOptimization.shippingCosts.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Inventory Costs</span>
                        <span className="text-lg font-bold text-orange-600">${mitigationMetrics.costOptimization.inventoryCosts.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Penalty Costs</span>
                        <span className="text-lg font-bold text-red-600">${mitigationMetrics.costOptimization.penaltyCosts.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Optimized</span>
                        <span className="text-xl font-bold">${mitigationMetrics.costOptimization.totalOptimized.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multiple Options Analysis */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Multiple Options Analysis</h4>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(mitigationMetrics.optionsAnalysis).map(([option, data]) => (
                      <div key={option} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className="text-lg font-bold text-blue-600">${data.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Timeline: {data.timeline}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            data.probability > 90 ? 'bg-green-100 text-green-800' : 
                            data.probability > 80 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {data.probability}% success
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              data.probability > 90 ? 'bg-green-500' : 
                              data.probability > 80 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{width: `${data.probability}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROI Calculations */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="h-6 w-6 text-purple-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">ROI Calculations</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Implementation Cost</span>
                        <span className="text-lg font-bold text-red-600">${mitigationMetrics.roiCalculations.implementationCost.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Risk Reduction Value</span>
                        <span className="text-lg font-bold text-green-600">${mitigationMetrics.roiCalculations.riskReduction.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Net Benefit</span>
                        <span className="text-lg font-bold text-blue-600">${mitigationMetrics.roiCalculations.netBenefit.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">ROI Percentage</span>
                        <span className="text-xl font-bold">{mitigationMetrics.roiCalculations.roiPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feasibility Scoring */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-orange-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Feasibility Scoring</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Average Success Probability</span>
                        <span className="text-lg font-bold text-green-600">{mitigationMetrics.feasibilityScoring.avgSuccessProbability.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{width: `${mitigationMetrics.feasibilityScoring.avgSuccessProbability}%`}}></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Average Timeline</span>
                        <span className="text-lg font-bold text-blue-600">{mitigationMetrics.feasibilityScoring.avgTimeline.toFixed(1)} days</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Recommendations Generated</span>
                        <span className="text-lg font-bold text-purple-600">{mitigationMetrics.feasibilityScoring.recommendationsGenerated}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Activity Stream */}
              <div className="mt-8 bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Live Mitigation Activity</h4>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-gray-600">Optimization Engine</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mitigationMetrics.activity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.impact === 'high' ? 'bg-green-500' : 
                          activity.impact === 'medium' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{activity.type}</div>
                          <div className="text-sm text-gray-600">{activity.details}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{activity.time}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.impact === 'high' ? 'bg-green-100 text-green-800' : 
                          activity.impact === 'medium' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.impact} impact
                        </span>
                      </div>
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
