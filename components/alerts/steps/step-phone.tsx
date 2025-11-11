"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

type StepPhoneProps = {
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
};

export function StepPhone({ phoneNumber, onPhoneChange }: StepPhoneProps) {
  const [error, setError] = useState<string>("");

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Limit to 10 digits
    const limited = digits.slice(0, 10);

    // Format as (XXX) XXX-XXXX
    if (limited.length === 0) return "";
    if (limited.length <= 3) return `(${limited}`;
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onPhoneChange(formatted);

    // Validate phone number
    const digits = formatted.replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 10) {
      setError("Please enter a complete 10-digit phone number");
    } else {
      setError("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Phone Number for SMS Notifications
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get instant text alerts when new listings match your criteria. You can skip this step to receive email notifications only.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phoneNumber}
          onChange={handleChange}
          className={error ? "border-destructive" : ""}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Standard text messaging rates may apply
        </p>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-muted-foreground/20">
        <h4 className="text-sm font-medium mb-2">Why provide your phone number?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Get instant SMS notifications when new listings appear</li>
          <li>• Never miss a rental opportunity with real-time alerts</li>
          <li>• Skip this to receive email notifications only</li>
          <li>• You can add or update your number later in settings</li>
        </ul>
      </div>
    </div>
  );
}
