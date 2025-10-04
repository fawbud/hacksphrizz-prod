-- Create user_trust table for real-time trust score tracking
-- This table stores user trust scores on a 0-1 scale with real-time updates

CREATE TABLE IF NOT EXISTS public.user_trust (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trust_score DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (trust_score >= 0 AND trust_score <= 1),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_trust_score ON public.user_trust(trust_score);
CREATE INDEX IF NOT EXISTS idx_user_trust_blocked ON public.user_trust(blocked_until) WHERE blocked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_trust_updated_at ON public.user_trust(updated_at);

-- Enable Row Level Security
ALTER TABLE public.user_trust ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (for API operations)
CREATE POLICY "Enable read access for service role" ON public.user_trust
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert access for service role" ON public.user_trust
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update access for service role" ON public.user_trust
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create policies for authenticated users to read their own trust score
CREATE POLICY "Users can read own trust score" ON public.user_trust
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_trust_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_user_trust_timestamp
  BEFORE UPDATE ON public.user_trust
  FOR EACH ROW
  EXECUTE FUNCTION update_user_trust_updated_at();

-- Create function to auto-unblock users after blocked_until expires
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.user_trust
  SET blocked_until = NULL
  WHERE blocked_until IS NOT NULL
    AND blocked_until < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.user_trust IS 'Stores user trust scores (0-1 scale) for bot detection and adaptive CAPTCHA';
COMMENT ON COLUMN public.user_trust.trust_score IS 'Trust score from 0.00 to 1.00 (higher = more trusted)';
COMMENT ON COLUMN public.user_trust.failed_attempts IS 'Count of failed CAPTCHA attempts';
COMMENT ON COLUMN public.user_trust.blocked_until IS 'Timestamp when user will be unblocked (NULL = not blocked)';
COMMENT ON COLUMN public.user_trust.updated_at IS 'Last time trust score was updated';

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_trust;

COMMIT;
