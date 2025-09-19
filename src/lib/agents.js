import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { SupabaseService } from "./supabase";
import { RAGService } from "./rag";

const llm = new ChatOpenAI({
  openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.1,
});

// Enhanced Data Ingestion Agent with configurable API polling schedules
export class EnhancedDataIngestionAgent {
  constructor() {
    this.name = "data_ingestion";
    this.isRunning = false;
    this.intervals = new Map();
    
    // Configurable polling schedules (in milliseconds)
    this.pollingSchedules = {
      // High-frequency: Critical real-time data
      carrierTracking: {
        interval: 5 * 60 * 1000,      // Every 5 minutes
        apis: ['fedex', 'ups', 'dhl', 'maersk', 'cosco'],
        priority: 'high'
      },
      
      weatherAlerts: {
        interval: 15 * 60 * 1000,     // Every 15 minutes
        apis: ['openweathermap', 'noaa'],
        priority: 'high'
      },
      
      portCongestion: {
        interval: 30 * 60 * 1000,     // Every 30 minutes
        apis: ['marinetraffic'],
        priority: 'high'
      },
      
      // Medium-frequency: Important operational data
      supplierEDI: {
        interval: 60 * 60 * 1000,     // Every 1 hour
        apis: ['supplier_portals', 'edi_feeds'],
        priority: 'medium'
      },
      
      internalERP: {
        interval: 30 * 60 * 1000,     // Every 30 minutes
        apis: ['erp_system', 'wms_system', 'tms_system'],
        priority: 'medium'
      },
      
      customsDelays: {
        interval: 2 * 60 * 60 * 1000, // Every 2 hours
        apis: ['customs_api'],
        priority: 'medium'
      },
      
      // Lower-frequency: Background intelligence
      newsSentiment: {
        interval: 4 * 60 * 60 * 1000, // Every 4 hours
        apis: ['newsapi', 'reuters'],
        priority: 'low'
      },
      
      geopoliticalAlerts: {
        interval: 6 * 60 * 60 * 1000, // Every 6 hours
        apis: ['gdelt'],
        priority: 'low'
      },
      
      socialMediaSignals: {
        interval: 2 * 60 * 60 * 1000, // Every 2 hours
        apis: ['twitter_api'],
        priority: 'low'
      }
    };
    
    // Rate limiting and error handling
    this.rateLimits = new Map();
    this.errorCounts = new Map();
    this.maxRetries = 3;
    this.backoffMultiplier = 2;
  }

  async startContinuousIngestion() {
    if (this.isRunning) {
      console.log("🔄 Data ingestion already running");
      return;
    }

    console.log("🚀 Starting continuous data ingestion with optimized polling schedules...");
    this.isRunning = true;

    // Start each data source with its specific polling schedule
    for (const [sourceName, config] of Object.entries(this.pollingSchedules)) {
      this.scheduleDataSource(sourceName, config);
    }

    // Start immediate initial ingestion
    await this.executeFullIngestion();
  }

