"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BANNER_DISMISSED_KEY = 'upgrade-banner-dismissed';

export function UpgradeBanner() {
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
    checkDismissedState();
  }, []);

  async function checkPremiumStatus() {
    try {
      const response = await fetch('/api/user/access');
      if (response.ok) {
        const data = await response.json();
        // Check if user has any paid subscriptions (not just free tier)
        const hasPaid = data.subscriptions.some(
          (sub: any) => sub.tierId !== '1hour'
        );
        setHasPremium(hasPaid);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  }

  function checkDismissedState() {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed === 'true') {
      setDismissed(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  }

  // Don't render if loading, has premium, or dismissed
  if (loading || hasPremium || dismissed) {
    return null;
  }

  return (
    <Card className="mb-6 overflow-hidden border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
      <div className="relative p-4 flex items-center gap-4">
        {/* Icon */}
        <div className="hidden sm:flex shrink-0 p-2 rounded-lg bg-blue-500/10">
          <Sparkles className="h-5 w-5 text-blue-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            Upgrade for Faster Notifications
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Premium plans check for new apartments every 15-30 minutes, giving you a competitive
            advantage in NYC's fast-moving rental market.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/pricing">
            <Button size="sm" className="whitespace-nowrap">
              <TrendingUp className="h-3 w-3 mr-1.5" />
              Upgrade
            </Button>
          </Link>

          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
