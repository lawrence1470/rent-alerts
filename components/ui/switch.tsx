"use client";

import * as React from "react";
import { Switch as MantineSwitch, SwitchProps as MantineSwitchProps } from "@mantine/core";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<MantineSwitchProps, "classNames"> {
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

function Switch({
  className,
  checked,
  onCheckedChange,
  onChange,
  ...props
}: SwitchProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <MantineSwitch
      checked={checked}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  );
}

export { Switch };
