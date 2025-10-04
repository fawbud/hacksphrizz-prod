# Real-time Trust Score System Implementation

## Overview
Successfully implemented a unified **0-1 trust score system** with **real-time monitoring** using Supabase Realtime subscriptions. The captcha is now displayed based on live trust score updates without requiring page refresh.

---

## 🎯 Key Changes

### 1. **Unified Trust Score Scale (0-1)**
- All trust scores now use **0.00 to 1.00** scale (no more 0-100 conversion)
- Database stores `DECIMAL(3,2)` ranging from 0.00 to 1.00
- Consistent thresholds across the entire system

### 2. **New Database Table: `user_trust`**
```sql
CREATE TABLE public.user_trust (
  user_id UUID PRIMARY KEY,
  trust_score DECIMAL(3,2) DEFAULT 0.70 CHECK (trust_score >= 0 AND trust_score <= 1),
  failed_attempts INTEGER DEFAULT 0,
  blocked_until TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- ✅ Real-time enabled (`ALTER PUBLICATION supabase_realtime ADD TABLE user_trust`)
- ✅ Auto-updating timestamps
- ✅ RLS policies for security
- ✅ Indexes for performance
- ✅ Auto-cleanup for expired blocks

### 3. **Real-time Trust Score Hook**
**File:** `src/hooks/useRealtimeTrustScore.js`

```javascript
const trustScore = useRealtimeTrustScore(userId, {
  captchaThreshold: 0.45,
  onCaptchaRequired: (state) => {
    // Auto-trigger captcha when trust drops
    setShowCaptcha(true);
  },
  onScoreUpdate: (state) => {
    // Handle real-time updates
    console.log('Trust score updated:', state.trustScore);
  },
});
```

**Returns:**
- `trustScore` - Current score (0-1)
- `trustPercentage` - Score as percentage (0-100)
- `trustLevel` - Category ('high', 'medium_high', 'medium', 'low', 'very_low')
- `needsCaptcha` - Boolean flag
- `isBlocked` - Boolean flag
- `blockedUntil` - Timestamp
- `failedAttempts` - Count
- `refresh()` - Manual refresh function

### 4. **Adaptive Captcha Component**
**File:** `src/components/AdaptiveCaptcha.js`

Features:
- ✅ Real-time trust score monitoring
- ✅ Auto-show/hide based on score changes
- ✅ Live trust score display in modal
- ✅ Failed attempts tracking
- ✅ Temporary blocking support
- ✅ No page refresh needed

### 5. **Updated Behavior Tracking API**
**File:** `src/app/api/behavior/track/route.js`

Changes:
- Saves to `user_trust` table (0-1 scale)
- Also updates `queue` table for backward compatibility
- Logs to `behavior_logs` with 0-1 scale
- Returns 0-1 scores in API response

---

## 📊 Trust Score Thresholds

### Default Values:
```javascript
// New users
DEFAULT_TRUST_SCORE = 0.70  // 70% - medium-high trust

// Thresholds
CAPTCHA_THRESHOLD = 0.45    // ≤45% requires captcha
BLOCKING_THRESHOLD = 5       // 5 failed attempts → block 30min
```

### Trust Levels:
```javascript
≥ 0.75 → 'high'           // 75-100%
≥ 0.60 → 'medium_high'    // 60-74%
≥ 0.45 → 'medium'         // 45-59%
≥ 0.30 → 'low'            // 30-44%
<  0.30 → 'very_low'      // 0-29%
```

### Score Adjustments:
- **Successful Captcha:** +0.15 (15% boost)
- **Failed Captcha:** +1 failed attempt
- **5 Failed Attempts:** Blocked for 30 minutes
- **Behavior Analysis:** AI-calculated (0-1 scale)

---

## 🔄 Real-time Flow

```
1. User interacts with website
   ↓
2. BehaviorTracker captures events
   ↓
3. analyzeNow() → POST /api/behavior/track
   ↓
4. AI calculates trust score (0-1)
   ↓
5. Updates user_trust table
   ↓
6. Supabase Realtime broadcasts change
   ↓
7. useRealtimeTrustScore receives update
   ↓
8. UI updates automatically (captcha shows/hides)
```

---

## 🚀 Implementation in Book Page

**File:** `src/app/book/page.js`

```javascript
// Real-time monitoring
const trustScore = useRealtimeTrustScore(user?.id, {
  captchaThreshold: 0.45,
  onCaptchaRequired: (state) => {
    setCaptchaReason(`Trust score too low (${Math.round(state.trustScore * 100)}%)`);
    setShowCaptcha(true);
  },
  onScoreUpdate: (state) => {
    // Auto-hide if trust improves
    if (!state.needsCaptcha && showCaptcha) {
      setShowCaptcha(false);
    }
  },
});

// Adaptive captcha component
<AdaptiveCaptcha
  userId={user?.id}
  forceVisible={showCaptcha}
  captchaThreshold={0.45}
  reason={captchaReason}
  onSuccess={handleCaptchaSuccess}
  onError={handleCaptchaError}
/>

