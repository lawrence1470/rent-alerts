"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { TextInput, Switch, Badge } from "@mantine/core";
import { AlertFormData } from "../types";
import { Mail, Phone, AlertCircle, Crown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

type StepNotificationMethodsProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
  userHasPhone: boolean;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
};

export function StepNotificationMethods({
  formData,
  updateFormData,
  userHasPhone,
  phoneNumber,
  onPhoneChange,
}: StepNotificationMethodsProps) {
  const { user } = useUser();
  const [isPremium, setIsPremium] = useState(false);

  // Check if user has premium access (any paid tier)
  useEffect(() => {
    if (user) {
      fetch('/api/user/access')
        .then(res => res.json())
        .then(data => {
          // User is premium if they have 15min or 30min tier
          const hasPremiumTier = data.activeTiers?.includes('15min') || data.activeTiers?.includes('30min');
          setIsPremium(hasPremiumTier);

          // If not premium, ensure phone notifications are disabled
          if (!hasPremiumTier && formData.enablePhoneNotifications) {
            updateFormData({ enablePhoneNotifications: false });
          }
        })
        .catch(() => {
          setIsPremium(false);
          // On error, disable phone notifications to be safe
          if (formData.enablePhoneNotifications) {
            updateFormData({ enablePhoneNotifications: false });
          }
        });
    }
  }, [user]);
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");

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

  // Only show phone input if premium user has SMS enabled and needs to provide phone
  const needsPhoneNumber = isPremium && formData.enablePhoneNotifications && !userHasPhone;
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length === 10;

  // For non-premium users, only email counts as a notification method
  const hasNoNotificationMethod = isPremium
    ? !formData.enableEmailNotifications && !formData.enablePhoneNotifications
    : !formData.enableEmailNotifications;

  const toggleEmailNotifications = (checked: boolean) => {
    updateFormData({ enableEmailNotifications: checked });
  };

  const togglePhoneNotifications = (checked: boolean) => {
    // Only allow toggling for premium users
    if (isPremium) {
      updateFormData({ enablePhoneNotifications: checked });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">How do you want to be notified?</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to receive alerts when new listings match your criteria.
        </p>
      </div>

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
            onChange={(e) => toggleEmailNotifications(e.currentTarget.checked)}
            className="flex-shrink-0 ml-4"
            aria-labelledby="email-label"
            aria-describedby="email-description"
          />
        </div>

        {/* Phone Notifications */}
        <div className={`rounded-lg border bg-card px-5 py-4 shadow-sm transition-all ${
          !isPremium ? 'border-dashed border-muted-foreground/30 bg-muted/30' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`mt-0.5 ${!isPremium ? 'opacity-50' : ''}`}>
                <Phone className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="text-sm flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`font-semibold ${!isPremium ? 'text-muted-foreground' : 'text-foreground'}`} id="sms-label">
                    SMS Notifications
                  </p>
                  {!isPremium && (
                    <Badge
                      size="xs"
                      variant="light"
                      color="violet"
                      leftSection={<Crown className="h-3 w-3" />}
                    >
                      Premium
                    </Badge>
                  )}
                </div>
                <p className={`${!isPremium ? 'text-muted-foreground/70' : 'text-muted-foreground'}`} id="sms-description">
                  Get instant text alerts when new listings match your criteria.
                </p>
                {!isPremium && (
                  <Link
                    href="/subscriptions"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Crown className="h-3 w-3" />
                    Upgrade to unlock SMS
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
            <Switch
              checked={isPremium ? formData.enablePhoneNotifications : false}
              onChange={(e) => togglePhoneNotifications(e.currentTarget.checked)}
              className="flex-shrink-0 ml-4"
              aria-labelledby="sms-label"
              aria-describedby="sms-description"
              disabled={!isPremium}
            />
          </div>
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
              </div>

              <TextInput
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
