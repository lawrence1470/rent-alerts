import { Hero, Showcase, LiveFeed, TextRevealSection, Pricing, FAQ, CTA, Footer } from "@/components/landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NYC Apartment Alerts - Instant Rental Notifications for Manhattan, Brooklyn & Queens",
  description: "Get instant SMS and email alerts for NYC apartments the moment they're listed. Track rent-stabilized units, set custom search criteria for Manhattan, Brooklyn, Queens apartments. Join 2,500+ NYC renters finding their perfect home faster.",
  keywords: [
    "NYC apartment alerts",
    "New York City rental notifications",
    "Manhattan apartment search",
    "Brooklyn rental finder",
    "Queens apartments",
    "rent stabilized NYC",
    "instant apartment alerts",
    "StreetEasy notifications",
    "NYC housing alerts",
    "New York rental search"
  ],
  openGraph: {
    title: "NYC Apartment Alerts - Never Miss Your Perfect NYC Rental",
    description: "Get instant SMS and email alerts for NYC apartments. Track rent-stabilized units in Manhattan, Brooklyn, and Queens. Free trial available.",
    type: "website",
    url: "/",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "NYC Rental Notifications",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Plan",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Perfect for casual apartment hunters - 1 saved alert, alerts every 24 hours, email notifications"
    },
    {
      "@type": "Offer",
      "name": "Pro Plan",
      "price": "3",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "3.00",
        "priceCurrency": "USD",
        "unitText": "WEEK"
      },
      "description": "For serious renters - unlimited alerts, hourly notifications, SMS & email, rent stabilization detection"
    },
    {
      "@type": "Offer",
      "name": "Premium Plan",
      "price": "10",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "10.00",
        "priceCurrency": "USD",
        "unitText": "WEEK"
      },
      "description": "Maximum advantage - alerts every 5 minutes, AI-powered analysis, dedicated support"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "2500",
    "bestRating": "5"
  },
  "description": "Get instant SMS and email alerts for NYC apartments. Track rent-stabilized units, set custom search criteria, and never miss your perfect Manhattan, Brooklyn, or Queens rental.",
  "featureList": [
    "Instant SMS and email notifications",
    "Rent stabilization detection",
    "Multiple saved searches",
    "Real-time listing alerts",
    "Advanced filtering options",
    "Manhattan, Brooklyn, Queens coverage"
  ],
  "screenshot": "/screenshot.png",
  "areaServed": {
    "@type": "City",
    "name": "New York City",
    "sameAs": "https://en.wikipedia.org/wiki/New_York_City"
  }
};

const localBusinessData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Rental Notification Service",
  "provider": {
    "@type": "Organization",
    "name": "NYC Rental Notifications"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Manhattan",
      "containedIn": "New York, NY"
    },
    {
      "@type": "City",
      "name": "Brooklyn",
      "containedIn": "New York, NY"
    },
    {
      "@type": "City",
      "name": "Queens",
      "containedIn": "New York, NY"
    }
  ],
  "description": "Instant apartment rental notifications for NYC apartments in Manhattan, Brooklyn, and Queens. Track rent-stabilized units and get SMS alerts.",
  "audience": {
    "@type": "Audience",
    "geographicArea": {
      "@type": "City",
      "name": "New York City"
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
      />
      <main>
        <Hero />
        <Showcase />
        <LiveFeed />
        <TextRevealSection />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
