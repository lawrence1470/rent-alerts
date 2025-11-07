import { ArrowRight, Bell, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 px-4 py-24 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 px-4 py-1.5">
            <Bell className="mr-2 h-3 w-3" />
            <span className="text-sm font-medium">Never miss your perfect rental</span>
          </Badge>

          {/* Heading */}
          <h1 className="mb-6 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
            Find Your Perfect Rental Before Anyone Else
          </h1>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Get instant notifications when new rental listings match your criteria.
            Save your searches, track favorites, and never let the perfect apartment slip away.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="min-w-[200px]">
              <Link href="/dashboard">
                <Search className="mr-2 h-4 w-4" />
                Browse Listings
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted-foreground">
            Join <span className="font-semibold text-foreground">2,500+</span> renters finding their perfect home
          </p>
        </div>

        {/* Hero Image/Mockup Placeholder */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="aspect-[16/10] bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50" />
            {/* You can replace this with an actual screenshot later */}
          </div>
          {/* Glow effect */}
          <div className="absolute -bottom-12 left-1/2 h-32 w-full -translate-x-1/2 bg-primary/20 blur-[80px]" />
        </div>
      </div>
    </section>
  );
}
