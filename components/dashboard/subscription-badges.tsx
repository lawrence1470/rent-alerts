"use client";

import { useEffect, useState } from "react";
import { Badge, Tooltip } from "@mantine/core";
import { Zap, Clock } from "lucide-react";

interface AccessPeriod {
  tierId: string;
  tierName: string;
  expiresAt: string;
  status: string;
}

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return "Expired";

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day left";
  if (diffDays <= 7) return `${diffDays} days left`;
  if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7);
    return weeks === 1 ? "1 week left" : `${weeks} weeks left`;
  }

  // Format as date for longer durations
  return `Ends ${expires.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function SubscriptionBadges() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      const response = await fetch('/api/user/access');
      if (response.ok) {
        const data = await response.json();
        const accessPeriods: AccessPeriod[] = data.accessPeriods || [];

        // Check if user has any paid tiers (not just free tier)
        const paidPeriod = accessPeriods.find(period => period.tierId !== '1hour');
        if (paidPeriod) {
          setHasPremium(true);
          setCurrentPlan(paidPeriod.tierName);
          setExpiresAt(paidPeriod.expiresAt);
        } else {
          setHasPremium(false);
          setCurrentPlan("Free");
          setExpiresAt(null);
        }
      } else {
        setCurrentPlan("Free");
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setCurrentPlan("Free");
    } finally {
      setLoading(false);
    }
  }

  if (loading || !currentPlan) {
    return null;
  }

  const timeRemaining = expiresAt ? formatTimeRemaining(expiresAt) : null;
  const isExpiringSoon = expiresAt && new Date(expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={hasPremium ? "gradient" : "light"}
        gradient={hasPremium ? { from: "yellow", to: "orange", deg: 90 } : undefined}
        color={hasPremium ? undefined : "dark"}
        leftSection={hasPremium ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        size="lg"
        radius="md"
      >
        {currentPlan}
      </Badge>

      {hasPremium && timeRemaining && (
        <Tooltip label={`Subscription expires ${new Date(expiresAt!).toLocaleDateString()}`}>
          <Badge
            variant="light"
            color={isExpiringSoon ? "red" : "gray"}
            size="lg"
            radius="md"
          >
            {timeRemaining}
          </Badge>
        </Tooltip>
      )}
    </div>
  );
}
