import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { Activity, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";

interface ChartDataPoint {
  hour: number;
  orders: number;
  risk: number;
  disruptions: number;
}

interface RealtimeChartProps {
  data: ChartDataPoint[];
}

export function RealtimeChart({ data }: RealtimeChartProps) {
  const currentHour = new Date().getHours();
  
  // Calculate trends
  const recentData = data.slice(-6);
  const ordersTrend = recentData.length >= 2 
    ? ((recentData[recentData.length - 1].orders - recentData[0].orders) / recentData[0].orders) * 100
    : 0;
  
  const avgRisk = recentData.reduce((sum, point) => sum + point.risk, 0) / recentData.length;
  const totalDisruptions = recentData.reduce((sum, point) => sum + point.disruptions, 0);

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground mb-2">
            {formatHour(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'risk' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-electric/10">
            <Activity className="h-5 w-5 text-electric animate-sparkle" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Real-time Analytics
            </h3>
            <p className="text-sm text-muted-foreground">
              24-hour operational metrics & trend analysis
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-success border-success/30">
            <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-surface p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Orders Trend</p>
              <p className="text-xl font-bold text-card-foreground">
                {ordersTrend > 0 ? '+' : ''}{ordersTrend.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className={`h-4 w-4 ${ordersTrend > 0 ? 'text-success' : 'text-critical'}`} />
          </div>
        </div>
        
        <div className="bg-gradient-surface p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Risk Score</p>
              <p className="text-xl font-bold text-card-foreground">
                {avgRisk.toFixed(0)}%
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-warning" />
          </div>
        </div>
        
        <div className="bg-gradient-surface p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Issues</p>
              <p className="text-xl font-bold text-card-foreground">
                {totalDisruptions}
              </p>
            </div>
            <AlertTriangle className="h-4 w-4 text-critical" />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={formatHour}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Orders area */}
            <Area
              type="monotone"
              dataKey="orders"
              stackId="1"
              stroke="hsl(var(--electric))"
              fill="hsl(var(--electric) / 0.2)"
              strokeWidth={2}
              name="Orders Processed"
            />
            
            {/* Risk line */}
            <Line
              type="monotone"
              dataKey="risk"
              stroke="hsl(var(--warning))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--warning))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--warning))" }}
              name="Risk Score %"
            />
            
            {/* Disruptions bars */}
            <Bar
              dataKey="disruptions"
              fill="hsl(var(--critical) / 0.6)"
              name="Disruptions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-electric rounded-full"></div>
            <span>Order Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span>Risk Level</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-critical rounded-full"></div>
            <span>Disruptions</span>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Last updated: {formatHour(currentHour)}
        </div>
      </div>
    </Card>
  );
}