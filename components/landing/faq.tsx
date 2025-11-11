"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How quickly will I receive notifications?",
    answer: "Notifications are sent instantly when a new listing matches your criteria - typically within seconds of the listing going live. This gives you a critical time advantage in NYC's competitive rental market.",
  },
  {
    question: "Which rental platforms do you track?",
    answer: "We aggregate listings from all major NYC rental platforms including StreetEasy, Zillow, Apartments.com, and more. Our system checks these sources continuously to ensure you never miss an opportunity.",
  },
  {
    question: "How does rent stabilization detection work?",
    answer: "We use NYC's public DHCR database and building records to determine if a listing is likely rent stabilized. Our algorithm analyzes building age, location, and historical data to provide confidence scores on each listing.",
  },
  {
    question: "Can I customize my search criteria?",
    answer: "Yes! You can set specific parameters including neighborhood, price range, number of bedrooms, amenities, and more. You'll only receive notifications for listings that match your exact requirements.",
  },
  {
    question: "Is there a cost to use the service?",
    answer: "We offer a free tier with basic alert functionality. Premium plans include faster notifications, rent stabilization detection, and advanced filtering options. Check our pricing page for details.",
  },
  {
    question: "How do I know if a listing is still available?",
    answer: "All notifications include a direct link to the original listing. We recommend acting quickly - in NYC's market, desirable apartments can be claimed within hours of posting.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        className="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-semibold pr-8">{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <section className="bg-background px-8 py-24 sm:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Everything you need to know about finding your perfect NYC apartment
          </p>
        </div>

        <div className="space-y-0">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
