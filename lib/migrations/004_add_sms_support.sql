-- Migration: Add SMS support to notifications table
-- Date: 2025-01-09
-- Description: Add SMS as a notification channel and related fields

-- Add SMS to channel enum
ALTER TYPE text DROP CONSTRAINT IF EXISTS notifications_channel_check;
ALTER TABLE notifications
  ALTER COLUMN channel TYPE text,
  ADD CONSTRAINT notifications_channel_check CHECK (channel IN ('email', 'in_app', 'push', 'sms'));

-- Add SMS-specific fields
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS twilio_message_sid text;

-- Add comment for documentation
COMMENT ON COLUMN notifications.phone_number IS 'E.164 format phone number for SMS notifications';
COMMENT ON COLUMN notifications.twilio_message_sid IS 'Twilio message identifier for tracking SMS delivery';
