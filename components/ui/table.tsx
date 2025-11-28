"use client";

import * as React from "react";
import { Table as MantineTable, TableProps as MantineTableProps } from "@mantine/core";
import { cn } from "@/lib/utils";

interface TableProps extends Omit<MantineTableProps, "children"> {
  className?: string;
  children?: React.ReactNode;
}

function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-x-auto">
      <MantineTable
        className={cn("w-full caption-bottom text-sm", className)}
        highlightOnHover
        {...props}
      >
        {children}
      </MantineTable>
    </div>
  );
}

function TableHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <MantineTable.Thead className={cn(className)} {...props}>
      {children}
    </MantineTable.Thead>
  );
}

function TableBody({
  className,
  children,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <MantineTable.Tbody className={cn(className)} {...props}>
      {children}
    </MantineTable.Tbody>
  );
}

function TableFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"tfoot">) {
  return (
    <MantineTable.Tfoot className={cn(className)} {...props}>
      {children}
    </MantineTable.Tfoot>
  );
}

function TableRow({
  className,
  children,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <MantineTable.Tr className={cn(className)} {...props}>
      {children}
    </MantineTable.Tr>
  );
}

function TableHead({
  className,
  children,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <MantineTable.Th
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </MantineTable.Th>
  );
}

function TableCell({
  className,
  children,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <MantineTable.Td
      className={cn("p-2 align-middle whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </MantineTable.Td>
  );
}

interface TableCaptionProps {
  className?: string;
  children?: React.ReactNode;
}

function TableCaption({
  className,
  children,
}: TableCaptionProps) {
  return (
    <MantineTable.Caption className={cn("mt-4 text-sm", className)}>
      {children}
    </MantineTable.Caption>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
