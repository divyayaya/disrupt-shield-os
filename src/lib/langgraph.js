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
    
    // Occasionally create new disruptions
    if (Math.random() > 0.7) { // 30% chance of detecting a disruption
      const suppliers = await SupabaseService.getSuppliers();
      const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      
      const disruptionTypes = ['weather', 'transport', 'supplier_delay', 'quality_issue', 'capacity_shortage'];
      const severities = ['low', 'medium', 'high'];
      
      const disruption = {
        type: disruptionTypes[Math.floor(Math.random() * disruptionTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        supplier_id: randomSupplier?.id,
        location: randomSupplier?.location || 'Unknown',
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        predicted_impact: Math.floor(Math.random() * 10) + 1, // 1-10 impact score
        is_active: true
      };
      
      try {
        const createdDisruption = await SupabaseService.createDisruption(disruption);
        console.log('Detected new disruption:', createdDisruption);
      } catch (error) {
        console.error('Failed to create disruption:', error);
      }
    }
    
    await SupabaseService.updateAgentState('disruption_detection_agent', {
      status: 'completed',
      last_run: new Date().toISOString()
    });
  }

  async riskScoringStep() {
    this.state.updateStep('risk_scoring');
    
    // Update risk scores for some orders
    const orders = await SupabaseService.getOrders();
    const ordersToUpdate = orders.slice(0, Math.floor(Math.random() * 5) + 3); // Update 3-7 orders
    
    console.log(`Updating risk scores for ${ordersToUpdate.length} orders`);
    
    for (const order of ordersToUpdate) {
      // Generate realistic risk scores based on various factors
      let riskScore = Math.floor(Math.random() * 100);
      
      // Increase risk for delayed orders
      if (order.status === 'delayed') riskScore = Math.min(100, riskScore + 30);
      if (order.suppliers?.reliability < 0.9) riskScore = Math.min(100, riskScore + 20);
      if (order.value > 50000) riskScore = Math.min(100, riskScore + 15);
      
      try {
        await SupabaseService.supabase
          .from('orders')
          .update({ 
            risk_score: riskScore,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
        
        console.log(`Updated order ${order.order_number} risk score to ${riskScore}`);
      } catch (error) {
        console.error('Failed to update risk score:', error);
      }
    }
    
    await SupabaseService.updateAgentState('risk_scoring_agent', {
      status: 'completed',
      last_run: new Date().toISOString(),
      orders_analyzed: ordersToUpdate.length
    });
  }

  async notificationStep() {
    this.state.updateStep('notification');
    
    // Generate AI notifications based on current data
    const orders = await SupabaseService.getOrders();
    const highRiskOrders = orders.filter(order => (order.risk_score || 0) >= 70);
    
    console.log(`Found ${highRiskOrders.length} high-risk orders to notify about`);
    
    let notificationsSent = 0;
    
    // Create notifications for high-risk orders
    for (const order of highRiskOrders.slice(0, 3)) { // Limit to 3 notifications per cycle
      const messages = [
        `⚠️ High-risk order ${order.order_number} requires immediate attention. Risk score: ${order.risk_score}`,
        `🚨 Order ${order.order_number} ($${order.value}) is at risk of delay. Customer: ${order.customers?.name}`,
        `📊 Critical order alert: ${order.order_number} shows elevated risk indicators (${order.risk_score}/100)`,
        `⏰ Urgent: Order ${order.order_number} may miss SLA deadline. Expected delivery: ${new Date(order.expected_delivery).toLocaleDateString()}`
      ];
      
      const channels = ['email', 'sms', 'portal'];
      const urgencies = ['immediate', 'scheduled'];
      
      const notification = {
        order_id: order.id,
        customer_id: order.customer_id,
        message: messages[Math.floor(Math.random() * messages.length)],
        channel: channels[Math.floor(Math.random() * channels.length)],
        urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
        status: Math.random() > 0.3 ? 'sent' : 'pending', // 70% sent, 30% pending
        sent_at: Math.random() > 0.3 ? new Date().toISOString() : null,
        scheduled_for: new Date(Date.now() + Math.random() * 3600000).toISOString() // Within next hour
      };
      
      try {
        const { data, error } = await SupabaseService.supabase
          .from('notifications')
          .insert([notification])
          .select();
        
        if (error) {
          console.error('Error creating notification:', error);
        } else {
          console.log('Created notification:', data[0]);
          notificationsSent++;
        }
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }
    
    // Update agent state with actual results
    await SupabaseService.updateAgentState('notification_agent', {
      status: 'completed',
      last_run: new Date().toISOString(),
      notifications_sent: notificationsSent
    });
    
    this.state.addResult('actualNotificationsSent', notificationsSent);
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