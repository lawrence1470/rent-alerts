"use client";

import { ArrowRight, Bell, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/ui/hyper-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 px-8 sm:px-12 lg:px-16 xl:px-24 flex items-center" aria-label="Hero section">
      {/* Mobile Video Background - Only visible on mobile */}
      <div className="absolute inset-0 z-0 lg:hidden" aria-hidden="true">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-label="NYC yellow taxi cab video background"
        >
          <source src="/nyc-yellow-cab.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/75 to-background/80" />
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" aria-hidden="true" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 blur-[100px]" aria-hidden="true" />

      <div className="mx-auto max-w-7xl w-full py-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <div className="relative mx-auto max-w-3xl text-center lg:text-left lg:mx-0">
            {/* Shiny Badge */}
            <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-1.5">
              <Bell className="mr-2 h-3 w-3 text-primary" />
              <AnimatedShinyText className="text-sm font-medium">
                Never miss your perfect rental
              </AnimatedShinyText>
            </div>

            {/* Heading */}
            <div className="mb-6 space-y-2">
              <HyperText
                as="h1"
                className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                duration={1000}
                delay={200}
              >
                Finding an Apartment in NYC
              </HyperText>

              <HyperText
                as="h1"
                className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                duration={1000}
                delay={800}
              >
                Just Got A Lot Easier
              </HyperText>
            </div>

            {/* Description */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:mx-0">
              Get instant alerts when new NYC rental listings match your criteria.
              Never miss out on your dream apartment in the city that never sleeps.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button size="lg" variant="outline" asChild className="min-w-[200px] backdrop-blur-sm">
                <Link href="/dashboard">
                  <Bell className="mr-2 h-4 w-4" />
                  Create Your Alert Now
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <p className="mt-8 text-sm text-muted-foreground">
              Join <span className="font-semibold text-foreground">2,500+</span> renters finding their perfect home
            </p>
          </div>

          {/* Right side - Video (Desktop only) */}
          <div className="relative hidden lg:flex justify-end" aria-hidden="true">
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <video
                className="w-full h-auto aspect-[9/16] object-cover"
                autoPlay
                muted
                loop
                playsInline
                aria-label="NYC yellow taxi cab in Manhattan showcasing the city atmosphere"
              >
                <source src="/nyc-yellow-cab.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            {/* Glow effect */}
            <div className="absolute -bottom-8 left-1/2 h-24 w-full max-w-sm -translate-x-1/2 bg-primary/20 blur-[60px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
