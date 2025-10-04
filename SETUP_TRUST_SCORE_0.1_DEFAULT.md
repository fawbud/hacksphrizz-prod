# Trust Score Setup - 0.1 Default for All Users

## 🎯 Overview
This guide sets up the trust score system with **0.1 (10%)** as the default trust score for all users. This ensures:
- ✅ All users start with low trust and **must verify via captcha**
- ✅ Existing users get 0.1 trust score automatically
- ✅ New users get 0.1 trust score on signup
- ✅ Real-time updates work properly

---

## 📋 Step-by-Step Setup

### Step 1: Create user_trust Table
Run this SQL in Supabase SQL Editor:

```bash
migrations/create_user_trust_table.sql
```

This creates:
- `user_trust` table with proper structure
- Realtime publication
- RLS policies
- Indexes for performance

---

### Step 2: Setup Default 0.1 Trust Score
Run this SQL in Supabase SQL Editor:

```bash
migrations/setup_user_trust_defaults.sql
```

This will:
- ✅ Create `user_trust` entries for **ALL existing users** with 0.1 trust score
- ✅ Install trigger to auto-create `user_trust` for **new signups** with 0.1
- ✅ Create helper function `get_or_create_user_trust()`
- ✅ Show summary of results

---

### Step 3: Enable Realtime (IMPORTANT!)

**Option A: Via Supabase Dashboard**
1. Go to **Database → Replication**
2. Find `user_trust` table
3. Ensure it's checked/enabled
4. Save changes

**Option B: Via SQL**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_trust;
```

---

### Step 4: Verify Setup

Run this query to verify:

```sql
-- Check if users have trust scores
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.user_trust) as users_with_trust,
  (SELECT COUNT(*) FROM auth.users u
   LEFT JOIN public.user_trust ut ON u.id = ut.user_id
   WHERE ut.user_id IS NULL) as users_missing_trust;

-- Show sample of trust scores
SELECT user_id, trust_score, failed_attempts, created_at
FROM public.user_trust
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- `total_users` = `users_with_trust` (all users should have trust scores)
- `users_missing_trust` = 0
- All `trust_score` values should be 0.10

---

## 🔧 How It Works

### For Existing Users
```sql
-- Run once to populate all existing users
INSERT INTO public.user_trust (user_id, trust_score, failed_attempts)
SELECT id, 0.1, 0
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_trust WHERE user_id = users.id
);
```

### For New Users (Automatic)
```sql
-- Trigger automatically runs on every new signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_trust_on_signup();
```

The trigger function creates:
```javascript
{
  user_id: new_user.id,
  trust_score: 0.1,     // 10% - requires captcha
  failed_attempts: 0,
  blocked_until: null
}
```

---

## 🎯 Default Trust Score: 0.1

### Why 0.1 (10%)?
- **Security First**: All users must prove they're human via captcha
- **No Free Pass**: Even existing users need verification
- **Progressive Trust**: Users gain trust (up to 1.0) by completing captchas

### Trust Score Progression
```
New User:          0.1 (10%)  → Must complete captcha
After 1st Captcha: 0.25 (25%) → Still requires captcha (≤0.45)
After 2nd Captcha: 0.40 (40%) → Still requires captcha
After 3rd Captcha: 0.55 (55%) → ✅ Above threshold, no captcha needed
After 4th Captcha: 0.70 (70%) → Good trust
Maximum:           1.0 (100%) → Perfect trust
```

### Captcha Boost
Each successful captcha: **+0.15 (15%)**

---

## 🔄 API Updates

All APIs now default to **0.1** instead of 0.7:

### `/api/behavior/track` (GET)
```javascript
const trustScore = data ? data.trust_score : 0.1;  // Changed from 0.7
```

### `/api/precheck-trust` (POST)
```javascript
if (!trustRow) {
  await supabase.from("user_trust").insert({
    user_id,
    trust_score: 0.1  // Changed from 0.7
  });
}
```

### `/api/verify-captcha` (POST)
```javascript
// On success: trust_score += 0.15
const newTrustScore = Math.min(trustRow.trust_score + 0.15, 1.0);
```

---

## 📊 Database Structure

