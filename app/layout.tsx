import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/dashboard/navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NYC Apartment Alerts | Instant Rental Notifications in New York City",
    template: "%s | NYC Rental Notifications",
  },
  description: "Get instant SMS and email alerts for NYC apartments. Track rent-stabilized units, set custom search criteria, and never miss your perfect Manhattan, Brooklyn, or Queens rental. Free trial available.",
  keywords: [
    "NYC apartment alerts",
    "New York rental notifications",
    "Manhattan apartment search",
    "Brooklyn rental alerts",
    "rent stabilized apartments NYC",
    "NYC housing notifications",
    "instant apartment alerts",
    "New York City rentals",
    "StreetEasy alerts",
    "NYC apartment finder"
  ],
  authors: [{ name: "Rental Notifications" }],
  creator: "Rental Notifications",
  publisher: "Rental Notifications",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'NYC Rental Notifications',
    title: 'NYC Apartment Alerts - Never Miss Your Perfect NYC Rental',
    description: 'Get instant SMS and email alerts for NYC apartments. Track rent-stabilized units in Manhattan, Brooklyn, and Queens. Free trial available.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'NYC Rental Notifications - Find Your Perfect Apartment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NYC Apartment Alerts - Never Miss Your Perfect NYC Rental',
    description: 'Get instant SMS and email alerts for NYC apartments. Track rent-stabilized units. Free trial available.',
    images: ['/og.png'],
    creator: '@rentalnotifs',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        cssLayerName: 'clerk' // Required for Tailwind 4 compatibility
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} antialiased font-sans`}
        >
          <Navbar />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
