-- Migration script to add trust score functionality
-- Run this in your Supabase SQL editor

-- Add trust_score and trust_level columns to queue table
ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT NULL;

-- Add trust_score column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(3,2) DEFAULT NULL;

-- Create behavior_logs table for analytics
CREATE TABLE IF NOT EXISTS behavior_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_agent TEXT,
    behavior_data JSONB NOT NULL,
    trust_score DECIMAL(3,2),
    trust_level VARCHAR(20),
    ai_analysis JSONB,
    flagged_patterns TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_behavior_logs_session_id ON behavior_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_trust_score ON behavior_logs(trust_score);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_created_at ON behavior_logs(created_at);

-- Create index for queue trust scores
CREATE INDEX IF NOT EXISTS idx_queue_trust_score ON queue(trust_score);

-- Create index for bookings trust scores  
CREATE INDEX IF NOT EXISTS idx_bookings_trust_score ON bookings(trust_score);

-- Enable RLS (Row Level Security) on behavior_logs table
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for behavior_logs (adjust based on your auth setup)
CREATE POLICY "Users can access their own behavior logs" ON behavior_logs
    FOR ALL USING (true); -- Temporarily allow all access, adjust for production

-- Add comments for documentation
COMMENT ON TABLE behavior_logs IS 'Stores user behavior data and AI trust scores for bot detection';
COMMENT ON COLUMN behavior_logs.behavior_data IS 'JSON object containing mouse, keyboard, and form interaction data';
COMMENT ON COLUMN behavior_logs.ai_analysis IS 'JSON object containing AI analysis results and component scores';
COMMENT ON COLUMN behavior_logs.flagged_patterns IS 'Array of suspicious behavior patterns detected';

COMMENT ON COLUMN queue.trust_score IS 'AI-calculated trust score (0.0-1.0) for bot detection';
COMMENT ON COLUMN queue.trust_level IS 'Human-readable trust level (high/medium/low/suspicious)';
COMMENT ON COLUMN bookings.trust_score IS 'Trust score at time of booking completion';