-- Migration: Add Rent Stabilization Support
-- Created: 2024
-- Description: Adds fields and tables to support rent-stabilized apartment detection

-- ============================================================================
-- 1. Add rent stabilization filter to alerts table
-- ============================================================================
ALTER TABLE alerts
ADD COLUMN filter_rent_stabilized BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 2. Add rent stabilization fields to listings table
-- ============================================================================
ALTER TABLE listings
ADD COLUMN latitude REAL,
ADD COLUMN longitude REAL,
ADD COLUMN rent_stabilized_status TEXT DEFAULT 'unknown',
ADD COLUMN rent_stabilized_probability REAL,
ADD COLUMN rent_stabilized_source TEXT,
ADD COLUMN rent_stabilized_checked_at TIMESTAMP,
ADD COLUMN building_dhcr_id TEXT;

-- Add indexes for the new fields
CREATE INDEX listings_building_dhcr_id_idx ON listings(building_dhcr_id);
CREATE INDEX listings_rent_stabilized_status_idx ON listings(rent_stabilized_status);

-- ============================================================================
-- 3. Create building_cache table for performance optimization
-- ============================================================================
CREATE TABLE IF NOT EXISTS building_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Building identification (normalized)
  address_normalized TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,

  -- DHCR data
  dhcr_building_id TEXT,
  dhcr_last_updated TIMESTAMP,
  is_rent_stabilized BOOLEAN NOT NULL,
  stabilized_unit_count INTEGER,
  total_unit_count INTEGER,

  -- Heuristic data
  heuristic_probability REAL,
  building_year_built INTEGER,

  -- Cache metadata
  cache_hit_count INTEGER DEFAULT 0,
  last_queried_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient lookups
CREATE INDEX building_cache_location_idx ON building_cache(latitude, longitude);
CREATE INDEX building_cache_address_idx ON building_cache(address_normalized);
CREATE INDEX building_cache_dhcr_id_idx ON building_cache(dhcr_building_id);

-- ============================================================================
-- 4. Add check constraint for rent_stabilized_status enum values
-- ============================================================================
ALTER TABLE listings
ADD CONSTRAINT rent_stabilized_status_check
CHECK (rent_stabilized_status IN ('confirmed', 'probable', 'unlikely', 'unknown'));

-- Add check constraint for rent_stabilized_source enum values
ALTER TABLE listings
ADD CONSTRAINT rent_stabilized_source_check
CHECK (rent_stabilized_source IN ('dhcr_registry', 'heuristic', 'manual_verification') OR rent_stabilized_source IS NULL);

-- Add check constraint for probability range
ALTER TABLE listings
ADD CONSTRAINT rent_stabilized_probability_check
CHECK (rent_stabilized_probability >= 0 AND rent_stabilized_probability <= 1 OR rent_stabilized_probability IS NULL);

-- Same for building_cache
ALTER TABLE building_cache
ADD CONSTRAINT heuristic_probability_check
CHECK (heuristic_probability >= 0 AND heuristic_probability <= 1 OR heuristic_probability IS NULL);