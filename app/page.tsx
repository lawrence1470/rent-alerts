import { Navbar, Hero, LiveFeed, TextRevealSection, Stats, CTA, Footer } from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <main>
        <Hero />
        <LiveFeed />
        <TextRevealSection />
        <Stats />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
