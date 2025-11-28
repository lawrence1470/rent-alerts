"use client";

import { Accordion as MantineAccordion } from "@mantine/core";
import Link from "next/link";

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

export function FAQ() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            Everything you need to know about our rental notification service
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <MantineAccordion
            variant="separated"
            radius="lg"
            className="bg-card ring-muted w-full rounded-2xl border px-4 py-3 shadow-sm ring-4 dark:ring-0"
          >
            {faqs.map((faq, idx) => (
              <MantineAccordion.Item
                key={`item-${idx + 1}`}
                value={`item-${idx + 1}`}
                className="border-dashed"
              >
                <MantineAccordion.Control className="cursor-pointer text-base">
                  {faq.question}
                </MantineAccordion.Control>
                <MantineAccordion.Panel className="text-base pb-3">
                  <p>{faq.answer}</p>
                </MantineAccordion.Panel>
              </MantineAccordion.Item>
            ))}
          </MantineAccordion>

          <p className="text-muted-foreground mt-6 px-8">
            Can't find what you're looking for? Contact our{" "}
            <Link
              href="mailto:support@example.com"
              className="text-primary font-medium hover:underline"
            >
              customer support team
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
