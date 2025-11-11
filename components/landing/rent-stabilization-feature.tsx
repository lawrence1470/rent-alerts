"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { Building2, Check, Hash, Clock, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export function RentStabilizationFeature() {
  return (
    <section className="bg-background px-8 py-24 sm:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Know Before You Apply
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Our AI analyzes every listing to determine if it's rent stabilized—giving you crucial information before you even schedule a viewing.
          </p>
        </div>

        {/* Feature Card */}
        <div className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border bg-card p-8 shadow-lg">
            {/* Listing Info */}
            <div className="mb-6 border-b border-border pb-6">
              <h3 className="mb-2 text-2xl font-semibold text-foreground">
                123 E 10th St, Apt 4B
              </h3>
              <p className="text-lg text-muted-foreground">
                $2,100/mo · 2BR · East Village
              </p>
            </div>

            {/* Rent Stabilization Badge with Orbiting Circles */}
            <div className="mb-8 rounded-xl bg-primary/5 p-8 border border-primary/20">
              <div className="mb-6 flex items-center justify-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-lg font-semibold text-foreground">
                  RENT STABILIZED
                </span>
              </div>

              {/* Orbiting Circles Container */}
              <div className="relative mx-auto flex h-[400px] w-full max-w-[400px] items-center justify-center">
                {/* Center Content - Percentage */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex items-baseline gap-2">
                    <NumberTicker
                      value={74}
                      className="text-6xl font-bold tracking-tight text-primary"
                    />
                    <span className="text-4xl font-bold text-primary">%</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    High Confidence
                  </p>
                </div>

                {/* Orbiting Icons */}
                <OrbitingCircles radius={120} duration={20} iconSize={50}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-background shadow-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-background shadow-lg">
                    <Hash className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-background shadow-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-background shadow-lg">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                </OrbitingCircles>
              </div>

              <div className="mt-6 relative h-3 w-full max-w-md mx-auto overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000"
                  style={{ width: '74%' }}
                />
              </div>
            </div>

            {/* Analysis Breakdown */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Based on:
              </h4>
              <div className="space-y-3">
                {[
                  "Building records and registration data",
                  "Unit count analysis (45+ units)",
                  "Historical rent stabilization patterns",
                  "NYC housing database cross-reference"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA Text */}
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-foreground">
              Save time. Avoid surprises. Apply with confidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