  scheduleDataSource(sourceName, config) {
    console.log(`📅 Scheduling ${sourceName} polling every ${config.interval / 1000 / 60} minutes`);
    
    const intervalId = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.ingestFromSource(sourceName, config);
      } catch (error) {
        console.error(`❌ Error ingesting from ${sourceName}:`, error);
        await this.handleIngestionError(sourceName, error);
      }
    }, config.interval);

    this.intervals.set(sourceName, intervalId);
  }

  async ingestFromSource(sourceName, config) {
    // Check rate limits
    if (this.isRateLimited(sourceName)) {
      console.log(`⏳ Rate limited for ${sourceName}, skipping this cycle`);
      return;
    }

    console.log(`🔍 Ingesting from ${sourceName} (Priority: ${config.priority})`);
    
    const startTime = Date.now();
    let data = {};

    switch (sourceName) {
      case 'carrierTracking':
        data = await this.fetchCarrierData(config.apis);
        break;
        
      case 'weatherAlerts':
        data = await this.fetchWeatherData(config.apis);
        break;
        
      case 'portCongestion':
        data = await this.fetchPortData(config.apis);
        break;
        
      case 'supplierEDI':
        data = await this.fetchSupplierData(config.apis);
        break;
        
      case 'internalERP':
        data = await this.fetchInternalData(config.apis);
        break;
        
      case 'customsDelays':
        data = await this.fetchCustomsData(config.apis);
        break;
        
      case 'newsSentiment':
        data = await this.fetchNewsData(config.apis);
        break;
        
      case 'geopoliticalAlerts':
        data = await this.fetchGeopoliticalData(config.apis);
        break;
        
      case 'socialMediaSignals':
        data = await this.fetchSocialMediaData(config.apis);
        break;
    }

    // Update rate limiting
    this.updateRateLimit(sourceName);
    
    // Clear error count on successful ingestion
    this.errorCounts.set(sourceName, 0);

    // Process and store the data
    await this.processAndStoreData(sourceName, data, config.priority);
    
    const duration = Date.now() - startTime;
    console.log(`✅ ${sourceName} ingestion completed in ${duration}ms`);
    
    // Update agent state with source-specific metrics
    await this.updateSourceMetrics(sourceName, data, duration);
  }

  async fetchCarrierData(apis) {
    // Mock implementation - replace with actual API calls
    const carrierData = {};
    
    for (const carrier of apis) {
      try {
        // Actual API call would go here
        // const response = await fetch(`https://api.${carrier}.com/tracking`, {
        //   headers: { 'Authorization': `Bearer ${process.env[`${carrier.toUpperCase()}_API_KEY`]}` }
        // });
        
        // Mock data for demonstration
        carrierData[carrier] = {
          trackingUpdates: Math.floor(Math.random() * 100) + 50,
          avgDelay: Math.random() * 2,
          serviceDisruptions: Math.floor(Math.random() * 5),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Failed to fetch data from ${carrier}:`, error);
        carrierData[carrier] = { error: error.message };
      }
    }
    
    return carrierData;
  }

  async fetchWeatherData(apis) {
    // Mock weather data - replace with actual API calls
    return {
      activeAlerts: Math.floor(Math.random() * 20),
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      affectedRegions: ['US-West', 'EU-North', 'ASIA-Southeast'].slice(0, Math.floor(Math.random() * 3) + 1),
      forecast: {
        storms: Math.random() > 0.7,
        hurricanes: Math.random() > 0.95,
        snow: Math.random() > 0.8
      },
      timestamp: new Date().toISOString()
    };
  }

  async fetchPortData(apis) {
    // Mock port congestion data
    const ports = ['Los Angeles', 'Long Beach', 'New York', 'Savannah', 'Rotterdam', 'Shanghai'];
    const portData = {};
    
    ports.forEach(port => {
      portData[port] = {
        congestionLevel: Math.floor(Math.random() * 100),
        waitTime: Math.floor(Math.random() * 48), // hours
        vesselBacklog: Math.floor(Math.random() * 50),
        timestamp: new Date().toISOString()
      };
    });
    
    return { ports: portData };
  }

  async processAndStoreData(sourceName, data, priority) {
    // Normalize the data
    const normalizedData = this.normalizeSourceData(sourceName, data, priority);
    
    // Store in knowledge base for RAG
    await this.storeInKnowledgeBase(sourceName, normalizedData);
    
    // Update real-time metrics
    await this.updateRealTimeMetrics(sourceName, normalizedData);
    
    // Trigger downstream processing for high-priority data
    if (priority === 'high') {
      await this.triggerDownstreamProcessing(sourceName, normalizedData);
    }
  }

  normalizeSourceData(sourceName, data, priority) {
    return {
      source: sourceName,
      priority,
      timestamp: new Date().toISOString(),
      dataHash: this.generateDataHash(data),
      processedData: data,
      metadata: {
        ingestionTime: new Date().toISOString(),
        dataSize: JSON.stringify(data).length,
        recordCount: this.getRecordCount(data)
      }
    };
  }

  async storeInKnowledgeBase(sourceName, normalizedData) {
    try {
      await SupabaseService.supabase
        .from('knowledge_base')
        .insert({
          category: `realtime_${sourceName}`,
          title: `${sourceName} data - ${new Date().toLocaleString()}`,
          content: JSON.stringify(normalizedData.processedData),
          metadata: {
            source: 'data_ingestion_agent',
            priority: normalizedData.priority,
            ingestion_time: normalizedData.timestamp,
            data_hash: normalizedData.dataHash
          },
          keywords: this.generateSourceKeywords(sourceName, normalizedData.processedData)
        });
    } catch (error) {
      console.error(`Failed to store ${sourceName} data in knowledge base:`, error);
    }
  }

  async handleIngestionError(sourceName, error) {
    const errorCount = (this.errorCounts.get(sourceName) || 0) + 1;
    this.errorCounts.set(sourceName, errorCount);

    console.error(`❌ ${sourceName} ingestion failed (attempt ${errorCount}/${this.maxRetries}):`, error.message);

    if (errorCount >= this.maxRetries) {
      // Implement exponential backoff
      const backoffDelay = Math.pow(this.backoffMultiplier, errorCount) * 60000; // Base 1 minute
      console.log(`⏰ Implementing backoff for ${sourceName}: ${backoffDelay / 1000} seconds`);
      
      setTimeout(() => {
        this.errorCounts.set(sourceName, 0); // Reset after backoff
      }, backoffDelay);
    }

    // Log error to monitoring system
    await this.logIngestionError(sourceName, error, errorCount);
  }

  isRateLimited(sourceName) {
    const lastCall = this.rateLimits.get(sourceName);
    if (!lastCall) return false;
    
    // Simple rate limiting: minimum 1 second between calls
    return (Date.now() - lastCall) < 1000;
  }

  updateRateLimit(sourceName) {
    this.rateLimits.set(sourceName, Date.now());
  }

  async stopContinuousIngestion() {
    console.log("🛑 Stopping continuous data ingestion...");
    this.isRunning = false;
    
    // Clear all intervals
    for (const [sourceName, intervalId] of this.intervals.entries()) {
      clearInterval(intervalId);
      console.log(`🔽 Stopped polling for ${sourceName}`);
    }
    
    this.intervals.clear();
    
    // Final state update
    await SupabaseService.updateAgentState(this.name, {
      status: 'stopped',
      lastExecution: new Date().toISOString(),
      totalSources: Object.keys(this.pollingSchedules).length
    });
  }

  // Utility methods
  generateDataHash(data) {
    return btoa(JSON.stringify(data)).slice(0, 16);
  }

  getRecordCount(data) {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 1;
  }

  generateSourceKeywords(sourceName, data) {
    const baseKeywords = [sourceName, 'real-time', 'api-data'];
    
    // Add source-specific keywords
    switch (sourceName) {
      case 'carrierTracking':
        baseKeywords.push('tracking', 'shipping', 'logistics', 'delivery');
        break;
      case 'weatherAlerts':
        baseKeywords.push('weather', 'storm', 'climate', 'forecast');
        break;
      case 'portCongestion':
        baseKeywords.push('port', 'congestion', 'maritime', 'vessel');
        break;
    }
    
    return baseKeywords;
  }

  // Configuration methods
  updatePollingFrequency(sourceName, newInterval) {
    if (this.pollingSchedules[sourceName]) {
      this.pollingSchedules[sourceName].interval = newInterval;
      
      if (this.isRunning && this.intervals.has(sourceName)) {
        // Restart the specific source with new frequency
        clearInterval(this.intervals.get(sourceName));
        this.scheduleDataSource(sourceName, this.pollingSchedules[sourceName]);
      }
      
      console.log(`📅 Updated ${sourceName} polling frequency to ${newInterval / 1000 / 60} minutes`);
    }
  }

  getPollingStatus() {
    return {
      isRunning: this.isRunning,
      activeSources: Array.from(this.intervals.keys()),
      schedules: this.pollingSchedules,
      errorCounts: Object.fromEntries(this.errorCounts),
      rateLimits: Object.fromEntries(this.rateLimits)
    };
  }
}

export class RiskScoringAgent {
  constructor() {
    this.name = "risk_scoring";
    this.riskWeights = {
      priority: { low: 10, medium: 25, high: 50, critical: 75 },
      customerTier: { standard: 0, premium: 15, vip: 30, enterprise: 50 },
      orderValue: { multiplier: 0.02 }, // 2 points per $1000
      slaRisk: { multiplier: 5 }, // 5 points per day over SLA
      supplierRisk: { multiplier: 0.3 }, // 30% of supplier health score impact
      inventoryBuffer: { low: 20, medium: 10, high: 0 }, // Points added for low buffer
      seasonalFactor: { peak: 15, normal: 0, low: -5 }
    };

    this.prompt = new PromptTemplate({
      template: `
You are an advanced supply chain risk assessment AI implementing sophisticated scoring algorithms.

Order Analysis Data:
Orders: {orderData}
Active Disruptions: {disruptionData}
Supplier Health Scores: {supplierHealth}
Inventory Status: {inventoryStatus}
Customer Profiles: {customerProfiles}
Historical Risk Patterns: {riskPatterns}
Market Conditions: {marketConditions}

Risk Scoring Model (as per playbook):
1. Revenue at Risk = Order Value × Probability of Loss
2. SLA Breach Cost = Penalty Cost + Expedited Shipping Cost
3. Customer Lifetime Value Impact = CLV × Churn Risk Probability

Calculate comprehensive risk scores (0-100) for each order considering:
- Order priority and customer tier weighting
- Current inventory buffer levels
- Supplier reliability and health scores
- Active disruption correlation
- Historical performance patterns
- Seasonal demand factors

Decision Thresholds:
- Score < 50: Internal monitoring only
- Score 50-69: Scheduled customer communication
- Score 70-84: Immediate proactive outreach
- Score 85+: Emergency escalation protocol

Return JSON array of scored orders:
{
  "orderId": "uuid",
  "orderNumber": "string",
  "riskScore": 85,
  "riskCategory": "high/critical",
  "reasoning": "detailed explanation",
  "revenueAtRisk": 15000,
  "slaBreachCost": 2500,
  "customerImpact": "high",
  "recommendedActions": ["action1", "action2"],
  "escalationLevel": "immediate/scheduled/monitoring",
  "mitigationOptions": [
    {
      "option": "air_freight",
      "cost": 1200,
      "timeImprovement": 3,
      "feasibility": "high"
    }
  ]
}

Response:`,
      inputVariables: ["orderData", "disruptionData", "supplierHealth", "inventoryStatus", "customerProfiles", "riskPatterns", "marketConditions"],
    });
  }

  async execute(orders, disruptions) {
    try {
      console.log("📊 Starting advanced risk scoring...");

      // Gather comprehensive context data
      const contextData = await this.gatherRiskContext(orders, disruptions);
      
      // Get historical risk patterns from RAG
      const riskPatterns = await RAGService.retrieveRelevantKnowledge(
        'risk_patterns',
        'order risk customer tier supplier performance'
      );

      const chain = new LLMChain({ llm, prompt: this.prompt });

      const result = await chain.call({
        orderData: JSON.stringify(orders.slice(0, 10)), // Limit for context
        disruptionData: JSON.stringify(disruptions),
        supplierHealth: JSON.stringify(contextData.supplierHealth),
        inventoryStatus: JSON.stringify(contextData.inventoryStatus),
        customerProfiles: JSON.stringify(contextData.customerProfiles),
        riskPatterns: JSON.stringify(riskPatterns.slice(0, 3)),
        marketConditions: JSON.stringify(contextData.marketConditions)
      });

      let scoredOrders = [];
      try {
        scoredOrders = JSON.parse(result.text);
      } catch {
        console.log("Falling back to enhanced algorithmic scoring");
        scoredOrders = await this.enhancedAlgorithmicScoring(orders, disruptions, contextData);
      }

      // Update risk scores in database
      await this.updateOrderRiskScores(scoredOrders);

      // Store risk patterns in knowledge base
      await this.storeRiskPatterns(scoredOrders, contextData);

      await SupabaseService.updateAgentState(this.name, {
        lastExecution: new Date().toISOString(),
        ordersScored: scoredOrders.length,
        highRiskOrders: scoredOrders.filter(o => o.riskScore >= 70).length,
        criticalRiskOrders: scoredOrders.filter(o => o.riskScore >= 85).length,
        avgRiskScore: scoredOrders.reduce((sum, o) => sum + o.riskScore, 0) / scoredOrders.length
      });

      return scoredOrders;
    } catch (error) {
      console.error("Risk scoring error:", error);
      return await this.enhancedAlgorithmicScoring(orders, disruptions, {});
    }
  }

  async gatherRiskContext(orders, disruptions) {
    try {
      // Get supplier health data
      const supplierIds = [...new Set(orders.map(o => o.supplier_id).filter(Boolean))];
      const supplierHealth = await this.getSupplierHealthScores(supplierIds);

      // Get inventory status
      const skus = [...new Set(orders.map(o => o.sku))];
      const inventoryStatus = await this.getInventoryStatus(skus);

      // Get customer profiles
      const customerIds = [...new Set(orders.map(o => o.customer_id).filter(Boolean))];
      const customerProfiles = await this.getCustomerProfiles(customerIds);

      // Generate market conditions context
      const marketConditions = this.generateMarketConditions();

      return {
        supplierHealth,
        inventoryStatus,
        customerProfiles,
        marketConditions
      };
    } catch (error) {
      console.error("Error gathering risk context:", error);
      return {};
    }
  }

  async getSupplierHealthScores(supplierIds) {
    if (!supplierIds.length) return [];

    try {
      const { data, error } = await SupabaseService.supabase
        .from('suppliers')
        .select('id, name, reliability_score, performance_metrics')
        .in('id', supplierIds);

      if (error) throw error;

      return data.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        healthScore: supplier.reliability_score || 85,
        performanceMetrics: supplier.performance_metrics || {}
      }));
    } catch (error) {
      console.error("Error fetching supplier health:", error);
      return [];
    }
  }

  async getInventoryStatus(skus) {
    if (!skus.length) return [];

    try {
      const { data, error } = await SupabaseService.supabase
        .from('inventory')
        .select('sku, current_stock, reorder_point, locations')
        .in('sku', skus);

      if (error) throw error;

      return data.map(item => ({
        sku: item.sku,
        currentStock: item.current_stock,
        reorderPoint: item.reorder_point,
        bufferLevel: this.calculateBufferLevel(item.current_stock, item.reorder_point),
        locations: item.locations || []
      }));
    } catch (error) {
      console.error("Error fetching inventory status:", error);
      return [];
    }
  }

  calculateBufferLevel(currentStock, reorderPoint) {
    const ratio = currentStock / reorderPoint;
    if (ratio <= 1) return 'low';
    if (ratio <= 2) return 'medium';
    return 'high';
  }

  async getCustomerProfiles(customerIds) {
    if (!customerIds.length) return [];

    try {
      const { data, error } = await SupabaseService.supabase
        .from('customers')
        .select('id, name, tier, lifetime_value, churn_risk, preferred_channel')
        .in('id', customerIds);

      if (error) throw error;

      return data.map(customer => ({
        id: customer.id,
        name: customer.name,
        tier: customer.tier || 'standard',
        lifetimeValue: customer.lifetime_value || 10000,
        churnRisk: customer.churn_risk || 0.1,
        preferredChannel: customer.preferred_channel || 'email'
      }));
    } catch (error) {
      console.error("Error fetching customer profiles:", error);
      return [];
    }
  }

  generateMarketConditions() {
    const currentMonth = new Date().getMonth();
    const isQ4 = currentMonth >= 9; // Oct, Nov, Dec
    const isPeakSeason = isQ4 || currentMonth <= 1; // Q4 or Jan-Feb

    return {
      seasonalFactor: isPeakSeason ? 'peak' : 'normal',
      demandMultiplier: isPeakSeason ? 1.3 : 1.0,
      capacityConstraints: isPeakSeason ? 'high' : 'medium',
      marketVolatility: Math.random() * 100,
      economicIndicators: {
        gdpGrowth: 2.1 + Math.random() * 2,
        inflationRate: 3.2 + Math.random() * 2,
        supplyChainPressureIndex: 60 + Math.random() * 40
      }
    };
  }

  async enhancedAlgorithmicScoring(orders, disruptions, contextData) {
    const scoredOrders = [];

    for (const order of orders) {
      const riskScore = await this.calculateComprehensiveRiskScore(order, disruptions, contextData);
      
      const scoredOrder = {
        orderId: order.id,
        orderNumber: order.order_number,
        riskScore: riskScore.total,
        riskCategory: this.categorizeRisk(riskScore.total),
        reasoning: riskScore.reasoning,
        revenueAtRisk: this.calculateRevenueAtRisk(order, riskScore.total),
        slaBreachCost: this.calculateSlaBreachCost(order),
        customerImpact: this.assessCustomerImpact(order, contextData.customerProfiles),
        recommendedActions: this.generateRecommendedActions(riskScore.total, order),
        escalationLevel: this.determineEscalationLevel(riskScore.total),
        mitigationOptions: await this.generateMitigationOptions(order, riskScore.total)
      };

      scoredOrders.push(scoredOrder);
    }

    return scoredOrders;
  }

  async calculateComprehensiveRiskScore(order, disruptions, contextData) {
    let score = 0;
    const factors = [];

    // Priority weight
    const priorityScore = this.riskWeights.priority[order.priority] || 10;
    score += priorityScore;
    factors.push(`Priority (${order.priority}): +${priorityScore}`);

    // Customer tier weight
    const customer = contextData.customerProfiles?.find(c => c.id === order.customer_id);
    const tierScore = this.riskWeights.customerTier[customer?.tier] || 0;
    score += tierScore;
    if (tierScore > 0) factors.push(`Customer tier (${customer?.tier}): +${tierScore}`);

    // Order value impact
    const valueScore = Math.min((order.value || 0) * this.riskWeights.orderValue.multiplier, 30);
    score += valueScore;
    factors.push(`Order value (${order.value || 0}): +${Math.round(valueScore)}`);

    // SLA risk calculation
    if (order.expected_delivery) {
      const daysToDelivery = Math.ceil((new Date(order.expected_delivery) - new Date()) / (1000 * 60 * 60 * 24));
      const slaThreshold = order.sla_threshold || 5;
      if (daysToDelivery < slaThreshold) {
        const slaRiskScore = (slaThreshold - daysToDelivery) * this.riskWeights.slaRisk.multiplier;
        score += slaRiskScore;
        factors.push(`SLA risk (${daysToDelivery} days): +${slaRiskScore}`);
      }
    }

    // Supplier health impact
    const supplier = contextData.supplierHealth?.find(s => s.id === order.supplier_id);
    if (supplier) {
      const supplierRiskScore = (100 - supplier.healthScore) * this.riskWeights.supplierRisk.multiplier;
      score += supplierRiskScore;
      factors.push(`Supplier health (${supplier.healthScore}%): +${Math.round(supplierRiskScore)}`);
    }

    // Inventory buffer impact
    const inventory = contextData.inventoryStatus?.find(i => i.sku === order.sku);
    if (inventory) {
      const bufferScore = this.riskWeights.inventoryBuffer[inventory.bufferLevel] || 0;
      score += bufferScore;
      if (bufferScore > 0) factors.push(`Inventory buffer (${inventory.bufferLevel}): +${bufferScore}`);
    }

    // Seasonal factor
    const seasonalScore = this.riskWeights.seasonalFactor[contextData.marketConditions?.seasonalFactor] || 0;
    score += seasonalScore;
    if (seasonalScore !== 0) factors.push(`Seasonal factor: ${seasonalScore > 0 ? '+' : ''}${seasonalScore}`);

    // Active disruption impact
    let disruptionScore = 0;
    for (const disruption of disruptions) {
      if (disruption.severity === "critical") disruptionScore += 25;
      else if (disruption.severity === "high") disruptionScore += 15;
      else if (disruption.severity === "medium") disruptionScore += 8;
    }
    score += disruptionScore;
    if (disruptionScore > 0) factors.push(`Active disruptions: +${disruptionScore}`);

    // Market volatility impact
    const volatilityScore = (contextData.marketConditions?.marketVolatility || 0) * 0.1;
    score += volatilityScore;
    factors.push(`Market volatility: +${Math.round(volatilityScore)}`);

    return {
      total: Math.min(Math.round(score), 100),
      reasoning: `Risk factors: ${factors.join(', ')}`
    };
  }

  categorizeRisk(score) {
    if (score >= 85) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  calculateRevenueAtRisk(order, riskScore) {
    const probabilityOfLoss = riskScore / 100;
    return Math.round((order.value || 0) * probabilityOfLoss);
  }

  calculateSlaBreachCost(order) {
    const penaltyCost = (order.value || 0) * 0.05; // 5% penalty
    const expeditedShippingCost = Math.min((order.value || 0) * 0.1, 2000); // 10% of value, max $2000
    return Math.round(penaltyCost + expeditedShippingCost);
  }

  assessCustomerImpact(order, customerProfiles) {
    const customer = customerProfiles?.find(c => c.id === order.customer_id);
    if (!customer) return 'medium';

    if (customer.tier === 'vip' || customer.tier === 'enterprise') return 'high';
    if (customer.lifetimeValue > 50000) return 'high';
    if (customer.churnRisk > 0.3) return 'high';
    
    return customer.tier === 'premium' ? 'medium' : 'low';
  }

  generateRecommendedActions(riskScore, order) {
    const actions = [];

    if (riskScore >= 85) {
      actions.push('immediate_escalation', 'emergency_expedite', 'executive_notification');
    } else if (riskScore >= 70) {
      actions.push('proactive_communication', 'expedited_shipping', 'alternative_sourcing');
    } else if (riskScore >= 50) {
      actions.push('customer_notification', 'monitor_closely', 'prepare_alternatives');
    } else {
      actions.push('internal_monitoring', 'standard_process');
    }

    return actions;
  }

  determineEscalationLevel(riskScore) {
    if (riskScore >= 85) return 'immediate';
    if (riskScore >= 70) return 'scheduled';
    return 'monitoring';
  }

  async generateMitigationOptions(order, riskScore) {
    const options = [];

    // Air freight option
    if (riskScore >= 70) {
      options.push({
        option: 'air_freight',
        cost: Math.min((order.value || 0) * 0.15, 3000),
        timeImprovement: 5,
        feasibility: 'high'
      });
    }

    // Alternative supplier option
    if (riskScore >= 60) {
      options.push({
        option: 'alternative_supplier',
        cost: (order.value || 0) * 0.05,
        timeImprovement: 2,
        feasibility: 'medium'
      });
    }

    // Partial shipment option
    if (riskScore >= 50) {
      options.push({
        option: 'partial_shipment',
        cost: (order.value || 0) * 0.08,
        timeImprovement: 3,
        feasibility: 'high'
      });
    }

    // Customer communication option (always available)
    options.push({
      option: 'proactive_communication',
      cost: 0,
      timeImprovement: 0,
      feasibility: 'high'
    });

    return options;
  }

  async updateOrderRiskScores(scoredOrders) {
    try {
      for (const order of scoredOrders) {
        await SupabaseService.supabase
          .from('orders')
          .update({ 
            risk_score: order.riskScore,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.orderId);
      }
    } catch (error) {
      console.error("Error updating order risk scores:", error);
    }
  }

  async storeRiskPatterns(scoredOrders, contextData) {
    try {
      const riskPattern = {
        category: 'risk_patterns',
        title: `Risk assessment pattern - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          assessmentTimestamp: new Date().toISOString(),
          totalOrdersAssessed: scoredOrders.length,
          riskDistribution: {
            critical: scoredOrders.filter(o => o.riskScore >= 85).length,
            high: scoredOrders.filter(o => o.riskScore >= 70 && o.riskScore < 85).length,
            medium: scoredOrders.filter(o => o.riskScore >= 50 && o.riskScore < 70).length,
            low: scoredOrders.filter(o => o.riskScore < 50).length
          },
          averageRiskScore: scoredOrders.reduce((sum, o) => sum + o.riskScore, 0) / scoredOrders.length,
          marketConditions: contextData.marketConditions,
          topRiskFactors: this.identifyTopRiskFactors(scoredOrders)
        }),
        metadata: {
          source: 'risk_scoring_agent',
          assessment_method: 'comprehensive_algorithm',
          confidence: 0.9
        },
        keywords: ['risk', 'scoring', 'assessment', 'pattern', 'orders', 'supply chain']
      };

      await SupabaseService.supabase
        .from('knowledge_base')
        .insert(riskPattern);
    } catch (error) {
      console.error("Error storing risk patterns:", error);
    }
  }

  identifyTopRiskFactors(scoredOrders) {
    // Analyze common patterns in high-risk orders
    const highRiskOrders = scoredOrders.filter(o => o.riskScore >= 70);
    
    const factors = {
      customerTierImpact: highRiskOrders.filter(o => o.reasoning.includes('Customer tier')).length,
      supplierHealthImpact: highRiskOrders.filter(o => o.reasoning.includes('Supplier health')).length,
      slaRiskImpact: highRiskOrders.filter(o => o.reasoning.includes('SLA risk')).length,
      inventoryImpact: highRiskOrders.filter(o => o.reasoning.includes('Inventory buffer')).length,
      disruptionImpact: highRiskOrders.filter(o => o.reasoning.includes('disruptions')).length
    };

    return Object.entries(factors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([factor, count]) => ({ factor, impact: count }));
  }
}

