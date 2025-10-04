# Trust Score Migration Summary

## ✅ What Was Fixed

### 1. **UUID Type Error** ✅
**Problem:** Migration failed with "column user_id is of type uuid but expression is of type text"

**Solution:** Added explicit UUID casting
```sql
-- Before
user_id,

-- After
user_id::uuid,  -- Explicit cast to UUID
```

### 2. **Default Trust Score Changed** ✅
**Changed from:** 0.7 (70%) - Too generous
**Changed to:** 0.1 (10%) - Security-first approach

**Why 0.1?**
- All users must prove they're human
- No free pass for anyone
- Progressive trust building
- Better bot detection

### 3. **Automatic User Trust Creation** ✅
**Problem:** New users didn't get trust scores automatically

**Solution:** Database trigger on `auth.users`
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_trust_on_signup();
```

Now every new user automatically gets:
- `trust_score = 0.1`
- `failed_attempts = 0`
- `blocked_until = null`

---

## 📁 Migration Files

### File 1: `migrations/create_user_trust_table.sql`
**Purpose:** Create the user_trust table structure
- Creates table with UUID primary key
- Enables realtime
- Sets up RLS policies
- Creates indexes
- Adds constraints

**Run this FIRST** ✅

### File 2: `migrations/setup_user_trust_defaults.sql`
**Purpose:** Populate existing users and setup auto-creation
- Inserts 0.1 trust score for ALL existing auth.users
- Creates trigger for new user signups
- Creates helper function `get_or_create_user_trust()`
- Shows verification queries

**Run this SECOND** ✅

### File 3: `migrations/migrate_existing_trust_scores.sql` (Optional)
**Purpose:** Convert old 0-100 scores to 0-1 scale
- Converts queue table scores
- Converts behavior_logs scores
- Adds constraints
- Only needed if you have existing data in those tables

**Run this THIRD (if needed)** ⚠️

---

## 🔧 Code Changes Made

### API Endpoints Updated:

#### `/api/behavior/track/route.js`
```javascript
// Default trust score for GET requests
const trustScore = data ? data.trust_score : 0.1; // Was 0.7
const trustLevel = data?.trust_level || 'very_low';  // Was 'medium_high'
```

#### `/api/precheck-trust/route.js`
```javascript
// Create new user with 0.1 trust
if (!trustRow) {
  await supabase.from("user_trust").insert({
    user_id,
    trust_score: 0.1  // Was 0.7
  });
}
```

#### `/api/verify-captcha/route.js`
```javascript
// Default for new users
trustRow = {
  trust_score: 0.1,  // Was 0.7
  failed_attempts: 0,
  blocked_until: null
};
```

### React Hooks Updated:

#### `src/hooks/useRealtimeTrustScore.js`
```javascript
// Default when user not found
const defaultState = {
  trustScore: 0.1,        // Was 0.7
  needsCaptcha: true,     // Was false (now true because 0.1 ≤ 0.45)
  // ... other fields
};
```

---

## 📊 Trust Score Flow (0.1 Default)

### New User Journey:
```
1. User Signs Up
   ↓
   Trigger fires → INSERT INTO user_trust (trust_score = 0.1)
   ↓
2. User Navigates to /book
   ↓
   useRealtimeTrustScore fetches → 0.1
   ↓
   0.1 ≤ 0.45 → Captcha Required ✅
   ↓
3. User Completes Captcha
   ↓
   trust_score += 0.15 → 0.25
   ↓
   Still ≤ 0.45 → Captcha Still Required ✅
   ↓
4. User Completes 2nd Captcha
   ↓
   trust_score += 0.15 → 0.40
   ↓
   Still ≤ 0.45 → Captcha Still Required ✅
   ↓
5. User Completes 3rd Captcha
   ↓
   trust_score += 0.15 → 0.55
   ↓
   0.55 > 0.45 → No Captcha Needed ✅
   ↓
6. User Can Proceed
```

### Trust Score Progression:
| Captchas Completed | Trust Score | Captcha Required? |
|-------------------|-------------|-------------------|
| 0 (New User) | 0.10 (10%) | ✅ Yes |
| 1 | 0.25 (25%) | ✅ Yes |
| 2 | 0.40 (40%) | ✅ Yes |
| 3 | 0.55 (55%) | ❌ No |
| 4 | 0.70 (70%) | ❌ No |
| 5 | 0.85 (85%) | ❌ No |
| 6 | 1.00 (100%) | ❌ No |

---

## 🚀 Deployment Steps

### Step 1: Backup (Recommended)
```sql
-- Backup existing data
CREATE TABLE queue_backup AS SELECT * FROM queue;
CREATE TABLE behavior_logs_backup AS SELECT * FROM behavior_logs;
CREATE TABLE user_trust_backup AS SELECT * FROM user_trust;
```

### Step 2: Run Migrations
```bash
# In Supabase SQL Editor, run in order:

1. migrations/create_user_trust_table.sql
2. migrations/setup_user_trust_defaults.sql
3. migrations/migrate_existing_trust_scores.sql (if needed)
```

### Step 3: Enable Realtime
```sql
-- Verify realtime is enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_trust';

