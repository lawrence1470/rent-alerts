"use client";

import { TextInput, Select } from "@mantine/core";
import { Label } from "@/components/ui/label";
import { AlertFormData } from "../types";

type StepOneProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepOne({ formData, updateFormData }: StepOneProps) {
  return (
    <div className="space-y-4 py-2">
      {/* Alert Name */}
      <div className="space-y-1.5">
        <Label htmlFor="alert-name">Alert Name *</Label>
        <TextInput
          id="alert-name"
          placeholder="e.g., East Village 2BR under $3K"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          autoFocus
        />
      </div>

      {/* Price Range */}
      <div className="space-y-2 p-3 rounded-lg border bg-card">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="min-price" className="text-sm">Min Price</Label>
            <TextInput
              id="min-price"
              type="number"
              placeholder="2,000"
              value={formData.minPrice?.toString() ?? ""}
              onChange={(e) =>
                updateFormData({
                  minPrice: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              leftSection="$"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max-price" className="text-sm">Max Price</Label>
            <TextInput
              id="max-price"
              type="number"
              placeholder="3,500"
              value={formData.maxPrice?.toString() ?? ""}
              onChange={(e) =>
                updateFormData({
                  maxPrice: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              leftSection="$"
            />
          </div>
        </div>
        {formData.minPrice &&
          formData.maxPrice &&
          formData.minPrice >= formData.maxPrice && (
            <p className="text-xs text-destructive">
              Max price must be greater than min price
            </p>
          )}
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="space-y-2 p-3 rounded-lg border bg-card">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Bedrooms"
            placeholder="Any"
            value={formData.bedrooms ?? null}
            onChange={(value) =>
              updateFormData({
                bedrooms: value as AlertFormData["bedrooms"],
              })
            }
            data={[
              { value: "studio", label: "Studio" },
              { value: "1", label: "1 Bedroom" },
              { value: "2", label: "2 Bedrooms" },
              { value: "3", label: "3 Bedrooms" },
              { value: "4+", label: "4+ Bedrooms" },
            ]}
            clearable
          />

          <Select
            label="Bathrooms"
            placeholder="Any"
            value={formData.minBaths?.toString() ?? null}
            onChange={(value) =>
              updateFormData({
                minBaths: value ? parseInt(value) : null,
              })
            }
            data={[
              { value: "1", label: "1 Bathroom" },
              { value: "2", label: "2 Bathrooms" },
              { value: "3", label: "3 Bathrooms" },
            ]}
            clearable
          />
        </div>
      </div>
    </div>
  );
}
