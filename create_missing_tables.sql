-- ========================================
-- CREATE MISSING TABLES FOR BEHAVIOR TRACKING
-- ========================================
-- Run this SQL in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. Create 'queue' table for trust scores
CREATE TABLE IF NOT EXISTS public.queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  trust_score integer NOT NULL DEFAULT 100,
  trust_level text NOT NULL DEFAULT 'High',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT queue_pkey PRIMARY KEY (id),
  CONSTRAINT queue_user_id_unique UNIQUE (user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON public.queue(user_id);

-- Add comment
COMMENT ON TABLE public.queue IS 'Stores user trust scores for bot detection';

-- ========================================

-- 2. Create 'behavior_logs' table for behavior data
CREATE TABLE IF NOT EXISTS public.behavior_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  behavior_data jsonb NOT NULL,
  trust_score integer NOT NULL,
  analysis_method text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT behavior_logs_pkey PRIMARY KEY (id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_id ON public.behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_created_at ON public.behavior_logs(created_at DESC);

-- Add comment
COMMENT ON TABLE public.behavior_logs IS 'Stores detailed behavior tracking data for analysis';

-- ========================================

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_logs ENABLE ROW LEVEL SECURITY;

-- ========================================

-- 4. Create RLS Policies

-- Queue policies
CREATE POLICY "Allow service role full access to queue"
ON public.queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view their own trust score"
ON public.queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Behavior logs policies
CREATE POLICY "Allow service role full access to behavior_logs"
ON public.behavior_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view their own behavior logs"
ON public.behavior_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- ========================================

-- 5. Grant permissions
GRANT ALL ON public.queue TO service_role;
GRANT SELECT ON public.queue TO authenticated;
GRANT ALL ON public.behavior_logs TO service_role;
GRANT SELECT ON public.behavior_logs TO authenticated;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('queue', 'behavior_logs')
ORDER BY table_name;

-- Check queue table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'queue'
ORDER BY ordinal_position;

-- Check behavior_logs table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'behavior_logs'
ORDER BY ordinal_position;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT 'Tables created successfully! You can now use the behavior tracking system.' as status;
