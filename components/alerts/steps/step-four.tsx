"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertFormData } from "../types";
import { Clock, Zap, Timer, Lock, Bell, Mail, Phone, AlertCircle, ExternalLink, CheckCircleIcon } from "lucide-react";
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
  value: '15min' | '30min' | '1hour' | '1hour-sms';
  label: string;
  description: string;
  pricePerWeek: number;
  checksPerDay: number;
  icon: React.ReactNode;
  requiresPayment: boolean;
  isRecommended?: boolean;
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
    value: '1hour-sms',
    label: 'Hourly Checks + SMS',
    description: 'Check every hour with SMS notifications',
    pricePerWeek: 5,
    checksPerDay: 24,
    icon: <Bell className="h-5 w-5" />,
    requiresPayment: true,
  },
  {
    value: '30min',
    label: '30-Minute Checks',
    description: 'Check for new listings every 30 minutes',
    pricePerWeek: 15,
    checksPerDay: 48,
    icon: <Timer className="h-5 w-5" />,
    requiresPayment: true,
    isRecommended: true,
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
    '1hour-sms': false,
    '1hour': true,
  });

  useEffect(() => {
    if (user) {
      fetch('/api/user/access')
        .then(res => res.json())
        .then(data => {
          const newAccessState = {
            '15min': data.activeTiers?.includes('15min') || false,
            '30min': data.activeTiers?.includes('30min') || false,
            '1hour-sms': data.activeTiers?.includes('1hour-sms') || false,
            '1hour': true,
          };
          setHasActiveAccess(newAccessState);

          // Set default phone notifications based on premium access
          // Only enable if user has SMS-capable tier
          const hasSMSTier = newAccessState['1hour-sms'] || newAccessState['30min'] || newAccessState['15min'];
          if (formData.enablePhoneNotifications === undefined) {
            updateFormData({ enablePhoneNotifications: hasSMSTier });
          }
        })
        .catch(() => {
          setHasActiveAccess({
            '15min': false,
            '30min': false,
            '1hour-sms': false,
            '1hour': true,
          });
          // Default to off for non-premium users
          if (formData.enablePhoneNotifications === undefined) {
            updateFormData({ enablePhoneNotifications: false });
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleFrequencyChange = (frequency: '15min' | '30min' | '1hour' | '1hour-sms') => {
    updateFormData({ preferredFrequency: frequency });
  };

  // Keyboard navigation for frequency options
  const handleKeyDown = (e: React.KeyboardEvent, currentValue: string) => {
    const options = FREQUENCY_OPTIONS.map(opt => opt.value);
    const currentIndex = options.indexOf(currentValue as typeof options[0]);

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      handleFrequencyChange(options[nextIndex] as '15min' | '30min' | '1hour' | '1hour-sms');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      handleFrequencyChange(options[prevIndex] as '15min' | '30min' | '1hour' | '1hour-sms');
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Notification Frequency Section */}
      <div>
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold">Notification Frequency</h3>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <Link href="/subscriptions" className="flex items-center gap-1.5">
                View Pricing
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose how often you'd like us to check for new listings. Upgrade anytime for faster checks and SMS notifications.
          </p>
        </div>

        {/* Frequency Options - Segmented Control */}
        <div className="space-y-4 mb-8">
          {/* Button Group */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="radiogroup" aria-label="Notification frequency options">
            {FREQUENCY_OPTIONS.map((option) => {
              const isSelected = formData.preferredFrequency === option.value;
              const hasAccess = hasActiveAccess[option.value];
              const needsUpgrade = option.requiresPayment && !hasAccess;
              const dailyCost = option.pricePerWeek / 7;

              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleFrequencyChange(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  role="radio"
                  tabIndex={isSelected ? 0 : -1}
                  aria-checked={isSelected}
                  aria-label={`${option.label}, ${option.pricePerWeek === 0 ? 'Free' : `$${option.pricePerWeek} per week`}${needsUpgrade ? ', upgrade required' : ''}${option.isRecommended ? ', most popular' : ''}`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    group relative flex flex-col items-center p-6 rounded-xl border-2 transition-all cursor-pointer overflow-hidden
                    ${isSelected
                      ? 'border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                    }
                  `}
                >
                  {/* Most Popular Badge - Top Left */}
                  {option.isRecommended && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-3 left-3 z-20"
                    >
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        MOST POPULAR
                      </div>
                    </motion.div>
                  )}

                  {/* Background Gradient Effect */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                  )}

                  {/* Icon with larger size and better spacing */}
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className={`
                      relative mb-4 p-3 rounded-full transition-all
                      ${isSelected
                        ? 'bg-primary/10 text-primary scale-110'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary'
                      }
                    `}
                  >
                    {option.icon}
                  </motion.div>

                  {/* Label with better typography */}
                  <div className="text-sm font-bold text-center mb-2 relative z-10">
                    {option.label}
                  </div>

                  {/* Price Badge with better contrast */}
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-bold mb-1 relative z-10 transition-colors
                    ${option.pricePerWeek === 0
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                      : 'bg-primary/10 text-primary border border-primary/20'
                    }
                  `}>
                    {option.pricePerWeek === 0 ? 'Free' : `$${option.pricePerWeek}/wk`}
                  </div>

                  {/* Daily Cost - Value Anchoring */}
                  {option.pricePerWeek > 0 && (
                    <div className="text-[10px] text-muted-foreground relative z-10">
                      Only ${dailyCost.toFixed(2)}/day
                    </div>
                  )}

                  {/* Upgrade Badge - Top Right */}
                  {needsUpgrade && (
                    <div className="absolute top-3 right-3 z-20">
                      <div className="bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full p-1.5 shadow-sm">
                        <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  )}

                  {/* Selected Indicator - Top Right */}
                  {isSelected && !needsUpgrade && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 z-20"
                    >
                      <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full p-1">
                        <CheckCircleIcon className="h-4 w-4 text-primary" />
                      </div>
                    </motion.div>
                  )}

                  {/* Bottom shine effect for selected state */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Details for Selected Option */}
          {formData.preferredFrequency && (() => {
            const selectedOption = FREQUENCY_OPTIONS.find(opt => opt.value === formData.preferredFrequency);
            const needsUpgrade = !hasActiveAccess[formData.preferredFrequency] && formData.preferredFrequency !== '1hour';

            return (
              <div className={`p-4 rounded-lg border ${
                needsUpgrade
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-muted/50 border-border'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground">
                    {selectedOption?.icon}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">
                      {selectedOption?.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Up to {selectedOption?.checksPerDay} checks per day
                      </span>
                      {formData.preferredFrequency === '1hour' && (
                        <span className="text-blue-600 dark:text-blue-400">
                          • Email notifications only
                        </span>
                      )}
                      {(formData.preferredFrequency === '1hour-sms' || formData.preferredFrequency === '30min' || formData.preferredFrequency === '15min') && (
                        <span className="text-green-600 dark:text-green-400">
                          • Email + SMS notifications
                        </span>
                      )}
                    </div>
                    {needsUpgrade && (
                      <div className="mt-3 pt-3 border-t border-amber-500/20">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                              Upgrade Required
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              You can create this alert, but it will be inactive until you subscribe to {selectedOption?.label}
                            </p>
                          </div>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0 border-amber-500/30 hover:bg-amber-500/10"
                          >
                            <Link href="/subscriptions">
                              Upgrade
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Notification Methods Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Methods</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how you'd like to be notified about new listings.
        </p>

        <div className="space-y-4" role="group" aria-label="Notification methods">
          {/* Email Notifications */}
          <div className="flex items-center justify-between rounded-lg border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3 flex-1">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-foreground" id="email-label">Email Notifications</p>
                <p className="text-muted-foreground" id="email-description">
                  Receive listing alerts via email. We'll send you a summary of new matches.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.enableEmailNotifications}
              onCheckedChange={toggleEmailNotifications}
              className="flex-shrink-0 ml-4"
              aria-labelledby="email-label"
              aria-describedby="email-description"
            />
          </div>

          {/* Phone Notifications */}
          <div className={`rounded-lg border px-5 py-4 shadow-sm ${
            formData.enablePhoneNotifications && formData.preferredFrequency === '1hour'
              ? 'border-amber-500/20 bg-amber-500/5'
              : 'bg-card'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground" id="sms-label">SMS Notifications</p>
                    {formData.preferredFrequency === '1hour' && (
                      <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-muted-foreground" id="sms-description">
                    Get instant text alerts when new listings match your criteria.
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.enablePhoneNotifications}
                onCheckedChange={togglePhoneNotifications}
                className="flex-shrink-0 ml-4"
                aria-labelledby="sms-label"
                aria-describedby="sms-description"
              />
            </div>

            {/* Inline Premium Warning */}
            {formData.enablePhoneNotifications && formData.preferredFrequency === '1hour' && (
              <div className="pt-3 border-t border-amber-500/20">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Premium Feature Required
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                      SMS notifications require Hourly + SMS, 30-Minute, or 15-Minute tier. Select a premium tier above to enable SMS alerts.
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 text-xs border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <Link href="/subscriptions">
                      Upgrade
                    </Link>
                  </Button>
                </div>
              </div>
            )}
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
            className="p-4 rounded-lg border bg-card"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="phone-number" className="font-medium mb-0">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                {formData.preferredFrequency === '1hour' && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                )}
              </div>

              {formData.preferredFrequency === '1hour' && (
                <p className="text-xs text-muted-foreground">
                  Premium tier required for SMS. You can save your number now and{" "}
                  <Link href="/subscriptions" className="underline hover:text-foreground">
                    upgrade later
                  </Link>.
                </p>
              )}

              <Input
                id="phone-number"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={14}
              />

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
