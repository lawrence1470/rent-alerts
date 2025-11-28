"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Badge,
  Button,
  Skeleton,
} from "@mantine/core";
import {
  Clock,
  Timer,
  Zap,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AccessPeriod {
  tierId: string;
  tierName: string;
  expiresAt: string;
  status: string;
}

interface SubscriptionData {
  accessPeriods: AccessPeriod[];
}

export function SubscriptionOverview() {
  const [subscriptions, setSubscriptions] = useState<AccessPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      const response = await fetch('/api/user/access');
      if (response.ok) {
        const data: SubscriptionData = await response.json();
        setSubscriptions(data.accessPeriods || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateDaysRemaining(expiresAt: string): number {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (loading) {
    return (
      <div className="mb-8">
        <div className="mb-4">
          <Skeleton height={28} width={128} radius="md" mb={8} />
          <Skeleton height={16} width={256} radius="md" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg" className="h-[140px]">
              <Skeleton height="100%" radius="md" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getTierIcon = (tierId: string) => {
    if (tierId === '15min') return Zap;
    if (tierId === '30min') return Timer;
    return Clock;
  };

  const getTierIconColor = (tierId: string) => {
    if (tierId === '15min') return 'text-amber-500';
    if (tierId === '30min') return 'text-blue-500';
    return 'text-slate-500';
  };

  const getTierDetails = (tierId: string) => {
    if (tierId === '15min') return {
      cost: 20,
      frequency: 'Every 15 min',
      checksPerDay: 96,
      label: 'Lightning',
    };
    if (tierId === '30min') return {
      cost: 15,
      frequency: 'Every 30 min',
      checksPerDay: 48,
      label: 'Rapid',
    };
    return {
      cost: 0,
      frequency: 'Every hour',
      checksPerDay: 24,
      label: 'Free',
    };
  };

  // Always include free tier, plus any premium subscriptions
  const allPlans = [
    {
      tierId: '1hour',
      tierName: 'Hourly Checks',
      expiresAt: null,
      status: 'active',
    },
    ...subscriptions.filter(sub => sub.tierId !== '1hour')
  ];

  const hasPremium = allPlans.length > 1;

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Your Plan</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {hasPremium
            ? "You're on a premium plan"
            : "Upgrade for faster notifications"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {allPlans.map((plan) => {
          const details = getTierDetails(plan.tierId);
          const Icon = getTierIcon(plan.tierId);
          const isFree = plan.tierId === '1hour';
          const daysRemaining = plan.expiresAt ? calculateDaysRemaining(plan.expiresAt) : null;
          const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

          return (
            <Card
              key={plan.tierId}
              className={cn(
                "h-[140px] rounded-xl transition-shadow hover:shadow-md",
                isFree ? "border border-dashed" : "border"
              )}
              padding="md"
            >
              <div className="h-full flex flex-col justify-between">
                {/* Top: Icon, Name, Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Icon className={cn("h-4 w-4", getTierIconColor(plan.tierId))} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{details.label}</h3>
                      <p className="text-xs text-muted-foreground">{details.frequency}</p>
                    </div>
                  </div>
                  <Badge
                    color={isExpiringSoon ? "yellow" : "green"}
                    variant="light"
                    size="xs"
                  >
                    {isExpiringSoon ? `${daysRemaining}d left` : "Active"}
                  </Badge>
                </div>

                {/* Middle: Price */}
                <div className="text-center py-2">
                  {isFree ? (
                    <span className="text-xl font-bold">Free</span>
                  ) : (
                    <span className="text-xl font-bold">${details.cost}<span className="text-xs text-muted-foreground font-normal">/wk</span></span>
                  )}
                </div>

                {/* Bottom: Action */}
                <Button
                  variant={isFree ? "light" : "filled"}
                  color={isFree ? "gray" : "blue"}
                  size="xs"
                  className="w-full"
                  disabled={isFree}
                >
                  {isFree ? 'Current Plan' : 'Manage'}
                </Button>
              </div>
            </Card>
          );
        })}

        {/* Add Premium Plan Card */}
        {!hasPremium && (
          <Link href="/pricing" className="block">
            <Card className={cn(
              "h-[140px] rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-blue-400",
              "border border-dashed border-blue-300"
            )}>
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="p-2 rounded-full bg-blue-50 mb-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm">Upgrade</h3>
                <p className="text-xs text-muted-foreground">
                  Get faster alerts
                </p>
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
