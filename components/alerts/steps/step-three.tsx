"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import { AlertFormData } from "../types";

type StepThreeProps = {
  formData: AlertFormData;
  updateFormData: (data: Partial<AlertFormData>) => void;
};

export function StepThree({ formData, updateFormData }: StepThreeProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Set Your Filters</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Optional: Narrow down your search with price and bedroom filters.
          Leave blank for no restrictions.
        </p>
      </div>

      <div className="space-y-4">
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

        {/* Additional Options */}
        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <h4 className="font-medium">Additional Options</h4>
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
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Learn more about rent stabilization check"
                >
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">
                    How Rent Stabilization Check Works
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll estimate rent stabilization status based on NYC
                    building data. Results show probability percentages to help
                    you make informed decisions.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
