"use client";

import { BackgroundOverlayCard } from "@/components/ui/background-overlay-card";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { motion } from "motion/react";

export function Showcase() {
  return (
    <section className="bg-background px-8 py-24 sm:px-12 lg:px-16 xl:px-24" aria-labelledby="showcase-heading">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Title */}
          <div className="space-y-6" id="showcase-heading">
            <TypingAnimation
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl leading-tight"
              as="h2"
              duration={50}
              startOnView={true}
            >
              Getting an Apartment in NYC is F***ing Hard
            </TypingAnimation>
          </div>

          {/* Right column - Card */}
          <motion.div
            className="flex items-center justify-center lg:justify-end"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <BackgroundOverlayCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
