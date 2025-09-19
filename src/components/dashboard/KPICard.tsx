import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "success" | "warning" | "critical" | "info" | "primary";
  description?: string;
  className?: string;
}

const variantStyles = {
  success: "border-success/20 bg-gradient-success",
  warning: "border-warning/20 bg-gradient-warning", 
  critical: "border-critical/20 bg-gradient-critical",
  info: "border-info/20 bg-electric/10",
  primary: "border-primary/20 bg-gradient-primary",
};

const iconStyles = {
  success: "text-success",
  warning: "text-warning",
  critical: "text-critical", 
  info: "text-info",
  primary: "text-primary",
};

const valueStyles = {
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  critical: "text-critical-foreground",
  info: "text-info",
  primary: "text-primary-foreground",
};

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "primary",
  description,
  className,
}: KPICardProps) {
  return (
    <Card className={cn(
      "p-6 border-2 transition-all duration-300 hover:shadow-custom-lg hover:-translate-y-1",
      "animate-fade-in",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "p-2 rounded-lg bg-white/20 backdrop-blur-sm",
              variant === "critical" && "animate-pulse-critical"
            )}>
              <Icon className={cn("h-5 w-5", iconStyles[variant])} />
            </div>
            <h3 className="font-medium text-card-foreground">{title}</h3>
          </div>
          
          <div className="space-y-2">
            <div className={cn(
              "text-3xl font-bold",
              valueStyles[variant]
            )}>
              {value}
            </div>
            
            {trend && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{trend}</span>
              </div>
            )}
            
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Subtle animation indicator for real-time data */}
      <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={cn(
          "h-full w-full animate-pulse",
          variant === "success" && "bg-success-light",
          variant === "warning" && "bg-warning-light", 
          variant === "critical" && "bg-critical-light",
          variant === "info" && "bg-info-light",
          variant === "primary" && "bg-primary-light"
        )} />
      </div>
    </Card>
  );
}