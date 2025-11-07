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

let notifications: RentalNotification[] = [
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

notifications = Array.from({ length: 10 }, () => notifications).flat();

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
    <section className="bg-muted/50 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left side - Text content */}
          <div className="flex flex-col justify-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              See listings as they happen
            </h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Watch new rental listings appear in real-time. Our system monitors thousands of sources
              every minute, so you're always first to know when your perfect home becomes available.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Instant Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Get alerts within seconds of new listings matching your criteria
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Multiple Sources</h3>
                  <p className="text-sm text-muted-foreground">
                    We aggregate from all major rental platforms in one place
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Never Miss Out</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to respond and increase your chances of securing the rental
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Animated list */}
          <div className="flex items-center justify-center">
            <div
              className={cn(
                "relative flex h-[500px] w-full flex-col overflow-hidden p-2"
              )}
            >
              <AnimatedList>
                {notifications.map((item, idx) => (
                  <RentalNotificationCard {...item} key={idx} />
                ))}
              </AnimatedList>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
