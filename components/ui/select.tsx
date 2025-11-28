"use client";

import * as React from "react";
import {
  Select as MantineSelect,
  SelectProps as MantineSelectProps,
  ComboboxItem,
} from "@mantine/core";
import { cn } from "@/lib/utils";

export interface SelectProps extends Omit<MantineSelectProps, "classNames" | "data" | "onChange"> {
  className?: string;
  children?: React.ReactNode;
  onValueChange?: (value: string | null) => void;
  onChange?: (value: string | null, option: ComboboxItem | null) => void;
  data?: (string | ComboboxItem)[];
}

// Main Select component - Mantine-style usage
function Select({
  className,
  value,
  onValueChange,
  onChange,
  data,
  ...props
}: SelectProps) {
  const handleChange = (val: string | null, option: ComboboxItem | null) => {
    onChange?.(val, option);
    onValueChange?.(val);
  };

  return (
    <MantineSelect
      value={value}
      onChange={handleChange}
      data={data}
      className={cn(className)}
      {...props}
    />
  );
}

// Legacy compatibility exports for gradual migration
// These are no-op wrappers that can be used during migration
function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { size?: "sm" | "default" }) {
  return (
    <button
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-[var(--mantine-color-dark-4)] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[var(--mantine-color-dark-2)] focus:outline-none focus:ring-1 focus:ring-[var(--mantine-primary-color-filled)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function SelectValue({ placeholder, ...props }: { placeholder?: string } & React.ComponentProps<"span">) {
  return <span {...props}>{placeholder}</span>;
}

function SelectContent({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

function SelectGroup({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

function SelectItem({
  children,
  value,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  return <div data-value={value} {...props}>{children}</div>;
}

function SelectLabel({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

function SelectSeparator({ ...props }: React.ComponentProps<"div">) {
  return <div className="my-1 h-px bg-[var(--mantine-color-dark-4)]" {...props} />;
}

function SelectScrollUpButton(props: React.ComponentProps<"div">) {
  return null;
}

function SelectScrollDownButton(props: React.ComponentProps<"div">) {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
