"use client";

import { TextReveal } from "@/components/ui/text-reveal";
import Image from "next/image";

export function TextRevealSection() {
  return (
    <section className="relative w-full">
      {/* Text Reveal with overlay */}
      <div className="relative z-10">
        {/* Background Image - sticky and fixed in place */}
        <div className="sticky top-0 -z-10 h-screen w-full overflow-hidden">
          <Image
            src="/subway-seats.jpg"
            alt="NYC Subway"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>

        <TextReveal>
          Don't miss out on your dream NYC apartment
        </TextReveal>
      </div>
    </section>
  );
}
