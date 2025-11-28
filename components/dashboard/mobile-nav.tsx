"use client";

import { ActionIcon } from "@mantine/core";
import { Logo } from "@/components/logo";
import { Menu } from "lucide-react";

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <ActionIcon
        variant="subtle"
        size="lg"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        aria-expanded="false"
        aria-controls="mobile-sidebar"
        color="gray"
      >
        <Menu className="h-6 w-6" />
      </ActionIcon>

      <Logo href="/dashboard" showText size="sm" />

      {/* Placeholder for future actions (notifications, profile, etc.) */}
      <div className="w-10" />
    </div>
  );
}
