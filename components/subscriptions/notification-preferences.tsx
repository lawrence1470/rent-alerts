"use client";

import { Card, Badge } from "@mantine/core";
import { Mail, Smartphone, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NotificationPrefsData {
  emailEnabled: boolean;
  smsEnabled: boolean;
  smsAvailable: boolean;
}

interface NotificationPreferencesProps {
  prefs: NotificationPrefsData;
}

export function NotificationPreferences({
  prefs,
}: NotificationPreferencesProps) {
  return (
    <Card className="rounded-xl" padding="lg">
      <h3 className="text-sm font-semibold mb-4">Notification Types</h3>

      <div className="space-y-4">
        {/* Email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">
                Receive alerts via email
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-xs font-medium">Included</span>
          </div>
        </div>

        {/* SMS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              prefs.smsAvailable ? "bg-muted" : "bg-muted/50"
            )}>
              <Smartphone className={cn(
                "h-4 w-4",
                prefs.smsAvailable ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-sm font-medium",
                  !prefs.smsAvailable && "text-muted-foreground"
                )}>
                  SMS
                </p>
                {!prefs.smsAvailable && (
                  <Badge color="gray" variant="light" size="xs">
                    Paid Plan
                  </Badge>
                )}
              </div>
              <p className={cn(
                "text-xs",
                prefs.smsAvailable ? "text-muted-foreground" : "text-muted-foreground/60"
              )}>
                {prefs.smsAvailable
                  ? "Receive text message alerts"
                  : "Available with Hourly + SMS plan"
                }
              </p>
            </div>
          </div>
          {prefs.smsAvailable ? (
            <div className="flex items-center gap-1.5 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-xs font-medium">Included</span>
            </div>
          ) : (
            <Link
              href="/pricing"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
