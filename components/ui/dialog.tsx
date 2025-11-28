"use client";

import * as React from "react";
import { Modal, ModalProps, Title, Text, Group, Box, CloseButton } from "@mantine/core";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open: open ?? false, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({ open: false });

function DialogTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);

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

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DialogClose({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);

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

function DialogOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return null; // Mantine handles overlay internally
}

interface DialogContentProps extends Omit<ModalProps, "opened" | "onClose"> {
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext);

  return (
    <Modal
      opened={open}
      onClose={() => onOpenChange?.(false)}
      withCloseButton={showCloseButton}
      centered
      className={cn(className)}
      classNames={{
        content: "rounded-lg",
        header: "pb-0",
        body: "pt-4",
      }}
      {...props}
    >
      {children}
    </Modal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Box
      className={cn("flex flex-col gap-2 text-center sm:text-left mb-4", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Group
      className={cn("mt-4", className)}
      justify="flex-end"
      gap="sm"
      {...props}
    />
  );
}

function DialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <Title order={3} className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </Title>
  );
}

function DialogDescription({
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
