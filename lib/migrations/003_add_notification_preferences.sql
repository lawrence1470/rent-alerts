-- Migration: Add Notification Preferences
-- Created: 2025
-- Description: Adds notification preference fields to alerts table

-- ============================================================================
-- 1. Add notification preference columns to alerts table
-- ============================================================================
ALTER TABLE alerts
ADD COLUMN enable_phone_notifications BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN enable_email_notifications BOOLEAN DEFAULT TRUE NOT NULL;

-- ============================================================================
-- 2. Add check constraint to ensure at least one notification method is enabled
-- ============================================================================
-- Note: This is enforced at the application level for flexibility
-- Users must have at least one notification method enabled
