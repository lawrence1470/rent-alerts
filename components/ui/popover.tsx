"use client";

import * as React from "react";
import { Popover as MantinePopover, PopoverProps as MantinePopoverProps } from "@mantine/core";
import { cn } from "@/lib/utils";

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Popover({ open, onOpenChange, children }: PopoverProps) {
  return (
    <MantinePopover
      opened={open}
      onChange={onOpenChange}
      position="bottom"
      withArrow
      shadow="md"
    >
      {children}
    </MantinePopover>
  );
}

function PopoverTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return <MantinePopover.Target>{children}</MantinePopover.Target>;
  }

  return (
    <MantinePopover.Target>
      <button type="button" {...props}>
        {children}
      </button>
    </MantinePopover.Target>
  );
}

interface PopoverContentProps extends React.ComponentProps<"div"> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <MantinePopover.Dropdown className={cn("p-4", className)} {...props}>
      {children}
    </MantinePopover.Dropdown>
  );
}

function PopoverAnchor({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
