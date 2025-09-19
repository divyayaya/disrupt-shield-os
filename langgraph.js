import { StateGraph, END } from "langgraph";
import { SupabaseService } from "./supabase";
import {
  DataIngestionAgent,
  DisruptionDetectionAgent,
  RiskScoringAgent,
  NotificationAgent,
} from "./agents";

export class SupplyChainWorkflow {
  constructor() {
    this.agents = {
      dataIngestion: new DataIngestionAgent(),
      disruptionDetection: new DisruptionDetectionAgent(),
      riskScoring: new RiskScoringAgent(),
      notification: new NotificationAgent(),
    };

    this.graph = this.buildGraph();
    this.isRunning = false;
  }

  buildGraph() {
    // Define the state schema
    const workflow = new StateGraph({
      channels: {
        data: {
          default: () => null,
        },
        disruptions: {
          default: () => [],
        },
        riskyOrders: {
          default: () => [],
        },
        notifications: {
          default: () => [],
        },
        errors: {
          default: () => [],
        },
      },
    });

    // Add nodes for each agent
    workflow.addNode("ingest_data", this.ingestData.bind(this));
    workflow.addNode("detect_disruptions", this.detectDisruptions.bind(this));
    workflow.addNode("score_risks", this.scoreRisks.bind(this));
    workflow.addNode(
      "generate_notifications",
      this.generateNotifications.bind(this)
    );

    // Define the workflow edges
    workflow.addEdge("ingest_data", "detect_disruptions");
    workflow.addEdge("detect_disruptions", "score_risks");
    workflow.addEdge("score_risks", "generate_notifications");
    workflow.addEdge("generate_notifications", END);

    // Set entry point
    workflow.setEntryPoint("ingest_data");

    return workflow.compile();
  }

  async ingestData(state) {
    try {
      console.log("🔄 Starting data ingestion...");
      const data = await this.agents.dataIngestion.execute();
      return { ...state, data };
    } catch (error) {
      console.error("Data ingestion failed:", error);
      return {
        ...state,
        errors: [...state.errors, { step: "ingestion", error: error.message }],
      };
    }
  }

  async detectDisruptions(state) {
    try {
      console.log("🔍 Detecting disruptions...");
      if (!state.data) {
        throw new Error("No data available for disruption detection");
      }

      const disruptions = await this.agents.disruptionDetection.execute(
        state.data
      );
      return { ...state, disruptions };
    } catch (error) {
      console.error("Disruption detection failed:", error);
      return {
        ...state,
        errors: [
          ...state.errors,
          { step: "disruption_detection", error: error.message },
        ],
      };
    }
  }

  async scoreRisks(state) {
    try {
      console.log("📊 Scoring order risks...");
      if (!state.data?.orders) {
        throw new Error("No orders available for risk scoring");
      }

      const riskyOrders = await this.agents.riskScoring.execute(
        state.data.orders,
        state.disruptions
      );
      return { ...state, riskyOrders };
    } catch (error) {
      console.error("Risk scoring failed:", error);
      return {
        ...state,
        errors: [
          ...state.errors,
          { step: "risk_scoring", error: error.message },
        ],
      };
    }
  }

  async generateNotifications(state) {
    try {
      console.log("📧 Generating notifications...");
      if (!state.riskyOrders?.length) {
        console.log("No risky orders found, skipping notifications");
        return { ...state, notifications: [] };
      }

      const notifications = await this.agents.notification.execute(
        state.riskyOrders
      );
      return { ...state, notifications };
    } catch (error) {
      console.error("Notification generation failed:", error);
      return {
        ...state,
        errors: [
          ...state.errors,
          { step: "notification", error: error.message },
        ],
      };
    }
  }

  async start() {
    this.isRunning = true;
    this.runWorkflow();
  }

  stop() {
    this.isRunning = false;
  }

  async runWorkflow() {
    if (!this.isRunning) return;

    try {
      console.log("🚀 Starting supply chain workflow...");

      // Execute the LangGraph workflow
      const result = await this.graph.invoke({
        data: null,
        disruptions: [],
        riskyOrders: [],
        notifications: [],
        errors: [],
      });

      // Log workflow results
      console.log("✅ Workflow completed:", {
        dataIngested: !!result.data,
        disruptionsFound: result.disruptions?.length || 0,
        riskyOrdersIdentified: result.riskyOrders?.length || 0,
        notificationsGenerated: result.notifications?.length || 0,
        errors: result.errors?.length || 0,
      });

      // Store workflow state
      await SupabaseService.updateAgentState("workflow_orchestrator", {
        lastExecution: new Date().toISOString(),
        status: "completed",
        results: {
          disruptionsDetected: result.disruptions?.length || 0,
          highRiskOrders:
            result.riskyOrders?.filter((o) => o.riskScore >= 70).length || 0,
          notificationsSent: result.notifications?.length || 0,
        },
        errors: result.errors,
      });
    } catch (error) {
      console.error("Workflow execution failed:", error);
      await SupabaseService.updateAgentState("workflow_orchestrator", {
        lastExecution: new Date().toISOString(),
        status: "failed",
        error: error.message,
      });
    }

    // Schedule next workflow execution (every 30 seconds for demo)
    if (this.isRunning) {
      setTimeout(() => this.runWorkflow(), 30000);
    }
  }

  async getWorkflowStatus() {
    try {
      const state = await SupabaseService.getAgentState(
        "workflow_orchestrator"
      );
      return state || { status: "idle" };
    } catch (error) {
      console.error("Failed to get workflow status:", error);
      return { status: "error", error: error.message };
    }
  }
}
