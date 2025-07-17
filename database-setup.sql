-- StoreCalendar Database Setup
-- Run these commands in your Supabase SQL Editor

-- Stores table
CREATE TABLE IF NOT EXISTS calendar_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_url TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS calendar_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES calendar_stores(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  shopify_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for product upserts (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'calendar_products_store_shopify_unique'
    ) THEN
        ALTER TABLE calendar_products 
        ADD CONSTRAINT calendar_products_store_shopify_unique 
        UNIQUE (store_id, shopify_product_id);
    END IF;
END $$;

-- Captions table
CREATE TABLE IF NOT EXISTS calendar_captions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES calendar_products(id) ON DELETE CASCADE,
  caption_text TEXT NOT NULL,
  caption_style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS calendar_rate_limits (
  ip_address TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  daily_limit INTEGER DEFAULT 10
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS calendar_daily_stats (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  total_requests INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emails table (for progressive collection)
CREATE TABLE IF NOT EXISTS calendar_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  store_id UUID REFERENCES calendar_stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for email per store (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'calendar_emails_unique'
    ) THEN
        ALTER TABLE calendar_emails 
        ADD CONSTRAINT calendar_emails_unique 
        UNIQUE (email, store_id);
    END IF;
END $$;

-- OpenAI logs table (simplified for cost tracking)
CREATE TABLE IF NOT EXISTS calendar_openai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES calendar_stores(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'gpt-4o',
  total_tokens INTEGER,
  cost_cents INTEGER, -- Cost in cents for easy tracking
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_stores_url ON calendar_stores(shopify_url);
CREATE INDEX IF NOT EXISTS idx_calendar_products_store ON calendar_products(store_id);
CREATE INDEX IF NOT EXISTS idx_calendar_captions_product ON calendar_captions(product_id);
CREATE INDEX IF NOT EXISTS idx_calendar_openai_logs_store ON calendar_openai_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_calendar_openai_logs_date ON calendar_openai_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_emails_store ON calendar_emails(store_id);

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename LIKE 'calendar_%'
ORDER BY tablename;