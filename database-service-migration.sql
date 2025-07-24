-- Safe Re-run Migration: Add service business support to StoreCalendar
-- This version can be run multiple times safely

-- 1. Create the calendar_service_businesses table
CREATE TABLE IF NOT EXISTS calendar_service_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  business_url VARCHAR(500) NOT NULL,
  location TEXT,
  category VARCHAR(50) NOT NULL,
  services JSONB DEFAULT '[]'::jsonb,
  target_audience TEXT,
  scraped_content TEXT,
  last_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create index on business_url for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_calendar_service_businesses_url ON calendar_service_businesses(business_url);

-- 3. Add business_type enum to calendar_weekly_calendars
ALTER TABLE calendar_weekly_calendars 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(20) DEFAULT 'product' CHECK (business_type IN ('product', 'service'));

-- 4. Add service_business_id to calendar_weekly_calendars
ALTER TABLE calendar_weekly_calendars 
ADD COLUMN IF NOT EXISTS service_business_id UUID REFERENCES calendar_service_businesses(id);

-- 5. Make selected_products nullable (safe to run multiple times)
ALTER TABLE calendar_weekly_calendars 
ALTER COLUMN selected_products DROP NOT NULL;

-- 6. Create index on service_business_id for faster joins
CREATE INDEX IF NOT EXISTS idx_calendar_weekly_calendars_service_business_id ON calendar_weekly_calendars(service_business_id);

-- 7. Create calendar_service_captions table
CREATE TABLE IF NOT EXISTS calendar_service_captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_business_id UUID NOT NULL REFERENCES calendar_service_businesses(id) ON DELETE CASCADE,
  caption_text TEXT NOT NULL,
  caption_style VARCHAR(50) NOT NULL,
  service_featured VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create index on service_business_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_service_captions_business_id ON calendar_service_captions(service_business_id);

-- 9. Update calendar_posts table to support service businesses
ALTER TABLE calendar_posts 
ADD COLUMN IF NOT EXISTS service_featured VARCHAR(255),
ADD COLUMN IF NOT EXISTS service_business_id UUID REFERENCES calendar_service_businesses(id);

-- 10. Create or replace view (safe to run multiple times)
CREATE OR REPLACE VIEW calendar_unified_calendars AS
SELECT 
  cwc.id,
  cwc.user_id,
  cwc.week_number,
  cwc.start_date,
  cwc.end_date,
  cwc.country_code,
  cwc.brand_tone,
  cwc.calendar_data,
  cwc.created_at,
  cwc.is_public,
  cwc.share_token,
  cwc.share_title,
  cwc.share_description,
  cwc.shared_at,
  cwc.business_type,
  -- Product business info
  cwc.store_id,
  cs.store_name,
  cs.shopify_url,
  -- Service business info
  cwc.service_business_id,
  csb.business_name,
  csb.business_url,
  csb.category as service_category,
  -- Unified business name
  COALESCE(cs.store_name, csb.business_name) as unified_business_name,
  COALESCE(cs.shopify_url, csb.business_url) as unified_business_url
FROM calendar_weekly_calendars cwc
LEFT JOIN calendar_stores cs ON cwc.store_id = cs.id
LEFT JOIN calendar_service_businesses csb ON cwc.service_business_id = csb.id;