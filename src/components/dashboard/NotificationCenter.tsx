import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell,
  Mail, 
  MessageSquare,
  Smartphone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Send,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  message: string;
  channel: string | null;
  urgency: string | null;
  scheduled_for: string;
  sent_at: string | null;
  status: string | null;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  tier: string | null;
}

const channelIcons = {
  email: Mail,
  sms: Smartphone,
  portal: Bell,
  push: MessageSquare
};

const urgencyConfig = {
  low: { color: "text-info", bg: "bg-info/10" },
  medium: { color: "text-warning", bg: "bg-warning/10" },
  high: { color: "text-critical", bg: "bg-critical/10" },
  urgent: { color: "text-critical", bg: "bg-critical/20" }
};

const statusConfig = {
  pending: { color: "text-warning", icon: Clock },
  sent: { color: "text-success", icon: CheckCircle2 },
  failed: { color: "text-critical", icon: AlertCircle },
  scheduled: { color: "text-info", icon: Clock }
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "sent">("pending");

  useEffect(() => {
    loadNotifications();
    loadCustomers();

    // Real-time subscription
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload) => {
        console.log('Notification updated:', payload);
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === "pending") {
        query = query.eq('status', 'pending');
      } else if (filter === "sent") {
        query = query.eq('status', 'sent');
      }

      const { data, error } = await query.limit(15);

      if (error) throw error;
      if (data) setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, tier');

      if (error) throw error;
      if (data) setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "System Notification";
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getCustomerTier = (customerId: string | null) => {
    if (!customerId) return null;
    const customer = customers.find(c => c.id === customerId);
    return customer?.tier;
  };

  const formatScheduledTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMs < 0) return "Overdue";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (message: string, maxLength: number = 120) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const pendingCount = notifications.filter(n => n.status === "pending").length;
  const sentCount = notifications.filter(n => n.status === "sent").length;
  const urgentCount = notifications.filter(n => n.urgency === "urgent" && n.status === "pending").length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <Bell className="h-5 w-5 text-info" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Notification Center
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-generated customer communications
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <Badge variant="outline" className="text-critical border-critical/30 animate-pulse">
              {urgentCount} Urgent
            </Badge>
          )}
          <Badge variant="outline" className="text-warning border-warning/30">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex bg-muted rounded-lg p-1 mb-4">
        {[
          { key: "pending", label: "Pending", count: pendingCount },
          { key: "sent", label: "Sent", count: sentCount },
          { key: "all", label: "All", count: notifications.length }
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(key as any)}
            className={cn(
              "text-xs flex-1",
              filter === key && "bg-background shadow-sm"
            )}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No notifications found</p>
            <p className="text-sm">All communications up to date</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const urgency = notification.urgency || "low";
            const urgencyConfig_ = urgencyConfig[urgency as keyof typeof urgencyConfig];
            const status = notification.status || "pending";
            const statusConfig_ = statusConfig[status as keyof typeof statusConfig];
            const channel = notification.channel || "email";
            const ChannelIcon = channelIcons[channel as keyof typeof channelIcons] || Mail;
            const StatusIcon = statusConfig_.icon;
            const customerTier = getCustomerTier(notification.customer_id);
            
            return (
              <div
                key={notification.id}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200 hover:shadow-custom-md",
                  urgencyConfig_.bg,
                  urgency === "urgent" && status === "pending" && "animate-pulse-critical"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded bg-white/20">
                        <ChannelIcon className="h-3 w-3 text-card-foreground" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize text-xs", urgencyConfig_.color)}
                      >
                        {urgency} priority
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize text-xs", statusConfig_.color)}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {getCustomerName(notification.customer_id)}
                      </span>
                      {customerTier && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {customerTier}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-card-foreground mb-3 leading-relaxed">
                      {truncateMessage(notification.message)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {status === "pending" ? "Send in " : "Sent "}
                            {formatScheduledTime(notification.scheduled_for)}
                          </span>
                        </div>
                        {notification.order_id && (
                          <span>Order: {notification.order_id.slice(0, 8)}...</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="capitalize">{channel}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-electric hover:text-electric-dark"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {status === "pending" && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-success hover:text-success-light"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Quick Actions */}
      {pendingCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {pendingCount} notifications ready to send
            </span>
            <Button size="sm" className="bg-gradient-primary">
              <Send className="h-4 w-4 mr-2" />
              Send All Pending
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}