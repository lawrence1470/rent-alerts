"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface AlertCountdownProps {
  lastChecked: Date | null;
  preferredFrequency: "15min" | "30min" | "1hour" | "1hour-sms";
  isActive: boolean;
}

export function AlertCountdown({
  lastChecked,
  preferredFrequency,
  isActive,
}: AlertCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    // Only show countdown for active alerts
    if (!isActive) return;

    const calculateNextCheck = (): Date => {
      const now = new Date();
      const nextCheck = new Date(now);

      // Get frequency interval in minutes
      const intervalMinutes = {
        "15min": 15,
        "30min": 30,
        "1hour": 60,
        "1hour-sms": 60,
      }[preferredFrequency];

      // Calculate next scheduled check based on frequency
      const currentMinute = now.getMinutes();
      let nextMinute = 0;

      if (intervalMinutes === 15) {
        // Next :00, :15, :30, or :45
        nextMinute = Math.ceil(currentMinute / 15) * 15;
      } else if (intervalMinutes === 30) {
        // Next :00 or :30
        nextMinute = Math.ceil(currentMinute / 30) * 30;
      } else {
        // Next :00 (top of hour)
        nextMinute = 60;
      }

      if (nextMinute === 60) {
        nextCheck.setHours(nextCheck.getHours() + 1);
        nextCheck.setMinutes(0);
      } else {
        nextCheck.setMinutes(nextMinute);
      }

      nextCheck.setSeconds(0);
      nextCheck.setMilliseconds(0);

      return nextCheck;
    };

    const updateCountdown = () => {
      const now = new Date();
      const nextCheck = calculateNextCheck();
      const diff = nextCheck.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Checking now...");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (!lastChecked) {
        // Show time until first check
        if (minutes > 0) {
          setTimeRemaining(`First check in ${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`First check in ${seconds}s`);
        }
        return;
      }

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [lastChecked, preferredFrequency, isActive]);

  // Don't render for inactive alerts
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Clock className="h-3 w-3" />
      <span className="font-medium">{timeRemaining}</span>
    </div>
  );
}
