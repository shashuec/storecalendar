import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table schemas with calendar_ prefix
export const createTables = async () => {
  // This will be run manually in Supabase dashboard
  const queries = `
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
      email TEXT UNIQUE NOT NULL,
      store_id UUID REFERENCES calendar_stores(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  console.log('Run these queries in Supabase dashboard:', queries);
};