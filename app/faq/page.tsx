"use client";

import { Accordion } from "@mantine/core";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const FAQS = [
  {
    question: 'How does it work?',
    answer: 'We check StreetEasy every 15 minutes for new listings matching your alerts. When we find something new, you get an email and SMS instantly.',
  },
  {
    question: 'How much does it cost?',
    answer: '$80/month for premium (15-minute checks). Save 10% with 2 months ($144) or 20% with 3 months ($192). No subscriptions - just one-time payments.',
  },
  {
    question: 'Can I extend my time?',
    answer: 'Yes! Buy more months anytime and the time gets added to your existing access. You never lose time.',
  },
  {
    question: 'What happens when my access expires?',
    answer: 'Your alerts pause until you buy more time. Your settings and alerts are saved - just purchase more months to reactivate.',
  },
  {
    question: 'Is there a free option?',
    answer: 'Yes, free users get hourly checks (24/day). Premium gets 15-minute checks (96/day) - 4x faster.',
  },
  {
    question: 'Can I turn off SMS notifications?',
    answer: 'Yes, you can enable or disable email and SMS independently from your subscription settings.',
  },
  {
    question: 'How many alerts can I create?',
    answer: 'Unlimited. Create as many neighborhood and criteria combinations as you need.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Yes, within 7 days of purchase if you haven\'t received any notifications. Contact support.',
  },
];

export default function FAQPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">FAQ</h1>

        <Accordion variant="separated">
          {FAQS.map((faq, idx) => (
            <Accordion.Item
              key={idx}
              value={`faq-${idx}`}
              className="bg-card border rounded-xl mb-2"
            >
              <Accordion.Control className="font-medium">
                {faq.question}
              </Accordion.Control>
              <Accordion.Panel className="text-muted-foreground">
                {faq.answer}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
