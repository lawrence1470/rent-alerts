import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers, ColorSchemeScript } from "@/components/providers";
import { Navbar } from "@/components/dashboard/navbar";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";

// Mantine styles
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NYC Apartment Alerts | Instant Rental Notifications in New York City",
    template: "%s | Rent Notify",
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
  authors: [{ name: "Rent Notify" }],
  creator: "Rent Notify",
  publisher: "Rent Notify",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Rent Notify',
    title: 'NYC Apartment Alerts - Never Miss Your Perfect NYC Rental',
    description: 'Get instant SMS and email alerts for NYC apartments. Track rent-stabilized units in Manhattan, Brooklyn, and Queens. Free trial available.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Rent Notify - Find Your Perfect NYC Apartment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NYC Apartment Alerts - Never Miss Your Perfect NYC Rental',
    description: 'Get instant SMS and email alerts for NYC apartments. Track rent-stabilized units. Free trial available.',
    images: ['/og.png'],
    creator: '@rentnotify',
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
      <html lang="en" suppressHydrationWarning>
        <head>
          <ColorSchemeScript defaultColorScheme="dark" />
        </head>
        <body
          className={`${inter.variable} antialiased font-sans`}
        >
          <Providers>
            <UpgradeBanner />
            <Navbar />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