export class NotificationAgent {
  constructor() {
    this.name = "notification";
    this.notificationTemplates = {
      vip: {
        immediate: {
          subject: "URGENT: Update on Your Priority Order",
          tone: "formal",
          detail: "comprehensive"
        },
        scheduled: {
          subject: "Important Update Regarding Your Order",
          tone: "professional",
          detail: "detailed"
        }
      },
      premium: {
        immediate: {
          subject: "Important Order Update - Immediate Attention",
          tone: "professional",
          detail: "detailed"
        },
        scheduled: {
          subject: "Order Status Update",
          tone: "friendly",
          detail: "standard"
        }
      },
      standard: {
        immediate: {
          subject: "Order Update Required",
          tone: "friendly",
          detail: "standard"
        },
        scheduled: {
          subject: "Your Order Status",
          tone: "casual",
          detail: "brief"
        }
      }
    };

    this.prompt = new PromptTemplate({
      template: `
You are an advanced customer communication AI implementing tiered notification strategies.

Order Information: {orderData}
Customer Profile: {customerData}
Risk Assessment: {riskData}
Customer Preferences: {customerPreferences}
Mitigation Options: {mitigationOptions}
Communication Template: {templateData}

Communication Strategy (as per playbook):
- Score <50: Internal monitoring only, suppress customer alerts
- Score 50-69: Scheduled "soft" alert to customer portal (next business day)
- Score 70-84: Immediate proactive email/SMS with personalized message
- Score 85+: Emergency escalation with executive involvement

Personalization Factors:
1. Customer tier (VIP, Premium, Standard) - adjust tone and detail level
2. Preferred communication channel (email, SMS, portal)
3. Language preference and timezone
4. Historical communication preferences
5. Order value and relationship importance

Generate appropriate customer notification with:
- Personalized greeting using customer name
- Clear explanation of situation without technical jargon
- Specific expected impact and new delivery timeline
- Proactive mitigation steps already taken
- Next steps and contact information
- Appropriate tone based on customer tier

Return JSON:
{
  "message": "personalized message content",
  "subject": "email subject line",
  "urgency": "immediate/scheduled/low",
  "channel": "email/sms/portal/phone",
  "tone": "formal/professional/friendly/casual",
  "followUpRequired": true/false,
  "escalationLevel": "standard/supervisor/executive",
  "estimatedReadTime": "2 minutes",
  "callToAction": "specific action for customer",
  "compensationOffered": "discount/credit/expedite"
}

Response:`,
      inputVariables: [
        "orderData",
        "customerData", 
        "riskData",
        "customerPreferences",
        "mitigationOptions",
        "templateData"
      ],
    });
  }