-- If not found, run:
ALTER PUBLICATION supabase_realtime ADD TABLE user_trust;
```

### Step 4: Verify Setup
```sql
-- Check all users have trust scores
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM user_trust) as users_with_trust,
  (SELECT COUNT(*) FROM user_trust WHERE trust_score = 0.1) as users_at_default;

-- Should show:
-- total_users = users_with_trust
-- users_at_default > 0 (or = total_users if all are new)
```

### Step 5: Test
1. Sign up new user → Should get trust_score = 0.1
2. Go to /book page → Captcha should show
3. Complete captcha → Score should increase to 0.25
4. Check realtime → Updates should appear in console

---

## 🔍 Verification Queries

### Check User Trust Scores
```sql
SELECT
  user_id,
  trust_score,
  failed_attempts,
  blocked_until,
  created_at
FROM user_trust
ORDER BY created_at DESC
LIMIT 20;
```

### Find Users Without Trust Scores
```sql
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN user_trust ut ON u.id = ut.user_id
WHERE ut.user_id IS NULL;

-- Should return 0 rows after migration
```

### Check Trust Score Distribution
```sql
SELECT
  CASE
    WHEN trust_score >= 0.75 THEN 'High (0.75-1.0)'
    WHEN trust_score >= 0.45 THEN 'Medium (0.45-0.74)'
    WHEN trust_score >= 0.1 THEN 'Low (0.1-0.44)'
    ELSE 'Very Low (0-0.09)'
  END as trust_category,
  COUNT(*) as user_count,
  ROUND(AVG(trust_score)::numeric, 2) as avg_score
FROM user_trust
GROUP BY trust_category
ORDER BY avg_score DESC;
```

### Check Trigger Exists
```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Should return 1 row showing the trigger
```

---

## 📈 Expected Results

### After Migration:
- ✅ All existing users have `trust_score = 0.1`
- ✅ New signups automatically get `trust_score = 0.1`
- ✅ Captcha shows for all users initially
- ✅ Trust increases by 0.15 per successful captcha
- ✅ Real-time updates work without page refresh

### Database State:
```sql
-- All users in user_trust
SELECT COUNT(*) FROM user_trust;  -- Should match auth.users count

-- All scores are 0.1 for new system
SELECT COUNT(*) FROM user_trust WHERE trust_score = 0.1;  -- Should be > 0

-- Trigger is active
SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created';  -- Should be 1
```

---

## 🚨 Common Issues & Fixes

### Issue 1: UUID Type Error
**Error:** `column "user_id" is of type uuid but expression is of type text`

**Fix:** Migration script now includes `::uuid` cast
```sql
user_id::uuid  -- Explicit casting
```

### Issue 2: No Trust Scores Created
**Check:**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Fix:** Re-run `setup_user_trust_defaults.sql`

### Issue 3: Realtime Not Working
**Check:**
```sql
SELECT * FROM pg_publication_tables
WHERE tablename = 'user_trust';
```

**Fix:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_trust;
```

### Issue 4: Users Still Have High Trust
**Check:**
```sql
SELECT user_id, trust_score FROM user_trust
WHERE trust_score > 0.1;
```

**Fix:** Reset to 0.1
```sql
UPDATE user_trust SET trust_score = 0.1, updated_at = NOW();
```

---

## 🎯 Summary

### What Changed:
| Aspect | Before | After |
|--------|--------|-------|
| Default Trust | 0.7 (70%) | 0.1 (10%) |
| New Users | Manual creation | Auto-created via trigger |
| Captcha Required | Only if score ≤ 0.45 | All new users (0.1 ≤ 0.45) |
| Trust Progression | Fast (high start) | Gradual (low start) |
| Security | Moderate | Strict |

### Files Created:
1. ✅ `migrations/create_user_trust_table.sql`
2. ✅ `migrations/setup_user_trust_defaults.sql`
3. ✅ `migrations/migrate_existing_trust_scores.sql`
4. ✅ `SETUP_TRUST_SCORE_0.1_DEFAULT.md`
5. ✅ `TRUST_SCORE_MIGRATION_SUMMARY.md` (this file)

### API Updates:
1. ✅ `/api/behavior/track/route.js` - Default 0.1
2. ✅ `/api/precheck-trust/route.js` - Default 0.1
3. ✅ `/api/verify-captcha/route.js` - Default 0.1

### Hook Updates:
1. ✅ `src/hooks/useRealtimeTrustScore.js` - Default 0.1, captcha required

---

## ✨ Benefits of 0.1 Default

1. **Better Security** 🔒
   - All users must verify they're human
   - No free pass for anyone
   - Bots are immediately identified

2. **Progressive Trust** 📈
   - Users build trust over time
   - Each captcha completion increases score
   - Legitimate users reach high trust quickly (3 captchas)

3. **Fair System** ⚖️
   - Everyone starts equal
   - Trust is earned, not given
   - Transparent progression

4. **Bot Detection** 🤖
   - Bots unlikely to complete multiple captchas
   - Automated tools filtered out
   - Real users proceed smoothly

---

**Migration Status:** ✅ Complete
**Default Trust Score:** 0.1 (10%)
**Captcha Threshold:** ≤0.45 (45%)
**Auto-Creation:** ✅ Enabled
**Realtime:** ✅ Enabled

**Date:** 2025-10-04
