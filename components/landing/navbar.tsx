import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8 sm:px-12 lg:px-16 xl:px-24">
        {/* Logo */}
        <Logo showText className="hidden sm:flex" />
        <Logo showText={false} className="sm:hidden" size="sm" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
