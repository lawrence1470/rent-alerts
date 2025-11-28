"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, Settings } from "lucide-react";
import { Button, ActionIcon, Drawer } from "@mantine/core";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SubscriptionBadges } from "./subscription-badges";

const navItems = [
  {
    title: "Rental Alerts",
    href: "/alerts",
    icon: Search,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: Settings,
  },
];

export function Navbar() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Logo href="/" showText showTagline size="sm" className="hidden sm:flex" />
        <Logo href="/" showText={false} size="sm" className="sm:hidden" />

        {/* Desktop Navigation - Centered (only show on non-landing pages) */}
        {!isLandingPage && (
          <NavigationMenu className="hidden md:flex absolute left-1/2 -translate-x-1/2" viewport={isMobile}>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link href={item.href} className={navigationMenuTriggerStyle()}>
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        )}

        {/* Auth Section - Right */}
        <div className="flex items-center space-x-4">
          {!isLandingPage && <SubscriptionBadges />}

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="subtle" size="sm">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {isLandingPage ? (
              <Button variant="subtle" size="sm" component={Link} href="/dashboard">
                Dashboard
              </Button>
            ) : (
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            )}
          </SignedIn>

          {/* Mobile Menu (only show on non-landing pages) */}
          {!isLandingPage && (
            <>
              <ActionIcon
                variant="subtle"
                hiddenFrom="md"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </ActionIcon>
              <Drawer
                opened={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                position="right"
                size="280px"
                withCloseButton
                title="Navigation"
                classNames={{
                  content: "rounded-none",
                  header: "border-b border-border",
                }}
              >
                <nav className="flex flex-col gap-4 p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </Drawer>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
