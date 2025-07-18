-- StoreCalendar V1 Database Migrations
-- Run these SQL commands in your Supabase SQL editor to add V1 features

-- 1. Enhance calendar_products table with V1 metadata
ALTER TABLE calendar_products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS vendor TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ranking_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS handle TEXT DEFAULT '';

-- 2. Create calendar_weekly_calendars table for calendar persistence
CREATE TABLE IF NOT EXISTS calendar_weekly_calendars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES calendar_stores(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  country_code TEXT NOT NULL CHECK (country_code IN ('US', 'UK', 'IN')),
  brand_tone TEXT NOT NULL CHECK (brand_tone IN ('professional', 'casual', 'playful', 'luxury')),
  selected_products JSONB NOT NULL, -- Array of product IDs that were selected
  calendar_data JSONB NOT NULL, -- Full WeeklyCalendar structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create calendar_posts table for individual post storage
CREATE TABLE IF NOT EXISTS calendar_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID REFERENCES calendar_weekly_calendars(id) ON DELETE CASCADE,
  store_id UUID REFERENCES calendar_stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES calendar_products(id) ON DELETE SET NULL,
  day_name TEXT NOT NULL, -- Monday, Tuesday, etc.
  post_date DATE NOT NULL,
  post_type TEXT NOT NULL, -- Product Showcase, Testimonial, etc.
  caption_text TEXT NOT NULL,
  holiday_context JSONB, -- Store holiday data if relevant to this post
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create calendar_user_preferences table for user context
CREATE TABLE IF NOT EXISTS calendar_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES calendar_stores(id) ON DELETE CASCADE,
  email TEXT,
  country_code TEXT DEFAULT 'US' CHECK (country_code IN ('US', 'UK', 'IN')),
  brand_tone TEXT DEFAULT 'casual' CHECK (brand_tone IN ('professional', 'casual', 'playful', 'luxury')),
  selected_products JSONB DEFAULT '[]'::jsonb, -- Array of preferred product IDs
  last_week_generated INTEGER DEFAULT 1 CHECK (last_week_generated IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, email)
);

-- 5. Create calendar_holidays table for holiday caching (optional optimization)
CREATE TABLE IF NOT EXISTS calendar_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL CHECK (country_code IN ('US', 'UK', 'IN')),
  holiday_date DATE NOT NULL,
  holiday_name TEXT NOT NULL,
  holiday_type TEXT NOT NULL, -- celebration, gift-giving, shopping, patriotic, festival, seasonal, environmental
  relevance_score INTEGER DEFAULT 5 CHECK (relevance_score BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_code, holiday_date, holiday_name)
);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_weekly_calendars_store_week ON calendar_weekly_calendars(store_id, week_number);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_calendar_date ON calendar_posts(calendar_id, post_date);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_store_date ON calendar_posts(store_id, post_date);
CREATE INDEX IF NOT EXISTS idx_calendar_user_preferences_store_email ON calendar_user_preferences(store_id, email);
CREATE INDEX IF NOT EXISTS idx_calendar_holidays_country_date ON calendar_holidays(country_code, holiday_date);
CREATE INDEX IF NOT EXISTS idx_calendar_products_store_ranking ON calendar_products(store_id, ranking_score DESC);

-- 7. Add RLS (Row Level Security) policies
ALTER TABLE calendar_weekly_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_holidays ENABLE ROW LEVEL SECURITY;

-- Allow public access for anonymous users (same pattern as existing tables)
CREATE POLICY "Allow public access to calendar_weekly_calendars" ON calendar_weekly_calendars FOR ALL USING (true);
CREATE POLICY "Allow public access to calendar_posts" ON calendar_posts FOR ALL USING (true);
CREATE POLICY "Allow public access to calendar_user_preferences" ON calendar_user_preferences FOR ALL USING (true);
CREATE POLICY "Allow public access to calendar_holidays" ON calendar_holidays FOR ALL USING (true);

-- 8. Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Add trigger for calendar_user_preferences updated_at
CREATE TRIGGER update_calendar_user_preferences_updated_at 
  BEFORE UPDATE ON calendar_user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert sample holiday data for 2025 (US holidays)
INSERT INTO calendar_holidays (country_code, holiday_date, holiday_name, holiday_type, relevance_score) VALUES 
  ('US', '2025-01-01', 'New Year''s Day', 'celebration', 9),
  ('US', '2025-01-20', 'Martin Luther King Jr. Day', 'patriotic', 6),
  ('US', '2025-02-14', 'Valentine''s Day', 'gift-giving', 10),
  ('US', '2025-02-17', 'Presidents'' Day', 'patriotic', 5),
  ('US', '2025-03-17', 'St. Patrick''s Day', 'celebration', 7),
  ('US', '2025-03-20', 'Spring Equinox', 'seasonal', 6),
  ('US', '2025-04-13', 'Easter Sunday', 'celebration', 8),
  ('US', '2025-04-22', 'Earth Day', 'environmental', 7),
  ('US', '2025-05-11', 'Mother''s Day', 'gift-giving', 10),
  ('US', '2025-05-26', 'Memorial Day', 'patriotic', 6),
  ('US', '2025-06-15', 'Father''s Day', 'gift-giving', 10),
  ('US', '2025-06-21', 'Summer Solstice', 'seasonal', 6),
  ('US', '2025-07-04', 'Independence Day', 'patriotic', 9),
  ('US', '2025-09-01', 'Labor Day', 'patriotic', 5),
  ('US', '2025-09-22', 'Fall Equinox', 'seasonal', 6),
  ('US', '2025-10-13', 'Columbus Day', 'patriotic', 4),
  ('US', '2025-10-31', 'Halloween', 'celebration', 9),
  ('US', '2025-11-11', 'Veterans Day', 'patriotic', 6),
  ('US', '2025-11-27', 'Thanksgiving', 'celebration', 9),
  ('US', '2025-11-28', 'Black Friday', 'shopping', 10),
  ('US', '2025-12-01', 'Cyber Monday', 'shopping', 10),
  ('US', '2025-12-21', 'Winter Solstice', 'seasonal', 6),
  ('US', '2025-12-25', 'Christmas Day', 'gift-giving', 10),
  ('US', '2025-12-31', 'New Year''s Eve', 'celebration', 8)
ON CONFLICT (country_code, holiday_date, holiday_name) DO NOTHING;

-- 11. Add comments for documentation
COMMENT ON TABLE calendar_weekly_calendars IS 'Stores generated weekly calendars for retrieval and analytics';
COMMENT ON TABLE calendar_posts IS 'Individual posts within a weekly calendar for detailed tracking';
COMMENT ON TABLE calendar_user_preferences IS 'User preferences for country, brand tone, and product selection';
COMMENT ON TABLE calendar_holidays IS 'Holiday data for calendar generation context';

COMMENT ON COLUMN calendar_products.product_type IS 'Shopify product type (e.g., Skincare, Electronics)';
COMMENT ON COLUMN calendar_products.vendor IS 'Product vendor/brand name';
COMMENT ON COLUMN calendar_products.tags IS 'Product tags as JSON array';
COMMENT ON COLUMN calendar_products.ranking_score IS 'Calculated ranking score for product selection';
COMMENT ON COLUMN calendar_products.is_featured IS 'Whether this product is marked as featured';

-- Migration complete!
-- Next steps:
-- 1. Update API to store enhanced product metadata
-- 2. Update calendar generation to persist results
-- 3. Add user preference management
-- 4. Consider holiday caching optimization