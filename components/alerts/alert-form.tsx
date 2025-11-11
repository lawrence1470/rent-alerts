"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaAutocomplete } from "./area-autocomplete";
import { PriceRangeInputs } from "./price-range-inputs";
import { BedroomBathInputs } from "./bedroom-bath-inputs";

import {
  alertFormSchema,
  defaultAlertValues,
  formValuesToAlertPayload,
  type AlertFormValues,
} from "@/lib/validations/alert";

interface AlertFormProps {
  mode: "create" | "edit";
  alertId?: string;
  initialValues?: Partial<AlertFormValues>;
  onSuccess?: () => void;
}

export function AlertForm({
  mode,
  alertId,
  initialValues,
  onSuccess,
}: AlertFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: initialValues ?? defaultAlertValues,
  });

  // Watch form values for controlled components
  const areas = watch("areas");
  const minPrice = watch("minPrice");
  const maxPrice = watch("maxPrice");
  const minBeds = watch("minBeds");
  const maxBeds = watch("maxBeds");
  const minBaths = watch("minBaths");
  const noFee = watch("noFee");
  const filterRentStabilized = watch("filterRentStabilized");
  const enablePhoneNotifications = watch("enablePhoneNotifications");
  const enableEmailNotifications = watch("enableEmailNotifications");
  const notifyOnlyNewApartments = watch("notifyOnlyNewApartments");

  const onSubmit = async (data: AlertFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = formValuesToAlertPayload(data);
      const url = mode === "create" ? "/api/alerts" : `/api/alerts/${alertId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save alert");
      }

      const result = await response.json();

      toast.success(
        mode === "create" ? "Alert created successfully" : "Alert updated successfully"
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error saving alert:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save alert"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Alert Name */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Details</CardTitle>
          <CardDescription>
            Give your alert a name and select neighborhoods to monitor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alert Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Alert Name</Label>
            <Input
              id="name"
              placeholder="e.g., Williamsburg Studios"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Neighborhoods */}
          <div className="space-y-2">
            <Label>Neighborhoods</Label>
            <AreaAutocomplete
              value={areas ?? ""}
              onChange={(value) => setValue("areas", value, { shouldValidate: true })}
              error={errors.areas?.message}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Optional filters to narrow down your search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div className="space-y-2">
            <Label>Price Range</Label>
            <PriceRangeInputs
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={(value) => setValue("minPrice", value, { shouldValidate: true })}
              onMaxPriceChange={(value) => setValue("maxPrice", value, { shouldValidate: true })}
              minError={errors.minPrice?.message}
              maxError={errors.maxPrice?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="space-y-2">
            <Label>Bedrooms & Bathrooms</Label>
            <BedroomBathInputs
              minBeds={minBeds}
              maxBeds={maxBeds}
              minBaths={minBaths}
              onMinBedsChange={(value) => setValue("minBeds", value, { shouldValidate: true })}
              onMaxBedsChange={(value) => setValue("maxBeds", value, { shouldValidate: true })}
              onMinBathsChange={(value) => setValue("minBaths", value, { shouldValidate: true })}
              minBedsError={errors.minBeds?.message}
              maxBedsError={errors.maxBeds?.message}
              minBathsError={errors.minBaths?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* Boolean Filters */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noFee"
                checked={noFee}
                onCheckedChange={(checked) =>
                  setValue("noFee", checked === true, { shouldValidate: true })
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor="noFee"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                No fee listings only
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterRentStabilized"
                checked={filterRentStabilized}
                onCheckedChange={(checked) =>
                  setValue("filterRentStabilized", checked === true, { shouldValidate: true })
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor="filterRentStabilized"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Rent stabilized listings only
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified about new listings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enablePhoneNotifications"
              checked={enablePhoneNotifications}
              onCheckedChange={(checked) =>
                setValue("enablePhoneNotifications", checked === true, { shouldValidate: true })
              }
              disabled={isSubmitting}
            />
            <Label
              htmlFor="enablePhoneNotifications"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              SMS notifications
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableEmailNotifications"
              checked={enableEmailNotifications}
              onCheckedChange={(checked) =>
                setValue("enableEmailNotifications", checked === true, { shouldValidate: true })
              }
              disabled={isSubmitting}
            />
            <Label
              htmlFor="enableEmailNotifications"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email notifications
            </Label>
          </div>

          {errors.enableEmailNotifications && (
            <p className="text-sm text-destructive">
              {errors.enableEmailNotifications.message}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Notify Only on New Apartments Toggle */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyOnlyNewApartments"
                checked={notifyOnlyNewApartments}
                onCheckedChange={(checked) =>
                  setValue("notifyOnlyNewApartments", checked === true, { shouldValidate: true })
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor="notifyOnlyNewApartments"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Only notify me when new apartments are found
              </Label>
            </div>

            {/* Disclaimer */}
            {!notifyOnlyNewApartments && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> With this option disabled, you will receive notifications on every check cycle, even when no new apartments are found. This may result in frequent notifications without new results.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {mode === "create" ? "Create Alert" : "Update Alert"}
        </Button>
      </div>
    </form>
  );
}