  async execute(riskyOrders) {
    try {
      console.log("📧 Generating intelligent notifications...");
      
      const notifications = [];

      for (const order of riskyOrders) {
        // Apply notification threshold logic
        if (order.riskScore < 50) {
          console.log(`Order ${order.orderNumber} below notification threshold (${order.riskScore})`);
          continue; // Suppress customer alert, internal monitoring only
        }

        try {
          // Get enhanced customer preferences using RAG
          const customerPreferences = await RAGService.getCustomerPreferences(
            order.customer?.tier || "standard"
          );

          // Get appropriate communication template
          const templateData = this.getNotificationTemplate(order);

          const chain = new LLMChain({ llm, prompt: this.prompt });

          const result = await chain.call({
            orderData: JSON.stringify({
              orderNumber: order.orderNumber,
              value: order.revenueAtRisk || order.value,
              expectedDelivery: order.expectedDelivery,
              riskScore: order.riskScore
            }),
            customerData: JSON.stringify(order.customer || {}),
            riskData: JSON.stringify({
              riskScore: order.riskScore,
              riskCategory: order.riskCategory,
              reasoning: order.reasoning
            }),
            customerPreferences: JSON.stringify(customerPreferences.slice(0, 2)),
            mitigationOptions: JSON.stringify(order.mitigationOptions || []),
            templateData: JSON.stringify(templateData)
          });

          let notificationPlan;
          try {
            notificationPlan = JSON.parse(result.text);
          } catch {
            notificationPlan = this.generateEnhancedFallbackNotification(order);
          }

          const notification = {
            order_id: order.orderId,
            customer_id: order.customer_id,
            urgency: this.determineUrgency(order.riskScore),
            channel: this.selectOptimalChannel(order, notificationPlan),
            message: notificationPlan.message,
            subject: notificationPlan.subject,
            scheduled_for: this.calculateScheduleTime(order.riskScore),
            metadata: {
              tone: notificationPlan.tone,
              escalationLevel: notificationPlan.escalationLevel,
              followUpRequired: notificationPlan.followUpRequired,
              estimatedReadTime: notificationPlan.estimatedReadTime,
              callToAction: notificationPlan.callToAction,
              compensationOffered: notificationPlan.compensationOffered,
              riskScore: order.riskScore,
              templateUsed: templateData.template
            }
          };

          await SupabaseService.createNotification(notification);
          notifications.push(notification);

          // Create internal notification if high risk
          if (order.riskScore >= 85) {
            await this.createInternalEscalation(order, notification);
          }

        } catch (error) {
          console.error(`Notification generation error for order ${order.orderNumber}:`, error);
        }
      }

      // Update knowledge base with communication patterns
      await this.updateCommunicationKnowledge(notifications, riskyOrders);

      await SupabaseService.updateAgentState(this.name, {
        lastExecution: new Date().toISOString(),
        notificationsGenerated: notifications.length,
        immediateNotifications: notifications.filter(n => n.urgency === 'immediate').length,
        scheduledNotifications: notifications.filter(n => n.urgency === 'scheduled').length,
        escalationsCreated: notifications.filter(n => n.metadata?.escalationLevel === 'executive').length
      });

      return notifications;
    } catch (error) {
      console.error("Notification generation error:", error);
      return [];
    }
  }

