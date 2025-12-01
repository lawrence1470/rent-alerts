/**
 * Welcome Email Template
 *
 * Sent to new users when they first sign up
 * Personal story about why Rent Notify was created
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Heading,
  Link,
} from '@react-email/components';

export interface WelcomeEmailProps {
  firstName?: string;
}

/**
 * Welcome Email Component
 */
export default function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Welcome to Rent Notify!</Heading>
          </Section>

          {/* Personal Story */}
          <Section style={contentSection}>
            <Text style={greeting_style}>{greeting},</Text>

            <Text style={paragraph}>
              Thank you for signing up! I wanted to take a moment to share why I built Rent Notify.
            </Text>

            <Text style={paragraph}>
              When I moved to New York City, I quickly learned that finding an apartment here is
              unlike anywhere else. Good listings disappear within hours—sometimes minutes. I'd
              refresh StreetEasy constantly, set calendar reminders to check listings, and still
              missed out on apartments because someone else got there first.
            </Text>

            <Text style={paragraph}>
              After losing out on my dream apartment (twice!), I decided to build the tool I
              wished I had: <strong>instant notifications</strong> the moment a listing matches
              your criteria. No more refreshing. No more missing out.
            </Text>

            <Text style={paragraph}>
              That's what Rent Notify does. You set your search criteria once, and we'll alert
              you immediately via email or SMS when something new hits the market.
            </Text>
          </Section>

          {/* Getting Started */}
          <Section style={stepsSection}>
            <Heading style={h2}>Getting Started</Heading>

            <Text style={stepItem}>
              <strong>1. Create your first alert</strong> — Set your neighborhoods, price range,
              and bedroom count
            </Text>

            <Text style={stepItem}>
              <strong>2. Choose your notification speed</strong> — Free users get daily alerts.
              Upgrade for alerts every 15 minutes.
            </Text>

            <Text style={stepItem}>
              <strong>3. Act fast when you get notified</strong> — In NYC's rental market,
              speed is everything
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button style={button} href="https://rentnotify.com/alerts/create">
              Create Your First Alert
            </Button>
          </Section>

          {/* Closing */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              If you have any questions or feedback, just reply to this email. I read every
              message and genuinely want to help you find your next home.
            </Text>

            <Text style={paragraph}>
              Good luck with your apartment search!
            </Text>

            <Text style={signature}>
              — Lawrence
              <br />
              <span style={signatureTitle}>Founder, Rent Notify</span>
            </Text>
          </Section>

          {/* Divider */}
          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Rent Notify — Never miss your perfect NYC apartment
            </Text>
            <Text style={footerLinks}>
              <Link href="https://rentnotify.com/dashboard" style={footerLink}>Dashboard</Link>
              {' • '}
              <Link href="https://rentnotify.com/faq" style={footerLink}>FAQ</Link>
              {' • '}
              <Link href="https://rentnotify.com/pricing" style={footerLink}>Pricing</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const header = {
  padding: '32px 24px 16px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  lineHeight: '1.3',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px',
  padding: '0',
  lineHeight: '1.4',
};

const contentSection = {
  padding: '0 24px 24px',
};

const greeting_style = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '500',
  margin: '0 0 16px',
  lineHeight: '1.5',
};

const paragraph = {
  color: '#444444',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const stepsSection = {
  backgroundColor: '#f8f9fa',
  padding: '24px',
  margin: '0 24px 24px',
  borderRadius: '8px',
};

const stepItem = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const buttonSection = {
  padding: '0 24px 32px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#1a1a1a',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  lineHeight: '1.5',
};

const signature = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0',
};

const signatureTitle = {
  color: '#666666',
  fontSize: '14px',
};

const hr = {
  borderColor: '#e5e5e5',
  margin: '20px 24px',
};

const footer = {
  padding: '0 24px 32px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const footerLinks = {
  color: '#999999',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
};

const footerLink = {
  color: '#666666',
  textDecoration: 'underline',
};

// ============================================================================
// PREVIEW COMPONENT (for development/testing)
// ============================================================================

WelcomeEmail.PreviewProps = {
  firstName: 'Alex',
} as WelcomeEmailProps;
