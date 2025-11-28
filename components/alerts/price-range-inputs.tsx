"use client";

import * as React from "react";
import { TextInput } from "@mantine/core";
import { Label } from "@/components/ui/label";

interface PriceRangeInputsProps {
  minPrice: number | null | undefined;
  maxPrice: number | null | undefined;
  onMinPriceChange: (value: number | null) => void;
  onMaxPriceChange: (value: number | null) => void;
  minError?: string;
  maxError?: string;
  disabled?: boolean;
}

export function PriceRangeInputs({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  minError,
  maxError,
  disabled,
}: PriceRangeInputsProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onMinPriceChange(null);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        onMinPriceChange(num);
      }
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onMaxPriceChange(null);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        onMaxPriceChange(num);
      }
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Minimum Price */}
      <div className="space-y-2">
        <Label htmlFor="minPrice">Minimum Price</Label>
        <TextInput
          id="minPrice"
          type="number"
          placeholder="No minimum"
          value={minPrice?.toString() ?? ""}
          onChange={handleMinChange}
          disabled={disabled}
          leftSection="$"
          error={minError}
          aria-invalid={!!minError}
          aria-describedby={minError ? "min-price-error" : undefined}
        />
      </div>

      {/* Maximum Price */}
      <div className="space-y-2">
        <Label htmlFor="maxPrice">Maximum Price</Label>
        <TextInput
          id="maxPrice"
          type="number"
          placeholder="No maximum"
          value={maxPrice?.toString() ?? ""}
          onChange={handleMaxChange}
          disabled={disabled}
          leftSection="$"
          error={maxError}
          aria-invalid={!!maxError}
          aria-describedby={maxError ? "max-price-error" : undefined}
        />
      </div>
    </div>
  );
}
