"use client";

import { Card, Badge, Button, Progress, RingProgress, Center, Text } from "@mantine/core";
import { Zap, Plus, Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface CurrentPlanData {
  tierId: string;
  tierName: string;
  pricePerWeek: number;
  interval: string;
  checksPerDay: number;
  expiresAt: string | null;
  daysRemaining: number | null;
  percentRemaining: number;
  status: 'active' | 'expiring-soon' | 'expired' | 'free' | 'cancelled';
  accessPeriodId: string | null;
}

interface CurrentPlanHeroProps {
  plan: CurrentPlanData;
  onCancel?: () => void;
}

function calculateMonthsAndDays(daysRemaining: number | null): { months: number; days: number; weeksRemaining: number } {
  if (daysRemaining === null || daysRemaining <= 0) {
    return { months: 0, days: 0, weeksRemaining: 0 };
  }
  const months = Math.floor(daysRemaining / 30);
  const days = daysRemaining % 30;
  const weeksRemaining = Math.ceil(daysRemaining / 7);
  return { months, days, weeksRemaining };
}

export function CurrentPlanHero({ plan }: CurrentPlanHeroProps) {
  const isFree = plan.status === 'free' || plan.tierId === '1hour';
  const isPremium = !isFree;
  const { months, days, weeksRemaining } = calculateMonthsAndDays(plan.daysRemaining);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = () => {
    if (plan.status === 'expiring-soon' || (plan.daysRemaining !== null && plan.daysRemaining <= 7)) {
      return 'red';
    }
    if (plan.daysRemaining !== null && plan.daysRemaining <= 14) {
      return 'yellow';
    }
    return 'green';
  };

  // Free tier view
  if (isFree) {
    return (
      <Card className="rounded-2xl" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">Free Plan</h2>
            <p className="text-sm text-muted-foreground">24 checks per day</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4">
          Upgrade to get 15-minute alerts (96 checks/day) and never miss a listing.
        </p>

        <Button
          component={Link}
          href="/pricing"
          fullWidth
          leftSection={<Zap className="h-4 w-4" />}
        >
          Upgrade to Premium
        </Button>
      </Card>
    );
  }

  // Premium tier view
  return (
    <Card className="rounded-2xl overflow-hidden border-2 border-amber-200 dark:border-amber-800" padding={0}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Premium Active</h2>
            <p className="text-white/80 text-sm">15-minute alerts • 96 checks/day</p>
          </div>
          <Badge
            color={getStatusColor()}
            variant="filled"
            size="lg"
            className="ml-auto"
          >
            {plan.status === 'expiring-soon' ? 'Expiring Soon' : 'Active'}
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Time remaining visualization */}
          <div className="flex-shrink-0">
            <RingProgress
              size={160}
              thickness={12}
              roundCaps
              sections={[
                { value: plan.percentRemaining, color: getStatusColor() }
              ]}
              label={
                <Center>
                  <div className="text-center">
                    {months > 0 ? (
                      <>
                        <Text size="2rem" fw={700} className="leading-none">
                          {months}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {months === 1 ? 'month' : 'months'}
                        </Text>
                        {days > 0 && (
                          <Text size="xs" c="dimmed">
                            +{days} days
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text size="2rem" fw={700} className="leading-none">
                          {plan.daysRemaining}
                        </Text>
                        <Text size="sm" c="dimmed">
                          days
                        </Text>
                      </>
                    )}
                  </div>
                </Center>
              }
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-lg font-semibold mb-1">
              {months > 0
                ? `${months} ${months === 1 ? 'Month' : 'Months'}${days > 0 ? ` and ${days} Days` : ''} Remaining`
                : `${plan.daysRemaining} Days Remaining`
              }
            </h3>

            {plan.expiresAt && (
              <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center lg:justify-start gap-2">
                <Calendar className="h-4 w-4" />
                Expires {formatDate(plan.expiresAt)}
              </p>
            )}

            {/* Progress bar */}
            <div className="mb-4">
              <Progress
                value={plan.percentRemaining}
                color={getStatusColor()}
                size="lg"
                radius="xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {plan.percentRemaining}% of subscription remaining
              </p>
            </div>

            {/* Buy more button */}
            <Button
              component={Link}
              href="/pricing"
              size="lg"
              leftSection={<Plus className="h-5 w-5" />}
              variant="filled"
              color="blue"
              fullWidth
              className="lg:w-auto"
            >
              Buy More Months
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
