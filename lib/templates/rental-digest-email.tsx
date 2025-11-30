/**
 * Rental Digest Email Template
 *
 * Email template for digest notifications containing multiple listings
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
  Heading,
  Link,
} from '@react-email/components';

export interface DigestListing {
  address: string;
  price: number;
  bedrooms?: string | number;
  bathrooms?: number;
  url?: string;
  neighborhood?: string;
  noFee?: boolean;
}

export interface DigestEmailProps {
  listings: DigestListing[];
  alert: {
    name: string;
  };
}

/**
 * Rental Digest Email Component
 */
export default function RentalDigestEmail({
  listings,
  alert,
}: DigestEmailProps) {
  const listingCount = listings.length;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>
              {listingCount} New {listingCount === 1 ? 'Listing' : 'Listings'}!
            </Heading>
          </Section>

          {/* Alert Name */}
          <Section style={alertSection}>
            <Text style={alertText}>
              New listings matching your alert <strong>"{alert.name}"</strong>:
            </Text>
          </Section>

          {/* Listings */}
          {listings.map((listing, index) => {
            const bedroomsText = listing.bedrooms
              ? `${listing.bedrooms}BR`
              : 'Studio';
            const bathroomsText = listing.bathrooms
              ? `${listing.bathrooms}BA`
              : '';
            const details = [bedroomsText, bathroomsText].filter(Boolean).join(' / ');

            return (
              <Section key={index} style={listingCard}>
                {/* Price and Details Row */}
                <Text style={listingPrice}>
                  ${listing.price.toLocaleString()}/mo
                  {listing.noFee && <span style={noFeeTag}> No Fee</span>}
                </Text>

                {/* Address */}
                <Text style={listingAddress}>{listing.address}</Text>

                {/* Neighborhood and Details */}
                <Text style={listingDetails}>
                  {listing.neighborhood && <span>{listing.neighborhood} • </span>}
                  {details}
                </Text>

                {/* View Link */}
                {listing.url && (
                  <Link href={listing.url} style={viewLink}>
                    View Listing →
                  </Link>
                )}
              </Section>
            );
          })}

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
  padding: '20px 24px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const header = {
  padding: '12px 0 16px 0',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  lineHeight: '1.3',
};

const alertSection = {
  padding: '0 0 16px 0',
};

const alertText = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const listingCard = {
  backgroundColor: '#ffffff',
  padding: '16px 20px',
  margin: '0 0 12px 0',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const listingPrice = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 4px',
  lineHeight: '1.3',
};

const noFeeTag = {
  color: '#16a34a',
  fontSize: '12px',
  fontWeight: '600',
  backgroundColor: '#dcfce7',
  padding: '2px 8px',
  borderRadius: '4px',
  marginLeft: '8px',
};

const listingAddress = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 4px',
  lineHeight: '1.4',
};

const listingDetails = {
  color: '#666666',
  fontSize: '14px',
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const viewLink = {
  color: '#2563eb',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: '4px',
};

const hr = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
};

const footer = {
  padding: '0 0 12px 0',
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

RentalDigestEmail.PreviewProps = {
  listings: [
    {
      address: '123 Main St, Apt 4B',
      price: 3200,
      bedrooms: '2',
      bathrooms: 1,
      url: 'https://streeteasy.com/listing/123',
      neighborhood: 'East Village',
      noFee: true,
    },
    {
      address: '456 Broadway, Unit 7',
      price: 2800,
      bedrooms: '1',
      bathrooms: 1,
      url: 'https://streeteasy.com/listing/456',
      neighborhood: 'SoHo',
      noFee: false,
    },
    {
      address: '789 Park Ave, #12A',
      price: 2950,
      bedrooms: 'Studio',
      bathrooms: 1,
      url: 'https://streeteasy.com/listing/789',
      neighborhood: 'Upper East Side',
      noFee: true,
    },
  ],
  alert: {
    name: 'Manhattan under $3,500',
  },
} as DigestEmailProps;
