"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatefulButton, useStatefulButton } from "@/components/ui/stateful-button";
import { StepOne } from "./steps/step-one";
import { StepTwo } from "./steps/step-two";
import { StepThree } from "./steps/step-three";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type AlertFormData = {
  name: string;
  areas: string; // comma-separated
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  maxBeds: number | null;
  minBaths: number | null;
  noFee: boolean;
  filterRentStabilized: boolean;
};

type CreateAlertWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateAlertWizard({ open, onOpenChange }: CreateAlertWizardProps) {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { state: buttonState, setLoading, setSuccess, setError, reset } = useStatefulButton(2000);

  const [formData, setFormData] = useState<AlertFormData>({
    name: "",
    areas: "",
    minPrice: null,
    maxPrice: null,
    minBeds: null,
    maxBeds: null,
    minBaths: null,
    noFee: false,
    filterRentStabilized: false,
  });

  const updateFormData = (data: Partial<AlertFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading();

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create alert");
      }

      const data = await response.json();

      setSuccess();

      toast.success("Alert created!", {
        description: `"${formData.name}" will notify you of new listings.`,
      });

      // Wait a moment to show success state before closing
      setTimeout(() => {
        // Reset form and close dialog
        setFormData({
          name: "",
          areas: "",
          minPrice: null,
          maxPrice: null,
          minBeds: null,
          maxBeds: null,
          minBaths: null,
          noFee: false,
          filterRentStabilized: false,
        });
        setStep(1);
        reset(); // Reset button state
        onOpenChange(false);

        // Refresh the page to show new alert
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error creating alert:", error);
      setError();
      toast.error("Error", {
        description: "Failed to create alert. Please try again.",
      });
    }
  };

  const canGoNext = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.areas.length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Create Rental Alert - Step {step} of 3
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <StepOne formData={formData} updateFormData={updateFormData} />
          )}
          {step === 2 && (
            <StepTwo formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <StepThree formData={formData} updateFormData={updateFormData} />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={step === 1 ? () => onOpenChange(false) : handleBack}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              Next
            </Button>
          ) : (
            <StatefulButton
              onClick={handleSubmit}
              state={buttonState}
              loadingText="Creating..."
              successText="Created!"
              errorText="Failed"
              autoResetDelay={2000}
            >
              Create Alert
            </StatefulButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