  getNotificationTemplate(order) {
    const tier = order.customer?.tier || 'standard';
    const urgency = this.determineUrgency(order.riskScore);
    
    const template = this.notificationTemplates[tier]?.[urgency] || 
                    this.notificationTemplates.standard.scheduled;

    return {
      template: `${tier}_${urgency}`,
      ...template
    };
  }

  determineUrgency(riskScore) {
    if (riskScore >= 85) return 'immediate';
    if (riskScore >= 70) return 'immediate';
    if (riskScore >= 50) return 'scheduled';
    return 'low';
  }

  selectOptimalChannel(order, notificationPlan) {
    // Priority order for channel selection
    const preferredChannel = order.customer?.preferred_channel || 'email';
    const riskScore = order.riskScore;
    
    // Emergency situations override preference
    if (riskScore >= 85 && (preferredChannel === 'portal' || preferredChannel === 'email')) {
      return 'phone'; // Escalate to phone for critical issues
    }
    
    // High risk prefers immediate channels
    if (riskScore >= 70 && preferredChannel === 'portal') {
      return 'email'; // Upgrade portal to email for immediate attention
    }
    
    // Respect customer preference for moderate risk
    return notificationPlan.channel || preferredChannel;
  }

  calculateScheduleTime(riskScore) {
    const now = new Date();
    
    if (riskScore >= 70) {
      // Immediate notification
      return now.toISOString();
    } else if (riskScore >= 50) {
      // Next business day
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM next day
      return tomorrow.toISOString();
    } else {
      // Low priority - schedule for next week
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString();
    }
  }

