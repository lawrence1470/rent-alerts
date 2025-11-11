"use client";

import { Label } from "@/components/ui/label";
import { AlertFormData } from "../types";
import { Clock, Zap, Timer, Lock, MessageSquare, ExternalLink } from "lucide-react";
import { Checkbox } from "@headlessui/react";
import { CheckCircleIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
    pricePerWeek: 0, // Free tier
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
    '1hour': true, // Always available (free)
  });

  // Check user's active access tiers
  useEffect(() => {
    if (user) {
      fetch('/api/user/access')
        .then(res => res.json())
        .then(data => {
          setHasActiveAccess({
            '15min': data.activeTiers?.includes('15min') || false,
            '30min': data.activeTiers?.includes('30min') || false,
            '1hour': true, // Always available
          });
        })
        .catch(() => {
          // Default to free tier only on error
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
    <div className="space-y-8 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Notification Frequency</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Choose how often you'd like us to check for new listings that match your criteria.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-shrink-0"
        >
          <Link href="/subscriptions" target="_blank" className="flex items-center gap-1.5">
            View Pricing
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Frequency Options */}
      <div className="space-y-3">
        {FREQUENCY_OPTIONS.map((option) => {
          const isSelected = formData.preferredFrequency === option.value;
          const hasAccess = hasActiveAccess[option.value];
          const isLocked = option.requiresPayment && !hasAccess;

          return (
            <div key={option.value} className="relative">
              <Checkbox
                checked={isSelected}
                onChange={() => {
                  if (!isLocked) {
                    handleFrequencyChange(option.value);
                  }
                }}
                disabled={isLocked}
                className={`
                  group relative flex cursor-pointer rounded-lg border bg-card px-5 py-4 shadow-sm transition
                  focus:outline-none
                  data-checked:border-primary data-checked:bg-primary/5
                  ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`
                      mt-0.5
                      ${isSelected ? 'text-primary' : 'text-muted-foreground'}
                      ${isLocked ? 'text-muted-foreground/50' : ''}
                    `}>
                      {option.icon}
                    </div>

                    <div className="text-sm flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">
                          {option.label}
                        </p>
                        {isLocked && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {option.pricePerWeek > 0 && (
                          <span className="text-xs font-medium text-primary">
                            ${option.pricePerWeek}/week
                          </span>
                        )}
                        {option.pricePerWeek === 0 && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            Free
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-1">
                        {option.description}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Up to {option.checksPerDay} checks per day
                      </p>

                      {option.value === '1hour' && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Email notifications only
                        </p>
                      )}

                      {option.requiresPayment && !isLocked && isSelected && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`sms-${option.value}`} className="text-sm font-normal cursor-pointer">
                                Enable SMS notifications
                              </Label>
                            </div>
                            <Switch
                              id={`sms-${option.value}`}
                              checked={formData.enablePhoneNotifications}
                              onCheckedChange={(checked) => {
                                updateFormData({ enablePhoneNotifications: checked });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            Get instant text alerts when new listings match
                          </p>
                        </div>
                      )}

                      {isLocked && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          Purchase {option.label.toLowerCase()} access to use this frequency
                        </p>
                      )}
                    </div>
                  </div>

                  {!isLocked && (
                    <CheckCircleIcon
                      className={`
                        h-6 w-6 text-primary flex-shrink-0 transition
                        ${isSelected ? 'opacity-100' : 'opacity-0'}
                      `}
                    />
                  )}
                </div>
              </Checkbox>
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
