# Quick Start: Trust Score Migration

## 🚀 Run These 2 SQL Scripts in Order

### Step 1: Create Table ✅
Copy and paste this entire file into Supabase SQL Editor:
```
migrations/create_user_trust_table.sql
```
Click **RUN**

---

### Step 2: Setup Defaults & Auto-Creation ✅
Copy and paste this entire file into Supabase SQL Editor:
```
migrations/setup_user_trust_defaults.sql
```
Click **RUN**

You should see:
```
✅ User Trust Setup Complete!
Total users in system: X
Users with trust scores: X
Users missing trust scores: 0

📊 Default trust score: 0.1 (10%)
🔄 Auto-creation enabled for new users
✨ Trigger installed on auth.users
```

---

### Step 3: Enable Realtime 🔄

**Option A: Supabase Dashboard**
1. Go to **Database** → **Replication**
2. Find `user_trust` in the list
3. Check the box to enable it
4. Click **Save**

**Option B: SQL Command**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_trust;
```

---

## ✅ Verify Everything Works

Run this query:
```sql
-- Should show all users have trust scores
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.user_trust) as users_with_trust,
  (SELECT COUNT(*) FROM public.user_trust WHERE trust_score = 0.1) as default_trust_users;
```

**Expected:**
- `total_users` = `users_with_trust`
- `default_trust_users` > 0

---

## 🧪 Test It

### Test 1: Check Existing User
```sql
SELECT user_id, trust_score, failed_attempts
FROM user_trust
LIMIT 5;
```
All should have `trust_score = 0.1`

### Test 2: Create New User
1. Sign up a new user in your app
2. Run:
```sql
SELECT user_id, trust_score, created_at
FROM user_trust
ORDER BY created_at DESC
LIMIT 1;
```
Should show new user with `trust_score = 0.1`

### Test 3: Real-time Updates
1. Login and go to `/book` page
2. Open browser console
3. In Supabase, run:
```sql
UPDATE user_trust
SET trust_score = 0.3
WHERE user_id = 'your_user_id';
```
4. Check console - should see: `🔔 Real-time trust score update received`

---

## 📊 What Happens Now?

### For All Users (New & Existing):
```
1. User starts with trust_score = 0.1 (10%)
   ↓
2. Captcha is required (0.1 ≤ 0.45 threshold)
   ↓
3. User completes captcha
   ↓
4. Score increases to 0.25 (10% + 15%)
   ↓
5. Captcha still required (0.25 ≤ 0.45)
   ↓
6. After 3 captchas: score = 0.55
   ↓
7. No more captcha needed (0.55 > 0.45) ✅
```

---

## 🎯 Done!

Your trust score system is now:
- ✅ Using 0-1 scale (not 0-100)
- ✅ Starting all users at 0.1 (10%)
- ✅ Auto-creating trust scores for new signups
- ✅ Updating in real-time
- ✅ Showing captcha when trust ≤ 0.45

---

## 📝 Reference

**Captcha Threshold:** ≤ 0.45 (45%)
**Default Trust:** 0.1 (10%)
**Captcha Boost:** +0.15 (15%) per success
**Block After:** 5 failed attempts
**Block Duration:** 30 minutes

---

## 🆘 Problems?

See detailed troubleshooting in:
- `TRUST_SCORE_MIGRATION_SUMMARY.md`
- `SETUP_TRUST_SCORE_0.1_DEFAULT.md`
