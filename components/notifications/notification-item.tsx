"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  listingUrl: string;
}

export function NotificationItem({
  address,
  price,
  bedrooms,
  bathrooms,
  listingUrl,
}: NotificationItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 shrink-0">
          <MapPin className="h-3.5 w-3.5 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{address}</p>
          <p className="text-xs text-muted-foreground">
            {bedrooms}BR / {bathrooms}BA
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold">
          ${price.toLocaleString()}/mo
        </span>
        <a
          href={listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
            "transition-colors"
          )}
        >
          View
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
