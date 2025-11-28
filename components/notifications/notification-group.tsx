"use client";

import { Card } from "@mantine/core";
import { Calendar, Bell } from "lucide-react";
import { NotificationItem } from "./notification-item";

interface ListingData {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  listingUrl: string;
}

interface NotificationGroupProps {
  timestamp: Date;
  alertName: string;
  listings: ListingData[];
}

function formatDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }

  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + ` at ${timeStr}`;
}

export function NotificationGroup({
  timestamp,
  alertName,
  listings,
}: NotificationGroupProps) {
  const listingCount = listings.length;
  const listingText = listingCount === 1 ? "listing" : "listings";

  return (
    <Card className="rounded-xl overflow-hidden" padding={0}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{formatDate(timestamp)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{alertName}</span>
          <span className="text-xs text-muted-foreground">
            Found {listingCount} new {listingText}
          </span>
        </div>
      </div>

      {/* Listings */}
      <div className="divide-y divide-border">
        {listings.map((listing) => (
          <NotificationItem
            key={listing.id}
            address={listing.address}
            price={listing.price}
            bedrooms={listing.bedrooms}
            bathrooms={listing.bathrooms}
            listingUrl={listing.listingUrl}
          />
        ))}
      </div>
    </Card>
  );
}
