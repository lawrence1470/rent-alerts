/**
 * Rental Notification Email Template
 *
 * Professional email template for rental listing notifications
 * Built with React Email for consistent rendering across email clients
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
  Img,
  Heading,
} from '@react-email/components';

export interface RentalEmailProps {
  listing: {
    address: string;
    price: number;
    bedrooms?: string | number;
    bathrooms?: number;
    url?: string;
    neighborhood?: string;
    title?: string;
    imageUrl?: string;
    noFee?: boolean;
    sqft?: number;
  };
  alert: {
    name: string;
  };
}

/**
 * Rental Notification Email Component
 */
export default function RentalNotificationEmail({
  listing,
  alert,
}: RentalEmailProps) {
  // Format bedrooms display
  const bedroomsText = listing.bedrooms
    ? `${listing.bedrooms} Bedroom${listing.bedrooms !== 1 && listing.bedrooms !== '1' ? 's' : ''}`
    : 'Studio';

  // Format bathrooms display
  const bathroomsText = listing.bathrooms
    ? `${listing.bathrooms} Bathroom${listing.bathrooms !== 1 ? 's' : ''}`
    : '';

  // Format sqft display
  const sqftText = listing.sqft ? `${listing.sqft.toLocaleString()} sqft` : '';

  // Format fee display
  const feeText = listing.noFee ? 'No Fee' : 'Fee';

  // Build details array
  const details = [bedroomsText, bathroomsText, sqftText].filter(Boolean);

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>New Rental Match!</Heading>
          </Section>

          {/* Alert Name */}
          <Section style={alertSection}>
            <Text style={alertText}>
              A new listing matching your alert <strong>"{alert.name}"</strong> is now available:
            </Text>
          </Section>

          {/* Listing Image */}
          {listing.imageUrl && (
            <Section style={imageSection}>
              <Img
                src={listing.imageUrl}
                alt={listing.title || listing.address}
                style={image}
              />
            </Section>
          )}

          {/* Listing Title */}
          {listing.title && (
            <Section>
              <Heading style={h2}>{listing.title}</Heading>
            </Section>
          )}

          {/* Address & Neighborhood */}
          <Section style={addressSection}>
            <Text style={address}>{listing.address}</Text>
            {listing.neighborhood && (
              <Text style={neighborhood}>{listing.neighborhood}</Text>
            )}
          </Section>

          {/* Property Details */}
          <Section style={detailsBox}>
            {/* Details Row */}
            <Text style={detailsRow}>
              {details.map((detail, index) => (
                <React.Fragment key={index}>
                  <strong>{detail}</strong>
                  {index < details.length - 1 && <span> • </span>}
                </React.Fragment>
              ))}
            </Text>

            {/* Price */}
            <Text style={price}>
              ${listing.price.toLocaleString()}/month
            </Text>

            {/* Fee Badge */}
            <Text style={listing.noFee ? noFeeBadge : feeBadge}>
              {feeText}
            </Text>
          </Section>

          {/* Call to Action Button */}
          {listing.url && (
            <Section style={buttonSection}>
              <Button style={button} href={listing.url}>
                View Listing
              </Button>
            </Section>
          )}

          {/* Divider */}
          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this email because you created a rental alert.
              To manage your alerts or adjust notification settings, visit your dashboard.
            </Text>
            <Text style={footerSubtext}>
              Rent Notifications - Never miss your perfect apartment
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
  padding: '0 24px',
  lineHeight: '1.4',
};

const alertSection = {
  padding: '0 24px 24px',
};

const alertText = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const imageSection = {
  padding: '0 24px 24px',
};

const image = {
  width: '100%',
  maxWidth: '552px',
  height: 'auto',
  borderRadius: '8px',
  display: 'block',
};

const addressSection = {
  padding: '0 24px 16px',
};

const address = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '500',
  margin: '0 0 4px',
  lineHeight: '1.4',
};

const neighborhood = {
  color: '#666666',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.4',
};

const detailsBox = {
  backgroundColor: '#f5f5f5',
  padding: '20px 24px',
  margin: '0 24px 24px',
  borderRadius: '8px',
};

const detailsRow = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0 0 12px',
  lineHeight: '1.5',
};

const price = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  lineHeight: '1.2',
};

const noFeeBadge = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '1.5',
};

const feeBadge = {
  color: '#666666',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  lineHeight: '1.5',
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

const hr = {
  borderColor: '#e5e5e5',
  margin: '20px 24px',
};

const footer = {
  padding: '0 24px 32px',
};

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const footerSubtext = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
};

// ============================================================================
// PREVIEW COMPONENT (for development/testing)
// ============================================================================

/**
 * Preview Data for Email Development
 * Used when developing/testing the email template
 */
RentalNotificationEmail.PreviewProps = {
  listing: {
    address: '123 Main St, Apt 4B',
    price: 3200,
    bedrooms: '2',
    bathrooms: 1,
    sqft: 850,
    url: 'https://streeteasy.com/listing/123',
    neighborhood: 'East Village',
    title: 'Spacious 2BR with Exposed Brick',
    imageUrl: 'https://via.placeholder.com/600x400',
    noFee: true,
  },
  alert: {
    name: 'East Village 2BR under $3,500',
  },
} as RentalEmailProps;
