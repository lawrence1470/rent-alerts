"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Timer, Zap, Check } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Tier = {
  id: '1hour' | '30min' | '15min';
  name: string;
  description: string;
  pricePerWeek: number;
  checksPerDay: number;
  interval: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
  free?: boolean;
};

const TIERS: Tier[] = [
  {
    id: '1hour',
    name: 'Hourly Checks',
    description: 'Perfect for casual apartment hunting',
    pricePerWeek: 0,
    checksPerDay: 24,
    interval: 'every hour',
    icon: <Clock className="h-8 w-8" />,
    free: true,
    features: [
      '24 checks per day',
      'Email notifications only',
      'Unlimited alerts',
      'All search features',
      'No credit card required',
    ],
  },
  {
    id: '1hour-sms',
    name: 'Hourly Checks + SMS',
    description: 'Get text alerts every hour',
    pricePerWeek: 5,
    checksPerDay: 24,
    interval: 'every hour',
    icon: <Clock className="h-8 w-8" />,
    features: [
      '24 checks per day',
      'Email + SMS notifications',
      'Unlimited alerts',
      'All search features',
      'Affordable upgrade',
    ],
  },
  {
    id: '30min',
    name: '30-Minute Checks',
    description: 'Get a competitive edge',
    pricePerWeek: 15,
    checksPerDay: 48,
    interval: 'every 30 minutes',
    icon: <Timer className="h-8 w-8" />,
    popular: true,
    features: [
      '48 checks per day',
      'Email + SMS notifications',
      'Unlimited alerts',
      'All search features',
      '2x faster than free tier',
      'Better chance to be first',
    ],
  },
  {
    id: '15min',
    name: '15-Minute Checks',
    description: 'Maximum speed for serious hunters',
    pricePerWeek: 20,
    checksPerDay: 96,
    interval: 'every 15 minutes',
    icon: <Zap className="h-8 w-8" />,
    features: [
      '96 checks per day',
      'Email + SMS notifications',
      'Unlimited alerts',
      'All search features',
      '4x faster than free tier',
      'Best chance to get listings first',
      'Premium support',
    ],
  },
];

export function PricingCards() {
  const { user } = useUser();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<Record<string, number>>({
    '30min': 4,
    '15min': 4,
  });

  const handlePurchase = async (tierId: '30min' | '15min', weeks: number) => {
    if (!user) {
      toast.info('Sign in required', {
        description: 'Please sign in to purchase access',
      });
      router.push('/sign-in');
      return;
    }

    setLoadingTier(tierId);

    try {
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId, weeks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
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

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
      {TIERS.map((tier) => {
        const getGradient = () => {
          if (tier.id === '30min') return 'bg-gradient-to-br from-amber-200 via-blue-300 to-blue-400';
          if (tier.id === '15min') return 'bg-gradient-to-br from-pink-200 via-rose-300 to-rose-400';
          return 'bg-gradient-to-br from-gray-100 to-gray-200';
        };

        const getIconColor = () => {
          if (tier.free) return 'text-gray-400';
          return 'text-white/40';
        };

        return (
          <Card
            key={tier.id}
            className="relative overflow-hidden flex flex-col"
          >
            {/* Gradient Header */}
            <div className={`relative h-20 ${getGradient()} flex items-center justify-between px-4`}>
              <h3 className="text-lg font-semibold text-gray-900">
                {tier.name}
              </h3>
              <div className={`text-5xl font-bold ${getIconColor()}`}>
                {tier.id === '1hour' ? '1' : tier.id === '30min' ? '2' : '3'}
              </div>
            </div>

            {/* Pricing */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-3">
                {tier.free ? (
                  <>
                    <div className="text-4xl font-bold mb-1">Free</div>
                    <p className="text-xs text-muted-foreground">Forever free tier</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {formatPrice(tier.pricePerWeek * 100)}
                      </span>
                      <span className="text-sm text-muted-foreground">/ week</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Up to {selectedWeeks[tier.id]} week{selectedWeeks[tier.id] > 1 ? 's' : ''}, billed once
                    </p>
                  </>
                )}
              </div>

              {/* Week Selector for Premium */}
              {!tier.free && (
                <div className="mb-3">
                  <select
                    className="w-full px-2 py-1.5 text-xs border rounded-lg bg-background"
                    value={selectedWeeks[tier.id]}
                    onChange={(e) =>
                      setSelectedWeeks({
                        ...selectedWeeks,
                        [tier.id]: parseInt(e.target.value, 10),
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((weeks) => (
                      <option key={weeks} value={weeks}>
                        {weeks} week{weeks > 1 ? 's' : ''} - $
                        {(tier.pricePerWeek * weeks).toFixed(2)} total
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* CTA Button */}
              <Button
                className="w-full rounded-full mb-3"
                variant={tier.free ? 'outline' : 'default'}
                size="sm"
                onClick={() => {
                  if (tier.free) {
                    router.push('/dashboard');
                  } else {
                    handlePurchase(tier.id, selectedWeeks[tier.id]);
                  }
                }}
                disabled={loadingTier === tier.id}
              >
                {loadingTier === tier.id
                  ? 'Processing...'
                  : tier.free
                  ? 'Current Plan'
                  : tier.popular
                  ? 'Upgrade to Pro'
                  : 'Upgrade to Pro Max'}
              </Button>

              {/* Description */}
              <p className="text-xs font-medium mb-3">
                {tier.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <div className="rounded-full bg-foreground p-0.5 mt-0.5 flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-background" />
                    </div>
                    <span className="text-xs leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
