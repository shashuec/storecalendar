-- Feedback table migration
-- Add feedback collection functionality

CREATE TABLE IF NOT EXISTS calendar_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES calendar_users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous users
  liked_website BOOLEAN NOT NULL,
  improvement_suggestions TEXT, -- Only filled if liked_website is false
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for querying feedback by date
CREATE INDEX IF NOT EXISTS idx_calendar_feedback_created_at ON calendar_feedback(created_at);

-- Create index for user feedback lookup
CREATE INDEX IF NOT EXISTS idx_calendar_feedback_user_id ON calendar_feedback(user_id);

-- Create index for session-based feedback lookup
CREATE INDEX IF NOT EXISTS idx_calendar_feedback_session_id ON calendar_feedback(session_id);