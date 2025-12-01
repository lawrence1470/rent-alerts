import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy - Rent Notify",
  description: "Refund and cancellation policy for Rent Notify rental notification service.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: November 30, 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="text-muted-foreground">
              At Rent Notify, we want you to be completely satisfied with our service. This policy
              outlines our refund and cancellation procedures for paid subscriptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Subscription Model</h2>
            <p className="text-muted-foreground">
              Rent Notify subscriptions are one-time purchases for a specified duration (1, 2, or 3 months).
              There are no automatic renewals or recurring charges. When your subscription period ends,
              you simply purchase additional time if you wish to continue using premium features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refund Eligibility</h2>
            <p className="text-muted-foreground mb-4">We offer refunds under the following conditions:</p>

            <h3 className="text-xl font-medium mb-2 mt-6">Full Refund (Within 7 Days)</h3>
            <p className="text-muted-foreground mb-4">
              If you are not satisfied with our service, you may request a full refund within 7 days
              of your purchase, provided that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You have not received more than 10 listing notifications</li>
              <li>This is your first refund request</li>
              <li>You contact us with a valid reason for the refund</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-6">Prorated Refund (After 7 Days)</h3>
            <p className="text-muted-foreground">
              After the initial 7-day period, we may offer a prorated refund at our discretion based
              on the unused portion of your subscription. Contact us to discuss your situation.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-6">Service Issues</h3>
            <p className="text-muted-foreground">
              If you experience technical issues that prevent you from using the service (and we are
              unable to resolve them), you may be eligible for a full or partial refund regardless
              of the timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Non-Refundable Situations</h2>
            <p className="text-muted-foreground mb-4">Refunds are generally not provided for:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Change of mind after the 7-day refund window</li>
              <li>Failure to find an apartment (we provide notifications, not guaranteed results)</li>
              <li>Inability to use the service due to issues on your end (invalid email, blocked SMS, etc.)</li>
              <li>Accounts suspended or terminated for Terms of Service violations</li>
              <li>Duplicate purchases (contact us first, we&apos;ll help resolve)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
            <p className="text-muted-foreground mb-4">To request a refund:</p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
              <li>Email us at <strong>lawrence.nicastro1@gmail.com</strong></li>
              <li>Include your account email and purchase date</li>
              <li>Provide a brief explanation of your refund request</li>
              <li>Allow 3-5 business days for us to review and respond</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refund Processing</h2>
            <p className="text-muted-foreground">
              Approved refunds will be processed to your original payment method within 5-10 business days.
              The exact timing depends on your bank or credit card provider. You will receive an email
              confirmation when the refund is initiated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cancellation</h2>
            <p className="text-muted-foreground">
              Since our subscriptions do not auto-renew, there is no cancellation process required.
              Your subscription will simply expire at the end of your purchased period. You can
              continue to use the free tier features after your paid subscription expires.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              For refund requests or questions about this policy, please contact us:
            </p>
            <div className="text-muted-foreground">
              <p><strong>Rent Notify</strong></p>
              <p>1014 Lexington Ave, 3R</p>
              <p>New York, NY 10021</p>
              <p>Email: lawrence.nicastro1@gmail.com</p>
              <p>Phone: +1 (347) 617-2607</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
