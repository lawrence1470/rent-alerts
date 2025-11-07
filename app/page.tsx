import { Navbar, Hero, Features, LiveFeed, Stats, CTA, Footer } from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <LiveFeed />
        <Stats />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
