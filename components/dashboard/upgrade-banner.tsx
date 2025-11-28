"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button, ActionIcon, Paper } from "@mantine/core";
import { Sparkles, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

const BANNER_DISMISSED_KEY = 'upgrade-banner-dismissed';

interface AccessPeriod {
  tierId: string;
  tierName: string;
  expiresAt: string;
  status: string;
}

export function UpgradeBanner() {
  const pathname = usePathname();
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Routes where the banner should not appear
  const excludedRoutes = ['/pricing', '/subscriptions', '/sign-in', '/sign-up'];

  useEffect(() => {
    setMounted(true);
    checkDismissedState();
    checkPremiumStatus();
  }, []);

  async function checkPremiumStatus() {
    try {
      const response = await fetch('/api/user/access');

      if (response.ok) {
        const data = await response.json();
        const accessPeriods: AccessPeriod[] = data.accessPeriods || [];
        // Check if user has any paid tiers (not just free tier)
        const hasPaid = accessPeriods.some(period => period.tierId !== '1hour');
        setHasPremium(hasPaid);
      } else if (response.status === 401) {
        // User not signed in, treat as free tier
        setHasPremium(false);
      }
    } catch (error) {
      console.error('[UpgradeBanner] Error checking premium status:', error);
      // On error, assume free tier to show banner
      setHasPremium(false);
    } finally {
      setLoading(false);
    }
  }

  function checkDismissedState() {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed !== 'true') {
      setShow(true);
    }
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  }

  // Don't render until mounted (prevents hydration mismatch)
  // or if on excluded routes (pricing, subscriptions, auth pages)
  if (!mounted || loading || hasPremium || excludedRoutes.includes(pathname)) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
        >
          <Paper shadow="xl" radius="lg" p="md" withBorder className="bg-card">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Icon + Text */}
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    Upgrade to Premium
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get faster notifications and SMS alerts
                  </p>
                </div>
              </div>

              {/* Right: CTA + Close */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  component={Link}
                  href="/subscriptions"
                  size="sm"
                  radius="xl"
                  rightSection={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  <span className="hidden sm:inline">Upgrade Now</span>
                  <span className="sm:hidden">Upgrade</span>
                </Button>
                <ActionIcon
                  onClick={handleDismiss}
                  variant="subtle"
                  color="gray"
                  size="md"
                  aria-label="Dismiss upgrade banner"
                >
                  <X className="h-5 w-5" />
                </ActionIcon>
              </div>
            </div>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
