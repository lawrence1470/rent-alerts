"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertFormData } from "../create-alert-wizard";
import { NYC_NEIGHBORHOODS } from "@/lib/neighborhoods";
import { ScrollArea } from "@/components/ui/scroll-area";

type StepTwoProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepTwo({ formData, updateFormData }: StepTwoProps) {
  const [selectedBorough, setSelectedBorough] = useState("Manhattan");

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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Neighborhoods</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Select one or more neighborhoods where you'd like to find rentals.
        </p>
        <p className="text-xs text-muted-foreground/80 italic mb-4">
          We are currently only supporting high-demand areas in Manhattan and Brooklyn.
        </p>

        {selectedNeighborhoods.size > 0 && (
          <div className="mb-4">
            <Badge variant="secondary" className="text-sm">
              {selectedNeighborhoods.size} neighborhood{selectedNeighborhoods.size !== 1 ? 's' : ''} selected
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={selectedBorough} onValueChange={setSelectedBorough}>
        <TabsList className="grid w-full grid-cols-2">
          {NYC_NEIGHBORHOODS.map((borough) => (
            <TabsTrigger key={borough.name} value={borough.name} className="text-xs">
              {borough.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {NYC_NEIGHBORHOODS.map((borough) => (
          <TabsContent key={borough.name} value={borough.name} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
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
                      <div className="grid grid-cols-2 gap-3 pl-6">
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
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Selected neighborhoods preview */}
      {selectedNeighborhoods.size > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm font-medium mb-2">Selected areas:</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedNeighborhoods).map((neighborhood) => (
              <Badge key={neighborhood} variant="secondary" className="text-xs">
                {neighborhood}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
