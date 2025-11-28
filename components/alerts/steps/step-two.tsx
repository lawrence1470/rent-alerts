"use client";

import { useState, useMemo } from "react";
import { Tabs, Checkbox, Badge } from "@mantine/core";
import { Label } from "@/components/ui/label";
import { AlertFormData } from "../types";
import { NYC_NEIGHBORHOODS, getNeighborhoodsByBorough } from "@/lib/neighborhoods";

type StepTwoProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepTwo({ formData, updateFormData }: StepTwoProps) {
  const [selectedBorough, setSelectedBorough] = useState<string>(NYC_NEIGHBORHOODS[0]?.name || "");

  // Parse selected neighborhoods from comma-separated string
  const selectedNeighborhoods = useMemo(
    () => new Set(formData.areas.split(",").filter(Boolean)),
    [formData.areas]
  );

  const toggleNeighborhood = (neighborhood: string) => {
    const newSelected = new Set(selectedNeighborhoods);

    if (newSelected.has(neighborhood)) {
      newSelected.delete(neighborhood);
    } else {
      newSelected.add(neighborhood);
    }

    updateFormData({ areas: Array.from(newSelected).join(",") });
  };

  const toggleGroup = (neighborhoods: string[]) => {
    const newSelected = new Set(selectedNeighborhoods);
    const allSelected = neighborhoods.every(n => newSelected.has(n));

    if (allSelected) {
      // Unselect all
      neighborhoods.forEach(n => newSelected.delete(n));
    } else {
      // Select all
      neighborhoods.forEach(n => newSelected.add(n));
    }

    updateFormData({ areas: Array.from(newSelected).join(",") });
  };

  const isGroupSelected = (neighborhoods: string[]) => {
    return neighborhoods.every(n => selectedNeighborhoods.has(n));
  };

  const isGroupPartiallySelected = (neighborhoods: string[]) => {
    const selected = neighborhoods.filter(n => selectedNeighborhoods.has(n));
    return selected.length > 0 && selected.length < neighborhoods.length;
  };

  const getBoroughSelectedCount = (boroughName: string) => {
    const boroughNeighborhoods = getNeighborhoodsByBorough(boroughName);
    return boroughNeighborhoods.filter(n => selectedNeighborhoods.has(n)).length;
  };

  const currentBorough = NYC_NEIGHBORHOODS.find(b => b.name === selectedBorough);

  return (
    <div className="space-y-4 relative">
      {/* Selected count badge - top right */}
      {selectedNeighborhoods.size > 0 && (
        <div className="absolute top-0 right-0 z-10">
          <Badge color="violet" size="lg">
            {selectedNeighborhoods.size} neighborhood{selectedNeighborhoods.size !== 1 ? 's' : ''} selected
          </Badge>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Neighborhoods</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Select one or more neighborhoods where you'd like to find rentals.
        </p>
        <p className="text-xs text-muted-foreground/80 italic mb-4">
          We are currently only supporting high-demand areas in Manhattan and Brooklyn.
        </p>
      </div>

      <Tabs value={selectedBorough} onChange={(value) => setSelectedBorough(value || "")}>
        <Tabs.List className="flex gap-1 p-1 overflow-x-auto -mx-1 px-1 mb-4">
          {NYC_NEIGHBORHOODS.map((borough) => {
            const selectedCount = getBoroughSelectedCount(borough.name);
            return (
              <Tabs.Tab
                key={borough.name}
                value={borough.name}
                className="text-sm md:text-base font-medium"
                rightSection={
                  selectedCount > 0 ? (
                    <Badge size="sm" color="violet" variant="light">
                      {selectedCount}
                    </Badge>
                  ) : null
                }
              >
                {borough.name}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {/* Content area */}
        {NYC_NEIGHBORHOODS.map((borough) => (
          <Tabs.Panel key={borough.name} value={borough.name} className="pt-4 border-t border-border">
            <div className="space-y-6">
              {borough.groups.map((group) => {
                const allSelected = isGroupSelected(group.neighborhoods);
                const partiallySelected = isGroupPartiallySelected(group.neighborhoods);

                return (
                  <div key={group.label} className="space-y-3">
                    {/* Group header checkbox */}
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={partiallySelected && !allSelected}
                        onChange={() => toggleGroup(group.neighborhoods)}
                        label={<span className="text-sm font-semibold text-muted-foreground">{group.label}</span>}
                      />
                    </div>

                    {/* Individual neighborhoods */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      {group.neighborhoods.map((neighborhood) => (
                        <Checkbox
                          key={neighborhood}
                          checked={selectedNeighborhoods.has(neighborhood)}
                          onChange={() => toggleNeighborhood(neighborhood)}
                          label={<span className="text-sm leading-tight">{neighborhood}</span>}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}
