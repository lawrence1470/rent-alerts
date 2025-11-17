"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatefulButton, useStatefulButton } from "@/components/ui/stateful-button";
import { StepOne } from "@/components/alerts/steps/step-one";
import { StepTwo } from "@/components/alerts/steps/step-two";
import { StepFour } from "@/components/alerts/steps/step-four";
import { StepSix } from "@/components/alerts/steps/step-six";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AlertFormData } from "@/components/alerts/types";

export default function EditAlertPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const params = useParams();
  const alertId = params.id as string;
  const { user } = useUser();
  const { state: buttonState, setLoading, setSuccess, setError, reset } = useStatefulButton(2000);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [needsPhone, setNeedsPhone] = useState(false);
  const [isLoadingAlert, setIsLoadingAlert] = useState(true);

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
    notifyOnlyNewApartments: true,
  });

  const totalSteps = 4;

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

  // Fetch existing alert data
  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const response = await fetch(`/api/alerts/${alertId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Alert not found");
            router.push('/alerts');
            return;
          }
          throw new Error("Failed to fetch alert");
        }

        const data = await response.json();
        const alert = data.alert;

        // Map alert data to form data
        setFormData({
          name: alert.name || "",
          areas: alert.areas || "",
          minPrice: alert.minPrice,
          maxPrice: alert.maxPrice,
          bedrooms: alert.minBeds !== null ? `${alert.minBeds}` as AlertFormData['bedrooms'] : "studio",
          minBaths: alert.minBaths || 1,
          noFee: alert.noFee || false,
          filterRentStabilized: alert.filterRentStabilized || false,
          preferredFrequency: alert.preferredFrequency || "1hour",
          enablePhoneNotifications: alert.enablePhoneNotifications ?? true,
          enableEmailNotifications: alert.enableEmailNotifications ?? true,
          notifyOnlyNewApartments: alert.notifyOnlyNewApartments ?? true,
        });

        setIsLoadingAlert(false);
      } catch (error) {
        console.error("Error fetching alert:", error);
        toast.error("Failed to load alert");
        router.push('/alerts');
      }
    };

    if (alertId) {
      fetchAlert();
    }
  }, [alertId, router]);

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

      // Update the alert
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.info("Please sign in", {
            description: "Your session expired. Sign in to continue.",
          });
          router.push("/sign-in");
          return;
        }
        throw new Error("Failed to update alert");
      }

      setSuccess();

      toast.success("Alert updated!", {
        description: `"${formData.name}" has been updated successfully.`,
      });

      setTimeout(() => {
        router.push('/alerts');
      }, 1500);
    } catch (error) {
      console.error("Error updating alert:", error);
      setError();
      toast.error("Error", {
        description: "Failed to update alert. Please try again.",
      });
    }
  };

  const canGoNext = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.areas.length > 0;
    if (step === 3) {
      const hasNotificationMethod = formData.enablePhoneNotifications || formData.enableEmailNotifications;
      if (!hasNotificationMethod) return false;

      if (formData.enablePhoneNotifications && !user?.primaryPhoneNumber && !user?.phoneNumbers?.length) {
        if (phoneNumber.trim().length === 0) return false;
        const digits = phoneNumber.replace(/\D/g, "");
        return digits.length === 10;
      }

      return true;
    }
    if (step === 4) return true;
    return true;
  };

  // Show loading state while fetching alert
  if (isLoadingAlert) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading alert...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Rental Alert
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
        <div className="bg-card border rounded-lg p-6 mb-6 min-h-[300px]">
          {step === 1 && (
            <StepOne formData={formData} updateFormData={updateFormData} />
          )}
          {step === 2 && (
            <StepTwo formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <StepFour
              formData={formData}
              updateFormData={updateFormData}
              userHasPhone={!needsPhone}
              phoneNumber={phoneNumber}
              onPhoneChange={setPhoneNumber}
            />
          )}
          {step === 4 && (
            <StepSix formData={formData} updateFormData={updateFormData} />
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
              <StatefulButton
                onClick={handleSubmit}
                state={buttonState}
                loadingText="Updating..."
                successText="Updated!"
                errorText="Failed"
                autoResetDelay={2000}
                disabled={!canGoNext()}
              >
                Update Alert
              </StatefulButton>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
