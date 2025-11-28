"use client";

import * as React from "react";
import { Text, TextProps } from "@mantine/core";
import { cn } from "@/lib/utils";

export interface LabelProps extends Omit<TextProps, "component"> {
  htmlFor?: string;
  className?: string;
  children?: React.ReactNode;
}

function Label({ className, htmlFor, children, ...props }: LabelProps) {
  return (
    <Text
      component="label"
      htmlFor={htmlFor}
      size="sm"
      fw={500}
      className={cn(
        "flex items-center gap-2 leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export { Label };
