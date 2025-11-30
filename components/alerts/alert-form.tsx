"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button, TextInput, Checkbox, Card, Text, Title, Badge } from "@mantine/core";
import { Label } from "@/components/ui/label";
import { PriceRangeInputs } from "./price-range-inputs";
import { NYC_BOROUGHS } from "@/lib/neighborhoods";
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
      <Card withBorder radius="lg" p="lg">
        <div className="mb-4">
          <Title order={4}>Alert Details</Title>
          <Text size="sm" c="dimmed">
            Give your alert a name and select boroughs to monitor
          </Text>
        </div>
        <div className="space-y-4">
          {/* Alert Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Alert Name</Label>
            <TextInput
              id="name"
              placeholder="e.g., Williamsburg Studios"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>

          {/* Boroughs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Boroughs</Label>
              {areas && areas.split(",").filter(Boolean).length > 0 && (
                <Badge color="violet" size="sm">
                  {areas.split(",").filter(Boolean).length} selected
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NYC_BOROUGHS.map((borough) => {
                const selectedBoroughs = new Set(areas?.split(",").filter(Boolean) ?? []);
                return (
                  <Checkbox
                    key={borough.slug}
                    checked={selectedBoroughs.has(borough.slug)}
                    onChange={() => {
                      const newSelected = new Set(selectedBoroughs);
                      if (newSelected.has(borough.slug)) {
                        newSelected.delete(borough.slug);
                      } else {
                        newSelected.add(borough.slug);
                      }
                      setValue("areas", Array.from(newSelected).join(","), { shouldValidate: true });
                    }}
                    disabled={isSubmitting}
                    label={borough.name}
                    size="sm"
                    className="p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                  />
                );
              })}
            </div>
            {errors.areas?.message && (
              <Text size="xs" c="red">{errors.areas.message}</Text>
            )}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card withBorder radius="lg" p="lg">
        <div className="mb-4">
          <Title order={4}>Filters</Title>
          <Text size="sm" c="dimmed">
            Optional filters to narrow down your search results
          </Text>
        </div>
        <div className="space-y-6">
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
            <Checkbox
              checked={noFee}
              onChange={(e) =>
                setValue("noFee", e.currentTarget.checked, { shouldValidate: true })
              }
              disabled={isSubmitting}
              label="No fee listings only"
            />

            <Checkbox
              checked={filterRentStabilized}
              onChange={(e) =>
                setValue("filterRentStabilized", e.currentTarget.checked, { shouldValidate: true })
              }
              disabled={isSubmitting}
              label="Rent stabilized listings only"
            />
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card withBorder radius="lg" p="lg">
        <div className="mb-4">
          <Title order={4}>Notification Preferences</Title>
          <Text size="sm" c="dimmed">
            Choose how you want to be notified about new listings
          </Text>
        </div>
        <div className="space-y-3">
          <Checkbox
            checked={enablePhoneNotifications}
            onChange={(e) =>
              setValue("enablePhoneNotifications", e.currentTarget.checked, { shouldValidate: true })
            }
            disabled={isSubmitting}
            label="SMS notifications"
          />

          <Checkbox
            checked={enableEmailNotifications}
            onChange={(e) =>
              setValue("enableEmailNotifications", e.currentTarget.checked, { shouldValidate: true })
            }
            disabled={isSubmitting}
            label="Email notifications"
          />

          {errors.enableEmailNotifications && (
            <p className="text-sm text-destructive">
              {errors.enableEmailNotifications.message}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Notify Only on New Apartments Toggle */}
          <div className="space-y-3">
            <Checkbox
              checked={notifyOnlyNewApartments}
              onChange={(e) =>
                setValue("notifyOnlyNewApartments", e.currentTarget.checked, { shouldValidate: true })
              }
              disabled={isSubmitting}
              label="Only notify me when new apartments are found"
            />

            {/* Disclaimer */}
            {!notifyOnlyNewApartments && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> With this option disabled, you will receive notifications on every check cycle, even when no new apartments are found. This may result in frequent notifications without new results.
                </p>
              </div>
            )}
          </div>
        </div>
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
        <Button type="submit" disabled={isSubmitting} leftSection={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : undefined}>
          {mode === "create" ? "Create Alert" : "Update Alert"}
        </Button>
      </div>
    </form>
  );
}
