"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import { AlertFormData } from "../types";

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
        <div className="space-y-3 p-4 rounded-lg border bg-card">
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
