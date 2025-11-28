"use client";

import { useMemo } from "react";
import { Checkbox, Badge } from "@mantine/core";
import { AlertFormData } from "../types";
import { NYC_BOROUGHS } from "@/lib/neighborhoods";

type StepTwoProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepTwo({ formData, updateFormData }: StepTwoProps) {
  // Parse selected boroughs from comma-separated slug string
  const selectedBoroughs = useMemo(
    () => new Set(formData.areas.split(",").filter(Boolean)),
    [formData.areas]
  );

  const toggleBorough = (slug: string) => {
    const newSelected = new Set(selectedBoroughs);

    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }

    updateFormData({ areas: Array.from(newSelected).join(",") });
  };

  const selectAll = () => {
    const allSlugs = NYC_BOROUGHS.map(b => b.slug);
    updateFormData({ areas: allSlugs.join(",") });
  };

  const clearAll = () => {
    updateFormData({ areas: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Choose Boroughs</h3>
          <p className="text-sm text-muted-foreground">
            Select one or more NYC boroughs to search for rentals.
          </p>
        </div>
        {selectedBoroughs.size > 0 && (
          <Badge color="violet" size="lg">
            {selectedBoroughs.size} selected
          </Badge>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-primary hover:underline"
        >
          Select all
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:underline"
        >
          Clear
        </button>
      </div>

      {/* Borough checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {NYC_BOROUGHS.map((borough) => (
          <Checkbox
            key={borough.slug}
            checked={selectedBoroughs.has(borough.slug)}
            onChange={() => toggleBorough(borough.slug)}
            label={
              <span className="text-base font-medium">{borough.name}</span>
            }
            size="md"
            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          />
        ))}
      </div>

      {selectedBoroughs.size === 0 && (
        <p className="text-sm text-amber-600 mt-2">
          Please select at least one borough to continue.
        </p>
      )}
    </div>
  );
}
