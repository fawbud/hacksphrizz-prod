# Trust Score System - Quick Reference

## 🚀 Quick Start

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, paste and run:
migrations/create_user_trust_table.sql
```

### 2. Enable Realtime (Supabase Dashboard)
```
Database → Replication → Enable user_trust table
```

### 3. Use in Your Component
```javascript
import { useRealtimeTrustScore } from '@/hooks/useRealtimeTrustScore';

const MyComponent = () => {
  const { user } = useAuth();

  const trustScore = useRealtimeTrustScore(user?.id, {
    captchaThreshold: 0.45,
    onCaptchaRequired: (state) => {
      setShowCaptcha(true);
    },
  });

  return (
    <div>
      <p>Trust: {trustScore.trustPercentage}%</p>
      {trustScore.needsCaptcha && <Captcha />}
    </div>
  );
};
```

---

## 📊 Trust Score Values

### Scale: 0.00 - 1.00
```
1.00 = 100% - Perfect trust
0.75 = 75%  - High trust (green)
0.60 = 60%  - Medium-high (yellow)
0.45 = 45%  - Medium (yellow) ← CAPTCHA THRESHOLD
0.30 = 30%  - Low (red)
0.00 = 0%   - No trust (red)
```

### Default for New Users
```javascript
trust_score = 0.70  // 70% (medium-high)
```

---

## 🎯 Key Thresholds

```javascript
// Captcha
trust_score <= 0.45 → Show captcha

// Blocking
failed_attempts >= 5 → Block 30 minutes

// Score Adjustments
Captcha Success: +0.15 (15%)
Captcha Failure: +1 failed attempt
```

---

## 🔌 Real-time Hook API

### useRealtimeTrustScore(userId, options)

```javascript
const trustScore = useRealtimeTrustScore(userId, {
  captchaThreshold: 0.45,      // When to require captcha
  autoFetch: true,              // Auto-fetch on mount
  onCaptchaRequired: (state) => {}, // Callback
  onScoreUpdate: (state) => {},     // Callback
});
```

### Returns
```javascript
{
  // Values
  trustScore: 0.75,           // 0-1 scale
  trustPercentage: 75,        // 0-100%
  trustLevel: 'high',         // Category

  // Flags
  needsCaptcha: false,
  isBlocked: false,
  isLoading: false,
  hasScore: true,
  isLowTrust: false,
  isHighTrust: true,

  // Data
  failedAttempts: 0,
  blockedUntil: null,
  lastUpdate: '2025-10-04...',
  error: null,

  // Methods
  refresh: async () => {},     // Manual refresh
  shouldShowCaptcha: () => {}, // Check if needed
  getTrustPercentage: () => {},
  getTrustLevel: () => {},
}
```

---

## 🎨 Components

### Adaptive Captcha
```javascript
import AdaptiveCaptcha from '@/components/AdaptiveCaptcha';

<AdaptiveCaptcha
  userId={user?.id}
  forceVisible={showCaptcha}
  captchaThreshold={0.45}
  reason="Security verification required"
  onSuccess={() => setShowCaptcha(false)}
  onError={(err) => console.error(err)}
  onClose={() => setShowCaptcha(false)}
/>
```

### Trust Score Display
```javascript
import { RealtimeTrustScoreDisplay } from '@/components/AdaptiveCaptcha';

<RealtimeTrustScoreDisplay userId={user?.id} />
```

---

## 🔧 API Endpoints

### POST /api/behavior/track
```javascript
// Analyzes behavior and updates trust score
const response = await fetch('/api/behavior/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'uuid',
    behaviorData: { /* tracking data */ }
  })
});

// Response
{
  success: true,
  trustScore: 0.75,        // 0-1 scale
  trustLevel: 'high',
  needsCaptcha: false,
  confidence: 0.85,
  reasons: [...],
  analysis: {...}
}
```

### POST /api/precheck-trust
```javascript
// Get current trust score
const response = await fetch('/api/precheck-trust', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'uuid' })
});

// Response
{
  trust_score: 0.75,       // 0-1 scale
  failed_attempts: 0,
  showCaptcha: false,
  isBlocked: false
}
```

### POST /api/verify-captcha
```javascript
// Verify captcha and update trust
const response = await fetch('/api/verify-captcha', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'recaptcha-token',
    user_id: 'uuid'
  })
});

// Success: trust_score += 0.15
// Failure: failed_attempts += 1
```

---

## 💾 Database Schema

### user_trust Table
```sql
user_id        UUID PRIMARY KEY
trust_score    DECIMAL(3,2)     -- 0.00 to 1.00
failed_attempts INTEGER         -- Count
blocked_until  TIMESTAMPTZ      -- NULL or future date
updated_at     TIMESTAMPTZ      -- Auto-updated
created_at     TIMESTAMPTZ      -- Auto-set
```

### Key Queries
```sql
-- Get user trust score
SELECT * FROM user_trust WHERE user_id = 'uuid';

