"use client";

import { cn } from "@/lib/utils";

export function BackgroundOverlayCard() {
  return (
    <div className="max-w-xs w-full">
      <div
        className={cn(
          "w-full overflow-hidden relative card h-96 rounded-md shadow-xl mx-auto flex flex-col justify-end p-4 border border-transparent dark:border-neutral-800",
          "bg-[url(/Laughing%20GIF.gif)] bg-cover"
        )}
      >
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
