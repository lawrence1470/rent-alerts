"use client";

import * as React from "react";
import { Tooltip as MantineTooltip, TooltipProps as MantineTooltipProps } from "@mantine/core";
import { cn } from "@/lib/utils";

interface TooltipProviderProps {
  delayDuration?: number;
  children?: React.ReactNode;
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

interface TooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  children?: React.ReactNode;
}

const TooltipContext = React.createContext<{
  label?: React.ReactNode;
  setLabel: (label: React.ReactNode) => void;
}>({ setLabel: () => {} });

function Tooltip({ children, delayDuration = 0 }: TooltipProps) {
  const [label, setLabel] = React.useState<React.ReactNode>(null);

  return (
    <TooltipContext.Provider value={{ label, setLabel }}>
      <MantineTooltip
        label={label}
        openDelay={delayDuration}
        withArrow
        arrowSize={6}
      >
        <span className="inline-flex">{children}</span>
      </MantineTooltip>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return <>{children}</>;
  }

  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

interface TooltipContentProps extends React.ComponentProps<"div"> {
  sideOffset?: number;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: TooltipContentProps) {
  const { setLabel } = React.useContext(TooltipContext);

  React.useEffect(() => {
    setLabel(children);
  }, [children, setLabel]);

  return null; // Content is rendered via the label prop on MantineTooltip
}

// Simple unified tooltip component for easy usage
interface SimpleTooltipProps extends Omit<MantineTooltipProps, "children"> {
  children: React.ReactNode;
}

function SimpleTooltip({ children, ...props }: SimpleTooltipProps) {
  return (
    <MantineTooltip withArrow arrowSize={6} {...props}>
      <span className="inline-flex">{children}</span>
    </MantineTooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SimpleTooltip };
