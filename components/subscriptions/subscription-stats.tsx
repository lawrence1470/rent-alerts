"use client";

import { Card } from "@mantine/core";
import { Calendar, Bell, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  daysRemaining: number | null;
  activeAlerts: number;
  notificationsSent: number;
  checksPerDay: number;
}

interface SubscriptionStatsProps {
  stats: StatsData;
  status: 'active' | 'expiring-soon' | 'expired' | 'free' | 'cancelled';
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  iconColor?: string;
  highlight?: boolean;
}

function StatCard({ icon: Icon, label, value, subtext, iconColor = "text-slate-500", highlight = false }: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl transition-shadow hover:shadow-md",
        highlight && "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20"
      )}
      padding="md"
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg bg-muted", highlight && "bg-yellow-100 dark:bg-yellow-900/40")}>
          <Icon className={cn("h-4 w-4", iconColor, highlight && "text-yellow-600")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={cn(
            "text-xl font-bold mt-0.5",
            highlight && "text-yellow-700 dark:text-yellow-400"
          )}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function SubscriptionStats({ stats, status }: SubscriptionStatsProps) {
  const isExpiringSoon = status === 'expiring-soon';
  const isFree = status === 'free';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard
        icon={Calendar}
        label="Days Remaining"
        value={stats.daysRemaining !== null ? stats.daysRemaining : '∞'}
        subtext={isFree ? "Free tier" : isExpiringSoon ? "Renew soon!" : "Until expiry"}
        iconColor="text-blue-500"
        highlight={isExpiringSoon}
      />
      <StatCard
        icon={Bell}
        label="Active Alerts"
        value={stats.activeAlerts}
        subtext="Monitoring"
        iconColor="text-green-500"
      />
      <StatCard
        icon={Send}
        label="Notifications"
        value={stats.notificationsSent}
        subtext="Last 30 days"
        iconColor="text-purple-500"
      />
    </div>
  );
}
