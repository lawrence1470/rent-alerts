-- Email Notification Schema Migration
-- Adds email-specific fields to the notifications table
-- Date: 2025-11-10

-- Add email address field for storing recipient email
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS email_address TEXT;

-- Add Resend message ID field for tracking sent emails
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS resend_message_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN notifications.email_address IS 'Email address for email notifications';
COMMENT ON COLUMN notifications.resend_message_id IS 'Resend API message identifier for sent emails';

-- Optional: Create index for email lookups if needed
-- CREATE INDEX IF NOT EXISTS notifications_email_address_idx ON notifications(email_address);
-- CREATE INDEX IF NOT EXISTS notifications_resend_message_id_idx ON notifications(resend_message_id);

-- Verify migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND column_name IN ('email_address', 'resend_message_id');
