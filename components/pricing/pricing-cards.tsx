"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Timer, Zap, Check, AlertCircle, Shield, TrendingDown, ChevronDown, ChevronUp, Star, Users, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { cn } from '@/lib/utils';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UserSubscription {
  tierId: string;
  name: string;
  interval: string;
  expiresAt: string | null;
  daysRemaining: number | null;
}

// Testimonials data
const TESTIMONIALS = [
  {
    quote: "Got notified 12 minutes after listing went live. Had my application in within the hour. Worth every penny.",
    author: "Sarah M.",
    location: "Upper West Side",
  },
  {
    quote: "Missed out on 3 apartments with the free plan. Upgraded to 15-min checks and found my place within a week.",
    author: "James K.",
    location: "Williamsburg",
  },
  {
    quote: "The SMS notifications are a game changer. I can respond while commuting instead of checking email constantly.",
    author: "Maria L.",
    location: "Astoria",
  },
];

type Tier = {
  id: '1hour' | '1hour-sms' | '30min' | '15min';
  name: string;
  description: string;
  pricePerWeek: number;
  checksPerDay: number;
  interval: string;
  icon: React.ReactNode;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  popularityPercent?: number;
  free?: boolean;
};

const TIERS: Tier[] = [
  {
    id: '1hour-sms',
    name: 'Hourly Checks + SMS',
    description: 'Get text alerts on the go',
    pricePerWeek: 500,
    checksPerDay: 24,
    interval: 'every hour',
    icon: <Clock className="h-5 w-5" />,
    features: [
      '24 checks per day',
      'Email notifications',
      'SMS text notifications',
      'Respond while commuting',
      'Instant mobile alerts',
    ],
    limitations: [
      'May miss prime listings in competitive markets',
      'No priority customer support',
      'Slower than most competitors',
    ],
  },
  {
    id: '30min',
    name: '30-Minute Checks',
    description: 'Be among the first to respond',
    pricePerWeek: 1500,
    checksPerDay: 48,
    interval: 'every 30 minutes',
    icon: <Timer className="h-5 w-5" />,
    popular: true,
    popularityPercent: 68,
    features: [
      'Everything in Hourly + SMS',
      '48 checks per day',
      '2x faster notifications',
      'Beat 80% of other renters',
      'Higher response rate',
      'Competitive neighborhoods',
    ],
    limitations: [
      'Not optimized for Manhattan hot zones',
      'No priority customer support',
    ],
  },
  {
    id: '15min',
    name: '15-Minute Checks',
    description: 'Maximum speed for competitive markets',
    pricePerWeek: 2000,
    checksPerDay: 96,
    interval: 'every 15 minutes',
    icon: <Zap className="h-5 w-5" />,
    features: [
      'Everything in 30-Minute',
      '96 checks per day',
      '4x faster notifications',
      'Best chance at first contact',
      'Manhattan & Williamsburg optimized',
      'Priority customer support',
    ],
  },
];

