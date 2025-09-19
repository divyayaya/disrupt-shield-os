import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Search, 
  Calculator, 
  MessageSquare, 
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentState {
  id: string;
  agent_name: string;
  is_active: boolean;
  last_execution: string | null;
  execution_count: number;
  state: any;
}

const agentConfigs = {
  "data_ingestion": {
    name: "Data Ingestion",
    description: "Processing supplier feeds & order updates",
    icon: Database,
    color: "info"
  },
  "disruption_detection": {
    name: "Disruption Detection", 
    description: "AI-powered anomaly identification",
    icon: Search,
    color: "warning"
  },
  "risk_scoring": {
    name: "Risk Scoring",
    description: "Predictive impact assessment",
    icon: Calculator, 
    color: "critical"
  },
  "notification_planning": {
    name: "Notification Planning",
    description: "Personalized communication generation",
    icon: MessageSquare,
    color: "success"
  }
};

export function AgentStatusGrid() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [workflowHealth, setWorkflowHealth] = useState(98);

  useEffect(() => {
    loadAgentStates();

    // Real-time subscription to agent states
    const channel = supabase
      .channel('agent-states-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'agent_states' 
      }, (payload) => {
        console.log('Agent state changed:', payload);
        loadAgentStates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAgentStates = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_states')
        .select('*')
        .order('agent_name');

      if (error) throw error;
      
      if (data) {
        setAgents(data);
        // Calculate workflow health based on active agents
        const activeCount = data.filter(agent => agent.is_active).length;
        const healthPercentage = Math.round((activeCount / data.length) * 100);
        setWorkflowHealth(healthPercentage);
      }
    } catch (error) {
      console.error('Error loading agent states:', error);
    }
  };

  const getStatusInfo = (agent: AgentState) => {
    if (!agent.is_active) {
      return {
        status: "offline",
        icon: XCircle,
        color: "text-agent-offline",
        bgColor: "bg-agent-offline/10"
      };
    }

    const lastExecution = agent.last_execution ? new Date(agent.last_execution) : null;
    const now = new Date();
    const timeDiff = lastExecution ? now.getTime() - lastExecution.getTime() : Infinity;
    const minutesAgo = Math.floor(timeDiff / (1000 * 60));

    if (minutesAgo < 2) {
      return {
        status: "active",
        icon: CheckCircle2,
        color: "text-agent-active",
        bgColor: "bg-agent-active/10"
      };
    } else if (minutesAgo < 10) {
      return {
        status: "idle", 
        icon: Clock,
        color: "text-agent-idle",
        bgColor: "bg-agent-idle/10"
      };
    } else {
      return {
        status: "error",
        icon: AlertCircle,
        color: "text-agent-error", 
        bgColor: "bg-agent-error/10"
      };
    }
  };

  const formatLastExecution = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Workflow Health Overview */}
      <Card className="p-6 border-electric/20 bg-gradient-primary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-foreground">
            Multi-Agent Workflow
          </h3>
          <Activity className="h-5 w-5 text-primary-glow animate-sparkle" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-primary-foreground/80">System Health</span>
            <span className="text-2xl font-bold text-primary-foreground">
              {workflowHealth}%
            </span>
          </div>
          
          {/* Health bar */}
          <div className="w-full bg-primary-foreground/20 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                workflowHealth >= 90 ? "bg-success" : 
                workflowHealth >= 70 ? "bg-warning" : "bg-critical"
              )}
              style={{ width: `${workflowHealth}%` }}
            />
          </div>
          
          <div className="text-sm text-primary-foreground/70">
            {agents.filter(a => a.is_active).length} of {agents.length} agents active
          </div>
        </div>
      </Card>

      {/* Individual Agent Status Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Agent Status Monitor
        </h4>
        
        {Object.entries(agentConfigs).map(([key, config]) => {
          const agent = agents.find(a => a.agent_name === key);
          const statusInfo = agent ? getStatusInfo(agent) : {
            status: "offline",
            icon: XCircle,
            color: "text-agent-offline",
            bgColor: "bg-agent-offline/10"
          };
          
          const StatusIcon = statusInfo.icon;
          const AgentIcon = config.icon;

          return (
            <Card 
              key={key}
              className={cn(
                "p-4 transition-all duration-300 hover:shadow-custom-md",
                statusInfo.bgColor,
                statusInfo.status === "active" && "animate-pulse-glow"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-card">
                    <AgentIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-card-foreground">
                      {config.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={cn("capitalize", statusInfo.color)}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatLastExecution(agent?.last_execution || null)}
                    </div>
                  </div>
                </div>
              </div>
              
              {agent && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Executions: {agent.execution_count || 0}</span>
                    <span>ID: {agent.id.slice(0, 8)}...</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}