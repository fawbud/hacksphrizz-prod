-- Setup user_trust with default 0.1 trust score
-- This script:
-- 1. Creates user_trust entries for all existing users (0.1 default)
-- 2. Sets up automatic user_trust creation for new users

-- ============================================
-- STEP 1: Create user_trust for all existing users from auth.users
-- ============================================

-- Insert user_trust for all auth users that don't have one yet
INSERT INTO public.user_trust (user_id, trust_score, failed_attempts, blocked_until, created_at, updated_at)
SELECT
  id::uuid as user_id,
  0.1 as trust_score,  -- Default 0.1 (10%) trust score
  0 as failed_attempts,
  NULL as blocked_until,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_trust WHERE user_trust.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- STEP 2: Create trigger function for new user registration
-- ============================================

-- Function to automatically create user_trust entry when new user signs up
CREATE OR REPLACE FUNCTION public.create_user_trust_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user_trust with default 0.1 score
  INSERT INTO public.user_trust (user_id, trust_score, failed_attempts, blocked_until, created_at, updated_at)
  VALUES (
    NEW.id,
    0.1,  -- Default trust score 10%
    0,    -- No failed attempts
    NULL, -- Not blocked
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create trigger on auth.users
-- ============================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that runs after new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_trust_on_signup();

-- ============================================
-- STEP 4: Create helper function to get or create user trust
-- ============================================

-- Function to get user trust, creating if doesn't exist
CREATE OR REPLACE FUNCTION public.get_or_create_user_trust(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  trust_score DECIMAL(3,2),
  failed_attempts INTEGER,
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Try to get existing record
  RETURN QUERY
  SELECT
    ut.user_id,
    ut.trust_score,
    ut.failed_attempts,
    ut.blocked_until,
    ut.updated_at
  FROM public.user_trust ut
  WHERE ut.user_id = p_user_id;

  -- If no record found, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_trust (user_id, trust_score, failed_attempts, blocked_until, created_at, updated_at)
    VALUES (p_user_id, 0.1, 0, NULL, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Return the newly created record
    RETURN QUERY
    SELECT
      ut.user_id,
      ut.trust_score,
      ut.failed_attempts,
      ut.blocked_until,
      ut.updated_at
    FROM public.user_trust ut
    WHERE ut.user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Verify and display results
-- ============================================

-- Show count of users with trust scores
SELECT
  'Users in auth.users' as category,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT
  'Users in user_trust' as category,
  COUNT(*) as count
FROM public.user_trust

UNION ALL

SELECT
  'Users missing trust score' as category,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.user_trust ut ON u.id = ut.user_id
WHERE ut.user_id IS NULL;

-- Show sample of created user_trust records
SELECT
  user_id,
  trust_score,
  failed_attempts,
  blocked_until,
  created_at,
  updated_at
FROM public.user_trust
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 6: Grant necessary permissions
-- ============================================

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.get_or_create_user_trust(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_trust(UUID) TO service_role;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  total_users INTEGER;
  total_trust INTEGER;
  missing_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_trust FROM public.user_trust;
  SELECT COUNT(*) INTO missing_users
  FROM auth.users u
  LEFT JOIN public.user_trust ut ON u.id = ut.user_id
  WHERE ut.user_id IS NULL;

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ User Trust Setup Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total users in system: %', total_users;
  RAISE NOTICE 'Users with trust scores: %', total_trust;
  RAISE NOTICE 'Users missing trust scores: %', missing_users;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Default trust score: 0.1 (10%%)';
  RAISE NOTICE '🔄 Auto-creation enabled for new users';
  RAISE NOTICE '✨ Trigger installed on auth.users';
  RAISE NOTICE '============================================';
END $$;

COMMIT;