-- Get all low trust users
SELECT * FROM user_trust WHERE trust_score <= 0.45;

-- Get blocked users
SELECT * FROM user_trust WHERE blocked_until > NOW();

-- Reset user trust
UPDATE user_trust
SET trust_score = 0.70, failed_attempts = 0, blocked_until = NULL
WHERE user_id = 'uuid';
```

---

## 🐛 Debugging

### Console Logs to Look For
```
✅ Good:
"🔌 Setting up real-time trust score subscription"
"✅ Real-time subscription active"
"🔔 Real-time trust score update received"
"📊 Trust score updated: 0.75"

❌ Errors:
"❌ Real-time subscription error"
"❌ Failed to fetch trust score"
"⚠️ Captcha required due to trust score: 0.42"
```

### Common Issues

**1. Real-time not working**
```sql
-- Check if realtime is enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_trust';

-- If empty, run:
ALTER PUBLICATION supabase_realtime ADD TABLE user_trust;
```

**2. Score not updating**
```javascript
// Force refresh
const { refresh } = useRealtimeTrustScore(userId);
await refresh();
```

**3. Captcha not showing**
```javascript
// Check threshold
console.log('Score:', trustScore.trustScore);
console.log('Needs captcha:', trustScore.trustScore <= 0.45);
console.log('Is blocked:', trustScore.isBlocked);
```

---

## 🔄 Typical Flow

### User Journey
```
1. User logs in
   → Default trust_score = 0.70

2. User browses site
   → BehaviorTracker captures events

3. User clicks "Checkout"
   → analyzeNow() sends data to API
   → AI calculates trust_score
   → Updates user_trust table

4. Realtime broadcasts update
   → useRealtimeTrustScore receives it
   → UI updates automatically

5. If trust_score <= 0.45
   → Captcha shows automatically

6. User completes captcha
   → trust_score += 0.15
   → Captcha hides automatically

7. User proceeds to checkout
   ✅ Success
```

---

## 📝 Code Snippets

### Trigger Analysis Manually
```javascript
const { analyzeNow } = useBehaviorTracking(userId);

const result = await analyzeNow();
console.log('Trust score:', result.trustScore);
```

### Check Before Important Action
```javascript
const { trustScore, needsCaptcha } = useRealtimeTrustScore(userId);

const handleSubmit = async () => {
  if (needsCaptcha) {
    setShowCaptcha(true);
    return;
  }

  // Proceed with action
  await submitForm();
};
```

### Custom Threshold
```javascript
const trustScore = useRealtimeTrustScore(userId, {
  captchaThreshold: 0.30,  // More lenient
});

// or

const trustScore = useRealtimeTrustScore(userId, {
  captchaThreshold: 0.60,  // More strict
});
```

---

## 🎯 Best Practices

1. **Always check user exists:**
   ```javascript
   if (!user?.id) return;
   const trustScore = useRealtimeTrustScore(user.id);
   ```

2. **Handle loading state:**
   ```javascript
   if (trustScore.isLoading) {
     return <Spinner />;
   }
   ```

3. **Provide feedback:**
   ```javascript
   if (trustScore.isBlocked) {
     return <BlockedMessage until={trustScore.blockedUntil} />;
   }
   ```

4. **Log for debugging:**
   ```javascript
   useEffect(() => {
     console.log('Trust score changed:', trustScore.trustScore);
   }, [trustScore.trustScore]);
   ```

---

## 📊 Trust Level Colors

```javascript
const getScoreColor = (score) => {
  if (score >= 0.75) return 'green';    // High trust
  if (score >= 0.45) return 'yellow';   // Medium trust
  return 'red';                         // Low trust
};
```

### Tailwind Classes
```javascript
score >= 0.75: 'text-green-600 bg-green-50 border-green-200'
score >= 0.45: 'text-yellow-600 bg-yellow-50 border-yellow-200'
score <  0.45: 'text-red-600 bg-red-50 border-red-200'
```

---

## ⚡ Performance Tips

1. **Debounce Analysis:**
   ```javascript
   const debouncedAnalyze = debounce(analyzeNow, 5000);
   ```

2. **Limit Realtime Updates:**
   ```javascript
   // Already optimized in the hook
   // Only triggers callbacks when score actually changes
   ```

3. **Conditional Rendering:**
   ```javascript
   {trustScore.hasScore && <TrustDisplay />}
   ```

---

## 🔐 Security Notes

- ✅ RLS enabled on user_trust table
- ✅ Users can only read own scores
- ✅ Only service role can update
- ✅ Realtime filtered by user_id
- ✅ CAPTCHA validates server-side
- ✅ Failed attempts tracked
- ✅ Auto-blocking after 5 failures

---

**Last Updated:** 2025-10-04
**Version:** 1.0.0
