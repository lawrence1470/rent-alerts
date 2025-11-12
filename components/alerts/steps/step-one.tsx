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
    <div className="space-y-4 py-2">
      {/* Alert Name */}
      <div className="space-y-1.5">
        <Label htmlFor="alert-name">Alert Name *</Label>
        <Input
          id="alert-name"
          placeholder="e.g., East Village 2BR under $3K"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="text-base"
          autoFocus
        />
      </div>

      {/* Price Range */}
      <div className="space-y-2 p-3 rounded-lg border bg-card">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="min-price" className="text-sm">Min Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
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
                className="pl-7 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max-price" className="text-sm">Max Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
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
                className="pl-7 h-9"
              />
            </div>
          </div>
        </div>
        {formData.minPrice &&
          formData.maxPrice &&
          formData.minPrice >= formData.maxPrice && (
            <p className="text-xs text-destructive">
              Max price must be greater than min price
            </p>
          )}
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="space-y-2 p-3 rounded-lg border bg-card">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bedrooms" className="text-sm">Bedrooms</Label>
            <Select
              value={formData.bedrooms ?? undefined}
              onValueChange={(value) =>
                updateFormData({
                  bedrooms: value as AlertFormData["bedrooms"],
                })
              }
            >
              <SelectTrigger id="bedrooms" className="h-9">
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

          <div className="space-y-1.5">
            <Label htmlFor="bathrooms" className="text-sm">Bathrooms</Label>
            <Select
              value={formData.minBaths?.toString() ?? undefined}
              onValueChange={(value) =>
                updateFormData({
                  minBaths: parseInt(value),
                })
              }
            >
              <SelectTrigger id="bathrooms" className="h-9">
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
  );
}
