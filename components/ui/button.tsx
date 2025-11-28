"use client";

import * as React from "react";
import {
  Button as MantineButton,
  ButtonProps as MantineButtonProps,
} from "@mantine/core";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

export interface ButtonProps extends Omit<MantineButtonProps, "variant" | "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  href?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

// Map our variants to Mantine variants
const variantMap: Record<ButtonVariant, MantineButtonProps["variant"]> = {
  default: "filled",
  destructive: "filled",
  outline: "outline",
  secondary: "light",
  ghost: "subtle",
  link: "transparent",
};

// Map our sizes to Mantine sizes
const sizeMap: Record<ButtonSize, MantineButtonProps["size"]> = {
  default: "sm",
  sm: "xs",
  lg: "md",
  icon: "sm",
  "icon-sm": "xs",
  "icon-lg": "md",
};

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  href,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const mantineVariant = variantMap[variant];
  const mantineSize = sizeMap[size];
  const isIcon = size === "icon" || size === "icon-sm" || size === "icon-lg";

  // Handle link case
  if (href && !disabled) {
    return (
      <MantineButton
        component={Link}
        href={href}
        variant={mantineVariant}
        size={mantineSize}
        color={variant === "destructive" ? "red" : undefined}
        className={cn(
          "font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]",
          variant === "link" && "underline-offset-4 hover:underline",
          isIcon && "px-0",
          className
        )}
        styles={{
          root: isIcon ? {
            width: size === "icon-lg" ? 40 : size === "icon-sm" ? 32 : 36,
            height: size === "icon-lg" ? 40 : size === "icon-sm" ? 32 : 36,
            padding: 0,
          } : undefined,
        }}
        {...props}
      >
        {children}
      </MantineButton>
    );
  }

  return (
    <MantineButton
      variant={mantineVariant}
      size={mantineSize}
      color={variant === "destructive" ? "red" : undefined}
      disabled={disabled}
      className={cn(
        "font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]",
        variant === "link" && "underline-offset-4 hover:underline",
        isIcon && "px-0",
        className
      )}
      styles={{
        root: isIcon ? {
          width: size === "icon-lg" ? 40 : size === "icon-sm" ? 32 : 36,
          height: size === "icon-lg" ? 40 : size === "icon-sm" ? 32 : 36,
          padding: 0,
        } : undefined,
      }}
      {...props}
    >
      {children}
    </MantineButton>
  );
}

export { Button };
