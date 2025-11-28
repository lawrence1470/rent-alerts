"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function BackgroundOverlayCard() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="max-w-xs w-full">
      <div
        className={cn(
          "w-full overflow-hidden relative card h-96 rounded-md shadow-xl mx-auto flex flex-col justify-end p-4 border border-transparent dark:border-neutral-800"
        )}
      >
        {/* Loading placeholder with pulse */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          </div>
        )}

        {/* Background image/GIF */}
        <Image
          src="/Laughing GIF.gif"
          alt="NYC taxi background"
          fill
          className={cn(
            "object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          unoptimized
        />

        {/* Text content */}
        <div className="text relative z-50">
          <h1 className="font-bold text-xl md:text-3xl text-gray-50 relative">
            Speed Wins
          </h1>
          <p className="font-normal text-base text-gray-50 relative my-4">
            In NYC, the fastest applicant gets the apartment. Our instant alerts
            put you first in line, every time.
          </p>
        </div>
      </div>
    </div>
  );
}
