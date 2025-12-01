import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Rent Notify",
  description: "Terms of Service for Rent Notify rental notification service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: November 30, 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Rent Notify (&quot;the Service&quot;), operated by Rent Notify (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
              you agree to be bound by these Terms of Service. If you do not agree to these terms,
              please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Rent Notify is a software service that provides rental listing notifications for
              New York City apartments. We monitor rental listings and send alerts via email and/or
              SMS based on your saved search criteria. Our service is designed to help users find
              rental apartments more efficiently.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p className="text-muted-foreground mb-4">
              Paid subscriptions are billed as one-time purchases for a specified duration (1, 2, or 3 months).
              By purchasing a subscription, you agree to pay the fees indicated at the time of purchase.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>All payments are processed securely through Stripe</li>
              <li>Prices are listed in US Dollars (USD)</li>
              <li>Subscriptions provide access for the purchased duration</li>
              <li>No automatic renewals - you must manually purchase additional time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Refund Policy</h2>
            <p className="text-muted-foreground">
              Please see our <Link href="/refund" className="text-primary hover:underline">Refund Policy</Link> for
              detailed information about refunds and cancellations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use automated systems to access the Service beyond normal use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
              We do not guarantee that listings are accurate, complete, or available. We are not
              affiliated with any real estate platform or landlord. Rental listings are aggregated
              from third-party sources and we are not responsible for their accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Rent Notify shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages resulting from
              your use of the Service, including but not limited to loss of rental opportunities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of
              material changes via email or through the Service. Continued use of the Service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about these Terms, please contact us at:
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
