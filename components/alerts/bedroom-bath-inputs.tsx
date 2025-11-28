"use client";

import * as React from "react";
import { Select } from "@mantine/core";

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
    value: string | null,
    onChange: (val: number | null) => void
  ) => {
    if (value === "null" || value === null) {
      onChange(null);
    } else {
      onChange(parseInt(value, 10));
    }
  };

  const getSelectValue = (val: number | null | undefined): string | null => {
    if (val == null) return "null";
    return val.toString();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Minimum Bedrooms */}
      <Select
        label="Min Bedrooms"
        placeholder="Any"
        value={getSelectValue(minBeds)}
        onChange={(value) => handleSelectChange(value, onMinBedsChange)}
        disabled={disabled}
        error={minBedsError}
        data={BEDROOM_OPTIONS}
      />

      {/* Maximum Bedrooms */}
      <Select
        label="Max Bedrooms"
        placeholder="Any"
        value={getSelectValue(maxBeds)}
        onChange={(value) => handleSelectChange(value, onMaxBedsChange)}
        disabled={disabled}
        error={maxBedsError}
        data={BEDROOM_OPTIONS}
      />

      {/* Minimum Bathrooms */}
      <Select
        label="Min Bathrooms"
        placeholder="Any"
        value={getSelectValue(minBaths)}
        onChange={(value) => handleSelectChange(value, onMinBathsChange)}
        disabled={disabled}
        error={minBathsError}
        data={BATHROOM_OPTIONS}
      />
    </div>
  );
}
