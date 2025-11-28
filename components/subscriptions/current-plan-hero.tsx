"use client";

import { useState } from "react";
import { Card, Badge, Button, Progress } from "@mantine/core";
import { Clock, Timer, Zap, RefreshCw, ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
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

interface CurrentPlanData {
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
}

interface CurrentPlanHeroProps {
  plan: CurrentPlanData;
  onCancel?: () => void;
}

export function CurrentPlanHero({ plan, onCancel }: CurrentPlanHeroProps) {
  const [cancelling, setCancelling] = useState(false);

  const getTierIcon = () => {
    if (plan.tierId === '15min') return Zap;
    if (plan.tierId === '30min') return Timer;
    return Clock;
  };

  const getTierIconColor = () => {
    if (plan.tierId === '15min') return 'text-amber-500';
    if (plan.tierId === '30min') return 'text-blue-500';
    return 'text-slate-500';
  };

  const getProgressColor = () => {
    if (plan.status === 'expiring-soon' || (plan.daysRemaining !== null && plan.daysRemaining <= 3)) {
      return 'red';
    }
    if (plan.daysRemaining !== null && plan.daysRemaining <= 7) {
      return 'yellow';
    }
    return 'green';
  };

  const getStatusBadge = () => {
    switch (plan.status) {
      case 'expiring-soon':
        return <Badge color="red" variant="light" size="sm">Expiring Soon</Badge>;
      case 'expired':
        return <Badge color="gray" variant="light" size="sm">Expired</Badge>;
      case 'cancelled':
        return <Badge color="orange" variant="light" size="sm">Cancelled</Badge>;
      case 'free':
        return <Badge color="gray" variant="light" size="sm">Free</Badge>;
      default:
        return <Badge color="green" variant="light" size="sm">Active</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const handleCancel = async () => {
    if (!plan.accessPeriodId) return;

    setCancelling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessPeriodId: plan.accessPeriodId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      toast.success(data.message);
      onCancel?.();
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const Icon = getTierIcon();
  const isFree = plan.status === 'free';
  const isPremium = !isFree && plan.tierId !== '1hour';
  const canCancel = isPremium && plan.status === 'active' && plan.accessPeriodId;

  return (
    <Card
      className={cn(
        "rounded-xl transition-shadow hover:shadow-md",
        isPremium && "border-2 border-blue-200 dark:border-blue-800"
      )}
      padding="lg"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            isPremium ? "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950" : "bg-muted"
          )}>
            <Icon className={cn("h-6 w-6", getTierIconColor())} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{plan.tierName}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              {plan.interval} checks
              {!isFree && ` • ${formatPrice(plan.pricePerWeek)}/week`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Section (only for paid tiers) */}
      {!isFree && plan.expiresAt && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Time Remaining</span>
            <span className={cn(
              "text-sm font-medium",
              plan.status === 'expiring-soon' && "text-red-600 dark:text-red-400"
            )}>
              {plan.daysRemaining} days left ({plan.percentRemaining}%)
            </span>
          </div>
          <Progress
            value={plan.percentRemaining}
            color={getProgressColor()}
            size="lg"
            radius="xl"
            className="mb-2"
          />
          <p className="text-xs text-muted-foreground">
            {plan.status === 'cancelled'
              ? `Access until ${formatDate(plan.expiresAt)}`
              : `Expires ${formatDate(plan.expiresAt)}`
            }
          </p>
        </div>
      )}

      {/* Free Tier Message */}
      {isFree && (
        <div className="mb-6 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            You're on the free plan with hourly checks. Upgrade to get faster notifications
            and never miss a listing!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Renew Early - only show if expiring soon and not cancelled */}
        {isPremium && plan.status === 'expiring-soon' && (
          <Button
            component={Link}
            href="/pricing"
            leftSection={<RefreshCw className="h-4 w-4" />}
            color="green"
            variant="filled"
            size="sm"
          >
            Renew Early
          </Button>
        )}

        {/* Upgrade/Change Plan */}
        <Button
          component={Link}
          href="/pricing"
          leftSection={<ArrowUpRight className="h-4 w-4" />}
          color="blue"
          variant={isFree ? "filled" : "light"}
          size="sm"
        >
          {isFree ? "Upgrade Plan" : "Change Plan"}
        </Button>

        {/* Cancel - only for active premium */}
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                leftSection={<X className="h-4 w-4" />}
                color="gray"
                variant="subtle"
                size="sm"
                loading={cancelling}
              >
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your subscription will remain active until{' '}
                  <strong>{plan.expiresAt && formatDate(plan.expiresAt)}</strong>.
                  You'll have {plan.daysRemaining} days of access remaining.
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
        )}
      </div>
    </Card>
  );
}