  async createInternalEscalation(order, notification) {
    try {
      const escalationNotification = {
        order_id: order.orderId,
        customer_id: null, // Internal notification
        urgency: 'immediate',
        channel: 'email',
        message: `ESCALATION REQUIRED: High-risk order ${order.orderNumber} (Risk Score: ${order.riskScore}) requires immediate attention. Customer has been notified via ${notification.channel}.`,
        subject: `URGENT: Order Escalation Required - ${order.orderNumber}`,
        scheduled_for: new Date().toISOString(),
        metadata: {
          type: 'internal_escalation',
          originalNotificationId: notification.id,
          escalationLevel: 'executive',
          orderRiskScore: order.riskScore
        }
      };

      await SupabaseService.createNotification(escalationNotification);
    } catch (error) {
      console.error("Failed to create internal escalation:", error);
    }
  }

  generateEnhancedFallbackNotification(order) {
    const customerName = order.customer?.name || "Valued Customer";
    const tier = order.customer?.tier || 'standard';
    const riskScore = order.riskScore;
    
    let message, subject, tone, escalationLevel;

    if (riskScore >= 85) {
      subject = "URGENT: Critical Update on Your Order";
      message = `Dear ${customerName}, we need to inform you of a critical situation affecting your order ${order.orderNumber}. Our supply chain team has identified significant delays that require immediate attention. We are implementing emergency measures to minimize impact and will contact you directly within the next hour with a detailed action plan.`;
      tone = "formal";
      escalationLevel = "executive";
    } else if (riskScore >= 70) {
      subject = tier === 'vip' ? "Important Update on Your Priority Order" : "Important Order Update";
      message = `Dear ${customerName}, we want to proactively inform you about potential delays affecting your order ${order.orderNumber}. Our team has identified supply chain disruptions and is working on alternative solutions. We will keep you updated on our progress and any changes to your expected delivery date.`;
      tone = tier === 'vip' ? "formal" : "professional";
      escalationLevel = "supervisor";
    } else {
      subject = "Order Status Update";
      message = `Dear ${customerName}, we wanted to provide you with an update on your order ${order.orderNumber}. While we are monitoring some supply chain factors that could potentially impact delivery, we are taking proactive steps to ensure minimal disruption. We will notify you of any changes to your expected delivery timeline.`;
      tone = "friendly";
      escalationLevel = "standard";
    }

    return {
      message,
      subject,
      urgency: riskScore >= 70 ? "immediate" : "scheduled",
      channel: order.customer?.preferred_channel || "email",
      tone,
      followUpRequired: riskScore >= 70,
      escalationLevel,
      estimatedReadTime: "2 minutes",
      callToAction: riskScore >= 85 ? "Please call us immediately" : "Review order status",
      compensationOffered: riskScore >= 85 ? "priority_shipping" : null
    };
  }

