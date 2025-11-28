"use client";

import { useEffect, useState } from "react";
import { Badge, Text } from "@mantine/core";
import { Zap, Clock } from "lucide-react";

interface AccessPeriod {
  tierId: string;
  tierName: string;
  expiresAt: string;
  status: string;
}

export function SubscriptionBadges() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
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
        } else {
          setHasPremium(false);
          setCurrentPlan("Free");
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

  return (
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
  );
}
