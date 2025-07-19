-- Migration: Add shareable results functionality
-- Run this in Supabase SQL editor

-- Create table for storing generated calendars
CREATE TABLE IF NOT EXISTS calendar_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_url TEXT NOT NULL,
  store_name TEXT,
  calendar_data JSONB NOT NULL,
  country VARCHAR(2),
  brand_tone VARCHAR(20),
  week_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  view_count INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX idx_calendar_generations_id ON calendar_generations(id);
CREATE INDEX idx_calendar_generations_created_at ON calendar_generations(created_at);

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION increment_calendar_view_count(calendar_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE calendar_generations 
  SET view_count = view_count + 1 
  WHERE id = calendar_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up expired calendars (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_calendars()
RETURNS void AS $$
BEGIN
  DELETE FROM calendar_generations 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;