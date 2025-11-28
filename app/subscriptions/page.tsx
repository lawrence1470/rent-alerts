"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SubscriptionDashboard } from "@/components/subscriptions/subscription-dashboard";

export default function SubscriptionsPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1.5">
          Manage your plan and notification preferences
        </p>
      </div>

      {/* Subscription Dashboard */}
      <SubscriptionDashboard />
    </DashboardLayout>
  );
}
