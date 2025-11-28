"use client";

import * as React from "react";
import { Accordion as MantineAccordion } from "@mantine/core";
import { cn } from "@/lib/utils";

interface AccordionProps {
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[] | null) => void;
  className?: string;
  children?: React.ReactNode;
}

function Accordion({
  type = "single",
  collapsible = true,
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: AccordionProps) {
  return (
    <MantineAccordion
      multiple={type === "multiple"}
      defaultValue={defaultValue as string | string[] | undefined}
      value={value}
      onChange={onValueChange}
      className={cn(className)}
      variant="separated"
      {...props}
    >
      {children}
    </MantineAccordion>
  );
}

interface AccordionItemProps extends React.ComponentProps<"div"> {
  value: string;
}

function AccordionItem({
  className,
  value,
  children,
  ...props
}: AccordionItemProps) {
  return (
    <MantineAccordion.Item
      value={value}
      className={cn("border-b border-[var(--mantine-color-dark-4)]", className)}
      {...props}
    >
      {children}
    </MantineAccordion.Item>
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <MantineAccordion.Control
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-left font-semibold transition-all hover:underline",
        className
      )}
      {...props}
    >
      {children}
    </MantineAccordion.Control>
  );
}

interface AccordionContentProps {
  className?: string;
  children?: React.ReactNode;
}

function AccordionContent({
  className,
  children,
}: AccordionContentProps) {
  return (
    <MantineAccordion.Panel
      className={cn("text-sm", className)}
    >
      {children}
    </MantineAccordion.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
