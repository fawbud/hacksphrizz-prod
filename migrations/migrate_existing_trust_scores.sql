-- Migration script to convert existing trust scores from 0-100 to 0-1 scale
-- Run this AFTER creating the user_trust table

-- ============================================
-- STEP 1: Backup existing data (optional)
-- ============================================
-- CREATE TABLE queue_backup AS SELECT * FROM queue;
-- CREATE TABLE behavior_logs_backup AS SELECT * FROM behavior_logs;

-- ============================================
-- STEP 2: Migrate data from queue to user_trust
-- ============================================

-- Insert or update user_trust from existing queue data
-- Convert trust_score from 0-100 to 0-1 scale
INSERT INTO public.user_trust (user_id, trust_score, failed_attempts, blocked_until, created_at, updated_at)
SELECT
  user_id::uuid,  -- Cast to UUID
  CASE
    -- If trust_score is between 0-100, divide by 100
    WHEN trust_score > 1 THEN LEAST(trust_score / 100.0, 1.0)
    -- If already 0-1, use as is
    WHEN trust_score IS NOT NULL THEN LEAST(trust_score, 1.0)
    -- Default for NULL
    ELSE 0.1
  END as trust_score,
  0 as failed_attempts,  -- Start fresh with 0 failed attempts
  NULL as blocked_until,
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(updated_at, NOW()) as updated_at
FROM public.queue
WHERE user_id IS NOT NULL
ON CONFLICT (user_id)
DO UPDATE SET
  trust_score = EXCLUDED.trust_score,
  updated_at = NOW();

-- ============================================
-- STEP 3: Update queue table to use 0-1 scale
-- ============================================

-- Convert existing 0-100 scores to 0-1 in queue table
UPDATE public.queue
SET trust_score = CASE
  WHEN trust_score > 1 THEN LEAST(trust_score / 100.0, 1.0)
  ELSE LEAST(trust_score, 1.0)
END,
updated_at = NOW()
WHERE trust_score IS NOT NULL;

-- ============================================
-- STEP 4: Update behavior_logs to use 0-1 scale
-- ============================================

-- Convert existing 0-100 scores to 0-1 in behavior_logs
UPDATE public.behavior_logs
SET trust_score = CASE
  WHEN trust_score > 1 THEN LEAST(trust_score / 100.0, 1.0)
  ELSE LEAST(trust_score, 1.0)
END
WHERE trust_score IS NOT NULL;

-- ============================================
-- STEP 5: Update trust_level values to lowercase
-- ============================================

-- Standardize trust_level to lowercase
UPDATE public.queue
SET trust_level = LOWER(trust_level)
WHERE trust_level IS NOT NULL;

-- Map old trust levels to new scale
UPDATE public.queue
SET trust_level = CASE
  WHEN trust_score >= 0.75 THEN 'high'
  WHEN trust_score >= 0.60 THEN 'medium_high'
  WHEN trust_score >= 0.45 THEN 'medium'
  WHEN trust_score >= 0.30 THEN 'low'
  ELSE 'very_low'
END
WHERE trust_score IS NOT NULL;

-- ============================================
-- STEP 6: Verify migration
-- ============================================

-- Check user_trust scores (should all be 0-1)
SELECT
  user_id,
  trust_score,
  CASE
    WHEN trust_score > 1 THEN '❌ INVALID (>1)'
    WHEN trust_score < 0 THEN '❌ INVALID (<0)'
    WHEN trust_score >= 0.75 THEN '✅ High'
    WHEN trust_score >= 0.45 THEN '✅ Medium'
    ELSE '✅ Low'
  END as status
FROM public.user_trust
ORDER BY trust_score DESC
LIMIT 10;

-- Check queue scores (should all be 0-1)
SELECT
  user_id,
  trust_score,
  trust_level,
  CASE
    WHEN trust_score > 1 THEN '❌ INVALID (>1)'
    WHEN trust_score < 0 THEN '❌ INVALID (<0)'
    ELSE '✅ Valid'
  END as status
FROM public.queue
WHERE trust_score IS NOT NULL
ORDER BY trust_score DESC
LIMIT 10;

