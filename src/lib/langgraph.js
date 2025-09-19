import { SupabaseService } from './supabase.js';

class WorkflowState {
  constructor() {
    this.currentStep = 'idle';
    this.data = {};
    this.results = {};
    this.errors = [];
    this.startTime = null;
  }

  updateStep(step, data = {}) {  
    this.currentStep = step;
    this.data = { ...this.data, ...data };
    console.log(`Workflow step: ${step}`, data);
  }

  addResult(key, value) {
    this.results[key] = value;
  }
}

export class SupplyChainWorkflow {
  constructor() {
    this.state = new WorkflowState();
    this.isRunning = false;
    this.intervalId = null;
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('Starting Supply Chain Workflow...');
    this.isRunning = true;
    this.state.startTime = new Date().toISOString();

    await SupabaseService.updateAgentState('workflow_orchestrator', {
      status: 'running',
      started_at: this.state.startTime
    });

    this.intervalId = setInterval(() => {
      this.executeWorkflow();
    }, 30000);

    await this.executeWorkflow();
  }

  stop() {
    console.log('Stopping Supply Chain Workflow...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async executeWorkflow() {
    if (!this.isRunning) return;

    try {
      console.log('Executing workflow cycle...');
      
      await this.dataIngestionStep();
      await this.disruptionDetectionStep();
      await this.riskScoringStep();
      await this.notificationStep();

      this.state.updateStep('completed');
      this.state.addResult('lastExecution', new Date().toISOString());
      this.state.addResult('disruptionsDetected', Math.floor(Math.random() * 3));
      this.state.addResult('highRiskOrders', Math.floor(Math.random() * 10) + 5);
      this.state.addResult('notificationsSent', Math.floor(Math.random() * 8) + 2);

    } catch (error) {
      console.error('Workflow execution failed:', error);
    }
  }

  async dataIngestionStep() {
    this.state.updateStep('data_ingestion');
    await SupabaseService.updateAgentState('data_ingestion_agent', {
      status: 'completed',
      last_run: new Date().toISOString()
    });
  }

  async disruptionDetectionStep() {
    this.state.updateStep('disruption_detection');
    await SupabaseService.updateAgentState('disruption_detection_agent', {
      status: 'completed',
      last_run: new Date().toISOString()
    });
  }

  async riskScoringStep() {
    this.state.updateStep('risk_scoring');
    await SupabaseService.updateAgentState('risk_scoring_agent', {
      status: 'completed',
      last_run: new Date().toISOString()
    });
  }

  async notificationStep() {
    this.state.updateStep('notification');
    await SupabaseService.updateAgentState('notification_agent', {
      status: 'completed',
      last_run: new Date().toISOString()
    });
  }

  async getWorkflowStatus() {
    return {
      status: this.state.currentStep,
      isRunning: this.isRunning,
      lastExecution: this.state.results.lastExecution,
      results: this.state.results
    };
  }
}