  async updateCommunicationKnowledge(notifications, riskyOrders) {
    try {
      const communicationPattern = {
        category: 'communication_patterns',
        title: `Customer communication pattern - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          communicationTimestamp: new Date().toISOString(),
          totalNotifications: notifications.length,
          channelDistribution: this.analyzeChannelDistribution(notifications),
          urgencyDistribution: this.analyzeUrgencyDistribution(notifications),
          tierBasedCommunication: this.analyzeTierBasedCommunication(notifications, riskyOrders),
          escalationRate: notifications.filter(n => n.metadata?.escalationLevel === 'executive').length / notifications.length,
          averageRiskScore: riskyOrders.reduce((sum, o) => sum + o.riskScore, 0) / riskyOrders.length
        }),
        metadata: {
          source: 'notification_agent',
          communication_strategy: 'tiered_personalized',
          confidence: 0.95
        },
        keywords: ['communication', 'notification', 'customer', 'tier', 'channel', 'escalation']
      };

      await SupabaseService.supabase
        .from('knowledge_base')
        .insert(communicationPattern);
    } catch (error) {
      console.error("Error updating communication knowledge:", error);
    }
  }

  analyzeChannelDistribution(notifications) {
    const channels = {};
    notifications.forEach(n => {
      channels[n.channel] = (channels[n.channel] || 0) + 1;
    });
    return channels;
  }

  analyzeUrgencyDistribution(notifications) {
    const urgency = {};
    notifications.forEach(n => {
      urgency[n.urgency] = (urgency[n.urgency] || 0) + 1;
    });
    return urgency;
  }

  analyzeTierBasedCommunication(notifications, riskyOrders) {
    const tierAnalysis = {};
    
    notifications.forEach(notification => {
      const order = riskyOrders.find(o => o.orderId === notification.order_id);
      const tier = order?.customer?.tier || 'standard';
      
      if (!tierAnalysis[tier]) {
        tierAnalysis[tier] = {
          count: 0,
          avgRiskScore: 0,
          channels: {},
          escalations: 0
        };
      }
      
      tierAnalysis[tier].count++;
      tierAnalysis[tier].avgRiskScore += order?.riskScore || 0;
      tierAnalysis[tier].channels[notification.channel] = (tierAnalysis[tier].channels[notification.channel] || 0) + 1;
      
      if (notification.metadata?.escalationLevel === 'executive') {
        tierAnalysis[tier].escalations++;
      }
    });

    // Calculate averages
    Object.keys(tierAnalysis).forEach(tier => {
      if (tierAnalysis[tier].count > 0) {
        tierAnalysis[tier].avgRiskScore = tierAnalysis[tier].avgRiskScore / tierAnalysis[tier].count;
      }
    });

    return tierAnalysis;
  }
}

// Enhanced Mitigation Recommendation Agent
export class MitigationRecommendationAgent {
  constructor() {
    this.name = "mitigation_recommendation";
    this.costFactors = {
      airFreight: { baseMultiplier: 0.15, maxCost: 3000 },
      alternateSupplier: { baseMultiplier: 0.05, qualificationCost: 500 },
      partialShipment: { baseMultiplier: 0.08, handlingCost: 200 },
      expeditedGround: { baseMultiplier: 0.05, maxCost: 1000 },
      inventoryReallocation: { baseMultiplier: 0.02, transferCost: 300 }
    };

    this.prompt = new PromptTemplate({
      template: `
You are an advanced supply chain mitigation optimization AI implementing cost-benefit analysis.

High-Risk Order Analysis:
Order Details: {orderData}
Risk Assessment: {riskAssessment}
Current Disruptions: {disruptionData}
Available Inventory: {inventoryData}
Supplier Alternatives: {supplierData}
Customer Requirements: {customerRequirements}
Cost Constraints: {costConstraints}

Mitigation Framework (as per playbook):
1. Option A: Expedite via air freight (cost analysis, lead-time improvement)
2. Option B: Partial shipment from alternate location (inventory reallocation)
3. Option C: Switch to secondary supplier (qualification overhead, lead time)
4. Option D: Expedited ground shipping (cost vs. time trade-off)
5. Option E: Inventory reallocation from other locations

Optimization Objective:
Minimize Total Cost = Shipping Cost + Inventory Holding Cost + SLA Penalty Cost
Subject to: Meeting customer ETA requirements and maintaining service quality

For each mitigation option, calculate:
- Implementation cost and timeline
- Risk reduction achieved
- Customer satisfaction impact
- Feasibility score (0-100)
- ROI calculation

Return JSON array of optimized mitigation recommendations:
{
  "orderId": "uuid",
  "recommendedOptions": [
    {
      "option": "air_freight",
      "cost": 1200,
      "timeImprovement": 5,
      "riskReduction": 40,
      "feasibilityScore": 85,
      "roi": 2.3,
      "customerImpact": "positive",
      "implementationSteps": ["step1", "step2"],
      "deadline": "2025-01-15T10:00:00Z",
      "successProbability": 0.9
    }
  ],
  "optimalSolution": "air_freight",
  "totalCostSavings": 3500,
  "riskReductionAchieved": 65,
  "implementationPriority": "immediate"
}

Response:`,
      inputVariables: ["orderData", "riskAssessment", "disruptionData", "inventoryData", "supplierData", "customerRequirements", "costConstraints"]
    });
  }

  async execute(highRiskOrders) {
    try {
      console.log("🎯 Generating mitigation recommendations...");
      
      const recommendations = [];

      for (const order of highRiskOrders.filter(o => o.riskScore >= 70)) {
        try {
          // Gather comprehensive mitigation context
          const mitigationContext = await this.gatherMitigationContext(order);
          
          const chain = new LLMChain({ llm, prompt: this.prompt });

          const result = await chain.call({
            orderData: JSON.stringify({
              orderId: order.orderId,
              orderNumber: order.orderNumber,
              value: order.revenueAtRisk || 0,
              sku: order.sku,
              quantity: order.quantity,
              expectedDelivery: order.expectedDelivery
            }),
            riskAssessment: JSON.stringify({
              riskScore: order.riskScore,
              riskCategory: order.riskCategory,
              slaBreachCost: order.slaBreachCost
            }),
            disruptionData: JSON.stringify(mitigationContext.activeDisruptions),
            inventoryData: JSON.stringify(mitigationContext.inventoryOptions),
            supplierData: JSON.stringify(mitigationContext.alternativeSuppliers),
            customerRequirements: JSON.stringify(mitigationContext.customerRequirements),
            costConstraints: JSON.stringify(mitigationContext.costConstraints)
          });

          let mitigationPlan;
          try {
            mitigationPlan = JSON.parse(result.text);
          } catch {
            mitigationPlan = await this.generateAlgorithmicMitigation(order, mitigationContext);
          }

          recommendations.push(mitigationPlan);

          // Store mitigation strategy in knowledge base
          await this.storeMitigationStrategy(mitigationPlan, order);

        } catch (error) {
          console.error(`Mitigation generation error for order ${order.orderNumber}:`, error);
        }
      }

      await SupabaseService.updateAgentState(this.name, {
        lastExecution: new Date().toISOString(),
        recommendationsGenerated: recommendations.length,
        totalCostSavings: recommendations.reduce((sum, r) => sum + (r.totalCostSavings || 0), 0),
        avgRiskReduction: recommendations.reduce((sum, r) => sum + (r.riskReductionAchieved || 0), 0) / recommendations.length
      });

      return recommendations;
    } catch (error) {
      console.error("Mitigation recommendation error:", error);
      return [];
    }
  }

  async gatherMitigationContext(order) {
    // Implementation would gather real mitigation context
    // For now, return simulated context
    return {
      activeDisruptions: [],
      inventoryOptions: [],
      alternativeSuppliers: [],
      customerRequirements: {
        maxAcceptableDelay: 7,
        qualityRequirements: 'standard',
        costSensitivity: 'medium'
      },
      costConstraints: {
        maxMitigationCost: (order.revenueAtRisk || 0) * 0.2,
        approvalRequired: (order.revenueAtRisk || 0) > 10000
      }
    };
  }

  async generateAlgorithmicMitigation(order, context) {
    const options = [];
    const orderValue = order.revenueAtRisk || 0;

    // Air freight option
    const airFreightCost = Math.min(orderValue * this.costFactors.airFreight.baseMultiplier, this.costFactors.airFreight.maxCost);
    options.push({
      option: 'air_freight',
      cost: airFreightCost,
      timeImprovement: 5,
      riskReduction: 60,
      feasibilityScore: 90,
      roi: (order.slaBreachCost || 0) / airFreightCost,
      customerImpact: 'positive',
      implementationSteps: ['Book air freight', 'Coordinate pickup', 'Track shipment'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      successProbability: 0.95
    });

    // Alternate supplier option
    const altSupplierCost = orderValue * this.costFactors.alternateSupplier.baseMultiplier + this.costFactors.alternateSupplier.qualificationCost;
    options.push({
      option: 'alternate_supplier',
      cost: altSupplierCost,
      timeImprovement: 3,
      riskReduction: 45,
      feasibilityScore: 70,
      roi: (order.slaBreachCost || 0) / altSupplierCost,
      customerImpact: 'neutral',
      implementationSteps: ['Qualify supplier', 'Place order', 'Monitor production'],
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      successProbability: 0.8
    });

    // Select optimal solution
    const optimalOption = options.reduce((best, current) => 
      current.roi > best.roi ? current : best
    );

    return {
      orderId: order.orderId,
      recommendedOptions: options,
      optimalSolution: optimalOption.option,
      totalCostSavings: (order.slaBreachCost || 0) - optimalOption.cost,
      riskReductionAchieved: optimalOption.riskReduction,
      implementationPriority: order.riskScore >= 85 ? 'immediate' : 'scheduled'
    };
  }

  async storeMitigationStrategy(mitigationPlan, order) {
    try {
      const strategyEntry = {
        category: 'mitigation_strategies',
        title: `Mitigation strategy for order ${order.orderNumber} - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          riskScore: order.riskScore,
          recommendedOptions: mitigationPlan.recommendedOptions,
          optimalSolution: mitigationPlan.optimalSolution,
          costSavings: mitigationPlan.totalCostSavings,
          riskReduction: mitigationPlan.riskReductionAchieved,
          timestamp: new Date().toISOString()
        }),
        metadata: {
          source: 'mitigation_recommendation_agent',
          orderValue: order.revenueAtRisk || 0,
          implementationPriority: mitigationPlan.implementationPriority
        },
        keywords: ['mitigation', 'strategy', 'optimization', 'cost-benefit', 'supply chain', 'risk reduction']
      };

      await SupabaseService.supabase
        .from('knowledge_base')
        .insert(strategyEntry);
    } catch (error) {
      console.error("Error storing mitigation strategy:", error);
    }
  }
} '