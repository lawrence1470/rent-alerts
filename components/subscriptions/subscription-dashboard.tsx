"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Skeleton, Button } from "@mantine/core";
import { CurrentPlanHero } from "./current-plan-hero";
import { NotificationPreferences } from "./notification-preferences";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
    <div className="space-y-6 max-w-2xl">
      {/* Hero Skeleton */}
      <Card className="rounded-2xl" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton height={44} width={44} radius="xl" />
          <div>
            <Skeleton height={18} width={120} radius="md" mb={6} />
            <Skeleton height={14} width={100} radius="md" />
          </div>
        </div>
        <Skeleton height={14} width="80%" radius="md" mb={4} />
        <Skeleton height={40} radius="md" />
      </Card>

      {/* Notification Preferences Skeleton */}
      <Card className="rounded-2xl" padding="lg">
        <Skeleton height={16} width={140} radius="md" mb={16} />
        <div className="space-y-4">
          <Skeleton height={48} radius="md" />
          <Skeleton height={48} radius="md" />
        </div>
      </Card>

      {/* Manage Subscription Skeleton */}
      <Card className="rounded-2xl" padding="lg">
        <Skeleton height={16} width={160} radius="md" mb={8} />
        <Skeleton height={14} width="70%" radius="md" />
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
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancel = async () => {
    if (!data?.currentPlan.accessPeriodId) return;

    setCancelling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessPeriodId: data.currentPlan.accessPeriodId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const result = await response.json();
      toast.success(result.message || 'Subscription cancelled');
      fetchDashboard();
    } catch (err) {
      console.error('Error cancelling:', err);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return <DashboardError onRetry={fetchDashboard} />;
  }

  const isPremium = data.currentPlan.status !== 'free' && data.currentPlan.tierId !== '1hour';
  const canCancel = isPremium && data.currentPlan.status === 'active' && data.currentPlan.accessPeriodId;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current Plan Hero */}
      <CurrentPlanHero
        plan={data.currentPlan}
        onCancel={handleCancelSuccess}
      />

      {/* Notification Preferences */}
      <NotificationPreferences prefs={data.notificationPrefs} />

      {/* Manage Subscription Section */}
      <Card className="rounded-2xl" padding="lg">
        <h3 className="font-semibold mb-2">Manage Subscription</h3>
        {canCancel ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Need to cancel? Your access will continue until {data.currentPlan.expiresAt ? formatDate(data.currentPlan.expiresAt) : 'your expiration date'}.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="subtle" color="red" loading={cancelling}>
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your subscription will remain active until{' '}
                    <strong>{data.currentPlan.expiresAt && formatDate(data.currentPlan.expiresAt)}</strong>.
                    You'll have {data.currentPlan.daysRemaining} days of access remaining.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active subscription to manage.
          </p>
        )}
      </Card>
    </div>
  );
}
