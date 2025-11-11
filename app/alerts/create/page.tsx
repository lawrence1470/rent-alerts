"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatefulButton, useStatefulButton } from "@/components/ui/stateful-button";
import { StepOne } from "@/components/alerts/steps/step-one";
import { StepTwo } from "@/components/alerts/steps/step-two";
import { StepThree } from "@/components/alerts/steps/step-three";
import { StepFourFrequency } from "@/components/alerts/steps/step-four-frequency";
import { StepFive } from "@/components/alerts/steps/step-five";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AlertFormData } from "@/components/alerts/types";

const PENDING_ALERT_KEY = "pendingRentalAlert";

export default function CreateAlertPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { user } = useUser();
  const { state: buttonState, setLoading, setSuccess, setError, reset } = useStatefulButton(2000);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [needsPhone, setNeedsPhone] = useState(false);

  const [formData, setFormData] = useState<AlertFormData>({
    name: "",
    areas: "",
    minPrice: null,
    maxPrice: null,
    bedrooms: "studio",
    minBaths: 1,
    noFee: false,
    filterRentStabilized: false,
    preferredFrequency: "1hour",
    enablePhoneNotifications: true,
    enableEmailNotifications: true,
  });

  const totalSteps = 5;

  // Check if user needs to provide phone number
  useEffect(() => {
    if (user) {
      const hasPhone = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers?.length > 0;
      setNeedsPhone(!hasPhone);

      if (hasPhone) {
        const phone = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber;
        if (phone) {
          setPhoneNumber(phone);
        }
      }
    }
  }, [user]);

  // Check for pending alert on mount (when returning from sign-in)
  useEffect(() => {
    if (user) {
      const pendingAlert = localStorage.getItem(PENDING_ALERT_KEY);
      if (pendingAlert) {
        try {
          const parsedData = JSON.parse(pendingAlert);
          setFormData(parsedData);
          setStep(5);
          localStorage.removeItem(PENDING_ALERT_KEY);

          toast.info("Welcome back!", {
            description: "Let's finish setting up your notification preferences.",
          });
        } catch (error) {
          console.error("Error parsing pending alert:", error);
        }
      }
    }
  }, [user]);

  const updateFormData = (data: Partial<AlertFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleCancel = () => {
    router.push('/alerts');
  };

  const handleSubmit = async () => {
    if (!user) {
      localStorage.setItem(PENDING_ALERT_KEY, JSON.stringify(formData));

      toast.info("Sign in to complete", {
        description: "Your alert has been saved. Sign in to finish creating it.",
        action: {
          label: "Sign In",
          onClick: () => router.push("/sign-in"),
        },
      });

      router.push("/sign-in");
      return;
    }

    setLoading();

    try {
      // Save phone number if provided
      if (formData.enablePhoneNotifications && phoneNumber && phoneNumber.trim().length > 0) {
        const phoneDigits = phoneNumber.replace(/\D/g, "");

        if (phoneDigits.length === 10) {
          const phoneResponse = await fetch("/api/user/phone", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phoneNumber: phoneDigits }),
          });

          if (!phoneResponse.ok) {
            throw new Error("Failed to save phone number");
          }
        }
      }

      // Create the alert
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.setItem(PENDING_ALERT_KEY, JSON.stringify(formData));
          toast.info("Please sign in", {
            description: "Your session expired. Sign in to continue.",
          });
          router.push("/sign-in");
          return;
        }
        throw new Error("Failed to create alert");
      }

      setSuccess();

      toast.success("Alert created!", {
        description: `"${formData.name}" will notify you of new listings.`,
      });

      setTimeout(() => {
        router.push('/alerts');
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
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) {
      const hasNotificationMethod = formData.enablePhoneNotifications || formData.enableEmailNotifications;
      if (!hasNotificationMethod) return false;

      if (formData.enablePhoneNotifications && !user?.primaryPhoneNumber && !user?.phoneNumbers?.length) {
        if (phoneNumber.trim().length === 0) return false;
        const digits = phoneNumber.replace(/\D/g, "");
        return digits.length === 10;
      }

      return true;
    }
    return true;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="mb-8">
          {!user && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-muted/50 rounded-lg border border-muted-foreground/20">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                You'll need to sign in to save your alert
              </span>
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight">
            Create Rental Alert
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Step {step} of {totalSteps}
          </p>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card border rounded-lg p-6 mb-6 min-h-[400px]">
          {step === 1 && (
            <StepOne formData={formData} updateFormData={updateFormData} />
          )}
          {step === 2 && (
            <StepTwo formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <StepThree formData={formData} updateFormData={updateFormData} />
          )}
          {step === 4 && (
            <StepFourFrequency formData={formData} updateFormData={updateFormData} />
          )}
          {step === 5 && (
            <StepFive
              formData={formData}
              updateFormData={updateFormData}
              userHasPhone={!needsPhone}
              phoneNumber={phoneNumber}
              onPhoneChange={setPhoneNumber}
            />
          )}
        </div>
      </div>

      {/* Fixed Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={step === 1 ? handleCancel : handleBack}
              className="gap-2"
            >
              {step !== 1 && <ArrowLeft className="h-4 w-4" />}
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                Next
              </Button>
            ) : (
              user ? (
                <StatefulButton
                  onClick={handleSubmit}
                  state={buttonState}
                  loadingText="Creating..."
                  successText="Created!"
                  errorText="Failed"
                  autoResetDelay={2000}
                  disabled={!canGoNext()}
                >
                  Create Alert
                </StatefulButton>
              ) : (
                <Button onClick={handleSubmit} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In & Create Alert
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
