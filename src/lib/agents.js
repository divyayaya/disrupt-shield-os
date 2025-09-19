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

export class DataIngestionAgent {
  constructor() {
    this.name = "data_ingestion";
  }

  async execute() {
    try {
      // Simulate real-time data ingestion
      const suppliers = await SupabaseService.getSuppliers();
      const orders = await SupabaseService.getOrders();

      // Simulate external data feeds
      const externalData = {
        portCongestion: Math.random() > 0.7,
        weatherDelays: Math.random() > 0.8,
        geopoliticalRisk: Math.random() > 0.95,
        timestamp: new Date().toISOString(),
      };

      await SupabaseService.updateAgentState(this.name, {
        lastIngestion: externalData.timestamp,
        suppliersCount: suppliers.length,
        ordersCount: orders.length,
        externalSignals: externalData,
      });

      return {
        suppliers,
        orders,
        external: externalData,
      };
    } catch (error) {
      console.error("Data ingestion error:", error);
      return null;
    }
  }
}

export class DisruptionDetectionAgent {
  constructor() {
    this.name = "disruption_detection";
    this.prompt = new PromptTemplate({
      template: `
You are a supply chain disruption detection AI. Analyze the following data and identify potential disruptions:

Supplier Data: {supplierData}
External Signals: {externalSignals}
Historical Patterns: {historicalContext}

Identify disruptions and rate their severity (low/medium/high/critical) and confidence (0-1).
Return a JSON array of disruptions with fields: type, severity, confidence, predictedImpact, description.

Response:`,
      inputVariables: ["supplierData", "externalSignals", "historicalContext"],
    });
  }

  async execute(data) {
    try {
      // Get relevant historical patterns using RAG
      const historicalContext = await RAGService.getDisruptionPatterns(
        "port congestion weather"
      );

      const chain = new LLMChain({ llm, prompt: this.prompt });

      const result = await chain.call({
        supplierData: JSON.stringify(data.suppliers.slice(0, 5)),
        externalSignals: JSON.stringify(data.external),
        historicalContext: JSON.stringify(historicalContext),
      });

      let disruptions = [];
      try {
        disruptions = JSON.parse(result.text);
      } catch {
        // Fallback to simulated disruptions if LLM response can't be parsed
        disruptions = this.simulateDisruptions(data);
      }

      // Store disruptions in database
      for (const disruption of disruptions) {
        await SupabaseService.createDisruption({
          type: disruption.type,
          severity: disruption.severity,
          predicted_impact: disruption.predictedImpact,
          confidence: disruption.confidence,
          location: disruption.location || "Unknown",
        });
      }

      await SupabaseService.updateAgentState(this.name, {
        lastExecution: new Date().toISOString(),
        disruptionsDetected: disruptions.length,
      });

      return disruptions;
    } catch (error) {
      console.error("Disruption detection error:", error);
      return this.simulateDisruptions(data);
    }
  }

  simulateDisruptions(data) {
    const disruptions = [];

    if (data.external.portCongestion) {
      disruptions.push({
        type: "port_congestion",
        severity: "medium",
        confidence: 0.85,
        predictedImpact: 5,
        description: "Major port congestion detected",
      });
    }

    if (data.external.weatherDelays) {
      disruptions.push({
        type: "weather_delay",
        severity: "medium",
        confidence: 0.9,
        predictedImpact: 3,
        description: "Weather-related shipping delays",
      });
    }

    return disruptions;
  }
}

export class RiskScoringAgent {
  constructor() {
    this.name = "risk_scoring";
    this.prompt = new PromptTemplate({
      template: `
You are a supply chain risk assessment AI. Calculate risk scores (0-100) for orders based on:

Order: {orderData}
Customer: {customerData}
Supplier: {supplierData}
Active Disruptions: {disruptions}
Mitigation Knowledge: {mitigationContext}

Consider: order value, customer tier, supplier reliability, disruption impact, SLA deadlines.
Return JSON: {{"orderId": "...", "riskScore": number, "reasoning": "...", "recommendedActions": ["..."]}}

Response:`,
      inputVariables: [
        "orderData",
        "customerData",
        "supplierData",
        "disruptions",
        "mitigationContext",
      ],
    });
  }

