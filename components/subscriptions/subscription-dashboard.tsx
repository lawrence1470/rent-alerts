"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Skeleton } from "@mantine/core";
import { CurrentPlanHero } from "./current-plan-hero";
import { SubscriptionStats } from "./subscription-stats";
import { NotificationPreferences } from "./notification-preferences";

interface DashboardData {
  currentPlan: {
    tierId: string;
    tierName: string;
    pricePerWeek: number;
    interval: string;
    checksPerDay: number;
    expiresAt: string | null;
    daysRemaining: number | null;
    percentRemaining: number;
    status: 'active' | 'expiring-soon' | 'expired' | 'free' | 'cancelled';
    accessPeriodId: string | null;
  };
  stats: {
    activeAlerts: number;
    notificationsSent: number;
  };
  notificationPrefs: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    smsAvailable: boolean;
  };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <Card className="rounded-xl" padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton height={48} width={48} radius="xl" />
          <div>
            <Skeleton height={20} width={200} radius="md" mb={8} />
            <Skeleton height={14} width={150} radius="md" />
          </div>
        </div>
        <Skeleton height={12} radius="xl" mb={8} />
        <Skeleton height={8} radius="md" width="60%" />
      </Card>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl" padding="md">
            <div className="flex items-start gap-3">
              <Skeleton height={40} width={40} radius="md" />
              <div className="flex-1">
                <Skeleton height={12} width="60%" radius="md" mb={8} />
                <Skeleton height={24} width="40%" radius="md" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Notification Types Skeleton */}
      <Card className="rounded-xl max-w-md" padding="lg">
        <Skeleton height={16} width={140} radius="md" mb={16} />
        <div className="space-y-4">
          <Skeleton height={48} radius="md" />
          <Skeleton height={48} radius="md" />
        </div>
      </Card>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="rounded-xl" padding="xl">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-4 rounded-full bg-red-50 dark:bg-red-950 mb-4">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Unable to load subscription data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We're having trouble connecting. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

export function SubscriptionDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch('/api/subscriptions/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleCancelSuccess = () => {
    fetchDashboard(); // Refresh data after cancellation
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return <DashboardError onRetry={fetchDashboard} />;
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Hero */}
      <CurrentPlanHero
        plan={data.currentPlan}
        onCancel={handleCancelSuccess}
      />

      {/* Stats Grid */}
      <SubscriptionStats
        stats={{
          daysRemaining: data.currentPlan.daysRemaining,
          activeAlerts: data.stats.activeAlerts,
          notificationsSent: data.stats.notificationsSent,
          checksPerDay: data.currentPlan.checksPerDay,
        }}
        status={data.currentPlan.status}
      />

      {/* Notification Types */}
      <NotificationPreferences prefs={data.notificationPrefs} />
    </div>
  );
}
