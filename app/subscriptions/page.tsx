"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SubscriptionDashboard } from "@/components/subscriptions/subscription-dashboard";
import { Zap, X } from "lucide-react";
import Link from "next/link";

export default function SubscriptionsPage() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/user/access');
        if (response.ok) {
          const data = await response.json();
          const hasPremium = data.accessPeriods?.some(
            (p: { tierId: string }) => p.tierId !== '1hour'
          );
          setShowBanner(!hasPremium);
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    }
    checkAccess();
  }, []);

  return (
    <DashboardLayout>
      {/* Upgrade Banner - only for free users */}
      {showBanner && !dismissed && (
        <div className="mb-6 relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Upgrade to Premium</p>
                <p className="text-sm text-white/80">Get 4x faster alerts and never miss a listing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="px-4 py-2 bg-white text-amber-600 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
              >
                View Plans
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
