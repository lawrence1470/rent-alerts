/**
 * Zod validation schemas for alert creation/editing
 */

import { z } from "zod";

/**
 * Alert form validation schema
 *
 * Mirrors the database schema requirements with client-side validation
 */
export const alertFormSchema = z.object({
  // Required fields
  name: z.string()
    .min(1, "Alert name is required")
    .max(100, "Alert name must be less than 100 characters"),

  areas: z.string()
    .min(1, "At least one neighborhood is required")
    .refine(
      (val) => val.split(',').filter(Boolean).length > 0,
      "At least one neighborhood is required"
    ),

  // Optional price range
  minPrice: z.number()
    .int("Price must be a whole number")
    .positive("Price must be positive")
    .nullable()
    .optional(),

  maxPrice: z.number()
    .int("Price must be a whole number")
    .positive("Price must be positive")
    .nullable()
    .optional(),

  // Optional bedroom range
  minBeds: z.number()
    .int("Bedrooms must be a whole number")
    .min(0, "Bedrooms cannot be negative")
    .max(10, "Maximum 10 bedrooms")
    .nullable()
    .optional(),

  maxBeds: z.number()
    .int("Bedrooms must be a whole number")
    .min(0, "Bedrooms cannot be negative")
    .max(10, "Maximum 10 bedrooms")
    .nullable()
    .optional(),

  // Optional bathroom minimum
  minBaths: z.number()
    .int("Bathrooms must be a whole number")
    .min(0, "Bathrooms cannot be negative")
    .max(10, "Maximum 10 bathrooms")
    .nullable()
    .optional(),

  // Boolean filters
  noFee: z.boolean().default(false),
  filterRentStabilized: z.boolean().default(false),

  // Notification preferences
  enablePhoneNotifications: z.boolean().default(true),
  enableEmailNotifications: z.boolean().default(true),
  notifyOnlyNewApartments: z.boolean().default(true),

  // Status
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Validate price range: minPrice <= maxPrice
    if (data.minPrice != null && data.maxPrice != null) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  {
    message: "Minimum price cannot exceed maximum price",
    path: ["maxPrice"],
  }
).refine(
  (data) => {
    // Validate bedroom range: minBeds <= maxBeds
    if (data.minBeds != null && data.maxBeds != null) {
      return data.minBeds <= data.maxBeds;
    }
    return true;
  },
  {
    message: "Minimum bedrooms cannot exceed maximum bedrooms",
    path: ["maxBeds"],
  }
).refine(
  (data) => {
    // At least one notification method must be enabled
    return data.enablePhoneNotifications || data.enableEmailNotifications;
  },
  {
    message: "At least one notification method must be enabled",
    path: ["enableEmailNotifications"],
  }
);

/**
 * Type inference from schema
 */
export type AlertFormValues = z.infer<typeof alertFormSchema>;

/**
 * Default values for new alert form
 */
export const defaultAlertValues: Partial<AlertFormValues> = {
  name: "",
  areas: "",
  minPrice: null,
  maxPrice: null,
  minBeds: null,
  maxBeds: null,
  minBaths: null,
  noFee: false,
  filterRentStabilized: false,
  enablePhoneNotifications: true,
  enableEmailNotifications: true,
  notifyOnlyNewApartments: true,
  isActive: true,
};

/**
 * Helper to convert API response to form values
 */
export function alertToFormValues(alert: any): AlertFormValues {
  return {
    name: alert.name,
    areas: alert.areas,
    minPrice: alert.minPrice,
    maxPrice: alert.maxPrice,
    minBeds: alert.minBeds,
    maxBeds: alert.maxBeds,
    minBaths: alert.minBaths,
    noFee: alert.noFee ?? false,
    filterRentStabilized: alert.filterRentStabilized ?? false,
    enablePhoneNotifications: alert.enablePhoneNotifications ?? true,
    enableEmailNotifications: alert.enableEmailNotifications ?? true,
    notifyOnlyNewApartments: alert.notifyOnlyNewApartments ?? true,
    isActive: alert.isActive ?? true,
  };
}

/**
 * Helper to convert form values to API payload
 */
export function formValuesToAlertPayload(values: AlertFormValues) {
  return {
    name: values.name,
    areas: values.areas,
    minPrice: values.minPrice ?? null,
    maxPrice: values.maxPrice ?? null,
    minBeds: values.minBeds ?? null,
    maxBeds: values.maxBeds ?? null,
    minBaths: values.minBaths ?? null,
    noFee: values.noFee,
    filterRentStabilized: values.filterRentStabilized,
    enablePhoneNotifications: values.enablePhoneNotifications,
    enableEmailNotifications: values.enableEmailNotifications,
    notifyOnlyNewApartments: values.notifyOnlyNewApartments,
    isActive: values.isActive,
  };
}
