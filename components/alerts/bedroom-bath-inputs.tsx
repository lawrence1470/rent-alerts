"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface BedroomBathInputsProps {
  minBeds: number | null | undefined;
  maxBeds: number | null | undefined;
  minBaths: number | null | undefined;
  onMinBedsChange: (value: number | null) => void;
  onMaxBedsChange: (value: number | null) => void;
  onMinBathsChange: (value: number | null) => void;
  minBedsError?: string;
  maxBedsError?: string;
  minBathsError?: string;
  disabled?: boolean;
}

const BEDROOM_OPTIONS = [
  { value: "null", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 bed" },
  { value: "2", label: "2 beds" },
  { value: "3", label: "3 beds" },
  { value: "4", label: "4 beds" },
  { value: "5", label: "5+ beds" },
];

const BATHROOM_OPTIONS = [
  { value: "null", label: "Any" },
  { value: "1", label: "1 bath" },
  { value: "2", label: "2 baths" },
  { value: "3", label: "3+ baths" },
];

export function BedroomBathInputs({
  minBeds,
  maxBeds,
  minBaths,
  onMinBedsChange,
  onMaxBedsChange,
  onMinBathsChange,
  minBedsError,
  maxBedsError,
  minBathsError,
  disabled,
}: BedroomBathInputsProps) {
  const handleSelectChange = (
    value: string,
    onChange: (val: number | null) => void
  ) => {
    if (value === "null") {
      onChange(null);
    } else {
      onChange(parseInt(value, 10));
    }
  };

  const getSelectValue = (val: number | null | undefined): string => {
    if (val == null) return "null";
    return val.toString();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Minimum Bedrooms */}
      <div className="space-y-2">
        <Label htmlFor="minBeds">Min Bedrooms</Label>
        <Select
          value={getSelectValue(minBeds)}
          onValueChange={(val) => handleSelectChange(val, onMinBedsChange)}
          disabled={disabled}
        >
          <SelectTrigger id="minBeds" className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {BEDROOM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {minBedsError && (
          <p className="text-sm text-destructive">{minBedsError}</p>
        )}
      </div>

      {/* Maximum Bedrooms */}
      <div className="space-y-2">
        <Label htmlFor="maxBeds">Max Bedrooms</Label>
        <Select
          value={getSelectValue(maxBeds)}
          onValueChange={(val) => handleSelectChange(val, onMaxBedsChange)}
          disabled={disabled}
        >
          <SelectTrigger id="maxBeds" className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {BEDROOM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {maxBedsError && (
          <p className="text-sm text-destructive">{maxBedsError}</p>
        )}
      </div>

      {/* Minimum Bathrooms */}
      <div className="space-y-2">
        <Label htmlFor="minBaths">Min Bathrooms</Label>
        <Select
          value={getSelectValue(minBaths)}
          onValueChange={(val) => handleSelectChange(val, onMinBathsChange)}
          disabled={disabled}
        >
          <SelectTrigger id="minBaths" className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {BATHROOM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {minBathsError && (
          <p className="text-sm text-destructive">{minBathsError}</p>
        )}
      </div>
    </div>
  );
}
