"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertFormData } from "../types";
import { Bell, Mail, Phone, AlertCircle } from "lucide-react";
import { Checkbox } from "@headlessui/react";
import { CheckCircleIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type StepFourProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
  userHasPhone: boolean;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
};

export function StepFour({
  formData,
  updateFormData,
  userHasPhone,
  phoneNumber,
  onPhoneChange
}: StepFourProps) {
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

  const toggleEmailNotifications = () => {
    updateFormData({ enableEmailNotifications: !formData.enableEmailNotifications });
  };

  const togglePhoneNotifications = () => {
    updateFormData({ enablePhoneNotifications: !formData.enablePhoneNotifications });
  };

  return (
    <div className="space-y-8 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how you'd like to be notified about new listings.
        </p>
      </div>

      {/* Notification Methods */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notification Methods
        </h4>

        {/* Email Notifications */}
        <Checkbox
          checked={formData.enableEmailNotifications}
          onChange={toggleEmailNotifications}
          className="group relative flex cursor-pointer rounded-lg border bg-card px-5 py-4 shadow-sm transition focus:outline-none data-checked:border-primary data-checked:bg-primary/5"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground group-data-checked:text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Email Notifications</p>
                <p className="text-muted-foreground">
                  Receive listing alerts via email. We'll send you a summary of new matches.
                </p>
              </div>
            </div>
            <CheckCircleIcon className="h-6 w-6 text-primary opacity-0 transition group-data-checked:opacity-100 flex-shrink-0" />
          </div>
        </Checkbox>

        {/* Phone Notifications */}
        <Checkbox
          checked={formData.enablePhoneNotifications}
          onChange={togglePhoneNotifications}
          className="group relative flex cursor-pointer rounded-lg border bg-card px-5 py-4 shadow-sm transition focus:outline-none data-checked:border-primary data-checked:bg-primary/5"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground group-data-checked:text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">SMS Notifications</p>
                <p className="text-muted-foreground">
                  Get instant text alerts when new listings match your criteria.
                </p>
              </div>
            </div>
            <CheckCircleIcon className="h-6 w-6 text-primary opacity-0 transition group-data-checked:opacity-100 flex-shrink-0" />
          </div>
        </Checkbox>

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
