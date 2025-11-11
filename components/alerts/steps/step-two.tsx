"use client";

import { useState, useMemo } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertFormData } from "../types";
import { NYC_NEIGHBORHOODS, getNeighborhoodsByBorough } from "@/lib/neighborhoods";

type StepTwoProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepTwo({ formData, updateFormData }: StepTwoProps) {
  const [selectedBoroughIndex, setSelectedBoroughIndex] = useState(0);

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

  return (
    <div className="space-y-4 relative">
      {/* Selected count badge - top right */}
      {selectedNeighborhoods.size > 0 && (
        <div className="absolute top-0 right-0 z-10">
          <Badge variant="secondary" className="text-sm">
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

      <TabGroup selectedIndex={selectedBoroughIndex} onChange={setSelectedBoroughIndex}>
        <div className="flex flex-col">
          {/* Horizontal Tab List (folder style) for all screens */}
          <TabList className="flex gap-1 p-1 overflow-x-auto -mx-1 px-1 mb-4">
            {NYC_NEIGHBORHOODS.map((borough) => {
              const selectedCount = getBoroughSelectedCount(borough.name);
              return (
                <Tab
                  key={borough.name}
                  className="
                    text-sm md:text-base font-medium transition-all
                    focus:outline-none cursor-pointer group
                    whitespace-nowrap flex-shrink-0

                    /* Folder tab style for all screens */
                    rounded-t-lg rounded-b-none
                    border border-b-0

                    /* Selected state */
                    data-[selected]:bg-card data-[selected]:border-border
                    data-[selected]:text-foreground

                    /* Unselected state */
                    bg-muted/50 border-transparent
                    text-foreground

                    /* Hover */
                    hover:bg-muted

                    /* Spacing */
                    py-2.5 md:py-3.5 px-3 md:px-4

                    /* Layout */
                    flex items-center justify-between gap-2
                  "
                >
                  <span className="flex-1 text-left">{borough.name}</span>
                  {selectedCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs group-data-[selected]:bg-primary/10 group-data-[selected]:text-foreground"
                    >
                      {selectedCount}
                    </Badge>
                  )}
                </Tab>
              );
            })}
          </TabList>

          {/* Content area */}
          <TabPanels className="flex-1 border-t border-border pt-4">
            {NYC_NEIGHBORHOODS.map((borough) => (
              <TabPanel key={borough.name}>
                <div className="space-y-6">
                  {borough.groups.map((group) => {
                    const allSelected = isGroupSelected(group.neighborhoods);
                    const partiallySelected = isGroupPartiallySelected(group.neighborhoods);

                    return (
                      <div key={group.label} className="space-y-3">
                        {/* Group header checkbox */}
                        <div className="flex items-center space-x-2 pb-2 border-b">
                          <Checkbox
                            id={`group-${group.label}`}
                            checked={allSelected}
                            ref={(el) => {
                              if (el) {
                                (el as any).indeterminate = partiallySelected && !allSelected;
                              }
                            }}
                            onCheckedChange={() => toggleGroup(group.neighborhoods)}
                          />
                          <Label
                            htmlFor={`group-${group.label}`}
                            className="text-sm font-semibold text-muted-foreground cursor-pointer"
                          >
                            {group.label}
                          </Label>
                        </div>

                        {/* Individual neighborhoods */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                          {group.neighborhoods.map((neighborhood) => (
                            <div key={neighborhood} className="flex items-center space-x-2">
                              <Checkbox
                                id={neighborhood}
                                checked={selectedNeighborhoods.has(neighborhood)}
                                onCheckedChange={() => toggleNeighborhood(neighborhood)}
                              />
                              <Label
                                htmlFor={neighborhood}
                                className="text-sm cursor-pointer leading-tight"
                              >
                                {neighborhood}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </div>
      </TabGroup>
    </div>
  );
}
