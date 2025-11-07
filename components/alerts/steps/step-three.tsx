"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertFormData } from "../create-alert-wizard";

type StepThreeProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepThree({ formData, updateFormData }: StepThreeProps) {
  return (
    <div className="space-y-8 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Set Your Filters</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Optional: Narrow down your search with price and bedroom filters.
          Leave blank for no restrictions.
        </p>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="font-medium">Price Range</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-price">Minimum Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="min-price"
                type="number"
                placeholder="2,000"
                value={formData.minPrice ?? ""}
                onChange={(e) =>
                  updateFormData({
                    minPrice: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-price">Maximum Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="max-price"
                type="number"
                placeholder="3,500"
                value={formData.maxPrice ?? ""}
                onChange={(e) =>
                  updateFormData({
                    maxPrice: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="pl-7"
              />
            </div>
          </div>
        </div>
        {formData.minPrice && formData.maxPrice && formData.minPrice >= formData.maxPrice && (
          <p className="text-sm text-destructive">
            Maximum price must be greater than minimum price
          </p>
        )}
      </div>

      {/* Bedrooms */}
      <div className="space-y-4">
        <h4 className="font-medium">Bedrooms</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-beds">Minimum Beds</Label>
            <Input
              id="min-beds"
              type="number"
              min="0"
              max="10"
              placeholder="0"
              value={formData.minBeds ?? ""}
              onChange={(e) =>
                updateFormData({
                  minBeds: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-beds">Maximum Beds</Label>
            <Input
              id="max-beds"
              type="number"
              min="0"
              max="10"
              placeholder="3"
              value={formData.maxBeds ?? ""}
              onChange={(e) =>
                updateFormData({
                  maxBeds: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Bathrooms */}
      <div className="space-y-4">
        <h4 className="font-medium">Bathrooms</h4>
        <div className="space-y-2">
          <Label htmlFor="min-baths">Minimum Bathrooms</Label>
          <Input
            id="min-baths"
            type="number"
            min="0"
            max="10"
            placeholder="1"
            value={formData.minBaths ?? ""}
            onChange={(e) =>
              updateFormData({
                minBaths: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-4">
        <h4 className="font-medium">Additional Options</h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="no-fee"
              checked={formData.noFee}
              onCheckedChange={(checked) =>
                updateFormData({ noFee: checked as boolean })
              }
            />
            <Label
              htmlFor="no-fee"
              className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              No-fee apartments only
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rent-stabilized"
                checked={formData.filterRentStabilized}
                onCheckedChange={(checked) =>
                  updateFormData({ filterRentStabilized: checked as boolean })
                }
              />
              <Label
                htmlFor="rent-stabilized"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Check if rent stabilized
              </Label>
            </div>
            {formData.filterRentStabilized && (
              <p className="text-xs text-muted-foreground ml-6">
                We'll estimate rent stabilization status based on NYC building data.
                Buildings with 6+ units built before 1974 are typically rent stabilized,
                though this is not guaranteed. Results show probability percentages.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
        <p className="text-sm font-medium mb-2">Alert Summary:</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Name:</span> {formData.name}
          </p>
          <p>
            <span className="font-medium">Areas:</span>{" "}
            {formData.areas.split(",").length} neighborhood{formData.areas.split(",").length !== 1 ? 's' : ''}
          </p>
          {(formData.minPrice || formData.maxPrice) && (
            <p>
              <span className="font-medium">Price:</span>{" "}
              {formData.minPrice ? `$${formData.minPrice.toLocaleString()}` : "Any"} -{" "}
              {formData.maxPrice ? `$${formData.maxPrice.toLocaleString()}` : "Any"}
            </p>
          )}
          {(formData.minBeds || formData.maxBeds) && (
            <p>
              <span className="font-medium">Bedrooms:</span>{" "}
              {formData.minBeds ?? "Any"} - {formData.maxBeds ?? "Any"}
            </p>
          )}
          {formData.minBaths && (
            <p>
              <span className="font-medium">Min Bathrooms:</span> {formData.minBaths}
            </p>
          )}
          {formData.noFee && (
            <p className="text-primary font-medium">✓ No-fee only</p>
          )}
          {formData.filterRentStabilized && (
            <p className="text-primary font-medium">✓ Rent stabilized filter</p>
          )}
        </div>
      </div>
    </div>
  );
}
