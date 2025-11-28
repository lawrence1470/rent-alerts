"use client"

import * as React from "react"
import { Modal, Button, Text, Title, Group } from "@mantine/core"
import { cn } from "@/lib/utils"

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
  return (
    <Modal
      opened={open || false}
      onClose={() => onOpenChange?.(false)}
      centered
      withCloseButton={false}
      size="md"
    >
      {children}
    </Modal>
  )
}

const AlertDialogContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-4", className)} {...props}>
    {children}
  </div>
)

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <Group justify="flex-end" gap="sm" className={cn("mt-4", className)} {...props} />
)

const AlertDialogTitle = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <Title order={3} className={cn("text-lg font-semibold", className)} {...props}>
    {children}
  </Title>
)

const AlertDialogDescription = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <Text size="sm" c="dimmed" className={className} {...props}>
    {children}
  </Text>
)

interface AlertDialogActionProps {
  onClick?: () => void
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  color?: string
}

const AlertDialogAction = ({
  className,
  onClick,
  children,
  disabled,
  color,
  ...props
}: AlertDialogActionProps) => (
  <Button onClick={onClick} className={className} disabled={disabled} color={color} {...props}>
    {children}
  </Button>
)

interface AlertDialogCancelProps {
  onClick?: () => void
  children?: React.ReactNode
  className?: string
  disabled?: boolean
}

const AlertDialogCancel = ({
  className,
  onClick,
  children,
  disabled,
  ...props
}: AlertDialogCancelProps) => (
  <Button variant="outline" onClick={onClick} className={className} disabled={disabled} {...props}>
    {children}
  </Button>
)

// Placeholder components for compatibility
const AlertDialogTrigger = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)
const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)
const AlertDialogOverlay = () => null

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
