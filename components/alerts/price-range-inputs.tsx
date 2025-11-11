"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="minPrice"
            type="number"
            placeholder="No minimum"
            value={minPrice ?? ""}
            onChange={handleMinChange}
            disabled={disabled}
            className={cn("pl-7", minError && "border-destructive")}
            aria-invalid={!!minError}
            aria-describedby={minError ? "min-price-error" : undefined}
          />
        </div>
        {minError && (
          <p id="min-price-error" className="text-sm text-destructive">
            {minError}
          </p>
        )}
      </div>

      {/* Maximum Price */}
      <div className="space-y-2">
        <Label htmlFor="maxPrice">Maximum Price</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="maxPrice"
            type="number"
            placeholder="No maximum"
            value={maxPrice ?? ""}
            onChange={handleMaxChange}
            disabled={disabled}
            className={cn("pl-7", maxError && "border-destructive")}
            aria-invalid={!!maxError}
            aria-describedby={maxError ? "max-price-error" : undefined}
          />
        </div>
        {maxError && (
          <p id="max-price-error" className="text-sm text-destructive">
            {maxError}
          </p>
        )}
      </div>
    </div>
  );
}