  async execute(orders, disruptions) {
    const scoredOrders = [];

    for (const order of orders.slice(0, 10)) {
      // Limit for API costs
      try {
        // Get mitigation strategies using RAG
        const mitigationContext = await RAGService.getMitigationStrategies(
          order.value,
          3, // assuming 3-day delay
          order.supplier?.reliability || 0.8
        );

        const chain = new LLMChain({ llm, prompt: this.prompt });

        const result = await chain.call({
          orderData: JSON.stringify({
            id: order.id,
            value: order.value,
            priority: order.priority,
            expectedDelivery: order.expected_delivery,
          }),
          customerData: JSON.stringify(order.customer),
          supplierData: JSON.stringify(order.supplier),
          disruptions: JSON.stringify(disruptions),
          mitigationContext: JSON.stringify(mitigationContext.slice(0, 3)),
        });

        let riskAssessment;
        try {
          riskAssessment = JSON.parse(result.text);
        } catch {
          // Fallback calculation
          riskAssessment = this.calculateRiskScore(order, disruptions);
        }

        // Update order risk score in database
        await SupabaseService.updateOrderRiskScore(
          order.id,
          riskAssessment.riskScore
        );

        scoredOrders.push({
          ...order,
          riskScore: riskAssessment.riskScore,
          reasoning: riskAssessment.reasoning,
          recommendedActions: riskAssessment.recommendedActions,
        });
      } catch (error) {
        console.error("Risk scoring error for order", order.id, error);
        const fallbackScore = this.calculateRiskScore(order, disruptions);
        scoredOrders.push({ ...order, riskScore: fallbackScore.riskScore });
      }
    }

    await SupabaseService.updateAgentState(this.name, {
      lastExecution: new Date().toISOString(),
      ordersScored: scoredOrders.length,
      avgRiskScore:
        scoredOrders.reduce((sum, o) => sum + o.riskScore, 0) /
        scoredOrders.length,
    });

    return scoredOrders;
  }

  calculateRiskScore(order, disruptions) {
    let score = 0;

    // Priority weight
    const priorityWeights = { low: 10, medium: 25, high: 50, critical: 75 };
    score += priorityWeights[order.priority] || 10;

    // Customer tier
    const tierWeights = { standard: 0, premium: 15, vip: 30 };
    score += tierWeights[order.customer?.tier] || 0;

    // Order value
    score += Math.min(order.value / 1000, 20);

    // Disruption impact
    if (disruptions.some((d) => d.severity === "high")) score += 25;

    return {
      riskScore: Math.min(Math.round(score), 100),
      reasoning:
        "Calculated based on priority, customer tier, value, and active disruptions",
    };
  }
}

export class NotificationAgent {
  constructor() {
    this.name = "notification";
    this.prompt = new PromptTemplate({
      template: `
Generate a personalized customer notification for a supply chain delay:

Order: {orderData}
Customer: {customerData}
Risk Assessment: {riskData}
Customer Preferences: {customerPreferences}

Create appropriate message considering customer tier and communication preferences.
Return JSON: {{"message": "...", "urgency": "immediate/scheduled/low", "channel": "email/sms/portal"}}

Response:`,
      inputVariables: [
        "orderData",
        "customerData",
        "riskData",
        "customerPreferences",
      ],
    });
  }

  async execute(riskyOrders) {
    const notifications = [];

    for (const order of riskyOrders.filter((o) => o.riskScore >= 50)) {
      try {
        // Get customer preferences using RAG
        const customerPreferences = await RAGService.getCustomerPreferences(
          order.customer?.tier || "standard"
        );

        const chain = new LLMChain({ llm, prompt: this.prompt });

        const result = await chain.call({
          orderData: JSON.stringify({
            orderNumber: order.order_number,
            value: order.value,
            expectedDelivery: order.expected_delivery,
          }),
          customerData: JSON.stringify(order.customer),
          riskData: JSON.stringify({
            riskScore: order.riskScore,
            reasoning: order.reasoning,
          }),
          customerPreferences: JSON.stringify(customerPreferences.slice(0, 2)),
        });

        let notificationPlan;
        try {
          notificationPlan = JSON.parse(result.text);
        } catch {
          notificationPlan = this.generateFallbackNotification(order);
        }

        const notification = {
          order_id: order.id,
          customer_id: order.customer_id,
          urgency: notificationPlan.urgency,
          channel:
            notificationPlan.channel ||
            order.customer?.preferred_channel ||
            "email",
          message: notificationPlan.message,
          scheduled_for:
            notificationPlan.urgency === "immediate"
              ? new Date().toISOString()
              : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        await SupabaseService.createNotification(notification);
        notifications.push(notification);
      } catch (error) {
        console.error("Notification generation error:", error);
      }
    }

    await SupabaseService.updateAgentState(this.name, {
      lastExecution: new Date().toISOString(),
      notificationsGenerated: notifications.length,
    });

    return notifications;
  }

  generateFallbackNotification(order) {
    return {
      message: `Dear ${order.customer?.name || "Valued Customer"}, your order ${
        order.order_number
      } may experience delays due to supply chain disruptions. We're working to minimize impact and will keep you updated.`,
      urgency: order.riskScore >= 80 ? "immediate" : "scheduled",
      channel: order.customer?.preferred_channel || "email",
    };
  }
}
