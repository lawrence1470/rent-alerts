"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertFormData } from "../create-alert-wizard";

type StepOneProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepOne({ formData, updateFormData }: StepOneProps) {
  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Name Your Alert</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Give your rental alert a memorable name to help you identify it later.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alert-name">Alert Name *</Label>
        <Input
          id="alert-name"
          placeholder="e.g., East Village 2BR under $3K"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="text-base"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Examples: "Williamsburg Studio", "UES 1BR No Fee", "Chelsea Under $3500"
        </p>
      </div>

      {/* Preview section */}
      {formData.name && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm font-medium mb-1">Preview:</p>
          <p className="text-lg font-semibold text-foreground">{formData.name}</p>
        </div>
      )}
    </div>
  );
}
