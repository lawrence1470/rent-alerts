/**
 * FAQ Page
 *
 * Frequently Asked Questions with accordion layout
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Shield, CreditCard, Bell, Clock, RefreshCw, Zap } from 'lucide-react';

export const metadata = {
  title: 'FAQ - Rental Notifications',
  description: 'Frequently asked questions about our rental notification service',
};

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
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer hover:translate-x-[-4px] mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our rental notification service
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
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

                {/* Questions */}
                <div className="space-y-4">
                  {category.questions.map((faq, idx) => (
                    <Card key={idx} className="p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                      <h3 className="font-semibold text-lg mb-3 flex items-start gap-2">
                        <span className="text-primary mt-1">Q:</span>
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed pl-6">
                        {faq.answer}
                      </p>
                    </Card>
                  ))}
                </div>
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
