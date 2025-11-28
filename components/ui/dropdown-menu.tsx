"use client";

import * as React from "react";
import { Menu, MenuProps, Divider, Text, Checkbox, Radio } from "@mantine/core";
import { ChevronRightIcon, CheckIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({ open: false });

function DropdownMenu({ open, onOpenChange, children }: DropdownMenuProps) {
  return (
    <DropdownMenuContext.Provider value={{ open: open ?? false, onOpenChange }}>
      <Menu opened={open} onChange={onOpenChange} shadow="md" width={200}>
        {children}
      </Menu>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return <Menu.Target>{children}</Menu.Target>;
  }

  return (
    <Menu.Target>
      <button type="button" {...props}>
        {children}
      </button>
    </Menu.Target>
  );
}

interface DropdownMenuContentProps extends React.ComponentProps<"div"> {
  sideOffset?: number;
}

function DropdownMenuContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <Menu.Dropdown className={cn(className)} {...props}>
      {children}
    </Menu.Dropdown>
  );
}

function DropdownMenuGroup({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

interface DropdownMenuItemProps extends React.ComponentProps<"button"> {
  inset?: boolean;
  variant?: "default" | "destructive";
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <Menu.Item
      className={cn(
        inset && "pl-8",
        variant === "destructive" && "text-red-500",
        className
      )}
      color={variant === "destructive" ? "red" : undefined}
      {...props}
    >
      {children}
    </Menu.Item>
  );
}

interface DropdownMenuCheckboxItemProps extends React.ComponentProps<"button"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <Menu.Item
      className={cn(className)}
      leftSection={
        <Checkbox
          size="xs"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          styles={{ input: { cursor: "pointer" } }}
        />
      }
      {...props}
    >
      {children}
    </Menu.Item>
  );
}

function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<"div"> & {
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <DropdownMenuRadioContext.Provider value={{ value, onValueChange }}>
      <div {...props}>{children}</div>
    </DropdownMenuRadioContext.Provider>
  );
}

const DropdownMenuRadioContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

interface DropdownMenuRadioItemProps extends React.ComponentProps<"button"> {
  value: string;
}

function DropdownMenuRadioItem({
  className,
  children,
  value,
  ...props
}: DropdownMenuRadioItemProps) {
  const { value: selectedValue, onValueChange } = React.useContext(DropdownMenuRadioContext);

  return (
    <Menu.Item
      className={cn(className)}
      leftSection={
        <Radio
          size="xs"
          checked={selectedValue === value}
          onChange={() => onValueChange?.(value)}
          styles={{ radio: { cursor: "pointer" } }}
        />
      }
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </Menu.Item>
  );
}

interface DropdownMenuLabelProps extends React.ComponentProps<"div"> {
  inset?: boolean;
}

function DropdownMenuLabel({
  className,
  inset,
  children,
  ...props
}: DropdownMenuLabelProps) {
  return (
    <Menu.Label
      className={cn(inset && "pl-8", className)}
      {...props}
    >
      {children}
    </Menu.Label>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <Menu.Divider className={cn(className)} />;
}

function DropdownMenuShortcut({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <Text
      component="span"
      size="xs"
      c="dimmed"
      className={cn("ml-auto tracking-widest", className)}
      {...props}
    >
      {children}
    </Text>
  );
}

function DropdownMenuSub({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

interface DropdownMenuSubTriggerProps extends React.ComponentProps<"button"> {
  inset?: boolean;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <Menu.Item
      className={cn(inset && "pl-8", className)}
      rightSection={<ChevronRightIcon className="size-4" />}
      {...props}
    >
      {children}
    </Menu.Item>
  );
}

function DropdownMenuSubContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Menu.Dropdown className={cn(className)} {...props}>
      {children}
    </Menu.Dropdown>
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
