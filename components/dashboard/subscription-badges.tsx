"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap } from "lucide-react";

interface AccessPeriod {
  tierId: string;
  tierName: string;
  expiresAt: string;
  status: string;
}

export function SubscriptionBadges() {
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
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
        const hasPaid = accessPeriods.some(period => period.tierId !== '1hour');
        setHasPremium(hasPaid);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {hasPremium ? (
        <Badge variant="default" className="flex items-center gap-1.5 px-2 md:px-3 py-1">
          <Zap className="h-3 w-3" />
          <span className="text-xs font-medium">Premium</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1.5 px-2 md:px-3 py-1">
          <Clock className="h-3 w-3 opacity-60" />
          <span className="text-xs text-muted-foreground">Free Tier</span>
        </Badge>
      )}
    </div>
  );
}
