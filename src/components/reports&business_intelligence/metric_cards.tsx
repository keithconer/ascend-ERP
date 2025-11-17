import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  color: "primary" | "accent" | "success" | "warning";
}

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export const MetricCard = ({ title, value, change, trend, icon: Icon, color }: MetricCardProps) => {
  const isPositive = trend === "up";
  
  return (
    <Card className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-lg", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </Card>
  );
};
