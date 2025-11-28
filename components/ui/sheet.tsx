"use client";

import * as React from "react";
import { Drawer, DrawerProps, Title, Text, Group, Box, CloseButton } from "@mantine/core";
import { cn } from "@/lib/utils";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({ open: false });

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open: open ?? false, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(SheetContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e);
    onOpenChange?.(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange?.(true),
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function SheetClose({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(SheetContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e);
    onOpenChange?.(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange?.(false),
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function SheetPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return null; // Mantine handles overlay internally
}

// Map side to Mantine position
const sideToPosition: Record<string, DrawerProps["position"]> = {
  right: "right",
  left: "left",
  top: "top",
  bottom: "bottom",
};

interface SheetContentProps extends Omit<DrawerProps, "opened" | "onClose" | "position"> {
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  children?: React.ReactNode;
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetContext);

  return (
    <Drawer
      opened={open}
      onClose={() => onOpenChange?.(false)}
      position={sideToPosition[side]}
      size={side === "left" || side === "right" ? "sm" : "auto"}
      className={cn(className)}
      classNames={{
        content: "flex flex-col",
        body: "flex-1 flex flex-col p-0",
      }}
      withCloseButton
      {...props}
    >
      {children}
    </Drawer>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Box className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Box className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
  );
}

function SheetTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <Title order={4} className={cn("font-semibold", className)} {...props}>
      {children}
    </Title>
  );
}

function SheetDescription({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Text size="sm" c="dimmed" className={cn(className)} {...props}>
      {children}
    </Text>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetPortal,
  SheetOverlay,
};
