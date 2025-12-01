import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Rent Notify",
  description: "Privacy Policy for Rent Notify rental notification service.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: November 30, 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Rent Notify (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to
              protecting your personal data. This privacy policy explains how we collect, use,
              and safeguard your information when you use our rental notification service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">We collect the following types of information:</p>

            <h3 className="text-xl font-medium mb-2 mt-6">Account Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Email address (required for account creation and notifications)</li>
              <li>Phone number (optional, for SMS notifications)</li>
              <li>Name (as provided during signup)</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-6">Search Preferences</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Saved search criteria (neighborhoods, price range, bedrooms, etc.)</li>
              <li>Notification preferences</li>
              <li>Listing interaction history</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-6">Payment Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Payment processing is handled by Stripe</li>
              <li>We do not store credit card numbers on our servers</li>
              <li>We retain transaction records for accounting purposes</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-6">Usage Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Log data (IP address, browser type, access times)</li>
              <li>Device information</li>
              <li>Pages visited and features used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide rental listing notifications based on your search criteria</li>
              <li>Send you email and SMS alerts for new listings</li>
              <li>Process payments and maintain your subscription</li>
              <li>Improve and optimize our service</li>
              <li>Respond to customer support inquiries</li>
              <li>Send important service updates and announcements</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> Stripe (payments), Twilio (SMS), Resend (email), Clerk (authentication)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your data, including:
              encrypted data transmission (HTTPS), secure password hashing, and regular security
              audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your account information for as long as your account is active. If you
              delete your account, we will delete your personal data within 30 days, except where
              we are required to retain it for legal or accounting purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at lawrence.nicastro1@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use essential cookies to maintain your session and preferences. We may use
              analytics tools to understand how users interact with our service. You can
              control cookie settings through your browser.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for users under 18 years of age. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of any
              material changes by email or through the Service. Your continued use of the
              Service after changes indicates acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy, please contact us at:
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
