"use client";

import { AnimatedList } from "@/components/ui/animated-list";
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
    description: "$1,800/mo · Downtown",
    time: "2m ago",
    icon: "🏢",
    color: "#00C9A7",
  },
  {
    name: "Studio Loft",
    description: "$1,200/mo · Arts District",
    time: "5m ago",
    icon: "🏠",
    color: "#FFB800",
  },
  {
    name: "3BR House",
    description: "$2,500/mo · Suburbs",
    time: "12m ago",
    icon: "🏡",
    color: "#FF3D71",
  },
  {
    name: "1BR Condo",
    description: "$1,500/mo · Midtown",
    time: "18m ago",
    icon: "🏘️",
    color: "#1E86FF",
  },
  {
    name: "2BR Townhouse",
    description: "$2,100/mo · West End",
    time: "25m ago",
    icon: "🏚️",
    color: "#9F7AEA",
  },
  {
    name: "Studio Apartment",
    description: "$1,000/mo · University District",
    time: "32m ago",
    icon: "🏢",
    color: "#F56565",
  },
  {
    name: "4BR House",
    description: "$3,200/mo · Lake View",
    time: "45m ago",
    icon: "🏡",
    color: "#48BB78",
  },
  {
    name: "2BR Loft",
    description: "$1,900/mo · Historic District",
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

export function LiveFeed() {
  return (
    <section className="bg-muted/50 px-8 py-24 sm:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left side - Text content */}
          <div className="flex flex-col justify-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Instant text alerts for new listings
            </h2>
            <p className="text-lg text-muted-foreground">
              Get notified the moment a rental matches your criteria. Act fast, stay ahead.
            </p>
          </div>

          {/* Right side - Animated list */}
          <div className="flex items-center justify-center">
            <div className="relative flex h-[600px] w-full max-w-[450px] flex-col overflow-hidden rounded-lg border bg-background p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-semibold">Live Listings</h3>
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
        </div>
      </div>
    </section>
  );
}