-- Count records by trust level
SELECT
  CASE
    WHEN trust_score >= 0.75 THEN 'high'
    WHEN trust_score >= 0.60 THEN 'medium_high'
    WHEN trust_score >= 0.45 THEN 'medium'
    WHEN trust_score >= 0.30 THEN 'low'
    ELSE 'very_low'
  END as trust_category,
  COUNT(*) as user_count,
  ROUND(AVG(trust_score)::numeric, 2) as avg_score
FROM public.user_trust
GROUP BY trust_category
ORDER BY avg_score DESC;

-- ============================================
-- STEP 7: Optional - Set default scores for users with NULL
-- ============================================

-- Set default 0.1 for users with NULL scores
UPDATE public.user_trust
SET trust_score = 0.1,
    updated_at = NOW()
WHERE trust_score IS NULL;

UPDATE public.queue
SET trust_score = 0.1,
    trust_level = 'very_low',
    updated_at = NOW()
WHERE trust_score IS NULL;

-- ============================================
-- STEP 8: Add constraints (if not exists)
-- ============================================

-- Ensure trust_score is within valid range for queue table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'queue_trust_score_check'
  ) THEN
    ALTER TABLE public.queue
    ADD CONSTRAINT queue_trust_score_check
    CHECK (trust_score IS NULL OR (trust_score >= 0 AND trust_score <= 1));
  END IF;
END $$;

-- Ensure trust_score is within valid range for behavior_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'behavior_logs_trust_score_check'
  ) THEN
    ALTER TABLE public.behavior_logs
    ADD CONSTRAINT behavior_logs_trust_score_check
    CHECK (trust_score IS NULL OR (trust_score >= 0 AND trust_score <= 1));
  END IF;
END $$;

-- ============================================
-- STEP 9: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_trust_score_range
ON public.user_trust(trust_score)
WHERE trust_score <= 0.45;

CREATE INDEX IF NOT EXISTS idx_queue_trust_score_range
ON public.queue(trust_score)
WHERE trust_score <= 0.45;

-- ============================================
-- FINAL VALIDATION
-- ============================================

-- Show summary statistics
SELECT
  'user_trust' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN trust_score > 1 THEN 1 END) as invalid_high,
  COUNT(CASE WHEN trust_score < 0 THEN 1 END) as invalid_low,
  ROUND(AVG(trust_score)::numeric, 2) as avg_score,
  ROUND(MIN(trust_score)::numeric, 2) as min_score,
  ROUND(MAX(trust_score)::numeric, 2) as max_score
FROM public.user_trust

UNION ALL

SELECT
  'queue' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN trust_score > 1 THEN 1 END) as invalid_high,
  COUNT(CASE WHEN trust_score < 0 THEN 1 END) as invalid_low,
  ROUND(AVG(trust_score)::numeric, 2) as avg_score,
  ROUND(MIN(trust_score)::numeric, 2) as min_score,
  ROUND(MAX(trust_score)::numeric, 2) as max_score
FROM public.queue
WHERE trust_score IS NOT NULL

UNION ALL

SELECT
  'behavior_logs' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN trust_score > 1 THEN 1 END) as invalid_high,
  COUNT(CASE WHEN trust_score < 0 THEN 1 END) as invalid_low,
  ROUND(AVG(trust_score)::numeric, 2) as avg_score,
  ROUND(MIN(trust_score)::numeric, 2) as min_score,
  ROUND(MAX(trust_score)::numeric, 2) as max_score
FROM public.behavior_logs
WHERE trust_score IS NOT NULL;

-- ============================================
-- NOTES:
-- ============================================
-- 1. All trust scores are now 0.00 to 1.00
-- 2. Trust levels are lowercase: 'high', 'medium_high', 'medium', 'low', 'very_low'
-- 3. user_trust table is the primary source of truth
-- 4. queue table is kept for backward compatibility
-- 5. behavior_logs stores historical data in 0-1 scale
-- 6. Realtime is enabled on user_trust table
-- 7. Constraints ensure scores stay within valid range
-- ============================================

COMMIT;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 All trust scores converted to 0-1 scale';
  RAISE NOTICE '🔄 Realtime enabled on user_trust table';
  RAISE NOTICE '✨ Run the validation queries above to verify';
END $$;
