"use client";

import * as React from "react";
import { Checkbox as MantineCheckbox, CheckboxProps as MantineCheckboxProps } from "@mantine/core";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<MantineCheckboxProps, "classNames"> {
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
  className,
  checked,
  onCheckedChange,
  onChange,
  ...props
}: CheckboxProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <MantineCheckbox
      checked={checked}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  );
}

export { Checkbox };
