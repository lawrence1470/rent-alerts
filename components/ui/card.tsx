"use client";

import * as React from "react";
import { Paper, PaperProps, Title, Text, Group } from "@mantine/core";
import { cn } from "@/lib/utils";

export interface CardProps extends Omit<PaperProps, "ref"> {
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

function Card({ className, children, ...props }: CardProps) {
  return (
    <Paper
      p="lg"
      withBorder
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {children}
    </Paper>
  );
}

function CardHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <Title
      order={3}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </Title>
  );
}

function CardDescription({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Text
      size="sm"
      c="dimmed"
      className={cn(className)}
      {...props}
    >
      {children}
    </Text>
  );
}

function CardAction({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("ml-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Group className={cn("mt-auto pt-4", className)} {...props}>
      {children}
    </Group>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
