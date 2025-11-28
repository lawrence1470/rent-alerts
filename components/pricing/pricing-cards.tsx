"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as MantineBadge, NumberInput, ActionIcon } from '@mantine/core';
import { Clock, Timer, Zap, Check, X, Shield, TrendingDown, Minus, Plus, Mail, Bell, MessageSquare, Headphones, ArrowRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserSubscription {
  tierId: string;
  name: string;
  interval: string;
  expiresAt: string | null;
  daysRemaining: number | null;
}

// Discount tiers
function getDiscountPercent(weeks: number): number {
  if (weeks >= 12) return 30;
  if (weeks >= 8) return 20;
  if (weeks >= 4) return 10;
  return 0;
}

// ============================================
// FEATURE SYSTEM (Additive Model)
// ============================================

type TierId = '1hour-sms' | '30min' | '15min';

const ALL_FEATURES = [
  { id: 'email', label: 'Email notifications', icon: Mail, tier: '1hour-sms' as TierId },
  { id: 'sms', label: 'SMS text alerts', icon: MessageSquare, tier: '1hour-sms' as TierId },
  { id: 'mobile', label: 'Mobile push notifications', icon: Bell, tier: '1hour-sms' as TierId },
  { id: 'hourly', label: 'Hourly checks (24/day)', icon: Clock, tier: '1hour-sms' as TierId },
  { id: '30min', label: '30-min checks (48/day)', icon: Timer, tier: '30min' as TierId },
  { id: '15min', label: '15-min checks (96/day)', icon: Zap, tier: '15min' as TierId },
  { id: 'priority', label: 'Priority support', icon: Headphones, tier: '15min' as TierId },
] as const;

type FeatureId = typeof ALL_FEATURES[number]['id'];

const TIER_ORDER: TierId[] = ['1hour-sms', '30min', '15min'];

function getTierFeatures(tierId: TierId): FeatureId[] {
  const tierIndex = TIER_ORDER.indexOf(tierId);
  return ALL_FEATURES
    .filter(f => TIER_ORDER.indexOf(f.tier) <= tierIndex)
    .map(f => f.id);
}

function getUnlockTier(featureId: FeatureId): TierId {
  const feature = ALL_FEATURES.find(f => f.id === featureId);
  return feature?.tier || '1hour-sms';
}

function getTierName(tierId: TierId): string {
  const names: Record<TierId, string> = {
    '1hour-sms': 'Hourly + SMS',
    '30min': '30-Minute',
    '15min': '15-Minute',
  };
  return names[tierId];
}

// ============================================
// TIER DEFINITIONS
// ============================================

type Tier = {
  id: TierId;
  name: string;
  description: string;
  pricePerWeek: number;
  checksPerDay: number;
  interval: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
};

const TIERS: Tier[] = [
  {
    id: '1hour-sms',
    name: 'Hourly + SMS',
    description: 'Get text alerts on the go',
    pricePerWeek: 500,
    checksPerDay: 24,
    interval: 'every hour',
    icon: <Clock className="h-5 w-5" />,
    features: [
      '24 checks per day',
      'Email + SMS notifications',
      'Mobile alerts',
    ],
  },
  {
    id: '30min',
    name: '30-Minute',
    description: 'Be among the first to respond',
    pricePerWeek: 1500,
    checksPerDay: 48,
    interval: 'every 30 min',
    icon: <Timer className="h-5 w-5" />,
    popular: true,
    features: [
      '48 checks per day',
      '2x faster than hourly',
      'Competitive neighborhoods',
    ],
  },
  {
    id: '15min',
    name: '15-Minute',
    description: 'Maximum speed for hot markets',
    pricePerWeek: 2000,
    checksPerDay: 96,
    interval: 'every 15 min',
    icon: <Zap className="h-5 w-5" />,
    features: [
      '96 checks per day',
      '4x faster than hourly',
      'Priority support',
    ],
  },
];

export function PricingCards() {
  const { user } = useUser();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<number>(4);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(TIERS.find(t => t.id === '30min') || null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  async function fetchSubscriptions() {
    try {
      const response = await fetch('/api/user/access');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  }

  const handlePurchase = async (tierId: '1hour' | '1hour-sms' | '30min' | '15min') => {
    if (!user) {
      toast.info('Sign in required', {
        description: 'Please sign in to purchase access',
      });
      router.push('/sign-in');
      return;
    }

    setLoadingTier(tierId);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId, weeks: selectedWeeks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url, sessionId } = await response.json();

      // Stripe JS v8+ doesn't have redirectToCheckout, use URL redirect
      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        // Fallback: construct checkout URL manually
        window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const handleCheckout = () => {
    if (!selectedTier || loadingTier) return;
    handlePurchase(selectedTier.id);
  };

  // Calculate pricing with tiered discounts
  const discountPercent = getDiscountPercent(selectedWeeks);
  const subtotal = selectedTier ? (selectedTier.pricePerWeek * selectedWeeks) / 100 : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const totalCost = subtotal - discountAmount;

  return (
    <div className="max-w-7xl mx-auto pb-8 lg:pb-0">
      {/* Step Indicator */}
      <div className="mb-8 text-center">
        <p className="text-sm text-muted-foreground">
          Step {step} of 2
        </p>
      </div>

      {/* Step 1: Plan Selection */}
      {step === 1 && (
        <div className="animate-in fade-in duration-300 pb-32 lg:pb-0">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center">Choose Your Plan</h2>
            <p className="text-muted-foreground mb-8 text-center">
              Select the notification frequency that works best for you
            </p>

            {/* Two-Column Layout */}
            <div className="grid lg:grid-cols-[1fr_380px] gap-6">

              {/* Left Column: Plan Cards */}
              <div className="space-y-3">
                {TIERS.map((tier) => {
                  const isSelected = selectedTier?.id === tier.id;
                  const weeklyPrice = tier.pricePerWeek / 100;

                  return (
                    <div
                      key={tier.id}
                      className={cn(
                        "relative rounded-xl cursor-pointer transition-all duration-200",
                        isSelected && "p-[2px] bg-gradient-to-r from-primary to-primary/70"
                      )}
                      onClick={() => setSelectedTier(tier)}
                    >
                      <div
                        className={cn(
                          "relative rounded-xl bg-background p-5 transition-all",
                          !isSelected && "border hover:border-primary/50 hover:shadow-md",
                          isSelected && "shadow-lg"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div
                            className={cn(
                              "p-3 rounded-lg flex-shrink-0",
                              isSelected ? "bg-primary/10" : "bg-muted"
                            )}
                          >
                            <div className={cn(
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}>
                              {tier.icon}
                            </div>
                          </div>

                          {/* Plan Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-lg font-bold">{tier.name}</h3>
                              {tier.popular && (
                                <MantineBadge size="xs" color="blue" variant="light">
                                  Popular
                                </MantineBadge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {tier.description}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-bold">${weeklyPrice}</div>
                            <div className="text-xs text-muted-foreground">/week</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Continue Button - Desktop only */}
                <div className="hidden lg:block">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedTier}
                    className="w-full mt-4"
                    size="lg"
                  >
                    Continue
                  </Button>
                </div>
              </div>

              {/* Right Column: Perks Panel */}
              <div className="lg:sticky lg:top-8 h-fit">
                <Card className="p-6">
                  {selectedTier ? (
                    <>
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-lg bg-primary/10">
                          <div className="text-primary">{selectedTier.icon}</div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedTier.name}</h3>
                          <p className="text-xs text-muted-foreground">Perks & Features</p>
                        </div>
                      </div>

                      {/* Feature List with Comparison */}
                      <div className="space-y-2 mb-6">
                        {ALL_FEATURES.map((feature) => {
                          const includedFeatures = getTierFeatures(selectedTier.id);
                          const isIncluded = includedFeatures.includes(feature.id);
                          const Icon = feature.icon;
                          const unlockTier = getUnlockTier(feature.id);
                          const needsUpgrade = !isIncluded;

                          return (
                            <div
                              key={feature.id}
                              className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                                isIncluded ? "bg-primary/5" : "bg-muted/50"
                              )}
                            >
                              {/* Check/X Icon */}
                              <div
                                className={cn(
                                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                                  isIncluded
                                    ? "bg-green-500 text-white"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                                )}
                              >
                                {isIncluded ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </div>

                              {/* Feature Icon */}
                              <Icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isIncluded ? "text-foreground" : "text-muted-foreground"
                              )} />

                              {/* Feature Label + Upgrade Prompt */}
                              <div className="flex-1 min-w-0">
                                <span
                                  className={cn(
                                    "text-sm block",
                                    isIncluded ? "text-foreground" : "text-muted-foreground"
                                  )}
                                >
                                  {feature.label}
                                </span>
                                {needsUpgrade && (
                                  <span className="text-xs text-primary/80 flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3" />
                                    Upgrade to {getTierName(unlockTier)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* Empty State */
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Select a Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a plan to see what&apos;s included
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </div>

          </div>

          {/* Mobile Sticky Bottom Bar - Step 1 */}
          {selectedTier && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
              <div className="p-4 space-y-3">
                {/* Selected Plan Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {selectedTier.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedTier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTier.checksPerDay} checks/day
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="h-3 w-3" /> Email
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="h-3 w-3" /> SMS
                    </span>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="w-full">
                  <Button
                    onClick={() => setStep(2)}
                    className="w-full"
                    size="lg"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Duration & Checkout */}
      {step === 2 && selectedTier && (
        <div className="animate-in fade-in duration-300 pb-32 lg:pb-0">
          {/* Back Button - Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="gap-1 -ml-2"
            >
              ← Back
            </Button>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Left Column: Selected Plan & Duration */}
            <div className="space-y-6">
              {/* Selected Plan Summary */}
              <Card className="p-6 bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Selected Plan</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    Change
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-lg bg-primary/10")}>
                    {selectedTier.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-bold">{selectedTier.name}</h4>
                      {selectedTier.popular && (
                        <MantineBadge size="sm" color="blue">
                          Popular
                        </MantineBadge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedTier.interval} • {selectedTier.checksPerDay} checks/day
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${(selectedTier.pricePerWeek / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">/week</div>
                  </div>
                </div>
              </Card>

              {/* Duration Selector */}
              <Card className="p-6">
                {/* Header with Progress Bar */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <h3 className="text-lg font-semibold whitespace-nowrap">How long do you need it?</h3>

                  {/* Discount Progress Bar */}
                  <div className="flex-1 max-w-[200px] space-y-1">
                    {/* Progress Track */}
                    <div className="relative">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-300 rounded-full"
                          style={{
                            width: selectedWeeks >= 12 ? '100%' :
                                   selectedWeeks >= 8 ? '66%' :
                                   selectedWeeks >= 4 ? '33%' : '0%'
                          }}
                        />
                      </div>

                      {/* Milestone Markers */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-between">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors",
                          selectedWeeks >= 4 ? "bg-green-500" : "bg-muted-foreground/30"
                        )} />
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors",
                          selectedWeeks >= 8 ? "bg-green-500" : "bg-muted-foreground/30"
                        )} />
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors",
                          selectedWeeks >= 12 ? "bg-green-500" : "bg-muted-foreground/30"
                        )} />
                      </div>
                    </div>

                    {/* Milestone Labels */}
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">0%</span>
                      <span className={selectedWeeks >= 4 ? "text-green-600 font-medium" : "text-muted-foreground"}>10%</span>
                      <span className={selectedWeeks >= 8 ? "text-green-600 font-medium" : "text-muted-foreground"}>20%</span>
                      <span className={selectedWeeks >= 12 ? "text-green-600 font-medium" : "text-muted-foreground"}>30%</span>
                    </div>
                  </div>
                </div>

                {/* Week Selector */}
                <div className="flex items-center justify-center gap-3">
                  <ActionIcon
                    variant="light"
                    size="lg"
                    onClick={() => setSelectedWeeks((w) => Math.max(1, w - 1))}
                    disabled={selectedWeeks <= 1}
                    aria-label="Decrease weeks"
                  >
                    <Minus className="h-4 w-4" />
                  </ActionIcon>

                  <span className="text-3xl font-bold min-w-[40px] text-center">{selectedWeeks}</span>

                  <ActionIcon
                    variant="light"
                    size="lg"
                    onClick={() => setSelectedWeeks((w) => Math.min(52, w + 1))}
                    disabled={selectedWeeks >= 52}
                    aria-label="Increase weeks"
                  >
                    <Plus className="h-4 w-4" />
                  </ActionIcon>

                  <span className="text-lg text-muted-foreground">
                    week{selectedWeeks > 1 ? 's' : ''}
                  </span>
                </div>
              </Card>

              {/* Continue Button - Desktop only */}
              <div className="hidden lg:block max-w-md">
                <Button
                  onClick={handleCheckout}
                  disabled={loadingTier !== null}
                  className="w-full cursor-pointer hover:scale-[1.02] transition-all"
                  size="lg"
                >
                  {loadingTier ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-6">
                  {/* Summary Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <span className="font-medium">{selectedTier.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {selectedWeeks} week{selectedWeeks > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Check frequency</span>
                      <span className="font-medium">{selectedTier.interval}</span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        ${(selectedTier.pricePerWeek / 100).toFixed(2)} × {selectedWeeks} weeks
                      </span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>

                    {discountPercent > 0 && (
                      <div className="flex items-center justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {discountPercent}% discount
                        </span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t pt-4 flex items-center justify-between">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
                    </div>

                    {discountPercent > 0 && (
                      <p className="text-xs text-green-600 text-center font-medium">
                        You save ${discountAmount.toFixed(2)}!
                      </p>
                    )}
                  </div>

                </div>
              </Card>
            </div>
          </div>

          {/* Mobile Sticky Checkout Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
            <div className="p-4 space-y-3">
              {/* Price Summary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedTier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedWeeks} week{selectedWeeks > 1 ? 's' : ''}
                    {discountPercent > 0 && ` • ${discountPercent}% off`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                  {discountPercent > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      Save ${discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleCheckout}
                disabled={loadingTier !== null}
                className="w-full cursor-pointer hover:scale-[1.02] transition-all"
                size="lg"
              >
                {loadingTier ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
