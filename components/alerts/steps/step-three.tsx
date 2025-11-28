"use client";

import { TextInput, Select } from "@mantine/core";
import { Label } from "@/components/ui/label";
import { AlertFormData } from "../types";

type StepThreeProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepThree({ formData, updateFormData }: StepThreeProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Set Your Filters</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Optional: Narrow down your search with price and bedroom filters.
          Leave blank for no restrictions.
        </p>
      </div>

      <div className="space-y-4">
        {/* Price Range */}
        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <h4 className="font-medium">Price Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-price">Minimum Price</Label>
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

            <div className="space-y-2">
              <Label htmlFor="max-price">Maximum Price</Label>
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
              <p className="text-sm text-destructive">
                Maximum price must be greater than minimum price
              </p>
            )}
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <h4 className="font-medium">Bedrooms & Bathrooms</h4>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select bedroom type"
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
              label="Minimum bathrooms"
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
    </div>
  );
}
