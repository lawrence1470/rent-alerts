import { BackgroundOverlayCard } from "@/components/ui/background-overlay-card";

export function Showcase() {
  return (
    <section className="bg-background px-8 py-24 sm:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Title */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Getting an Apartment in NYC is F***ing Hard
            </h2>
          </div>

          {/* Right column - Card */}
          <div className="flex items-center justify-center lg:justify-end">
            <BackgroundOverlayCard />
          </div>
        </div>
      </div>
    </section>
  );
}
