"use client";

import { forwardRef, useRef } from "react";
import { AnimatedList } from "@/components/ui/animated-list";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Bell, Search, Zap, Target, Home, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface RentalNotification {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

const notifications: RentalNotification[] = [
  {
    name: "2BR Apartment",
    description: "$3,400/mo · Williamsburg, Brooklyn",
    time: "2m ago",
    icon: "🏢",
    color: "#00C9A7",
  },
  {
    name: "Studio Loft",
    description: "$2,200/mo · Chelsea, Manhattan",
    time: "5m ago",
    icon: "🏠",
    color: "#FFB800",
  },
  {
    name: "3BR Apartment",
    description: "$5,800/mo · Upper East Side, Manhattan",
    time: "12m ago",
    icon: "🏡",
    color: "#FF3D71",
  },
  {
    name: "1BR Apartment",
    description: "$2,800/mo · East Village, Manhattan",
    time: "18m ago",
    icon: "🏘️",
    color: "#1E86FF",
  },
  {
    name: "2BR Duplex",
    description: "$4,200/mo · Park Slope, Brooklyn",
    time: "25m ago",
    icon: "🏚️",
    color: "#9F7AEA",
  },
  {
    name: "Studio",
    description: "$1,950/mo · Hell's Kitchen, Manhattan",
    time: "32m ago",
    icon: "🏢",
    color: "#F56565",
  },
  {
    name: "4BR Townhouse",
    description: "$6,500/mo · DUMBO, Brooklyn",
    time: "45m ago",
    icon: "🏡",
    color: "#48BB78",
  },
  {
    name: "2BR Loft",
    description: "$3,900/mo · SoHo, Manhattan",
    time: "1h ago",
    icon: "🏠",
    color: "#ED8936",
  },
];

const RentalNotificationCard = ({ name, description, icon, color, time }: RentalNotification) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium dark:text-white">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 border-border bg-background p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden pt-6 px-4 sm:px-8 md:px-10 pb-16"
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-6 sm:gap-8 md:gap-10">
        <div className="flex flex-col justify-center gap-2">
          <Circle ref={div1Ref}>
            <Home className="h-4 w-4" />
          </Circle>
          <Circle ref={div2Ref}>
            <Building2 className="h-4 w-4" />
          </Circle>
          <Circle ref={div3Ref}>
            <Search className="h-4 w-4" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div4Ref} className="size-16">
            <Bell className="h-8 w-8 text-primary" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div5Ref}>
            <User className="h-4 w-4" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
      />
    </div>
  );
}

const features = [
  {
    icon: <Zap className="h-4 w-4 text-neutral-500" />,
    title: "Instant SMS Alerts",
    description: "Get notified the moment a rental matches your criteria",
    className: "md:row-span-2",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[12rem] items-center justify-center">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background/50 backdrop-blur-sm p-4">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-semibold">Live Listings</h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
          <AnimatedList delay={2000}>
            {notifications.map((item, idx) => (
              <RentalNotificationCard {...item} key={idx} />
            ))}
          </AnimatedList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    ),
  },
  {
    icon: <Bell className="h-4 w-4 text-neutral-500" />,
    title: "Rent Stabilization Detection",
    description: "Know if a listing is rent stabilized before you apply",
    className: "",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[12rem] flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            RENT STABILIZED
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <NumberTicker
            value={74}
            className="text-6xl font-bold tracking-tight text-primary"
          />
          <span className="text-4xl font-bold text-primary">%</span>
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          High Confidence
        </p>
        <div className="relative h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000"
            style={{ width: '74%' }}
          />
        </div>
      </div>
    ),
  },
  {
    icon: <Search className="h-4 w-4 text-neutral-500" />,
    title: "Multiple Sources",
    description: "Aggregating listings from all major rental platforms",
    className: "",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[12rem] relative">
        <AnimatedBeamDemo />
      </div>
    ),
  },
  {
    icon: <Target className="h-4 w-4 text-neutral-500" />,
    title: "Stay Ahead of the Competition",
    description: "Act fast on new listings before anyone else",
    className: "",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[12rem] flex-col items-center justify-center gap-4 bg-gradient-to-br from-muted/40 via-muted/20 to-transparent p-6">
        <div className="flex flex-col items-center gap-2">
          <NumberTicker
            value={966000}
            className="text-5xl font-bold tracking-tight text-foreground"
          />
          <p className="text-xs font-medium text-muted-foreground">
            rent stabilized units
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground/80 max-w-[240px] leading-relaxed">
          Gone in hours. Notified in seconds.
        </p>
      </div>
    ),
  },
];

export function LiveFeed() {
  return (
    <section className="bg-muted/50 px-8 py-16 sm:px-12 lg:px-16 xl:px-24 min-h-screen flex items-center" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl w-full py-8">
        <header className="mb-8 text-center">
          <h2 id="features-heading" className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Features That Help You Find NYC Apartments Faster
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time alerts, rent stabilization detection, and instant notifications for Manhattan, Brooklyn, and Queens rentals
          </p>
        </header>

        <BentoGrid>
          {features.map((feature, idx) => (
            <BentoGridItem key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
