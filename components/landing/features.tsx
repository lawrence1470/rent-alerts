import { Bell, Filter, Heart, MapPin, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Get real-time alerts the moment a new listing matches your saved searches. Be the first to know, first to respond.",
  },
  {
    icon: Filter,
    title: "Advanced Filters",
    description: "Create precise search criteria with filters for price, bedrooms, location, amenities, and more. Find exactly what you need.",
  },
  {
    icon: Heart,
    title: "Save Favorites",
    description: "Bookmark listings you love and track them over time. Never lose track of that perfect apartment you found.",
  },
  {
    icon: MapPin,
    title: "Location-Based Search",
    description: "Search by neighborhood, proximity to work, or commute time. Find rentals in the areas that matter to you.",
  },
  {
    icon: TrendingUp,
    title: "Price Tracking",
    description: "Monitor price changes and market trends. Get notified when prices drop on your favorite listings.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Our system scans thousands of listings every minute. When opportunity knocks, you'll hear it first.",
  },
];

export function Features() {
  return (
    <section className="bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Everything you need to find your perfect rental
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to give you an edge in the competitive rental market
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/40 transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
