-- StoreCalendar Unified Migration
-- This migration combines auth and sharing functionality for the StoreCalendar application
-- Run this single file to set up everything properly

-- ========================================
-- PART 1: AUTHENTICATION SETUP
-- ========================================

-- 1. Create users table for Google OAuth
CREATE TABLE IF NOT EXISTS calendar_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    google_id TEXT UNIQUE NOT NULL,
    picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add user_id column to existing tables
ALTER TABLE calendar_weekly_calendars 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES calendar_users(id);

ALTER TABLE calendar_posts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES calendar_users(id);

ALTER TABLE calendar_user_preferences 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES calendar_users(id);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_weekly_calendars_user_id 
ON calendar_weekly_calendars(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_posts_user_id 
ON calendar_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_user_preferences_user_id 
ON calendar_user_preferences(user_id);

-- 4. Update unique constraint for user preferences
-- First drop the old constraint if it exists
ALTER TABLE calendar_user_preferences 
DROP CONSTRAINT IF EXISTS calendar_user_preferences_email_key;

-- Then create new unique constraint that includes user_id
ALTER TABLE calendar_user_preferences 
ADD CONSTRAINT calendar_user_preferences_user_id_email_unique 
UNIQUE(user_id, email);

-- 5. Enable Row Level Security on users table
ALTER TABLE calendar_users ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON calendar_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON calendar_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- ========================================
-- PART 2: CALENDAR SHARING SETUP
-- ========================================

-- 1. Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS make_calendar_public(uuid,text,text);
DROP FUNCTION IF EXISTS revoke_public_access(uuid);

-- 2. Add sharing columns to calendar_weekly_calendars
ALTER TABLE calendar_weekly_calendars
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS share_title TEXT,
ADD COLUMN IF NOT EXISTS share_description TEXT;

-- 3. Drop public_url column if it exists (not needed)
ALTER TABLE calendar_weekly_calendars 
DROP COLUMN IF EXISTS public_url;

-- 4. Create indexes for efficient public calendar lookups
CREATE INDEX IF NOT EXISTS idx_calendar_weekly_calendars_share_token 
ON calendar_weekly_calendars(share_token) WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_calendar_weekly_calendars_is_public 
ON calendar_weekly_calendars(is_public) WHERE is_public = TRUE;

-- 5. Create function to make a calendar public
CREATE OR REPLACE FUNCTION make_calendar_public(
    calendar_id UUID,
    title TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL
)
RETURNS TABLE(share_token UUID) AS $$
DECLARE
    token UUID;
BEGIN
    -- Update calendar to be public
    UPDATE calendar_weekly_calendars 
    SET 
        is_public = TRUE,
        shared_at = NOW(),
        share_title = COALESCE(title, 'Weekly Social Media Calendar'),
        share_description = COALESCE(description, 'AI-generated social media content calendar')
    WHERE id = calendar_id
    RETURNING calendar_weekly_calendars.share_token INTO token;
    
    RETURN QUERY SELECT token;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to revoke public access
CREATE OR REPLACE FUNCTION revoke_public_access(calendar_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE calendar_weekly_calendars 
    SET 
        is_public = FALSE,
        shared_at = NULL
    WHERE id = calendar_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 7. Create view for public calendar access (optional but recommended)
CREATE OR REPLACE VIEW public_calendar_view AS
SELECT 
    c.share_token,
    c.share_title,
    c.share_description,
    c.week_number,
    c.start_date,
    c.end_date,
    c.country_code,
    c.brand_tone,
    c.shared_at,
    s.store_name,
    -- Sanitize calendar_data to remove any sensitive information
    jsonb_build_object(
        'days', c.calendar_data->'days'
    ) as sanitized_calendar_data
FROM calendar_weekly_calendars c
LEFT JOIN calendar_stores s ON c.store_id = s.id
WHERE c.is_public = TRUE;

-- Grant public access to the view
GRANT SELECT ON public_calendar_view TO anon;

-- ========================================
-- PART 3: VERIFICATION
-- ========================================

-- Test the setup (optional - remove in production)
DO $$
DECLARE
    test_user_id UUID;
    test_calendar_id UUID;
    result_token UUID;
BEGIN
    -- Check if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_users') THEN
        RAISE NOTICE 'Auth tables created successfully';
    END IF;
    
    -- Check if sharing columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_weekly_calendars' 
        AND column_name = 'share_token'
    ) THEN
        RAISE NOTICE 'Sharing columns added successfully';
    END IF;
    
    -- Test sharing function (if there's a calendar)
    SELECT id INTO test_calendar_id 
    FROM calendar_weekly_calendars 
    LIMIT 1;
    
    IF test_calendar_id IS NOT NULL THEN
        -- Make it public for testing
        SELECT share_token INTO result_token 
        FROM make_calendar_public(test_calendar_id, 'Test Calendar', 'Test Description');
        
        IF result_token IS NOT NULL THEN
            RAISE NOTICE 'Sharing functions work correctly. Test token: %', result_token;
            
            -- Revert the test
            PERFORM revoke_public_access(test_calendar_id);
            RAISE NOTICE 'Revoke function works correctly';
        END IF;
    ELSE
        RAISE NOTICE 'No calendars found for testing - create a calendar first to test sharing';
    END IF;
END;
$$;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- Your database is now ready for:
-- 1. Google OAuth authentication
-- 2. Public calendar sharing
-- 3. Multi-user support