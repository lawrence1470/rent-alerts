"use client";

import * as React from "react";
import { TextInput, TextInputProps } from "@mantine/core";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<TextInputProps, "classNames"> {
  className?: string;
}

function Input({ className, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(className)}
      classNames={{
        input: "transition-shadow",
      }}
      {...props}
    />
  );
}

// Also export a raw input for simple cases
function RawInput({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-[var(--mantine-color-dark-4)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--mantine-color-dark-2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--mantine-primary-color-filled)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input, RawInput };
