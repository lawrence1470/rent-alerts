"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Your Subscription</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 w-10 bg-muted rounded-lg"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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
                "relative overflow-hidden transition-all hover:shadow-md",
                !isFree && "bg-gradient-to-br",
                !isFree && getTierColor(plan.tierId)
              )}
            >
              {/* Pulsing Active Dot */}
              <div className="absolute top-3 right-3">
                <div className="relative flex items-center justify-center">
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 animate-ping">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      isExpiringSoon ? "bg-red-500" : "bg-green-500"
                    )} />
                  </div>
                  {/* Solid dot */}
                  <div className={cn(
                    "relative h-2 w-2 rounded-full",
                    isExpiringSoon ? "bg-red-500" : "bg-green-500"
                  )} />
                </div>
              </div>

              <div className="p-4">
                {/* Icon & Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isFree ? "bg-muted" : "bg-background/50"
                  )}>
                    <Icon className={cn("h-4 w-4", getTierIconColor(plan.tierId))} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{details.label}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {details.frequency}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {isFree ? (
                    <span className="text-2xl font-bold">Free</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">$</span>
                      <span className="text-2xl font-bold">{details.cost}</span>
                      <span className="text-xs text-muted-foreground">/wk</span>
                    </div>
                  )}
                </div>

                {/* All Features */}
                <div className="space-y-2 mb-4">
                  {details.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}

                  {/* Limitations (only for free tier) */}
                  {details.limitations.length > 0 && (
                    <>
                      <div className="border-t border-border/50 my-3" />
                      {details.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <X className="h-3.5 w-3.5 text-red-500/60 shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground/70 leading-relaxed">{limitation}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {!isFree && plan.expiresAt && (
                    <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                      <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        Renews in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  variant={isFree ? "outline" : "secondary"}
                  size="sm"
                  className="w-full h-8 text-xs"
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
          <Link href="/pricing">
            <Card className={cn(
              "relative overflow-hidden transition-all cursor-pointer group",
              "hover:shadow-lg hover:border-blue-500/50",
              "bg-gradient-to-br from-blue-500/5 to-indigo-500/5",
              "border-dashed border-2"
            )}>
              <div className="p-4 flex flex-col items-center justify-center min-h-[200px] text-center">
                {/* Icon */}
                <div className="p-3 rounded-full bg-blue-500/10 mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-blue-500" />
                </div>

                {/* Title */}
                <h3 className="font-bold text-base mb-2">Add Premium Plan</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                  Upgrade to get notifications every 15-30 minutes
                </p>

                {/* CTA Badge */}
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  <Sparkles className="h-3 w-3 mr-1" />
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
