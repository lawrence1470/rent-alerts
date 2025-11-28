"use client"

import * as React from "react"
import { ScrollArea as MantineScrollArea } from "@mantine/core"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentProps<typeof MantineScrollArea> {
  className?: string
  children: React.ReactNode
}

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <MantineScrollArea
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </MantineScrollArea>
  )
}

export { ScrollArea }
