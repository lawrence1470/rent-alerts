"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertFormData } from "../types";

type StepOneProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepOne({ formData, updateFormData }: StepOneProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Alert Name Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Name Your Alert</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Give your rental alert a memorable name to help you identify it later.
        </p>
        <div className="space-y-2">
          <Label htmlFor="alert-name">Alert Name *</Label>
          <Input
            id="alert-name"
            placeholder="e.g., East Village 2BR under $3K"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="text-base"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Examples: "Williamsburg Studio", "UES 1BR No Fee", "Chelsea Under $3500"
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Set Your Filters</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Optional: Narrow down your search with price and bedroom filters.
            Leave blank for no restrictions.
          </p>
        </div>

        {/* Price Range */}
        <div className="space-y-3 p-4 rounded-lg border bg-card">
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
                      minPrice: e.target.value
                        ? parseInt(e.target.value)
                        : null,
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
                      maxPrice: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="pl-7"
                />
              </div>
            </div>
          </div>
          {formData.minPrice &&
            formData.maxPrice &&
            formData.minPrice >= formData.maxPrice && (
              <p className="text-sm text-destructive">
                Maximum price must be greater than minimum price
              </p>
            )}
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <h4 className="font-medium">Bedrooms & Bathrooms</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Select bedroom type</Label>
              <Select
                value={formData.bedrooms ?? undefined}
                onValueChange={(value) =>
                  updateFormData({
                    bedrooms: value as AlertFormData["bedrooms"],
                  })
                }
              >
                <SelectTrigger id="bedrooms">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4+">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Minimum bathrooms</Label>
              <Select
                value={formData.minBaths?.toString() ?? undefined}
                onValueChange={(value) =>
                  updateFormData({
                    minBaths: parseInt(value),
                  })
                }
              >
                <SelectTrigger id="bathrooms">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bathroom</SelectItem>
                  <SelectItem value="2">2 Bathrooms</SelectItem>
                  <SelectItem value="3">3 Bathrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
