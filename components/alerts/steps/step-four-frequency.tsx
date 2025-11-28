"use client";

import { AlertFormData } from "../types";
import { Clock, Zap, Timer, Crown, ExternalLink, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@mantine/core";
import Link from "next/link";

type StepFourFrequencyProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

type FrequencyOption = {
  value: '15min' | '30min' | '1hour';
  label: string;
  description: string;
  pricePerWeek: number;
  checksPerDay: number;
  icon: React.ReactNode;
  requiresPayment: boolean;
};

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    value: '1hour',
    label: 'Hourly Checks',
    description: 'Check for new listings every hour',
    pricePerWeek: 0,
    checksPerDay: 24,
    icon: <Clock className="h-5 w-5" />,
    requiresPayment: false,
  },
  {
    value: '30min',
    label: '30-Minute Checks',
    description: 'Check for new listings every 30 minutes',
    pricePerWeek: 15,
    checksPerDay: 48,
    icon: <Timer className="h-5 w-5" />,
    requiresPayment: true,
  },
  {
    value: '15min',
    label: '15-Minute Checks',
    description: 'Check for new listings every 15 minutes',
    pricePerWeek: 20,
    checksPerDay: 96,
    icon: <Zap className="h-5 w-5" />,
    requiresPayment: true,
  },
];

export function StepFourFrequency({ formData, updateFormData }: StepFourFrequencyProps) {
  const { user } = useUser();
  const [hasActiveAccess, setHasActiveAccess] = useState<Record<string, boolean>>({
    '15min': false,
    '30min': false,
    '1hour': true,
  });

  useEffect(() => {
    if (user) {
      fetch('/api/user/access')
        .then(res => res.json())
        .then(data => {
          setHasActiveAccess({
            '15min': data.activeTiers?.includes('15min') || false,
            '30min': data.activeTiers?.includes('30min') || false,
            '1hour': true,
          });
        })
        .catch(() => {
          setHasActiveAccess({
            '15min': false,
            '30min': false,
            '1hour': true,
          });
        });
    }
  }, [user]);

  const handleFrequencyChange = (frequency: '15min' | '30min' | '1hour') => {
    updateFormData({ preferredFrequency: frequency });
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">How often should we check?</h3>
        <p className="text-sm text-muted-foreground">
          Choose how frequently you'd like us to scan for new listings that match your criteria.
        </p>
      </div>

      <div className="space-y-4" role="radiogroup" aria-label="Notification frequency">
        {FREQUENCY_OPTIONS.map((option) => {
          const isSelected = formData.preferredFrequency === option.value;
          const hasAccess = hasActiveAccess[option.value];
          const isLocked = option.requiresPayment && !hasAccess;

          return (
            <div
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isLocked}
              tabIndex={isLocked ? -1 : 0}
              onClick={() => !isLocked && handleFrequencyChange(option.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isLocked) {
                  e.preventDefault();
                  handleFrequencyChange(option.value);
                }
              }}
              className={`
                relative rounded-lg border bg-card px-5 py-4 shadow-sm transition-all
                ${isLocked
                  ? 'border-dashed border-muted-foreground/30 bg-muted/30 cursor-not-allowed'
                  : 'cursor-pointer hover:border-primary/50'
                }
                ${isSelected && !isLocked ? 'border-primary ring-1 ring-primary' : 'border-border'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 ${isLocked ? 'opacity-50' : ''}`}>
                    <div className={isSelected && !isLocked ? 'text-primary' : 'text-muted-foreground'}>
                      {option.icon}
                    </div>
                  </div>

                  <div className="text-sm flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`font-semibold ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {option.label}
                      </p>
                      {option.pricePerWeek === 0 ? (
                        <Badge size="xs" variant="light" color="green">
                          Free
                        </Badge>
                      ) : isLocked ? (
                        <Badge
                          size="xs"
                          variant="light"
                          color="violet"
                          leftSection={<Crown className="h-3 w-3" />}
                        >
                          ${option.pricePerWeek}/week
                        </Badge>
                      ) : (
                        <Badge size="xs" variant="light" color="blue">
                          ${option.pricePerWeek}/week
                        </Badge>
                      )}
                    </div>

                    <p className={isLocked ? 'text-muted-foreground/70' : 'text-muted-foreground'}>
                      {option.description}
                    </p>

                    <p className={`text-xs mt-1 ${isLocked ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                      Up to {option.checksPerDay} checks per day
                    </p>

                    {option.value === '1hour' && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Email notifications only
                      </p>
                    )}

                    {option.requiresPayment && hasAccess && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ You have access to this tier
                      </p>
                    )}

                    {isLocked && (
                      <Link
                        href="/subscriptions"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <Crown className="h-3 w-3" />
                        Upgrade to unlock
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                <div className="flex-shrink-0 ml-4">
                  {!isLocked && (
                    <div className={`
                      h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all
                      ${isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                      }
                    `}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> You can upgrade your notification frequency anytime from the pricing page.
          Your alert will automatically start using faster checks once you purchase access.
        </p>
      </div>
    </div>
  );
}
