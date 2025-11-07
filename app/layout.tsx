import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rental Notifications - Never Miss Your Perfect Rental",
    template: "%s | Rental Notifications",
  },
  description: "Get instant notifications when new rental listings match your criteria. Save searches, track favorites, and find your perfect home before anyone else.",
  keywords: ["rental notifications", "apartment search", "rental alerts", "housing notifications", "real estate alerts"],
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
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