// Real-time trust score display
<RealtimeTrustScoreDisplay userId={user.id} />
```

---

## 📁 Files Created/Modified

### Created:
1. ✅ `migrations/create_user_trust_table.sql` - Database schema
2. ✅ `src/hooks/useRealtimeTrustScore.js` - Real-time hook
3. ✅ `src/components/AdaptiveCaptcha.js` - Adaptive captcha component

### Modified:
1. ✅ `src/app/api/behavior/track/route.js` - Use user_trust table, 0-1 scale
2. ✅ `src/app/api/precheck-trust/route.js` - Return 0-1 scale
3. ✅ `src/app/api/verify-captcha/route.js` - Update with 0-1 scale
4. ✅ `src/app/api/queue/status/route.js` - Use 0-1 threshold
5. ✅ `src/app/book/page.js` - Real-time monitoring integration

---

## 🔧 Setup Instructions

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- File: migrations/create_user_trust_table.sql

-- OR run from terminal:
psql -U postgres -d your_db < migrations/create_user_trust_table.sql
```

### 2. Enable Realtime in Supabase Dashboard
```
1. Go to Database → Replication
2. Ensure 'user_trust' table is in replication publication
3. Or run: ALTER PUBLICATION supabase_realtime ADD TABLE user_trust;
```

### 3. Verify Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

### 4. Test Real-time Updates
```javascript
// Open browser console on book page
// Watch for real-time updates:
// "🔔 Real-time trust score update received: ..."
```

---

## 🎨 UI/UX Improvements

### Trust Score Display:
- ✅ Live percentage (0-100%)
- ✅ Color-coded badges (green/yellow/red)
- ✅ Trust level text
- ✅ Last update timestamp
- ✅ Blocked status indicator

### Adaptive Captcha:
- ✅ Shows automatically when trust drops
- ✅ Hides automatically when trust improves
- ✅ Can't be closed if required
- ✅ Shows failed attempts
- ✅ Shows blocking countdown
- ✅ Real-time trust score in modal

---

## 🔐 Security Features

1. **Graduated Response:**
   - 0.75+ → Full access, no captcha
   - 0.45-0.74 → Access with monitoring
   - 0.30-0.44 → Requires captcha
   - <0.30 → Severely limited

2. **Anti-Abuse:**
   - Failed attempt tracking
   - Temporary blocking (30 min)
   - Score degradation on failures
   - Score improvement on success

3. **Privacy:**
   - RLS policies restrict access
   - Users can only see own scores
   - Service role for admin operations

---

## 📊 Monitoring & Debugging

### Console Logs:
```javascript
// Real-time subscription
"🔌 Setting up real-time trust score subscription for user: ..."
"✅ Real-time subscription active for user_trust"
"🔔 Real-time trust score update received: ..."

// Trust score updates
"📊 Trust score updated in real-time: 0.75"
"⚠️ Captcha required due to trust score: 0.42"

// Captcha events
"✅ Captcha verification successful"
"❌ Captcha verification failed"
```

### Database Queries:
```sql
-- Check user trust scores
SELECT * FROM user_trust WHERE user_id = 'user_uuid';

-- View behavior logs
SELECT * FROM behavior_logs ORDER BY created_at DESC LIMIT 10;

-- Check blocked users
SELECT * FROM user_trust WHERE blocked_until > NOW();
```

---

## 🚨 Important Notes

1. **Realtime Setup Required:**
   - Must enable realtime for `user_trust` table in Supabase
   - Run migration script first

2. **Score Scale:**
   - All scores are now 0-1 (not 0-100)
   - Display shows percentage: `Math.round(score * 100)`

3. **Backward Compatibility:**
   - Queue table still updated for legacy code
   - Both tables use 0-1 scale now

4. **Default Trust:**
   - New users start at 0.7 (70%)
   - Can increase to 1.0 (100%)
   - Can decrease to 0.0 (0%)

5. **Threshold Consistency:**
   - Captcha at ≤0.45 everywhere
   - Block at 5 failed attempts
   - 30-minute block duration

---

## ✅ Testing Checklist

- [ ] Run database migration
- [ ] Enable realtime in Supabase
- [ ] Test new user registration (should get 0.7 score)
- [ ] Test behavior tracking (score should update)
- [ ] Test captcha auto-show (when score drops)
- [ ] Test captcha auto-hide (when score improves)
- [ ] Test failed attempts (should increment)
- [ ] Test blocking (after 5 failures)
- [ ] Test real-time display updates
- [ ] Verify no page refresh needed

---

## 🎯 Next Steps (Optional)

1. **Analytics Dashboard:**
   - Add admin page to view all trust scores
   - Charts for score distribution
   - Failed attempt statistics

2. **Machine Learning:**
   - Train model on behavior_logs data
   - Improve AI scoring accuracy
   - Add anomaly detection

3. **Advanced Features:**
   - Score decay over time (inactivity)
   - Different thresholds per page
   - Progressive challenges (easier → harder captcha)

---

## 📞 Support

If you encounter issues:
1. Check Supabase realtime is enabled
2. Verify migration ran successfully
3. Check browser console for errors
4. Ensure service key is set correctly

---

**Status:** ✅ Complete
**Version:** 1.0.0
**Date:** 2025-10-04