export function PricingCards() {
  const { user } = useUser();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<number>(4);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(TIERS[0]); // Default to first tier
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

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

  const handlePurchase = async (tierId: '1hour-sms' | '30min' | '15min') => {
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

      const { sessionId } = await response.json();

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
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

  const calculateSavings = (pricePerWeek: number, weeks: number) => {
    if (weeks >= 4) {
      return ((pricePerWeek * weeks * 0.1) / 100).toFixed(2);
    }
    return null;
  };

  const getGradient = (tierId: string) => {
    switch (tierId) {
      case '1hour':
        return 'bg-gradient-to-r from-slate-200 to-slate-300';
      case '1hour-sms':
        return 'bg-gradient-to-r from-green-200 to-emerald-300';
      case '30min':
        return 'bg-gradient-to-r from-blue-200 to-indigo-300';
      case '15min':
        return 'bg-gradient-to-r from-amber-200 to-orange-300';
      default:
        return 'bg-gradient-to-r from-gray-200 to-gray-300';
    }
  };

  const totalCost = selectedTier ? (selectedTier.pricePerWeek * selectedWeeks) / 100 : 0;
  const savings = selectedTier ? calculateSavings(selectedTier.pricePerWeek, selectedWeeks) : null;

  return (
    <div className="max-w-7xl mx-auto pb-32 lg:pb-0">
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left Column: Plan Selection */}
        <div className="space-y-5">
          {/* Week Selector - Sticky */}
          <div className="lg:sticky lg:top-4 lg:z-10">
            <Card className="p-4 bg-background">
              <div className="space-y-3">
                {/* Header */}
                <h2 className="text-lg font-semibold">Duration</h2>

                {/* Compact button group */}
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((week) => (
                    <button
                      key={week}
                      type="button"
                      onClick={() => setSelectedWeeks(week)}
                      className={cn(
                        "relative py-2 text-sm font-medium rounded transition-all cursor-pointer",
                        "hover:bg-accent hover:text-accent-foreground hover:scale-105",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selectedWeeks === week
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground"
                      )}
                      aria-label={`${week} week${week > 1 ? 's' : ''}`}
                      aria-pressed={selectedWeeks === week}
                    >
                      <div className="flex flex-col items-center">
                        <span>{week}w</span>
                        {week >= 4 && (
                          <span className={cn(
                            "text-[9px] font-semibold leading-none mt-0.5",
                            selectedWeeks === week
                              ? "text-primary-foreground/90"
                              : "text-green-600"
                          )}>
                            -10%
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Plan Selection */}
          <div>
            <h2 className="text-2xl font-bold mb-3">Notification Plans</h2>
            <div className="space-y-2">
              {TIERS.map((tier) => {
                const isSelected = selectedTier?.id === tier.id;
                const weeklyPrice = tier.pricePerWeek / 100;

                return (
                  <Card
                    key={tier.id}
                    className={`relative cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                      isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:scale-[1.01]'
                    }`}
                    onClick={() => setSelectedTier(tier)}
                  >
                    <div className="p-3 lg:p-4">
                      <div className="flex items-start gap-2.5">
                        {/* Radio Button */}
                        <div className="pt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-background" />
                            )}
                          </div>
                        </div>

                        {/* Plan Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold">{tier.name}</h3>
                                {tier.popular && (
                                  <Badge className="text-[10px] px-1.5 py-0">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tier.description}
                              </p>
                            </div>

                            {/* Price */}
                            <div className="text-right ml-3 flex-shrink-0">
                              <div>
                                <div className="text-xl font-bold">
                                  ${weeklyPrice.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-muted-foreground">/week</div>
                              </div>
                            </div>
                          </div>

                          {/* Features & Limitations - Two Column Layout */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2.5">
                            {/* Left Column: Features */}
                            <div className="space-y-1.5">
                              {tier.features.slice(0, 4).map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-1.5">
                                  <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                                </div>
                              ))}
                            </div>

                            {/* Right Column: Limitations */}
                            <div className="space-y-1.5">
                              {tier.limitations && tier.limitations.length > 0 ? (
                                tier.limitations.map((limitation, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5">
                                    <X className="h-3.5 w-3.5 text-red-500/70 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-muted-foreground/80 leading-tight">{limitation}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-start gap-1.5 text-muted-foreground/50">
                                  <span className="text-xs leading-tight italic">No limitations</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional info */}
                          <div className="mt-2.5 pt-2.5 border-t flex items-center gap-3 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {tier.icon}
                              <span>{tier.interval}</span>
                            </div>
                            <div>
                              {tier.checksPerDay} checks/day
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Summary</h2>

            {selectedTier && (
              <div className="space-y-6">
                {/* Selected Plan */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-medium">{selectedTier.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {selectedWeeks} week{selectedWeeks > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Speed</span>
                    <span className="font-medium">{selectedTier.interval}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                  {savings && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        Multi-week discount (10%)
                      </span>
                      <span>-${savings}</span>
                    </div>
                  )}

                  <div className="border-t pt-4 flex items-center justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold">
                      ${(totalCost - (savings ? parseFloat(savings) : 0)).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    One-time payment for {selectedWeeks} week{selectedWeeks > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={loadingTier !== null}
                  className="w-full cursor-pointer hover:scale-[1.02] transition-all"
                  size="lg"
                >
                  {loadingTier ? 'Processing...' : 'Continue to Payment'}
                </Button>

                {/* Additional Info */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
                    <span>7-day money-back guarantee. Cancel anytime.</span>
                  </p>
                  <p className="text-center">
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      {selectedTier && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
          <div className="p-4 space-y-3">
            {/* Price Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{selectedTier.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedWeeks} week{selectedWeeks > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${(totalCost - (savings ? parseFloat(savings) : 0)).toFixed(2)}
                </p>
                {savings && (
                  <p className="text-xs text-green-600">Save ${savings}</p>
                )}
              </div>
            </div>

            {/* Checkout Button */}
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
      )}
    </div>
  );
}
