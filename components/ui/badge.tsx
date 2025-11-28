"use client";

import * as React from "react";
import { Badge as MantineBadge, BadgeProps as MantineBadgeProps } from "@mantine/core";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends Omit<MantineBadgeProps, "variant"> {
  variant?: BadgeVariant;
  className?: string;
  asChild?: boolean;
}

// Map our variants to Mantine variants
const variantMap: Record<BadgeVariant, MantineBadgeProps["variant"]> = {
  default: "filled",
  secondary: "light",
  destructive: "filled",
  outline: "outline",
};

function Badge({
  className,
  variant = "default",
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <MantineBadge
      variant={variantMap[variant]}
      color={variant === "destructive" ? "red" : undefined}
      className={cn(className)}
      {...props}
    >
      {children}
    </MantineBadge>
  );
}

export { Badge };
