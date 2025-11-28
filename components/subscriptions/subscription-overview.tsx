"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Badge,
  Button,
  Divider,
  Skeleton,
} from "@mantine/core";
import {
  Clock,
  Timer,
  Zap,
  TrendingUp,
  Check,
  Sparkles,
  Plus,
  X
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
            <Card key={i} padding="lg">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton height={40} width={40} radius="md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton height={16} width={96} radius="md" />
                    <Skeleton height={12} width={128} radius="md" />
                  </div>
                </div>
                <Skeleton height={32} width={80} radius="md" />
                <div className="space-y-2">
                  <Skeleton height={12} width="100%" radius="md" />
                  <Skeleton height={12} width="100%" radius="md" />
                  <Skeleton height={12} width="80%" radius="md" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Skeleton height={32} width="100%" radius="md" />
              </div>
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

  const getTierColor = (tierId: string) => {
    if (tierId === '15min') return 'from-amber-500/10 to-orange-500/10 border-amber-500/20';
    if (tierId === '30min') return 'from-blue-500/10 to-indigo-500/10 border-blue-500/20';
    return 'from-slate-500/10 to-gray-500/10 border-slate-500/20';
  };

  const getTierIconColor = (tierId: string) => {
    if (tierId === '15min') return 'text-amber-500';
    if (tierId === '30min') return 'text-blue-500';
    return 'text-slate-500';
  };

  const getTierDetails = (tierId: string) => {
    if (tierId === '15min') return {
      cost: 20,
      frequency: 'Every 15 minutes',
      checksPerDay: 96,
      label: 'Lightning',
      description: 'Maximum speed for competitive markets',
      features: [
        '96 checks per day',
        'Email notifications',
        'SMS notifications',
        'Rent stabilization tracking',
        'Fastest response time',
        'Best apartment success rate'
      ],
      limitations: []
    };
    if (tierId === '30min') return {
      cost: 15,
      frequency: 'Every 30 minutes',
      checksPerDay: 48,
      label: 'Rapid',
      description: 'Great balance of speed and value',
      features: [
        '48 checks per day',
        'Email notifications',
        'SMS notifications',
        'Rent stabilization tracking',
        'Quick response time',
        'High apartment success rate'
      ],
      limitations: []
    };
    return {
      cost: 0,
      frequency: 'Every hour',
      checksPerDay: 24,
      label: 'Free',
      description: 'Perfect for casual searching',
      features: [
        '24 checks per day',
        'Email notifications only',
        'Custom search alerts',
        'Always available',
        'No credit card required'
      ],
      limitations: [
        'No SMS notifications',
        'No rent stabilization data',
        'Slower response time'
      ]
    };
  };

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
                "overflow-hidden transition-all duration-300 rounded-2xl",
                isFree
                  ? "border-2 border-dashed border-muted-foreground/30 bg-muted/30 shadow-sm hover:shadow-md"
                  : "shadow-lg hover:shadow-xl hover:scale-[1.02]",
                !isFree && "bg-gradient-to-br border-2",
                !isFree && getTierColor(plan.tierId)
              )}
              padding="lg"
            >
              {/* Card Header: Icon, Title, Subtitle, Status Chip */}
              <div className="flex items-center gap-3 pb-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isFree ? "bg-muted" : "bg-background/50"
                )}>
                  <Icon className={cn("h-4 w-4", getTierIconColor(plan.tierId))} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{details.label}</h3>
                    {!isFree && (
                      <Badge
                        size="sm"
                        variant="light"
                        color={plan.tierId === '15min' ? 'yellow' : 'blue'}
                        className="h-5"
                      >
                        {plan.tierId === '15min' ? 'Lightning' : 'Rapid'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {details.frequency}
                  </p>
                </div>
                {/* Status Badge with pulsing animation */}
                <Badge
                  color={isExpiringSoon ? "yellow" : "green"}
                  variant="light"
                  size="sm"
                  leftSection={
                    <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  }
                >
                  {isExpiringSoon ? "Expiring Soon" : "Active"}
                </Badge>
              </div>

              {/* Card Body: Price, Features, Limitations */}
              <div className="space-y-3 pt-0">
                {/* Price */}
                <div className={cn(
                  "inline-flex items-baseline gap-1 px-3 py-1.5 rounded-lg w-fit",
                  isFree ? "bg-muted" : "bg-gradient-to-r from-primary/10 to-primary/5"
                )}>
                  {isFree ? (
                    <span className="text-2xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">$</span>
                      <span className="text-2xl font-bold">{details.cost}</span>
                      <span className="text-xs text-muted-foreground">/wk</span>
                    </>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {details.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations (only for free tier) */}
                {details.limitations.length > 0 && (
                  <>
                    <Divider className="my-2 bg-muted-foreground/20" />
                    <div className="space-y-2">
                      {details.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <X className="h-3.5 w-3.5 text-red-500/60 shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground/70 leading-relaxed">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Renewal Information */}
                {!isFree && plan.expiresAt && (
                  <>
                    <Divider className="my-2 bg-primary/10" />
                    <div className="flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        Renews in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Card Footer: Action Button */}
              <div className="pt-3 mt-3 border-t">
                <Button
                  variant={isFree ? "outline" : "filled"}
                  color={isFree ? "gray" : "blue"}
                  size="md"
                  className="w-full"
                  disabled={isFree}
                >
                  {isFree ? 'Current Plan' : 'Manage Plan'}
                </Button>
              </div>
            </Card>
          );
        })}

        {/* Add Premium Plan Card */}
        {!hasPremium && (
          <Link href="/pricing">
            <Card className={cn(
              "relative overflow-hidden transition-all duration-300 cursor-pointer group rounded-2xl",
              "hover:shadow-xl hover:scale-[1.02]",
              "bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10",
              "border-2 border-dashed border-blue-500/30 hover:border-blue-500/60",
              "shadow-lg"
            )}>
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                {/* Icon */}
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="h-6 w-6 text-blue-500" />
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-2">Add Premium Plan</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[220px]">
                  Upgrade to get notifications every 15-30 minutes
                </p>

                {/* CTA Badge */}
                <Badge
                  variant="filled"
                  color="blue"
                  size="lg"
                  leftSection={<Sparkles className="h-3.5 w-3.5" />}
                >
                  View Plans
                </Badge>
              </div>
            </Card>
          </Link>
        )}
      </div>

    </div>
  );
}
