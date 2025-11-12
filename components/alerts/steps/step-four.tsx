"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertFormData } from "../types";
import { Clock, Zap, Timer, Lock, Bell, Mail, Phone, AlertCircle, ExternalLink } from "lucide-react";
import { Checkbox } from "@headlessui/react";
import { CheckCircleIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

type StepFourProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
  userHasPhone: boolean;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
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

export function StepFour({
  formData,
  updateFormData,
  userHasPhone,
  phoneNumber,
  onPhoneChange
}: StepFourProps) {
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
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onPhoneChange(formatted);
  };

  const needsPhoneNumber = formData.enablePhoneNotifications && !userHasPhone;
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length === 10;

  // Check if at least one notification method is enabled
  const hasNoNotificationMethod = !formData.enableEmailNotifications && !formData.enablePhoneNotifications;

  const toggleEmailNotifications = (checked: boolean) => {
    updateFormData({ enableEmailNotifications: checked });
  };

  const togglePhoneNotifications = (checked: boolean) => {
    updateFormData({ enablePhoneNotifications: checked });
  };

  const handleFrequencyChange = (frequency: '15min' | '30min' | '1hour') => {
    updateFormData({ preferredFrequency: frequency });
  };

  return (
    <div className="space-y-8 py-4">
      {/* Notification Frequency Section */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Notification Frequency</h3>
            <p className="text-sm text-muted-foreground">
              Choose how often you'd like us to check for new listings.
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
        <div className="space-y-3 mb-8">
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
      </div>

      {/* Notification Methods Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Methods</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how you'd like to be notified about new listings.
        </p>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between rounded-lg border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3 flex-1">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Email Notifications</p>
                <p className="text-muted-foreground">
                  Receive listing alerts via email. We'll send you a summary of new matches.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.enableEmailNotifications}
              onCheckedChange={toggleEmailNotifications}
              className="flex-shrink-0 ml-4"
            />
          </div>

          {/* Phone Notifications */}
          <div className="flex items-center justify-between rounded-lg border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3 flex-1">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">SMS Notifications</p>
                <p className="text-muted-foreground">
                  Get instant text alerts when new listings match your criteria.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.enablePhoneNotifications}
              onCheckedChange={togglePhoneNotifications}
              className="flex-shrink-0 ml-4"
            />
          </div>

          {/* Warning - only show if no method is selected */}
          {hasNoNotificationMethod && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                At least one notification method must be enabled
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Conditional Phone Number Collection */}
      <AnimatePresence>
        {needsPhoneNumber && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Phone Number Required</h4>
            </div>

            <p className="text-sm text-muted-foreground">
              We need your phone number to send you SMS notifications.
            </p>

            <div className="space-y-2">
              <Label htmlFor="phone-number">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={14}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                US phone numbers only. Standard messaging rates may apply.
              </p>
              {phoneNumber && !isPhoneValid && (
                <p className="text-xs text-destructive">
                  Please enter a valid 10-digit phone number
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> You can change these preferences anytime from your alert settings.
          We'll only send notifications for new listings that match your criteria.
        </p>
      </div>
    </div>
  );
}
