"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { SubscriptionOverview } from "@/components/subscriptions/subscription-overview";

export default function SubscriptionsPage() {
  return (
    <DashboardLayout>
      {/* Upgrade Banner */}
      <UpgradeBanner />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground mt-1.5">
          Manage your notification frequency plans
        </p>
      </div>

      {/* Subscription Overview */}
      <SubscriptionOverview />
    </DashboardLayout>
  );
}
