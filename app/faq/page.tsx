/**
 * FAQ Page
 *
 * Frequently Asked Questions with accordion layout
 */

"use client";

import { Accordion } from "@mantine/core";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Shield, CreditCard, Bell, Zap, Sparkles } from 'lucide-react';

const FAQ_CATEGORIES = [
  {
    category: 'Billing & Payment',
    icon: CreditCard,
    color: 'bg-blue-500/10 text-blue-500',
    questions: [
      {
        question: 'How does billing work?',
        answer: 'You purchase access for 1-6 weeks at a time. When you purchase additional weeks, they\'re added to your existing access period, so you never lose time. All purchases are one-time payments with no recurring charges.',
      },
      {
        question: 'Can I get a refund?',
        answer: 'Yes, we offer refunds within 7 days of purchase if you haven\'t used the service. Contact support for assistance with refund requests.',
      },
      {
        question: 'Do I need a subscription?',
        answer: 'No! All purchases are one-time payments for a specific number of weeks. There are no automatic renewals or recurring charges. You have full control over when and how long you purchase access.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards and debit cards through our secure Stripe payment processor. Your payment information is never stored on our servers.',
      },
    ],
  },
  {
    category: 'Plans & Features',
    icon: Zap,
    color: 'bg-amber-500/10 text-amber-500',
    questions: [
      {
        question: 'Can I use multiple tiers?',
        answer: 'Yes! You can purchase access to multiple tiers. When creating alerts, you\'ll choose which frequency to use for each individual alert. This gives you flexibility to use different speeds for different searches.',
      },
      {
        question: 'What happens when my access expires?',
        answer: 'Your alerts will automatically fall back to the free hourly checks. You won\'t lose any of your alerts or settings. Your account remains active and you can purchase more access anytime.',
      },
      {
        question: 'Why does speed matter?',
        answer: 'NYC rental market moves fast. Being notified within 15 minutes vs 1 hour can be the difference between getting your application in first or missing out. Faster notifications give you a competitive advantage.',
      },
      {
        question: 'Can I change my plan?',
        answer: 'You can purchase access to any tier at any time. Multiple tier purchases stack, so you can have access to different speeds simultaneously. Each purchase extends your access period for that specific tier.',
      },
    ],
  },
  {
    category: 'Notifications',
    icon: Bell,
    color: 'bg-green-500/10 text-green-500',
    questions: [
      {
        question: 'How do SMS notifications work?',
        answer: 'SMS notifications are included with the Hourly Checks + SMS plan and all higher tiers. You\'ll receive text messages to your phone number when new listings match your alerts. SMS is perfect for staying updated on the go.',
      },
      {
        question: 'Can I disable notifications temporarily?',
        answer: 'Yes! You can pause or disable individual alerts at any time from your dashboard. Your access time continues to run, but you won\'t receive notifications for paused alerts.',
      },
      {
        question: 'What information is included in notifications?',
        answer: 'Each notification includes the listing address, price, bedrooms/bathrooms, key features, and a direct link to the listing. For SMS, we keep it brief with the most important details.',
      },
    ],
  },
  {
    category: 'Account & Privacy',
    icon: Shield,
    color: 'bg-purple-500/10 text-purple-500',
    questions: [
      {
        question: 'Is my data secure?',
        answer: 'Yes. We use industry-standard encryption for all data transmission and storage. We never share your personal information with third parties. Payment processing is handled by Stripe, a PCI-compliant payment processor.',
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can delete your account at any time from your account settings. This will permanently remove all your data, alerts, and notification history. This action cannot be undone.',
      },
      {
        question: 'Do you sell my data?',
        answer: 'No, never. We do not sell, rent, or share your personal information with third parties for marketing purposes. Your privacy is important to us.',
      },
    ],
  },
  {
    category: 'Technical Support',
    icon: HelpCircle,
    color: 'bg-red-500/10 text-red-500',
    questions: [
      {
        question: 'What if I don\'t receive notifications?',
        answer: 'First, check that your alerts are active and not paused. Verify your email address and phone number are correct. Check your spam folder for emails. If issues persist, contact support.',
      },
      {
        question: 'How do I update my notification preferences?',
        answer: 'Go to your dashboard and click on any alert to edit its settings. You can change notification frequency, search criteria, and enable/disable email or SMS notifications.',
      },
      {
        question: 'Can I get notified for multiple neighborhoods?',
        answer: 'Yes! Create separate alerts for each neighborhood or search criteria. Each alert can have its own notification speed and preferences. There\'s no limit to the number of alerts you can create.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer hover:-translate-x-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </Link>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Frequently Asked Questions
              </h1>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about our rental notification service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-12">
          {FAQ_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold">{category.category}</h2>
                </div>

                {/* Accordion */}
                <Accordion
                  variant="separated"
                  className="bg-card w-full rounded-2xl border px-6 py-2 shadow-sm ring-4 ring-muted dark:ring-0"
                >
                  {category.questions.map((faq, idx) => (
                    <Accordion.Item
                      key={`${category.category}-${idx}`}
                      value={`${category.category}-${idx}`}
                      className="border-dashed"
                    >
                      <Accordion.Control className="cursor-pointer text-base text-left">
                        {faq.question}
                      </Accordion.Control>
                      <Accordion.Panel className="text-base text-muted-foreground leading-relaxed pb-3">
                        <p>{faq.answer}</p>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>

        {/* Still have questions CTA */}
        <Card className="mt-16 p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="mailto:support@example.com"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all cursor-pointer hover:scale-105 hover:shadow-lg"
              >
                Contact Support
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border font-medium hover:bg-accent transition-all cursor-pointer hover:scale-105 hover:border-primary/50"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
