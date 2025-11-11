"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Menu } from "lucide-react";

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        aria-expanded="false"
        aria-controls="mobile-sidebar"
        className="text-foreground hover:bg-accent"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <Logo href="/dashboard" showText size="sm" />

      {/* Placeholder for future actions (notifications, profile, etc.) */}
      <div className="w-10" />
    </div>
  );
}
