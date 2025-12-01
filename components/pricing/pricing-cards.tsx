"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as MantineBadge } from '@mantine/core';
import { Zap, Check, Shield, Lock } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================
// CONFIGURATION
// ============================================

// Single subscription: Monthly plan at $15/month
const BASE_PRICE_PER_WEEK = 375; // $3.75/week = $15/month in cents
const TIER_ID = 'monthly';

// Duration options for monthly packs
const DURATION_OPTIONS = [
  { months: 1, weeks: 4, discount: 0, label: '1 Month' },
  { months: 2, weeks: 8, discount: 10, label: '2 Months' },
  { months: 3, weeks: 12, discount: 20, label: '3 Months' },
] as const;

type DurationOption = typeof DURATION_OPTIONS[number];

// Feature list for the left panel
const FEATURES = [
  {
    title: '96 listing checks per day',
    description: 'Get notified every 15 minutes',
  },
  {
    title: 'Email + SMS notifications',
    description: 'Never miss a new listing',
  },
  {
    title: 'Smart deduplication',
    description: 'Only see new listings',
  },
  {
    title: 'Priority support',
    description: 'Get help when you need it',
  },
];

// ============================================
// PRICING CALCULATIONS
// ============================================

function calculatePrice(duration: DurationOption) {
  const subtotal = (BASE_PRICE_PER_WEEK * duration.weeks) / 100;
  const discountAmount = subtotal * (duration.discount / 100);
  const total = subtotal - discountAmount;
  return { subtotal, discountAmount, total };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PricingCards() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[1]); // Default to 2 months

  const { subtotal, discountAmount, total } = calculatePrice(selectedDuration);

  const handleCheckout = async () => {
    if (!user) {
      toast.info('Sign in required', {
        description: 'Please sign in to purchase access',
      });
      router.push('/sign-in');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId: TIER_ID,
          weeks: selectedDuration.weeks
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url, sessionId } = await response.json();

      if (url) {
        window.location.href = url;
      } else if (sessionId) {
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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-32 lg:pb-8">
      {/* Main Two-Panel Layout */}
      <div className="grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border bg-card shadow-lg">

        {/* Left Panel: Features */}
        <div className="p-8 lg:p-10 bg-gradient-to-br from-background to-muted/30">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">
              Get Rental Alerts
            </h2>
            <p className="text-muted-foreground">
              Unlock the fastest rental notifications in NYC
            </p>
          </div>

          {/* Divider */}
          <div className="border-t mb-6" />

          {/* Features List */}
          <div className="space-y-5">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Order Summary */}
        <div className="p-8 lg:p-10 bg-muted/50 border-t lg:border-t-0 lg:border-l">
          <h3 className="text-lg font-semibold mb-6">Order summary</h3>

          {/* Duration Selection */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Duration</p>
            <div className="space-y-2">
              {DURATION_OPTIONS.map((option) => {
                const isSelected = selectedDuration.months === option.months;
                const price = calculatePrice(option);

                return (
                  <div
                    key={option.months}
                    onClick={() => setSelectedDuration(option)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-background hover:bg-background/80"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio Circle */}
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        isSelected ? "border-primary" : "border-muted-foreground/30"
                      )}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold">${price.total.toFixed(0)}</span>
                      {option.discount > 0 && (
                        <MantineBadge size="sm" color="green" variant="light">
                          -{option.discount}%
                        </MantineBadge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t my-6" />

          {/* Price Breakdown */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {selectedDuration.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({selectedDuration.discount}%)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button - Desktop */}
          <div className="hidden lg:flex lg:justify-center">
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full max-w-xs"
              size="lg"
            >
              {loading ? 'Processing...' : 'Confirm payment'}
            </Button>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Secure checkout via Stripe</span>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="p-4 space-y-3">
          {/* Price Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{selectedDuration.label}</p>
              {selectedDuration.discount > 0 && (
                <p className="text-xs text-green-600">{selectedDuration.discount}% off</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${total.toFixed(2)}</p>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing...' : 'Confirm payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
