/**
 * Clerk Webhook Handler
 *
 * Syncs user data from Clerk to local database
 * Events handled: user.created, user.updated, user.deleted
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * POST handler for Clerk webhooks
 *
 * Verifies webhook signature and processes user events
 */
export async function POST(req: Request) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get headers for signature verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Verify required headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing Svix headers');
    return NextResponse.json(
      { error: 'Missing webhook headers' },
      { status: 400 }
    );
  }

  // Get raw body for signature verification
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create Svix instance for verification
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify webhook signature
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Handle different event types
  const eventType = evt.type;
  console.log(`Received Clerk webhook: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        const { id, email_addresses, phone_numbers, first_name, last_name, image_url } = evt.data;

        // Get primary email
        const primaryEmail = email_addresses?.find((email) => email.id === evt.data.primary_email_address_id);
        const email = primaryEmail?.email_address;

        if (!email) {
          console.error('No email found for user:', id);
          return NextResponse.json(
            { error: 'User email required' },
            { status: 400 }
          );
        }

        // Get primary phone (optional)
        const primaryPhone = phone_numbers?.find((phone) => phone.id === evt.data.primary_phone_number_id);
        const phoneNumber = primaryPhone?.phone_number;

        // Upsert user data
        await db
          .insert(users)
          .values({
            id,
            email,
            phoneNumber: phoneNumber || null,
            firstName: first_name || null,
            lastName: last_name || null,
            imageUrl: image_url || null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              email,
              phoneNumber: phoneNumber || null,
              firstName: first_name || null,
              lastName: last_name || null,
              imageUrl: image_url || null,
              updatedAt: new Date(),
            },
          });

        console.log(`User ${eventType === 'user.created' ? 'created' : 'updated'}: ${id} (${email})`);
        break;
      }

      case 'user.deleted': {
        const { id } = evt.data;

        if (!id) {
          console.error('No user ID in deletion event');
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400 }
          );
        }

        // Delete user from database
        await db.delete(users).where(eq(users.id, id));

        console.log(`User deleted: ${id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
