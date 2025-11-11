import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/highlighter";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for casual apartment hunters",
    features: [
      "1 saved alert",
      "⏰ Alerts every 24 hours",
      "Email notifications",
      "Basic filtering",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$3",
    period: "/week",
    description: "For serious renters who want the edge",
    features: [
      "Unlimited alerts",
      "⏰ Alerts every hour",
      "Email & SMS notifications",
      "Advanced filtering",
      "Rent stabilization detection",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Premium",
    price: "$10",
    period: "/week",
    description: "Maximum advantage for competitive markets",
    features: [
      "Everything in Pro",
      "⏰ Alerts every 5 minutes",
      "Lightning-fast notifications",
      "AI-powered listing analysis",
      "Dedicated account manager",
      "Custom automation rules",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="bg-muted/30 px-8 py-24 sm:px-12 lg:px-16 xl:px-24" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 text-center">
          <h2 id="pricing-heading" className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            NYC Apartment Alert Pricing - Simple & Transparent
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Choose the plan that fits your NYC apartment hunting needs. Free trial available.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg",
                plan.popular && "border-primary shadow-lg ring-2 ring-primary/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-2 text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-4">
                {plan.features.map((feature) => {
                  const isTimingFeature = feature.startsWith("⏰");
                  return (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      {isTimingFeature ? (
                        <Highlighter
                          action="highlight"
                          color="hsl(var(--primary))"
                          strokeWidth={2}
                          animationDuration={800}
                          iterations={1}
                          padding={6}
                          isView={true}
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {feature}
                          </span>
                        </Highlighter>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                className="w-full"
              >
                <Link href="/dashboard">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
