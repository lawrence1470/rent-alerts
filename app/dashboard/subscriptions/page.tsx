/**
 * Dashboard Subscriptions Page
 *
 * Manage user subscriptions and view current plans
 */

import { SubscriptionOverview } from '@/components/subscriptions';
import { PricingCards } from '@/components/pricing/pricing-cards';

export const metadata = {
  title: 'Subscriptions - Dashboard',
  description: 'Manage your notification frequency subscriptions',
};

export default function DashboardSubscriptionsPage() {
  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <SubscriptionOverview />

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Upgrade Your Plan</h2>
        <PricingCards />
      </div>
    </div>
  );
}
