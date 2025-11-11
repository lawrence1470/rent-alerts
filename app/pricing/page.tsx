/**
 * Pricing Page
 *
 * Displays the three notification frequency tiers with pricing
 * Allows users to purchase access to faster notification frequencies
 */

import { PricingCards } from '@/components/pricing/pricing-cards';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Pricing - Rental Notifications',
  description: 'Choose your notification frequency tier',
};

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <SignedOut>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Choose Your Notification Speed
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Get notified faster when new rental listings match your criteria.
            The faster you're notified, the better your chances of securing your dream apartment.
          </p>
        </div>
      </SignedOut>

      {/* Pricing Cards */}
      <PricingCards />

      {/* FAQ Link */}
      <div className="mt-16 mb-8 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer group hover:scale-105"
        >
          <HelpCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium underline-offset-4 group-hover:underline">Have questions? Check out our FAQ</span>
        </Link>
      </div>
    </div>
  );
}
