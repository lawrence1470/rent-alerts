import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-primary px-8 py-24 text-primary-foreground sm:px-12 lg:px-16 xl:px-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Ready to find your perfect rental?
        </h2>
        <p className="mb-10 text-lg text-primary-foreground/90 sm:text-xl">
          Join thousands of renters who never miss out on their dream apartment.
          Start tracking listings today — it's completely free.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="min-w-[200px] bg-background text-foreground hover:bg-background/90"
          >
            <Link href="/sign-up">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="min-w-[200px] border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href="/dashboard">
              View Demo
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-primary-foreground/70">
          No credit card required • Free forever • Cancel anytime
        </p>
      </div>
    </section>
  );
}
