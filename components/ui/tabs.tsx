"use client";

import * as React from "react";
import { Tabs as MantineTabs, TabsProps as MantineTabsProps } from "@mantine/core";
import { cn } from "@/lib/utils";

interface TabsProps extends Omit<MantineTabsProps, "value" | "onChange"> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  className?: string;
}

function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  children,
  ...props
}: TabsProps) {
  return (
    <MantineTabs
      defaultValue={defaultValue}
      value={value}
      onChange={onValueChange}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {children}
    </MantineTabs>
  );
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <MantineTabs.List className={cn(className)} {...props}>
      {children}
    </MantineTabs.List>
  );
}

interface TabsTriggerProps extends React.ComponentProps<"button"> {
  value: string;
}

function TabsTrigger({
  className,
  value,
  children,
  ...props
}: TabsTriggerProps) {
  return (
    <MantineTabs.Tab
      value={value}
      className={cn(
        "font-medium transition-all",
        className
      )}
      {...props}
    >
      {children}
    </MantineTabs.Tab>
  );
}

interface TabsContentProps extends React.ComponentProps<"div"> {
  value: string;
}

function TabsContent({
  className,
  value,
  children,
  ...props
}: TabsContentProps) {
  return (
    <MantineTabs.Panel
      value={value}
      className={cn("flex-1 outline-none", className)}
      {...props}
    >
      {children}
    </MantineTabs.Panel>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
