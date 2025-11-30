"use client";

import { TextInput, Select, Text } from "@mantine/core";
import { Label } from "@/components/ui/label";
import { AlertFormData } from "../types";

// StreetEasy-style price options
const PRICE_OPTIONS = [
  { value: "500", label: "$500" },
  { value: "750", label: "$750" },
  { value: "1000", label: "$1,000" },
  { value: "1250", label: "$1,250" },
  { value: "1500", label: "$1,500" },
  { value: "1750", label: "$1,750" },
  { value: "2000", label: "$2,000" },
  { value: "2250", label: "$2,250" },
  { value: "2500", label: "$2,500" },
  { value: "2750", label: "$2,750" },
  { value: "3000", label: "$3,000" },
  { value: "3500", label: "$3,500" },
  { value: "4000", label: "$4,000" },
  { value: "4500", label: "$4,500" },
  { value: "5000", label: "$5,000" },
  { value: "6000", label: "$6,000" },
  { value: "7000", label: "$7,000" },
  { value: "8000", label: "$8,000" },
  { value: "10000", label: "$10,000" },
  { value: "15000", label: "$15,000+" },
];

type StepOneProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepOne({ formData, updateFormData }: StepOneProps) {
  return (
    <div className="space-y-5 py-2">
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

      {/* Price Range - side by side like StreetEasy */}
      <div className="space-y-1.5">
        <Label className="text-sm">Price Range *</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            placeholder="Min"
            value={formData.minPrice?.toString() ?? null}
            onChange={(value) =>
              updateFormData({
                minPrice: value ? parseInt(value) : null,
              })
            }
            data={PRICE_OPTIONS}
            clearable
          />
          <Select
            placeholder="Max"
            value={formData.maxPrice?.toString() ?? null}
            onChange={(value) =>
              updateFormData({
                maxPrice: value ? parseInt(value) : null,
              })
            }
            data={PRICE_OPTIONS}
            clearable
          />
        </div>
        {formData.minPrice &&
          formData.maxPrice &&
          formData.minPrice >= formData.maxPrice && (
            <Text size="xs" c="red">
              Max price must be greater than min price
            </Text>
          )}
      </div>

      {/* Bedrooms & Bathrooms - side by side */}
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
  );
}
