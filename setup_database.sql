-- Create database tables for behavior tracking system
-- Run this in your Supabase SQL editor

-- Create behavior_logs table
CREATE TABLE IF NOT EXISTS public.behavior_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    behavior_data JSONB NOT NULL,
    trust_score DECIMAL(5,4),
    analysis_method VARCHAR(50) DEFAULT 'rule_based',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trust_scores table
CREATE TABLE IF NOT EXISTS public.trust_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    trust_score DECIMAL(5,4) NOT NULL,
    analysis_method VARCHAR(50) DEFAULT 'rule_based',
    behavior_summary JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_id ON public.behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_created_at ON public.behavior_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_trust_scores_user_id ON public.trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_expires_at ON public.trust_scores(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY IF NOT EXISTS "Enable read access for service role" ON public.behavior_logs
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Enable insert access for service role" ON public.behavior_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Enable read access for service role" ON public.trust_scores
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Enable insert access for service role" ON public.trust_scores
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Enable update access for service role" ON public.trust_scores
    FOR UPDATE USING (auth.role() = 'service_role');

-- Add helpful functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER IF NOT EXISTS update_behavior_logs_updated_at
    BEFORE UPDATE ON public.behavior_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired trust scores
CREATE OR REPLACE FUNCTION cleanup_expired_trust_scores()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.trust_scores WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up automatic cleanup (uncomment if you want automatic cleanup)
-- SELECT cron.schedule('cleanup-trust-scores', '0 * * * *', 'SELECT cleanup_expired_trust_scores();');

COMMIT;