### user_trust Table
```sql
CREATE TABLE public.user_trust (
  user_id UUID PRIMARY KEY,
  trust_score DECIMAL(3,2) DEFAULT 0.10,  -- Default 0.1
  failed_attempts INTEGER DEFAULT 0,
  blocked_until TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Trust Score Scale (0.00 - 1.00)
| Score | Percentage | Level | Captcha? |
|-------|------------|-------|----------|
| 0.00-0.29 | 0-29% | Very Low | ✅ Yes |
| 0.30-0.44 | 30-44% | Low | ✅ Yes |
| 0.45-0.59 | 45-59% | Medium | ❌ No |
| 0.60-0.74 | 60-74% | Medium-High | ❌ No |
| 0.75-1.00 | 75-100% | High | ❌ No |

**Captcha Threshold:** ≤ 0.45 (45%)

---

## 🧪 Testing

### Test New User Creation
1. Sign up a new user
2. Check `user_trust` table:
   ```sql
   SELECT * FROM user_trust WHERE user_id = 'new_user_uuid';
   ```
3. Should see:
   - `trust_score = 0.10`
   - `failed_attempts = 0`
   - `blocked_until = null`

### Test Captcha Flow
1. Login as user (trust_score = 0.1)
2. Navigate to `/book` page
3. Captcha should show automatically (0.1 ≤ 0.45)
4. Complete captcha successfully
5. Check database - score should be 0.25 (0.1 + 0.15)
6. Captcha still shows (0.25 ≤ 0.45)
7. Complete 2 more captchas
8. Score should be 0.55 (0.1 + 0.15 + 0.15 + 0.15)
9. Captcha should hide (0.55 > 0.45) ✅

### Test Real-time Updates
1. Open book page in browser
2. Open browser console
3. In another tab, manually update trust score:
   ```sql
   UPDATE user_trust
   SET trust_score = 0.3
   WHERE user_id = 'your_user_uuid';
   ```
4. Check console - should see:
   ```
   🔔 Real-time trust score update received
   📊 Trust score updated: 0.3
   ```
5. UI should update automatically without refresh

---

## 🚨 Troubleshooting

### Issue: Users have NULL trust_score
**Fix:**
```sql
UPDATE user_trust
SET trust_score = 0.1
WHERE trust_score IS NULL;
```

### Issue: New users don't get trust score
**Fix:** Check if trigger exists
```sql
SELECT * FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```
If not found, re-run `setup_user_trust_defaults.sql`

### Issue: Realtime not working
**Fix:**
```sql
-- Check publication
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_trust';

-- If empty, add table
ALTER PUBLICATION supabase_realtime ADD TABLE user_trust;
```

### Issue: UUID type error in migration
The migration script has been fixed to cast user_id properly:
```sql
user_id::uuid  -- Explicit cast to UUID type
```

---

## 📝 Summary

### What Changed
- ✅ Default trust score: **0.7 → 0.1**
- ✅ All existing users: **Set to 0.1**
- ✅ All new users: **Start at 0.1**
- ✅ Auto-creation trigger: **Installed**
- ✅ Helper function: **Available**
- ✅ Realtime: **Enabled**

### User Experience
1. **New user signs up** → trust_score = 0.1
2. **User goes to book page** → Captcha shows (0.1 ≤ 0.45)
3. **User completes captcha** → trust_score = 0.25
4. **Captcha shows again** (0.25 ≤ 0.45)
5. **User completes 2nd captcha** → trust_score = 0.40
6. **Captcha shows again** (0.40 ≤ 0.45)
7. **User completes 3rd captcha** → trust_score = 0.55
8. **Captcha hides** ✅ (0.55 > 0.45)
9. **User can now proceed** without captcha

### Security Benefits
- 🔒 No user gets free access
- 🔒 All must verify they're human
- 🔒 Progressive trust building
- 🔒 Failed attempts tracked
- 🔒 Automatic blocking after 5 failures
- 🔒 Real-time monitoring

---

## 🎯 Next Steps

1. ✅ Run `create_user_trust_table.sql`
2. ✅ Run `setup_user_trust_defaults.sql`
3. ✅ Enable realtime in Supabase
4. ✅ Test with new user signup
5. ✅ Test captcha flow
6. ✅ Monitor real-time updates

---

**Status:** Ready to Deploy
**Default Trust Score:** 0.1 (10%)
**Captcha Threshold:** ≤0.45 (45%)
**Updated:** 2025-10-04
