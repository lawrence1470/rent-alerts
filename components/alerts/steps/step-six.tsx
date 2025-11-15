"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Info, Building2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { AlertFormData } from "../types";
import { motion, AnimatePresence } from "motion/react";

type StepSixProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepSix({ formData, updateFormData }: StepSixProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Additional Options</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Optional: Enable advanced features for your rental search.
        </p>
      </div>

      <div className="space-y-4">
        {/* Rent Stabilization Check */}
        <div className="space-y-3">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="rent-stabilized"
                  className="text-sm cursor-pointer leading-none"
                >
                  Check if rent stabilized
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Learn more about rent stabilization check"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        How Rent Stabilization Check Works
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        We&apos;ll estimate rent stabilization status based on NYC
                        building data. Results show probability percentages to help
                        you make informed decisions.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Switch
                id="rent-stabilized"
                checked={formData.filterRentStabilized}
                onCheckedChange={(checked) =>
                  updateFormData({ filterRentStabilized: checked })
                }
              />
            </div>
          </div>

          {/* Example Preview when enabled */}
          <AnimatePresence>
            {formData.filterRentStabilized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">Example: How it looks in notifications</span>
                  </div>

                  <div className="space-y-2">
                    {/* High probability example */}
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-foreground">123 Main St, Apt 4B</span>
                        <Badge variant="secondary" className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                          85% Likely Rent Stabilized
                        </Badge>
                      </div>
                    </div>

                    {/* Medium probability example */}
                    <div className="flex items-start gap-2 text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-foreground">456 Park Ave, Apt 2C</span>
                        <Badge variant="secondary" className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs">
                          45% Possibly Stabilized
                        </Badge>
                      </div>
                    </div>

                    {/* Low probability example */}
                    <div className="flex items-start gap-2 text-xs">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-foreground">789 Broadway, Apt 10A</span>
                        <Badge variant="secondary" className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                          15% Unlikely Stabilized
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic pt-2 border-t">
                    Estimates are based on building age, size, and NYC housing data. Always verify with the landlord.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notify Only on New Apartments */}
        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label
                htmlFor="notify-new-only"
                className="text-sm cursor-pointer leading-none"
              >
                Only notify when new apartments are found
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Learn more about new apartment notifications"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      Smart Notification Control
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      <strong>Enabled (Recommended):</strong> You&apos;ll only receive notifications when we find apartments you haven&apos;t seen before. This prevents duplicate notifications.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Disabled:</strong> You&apos;ll receive notifications on every check cycle, even if no new apartments are found. This may result in frequent notifications without new results.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Switch
              id="notify-new-only"
              checked={formData.notifyOnlyNewApartments ?? true}
              onCheckedChange={(checked) =>
                updateFormData({ notifyOnlyNewApartments: checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
