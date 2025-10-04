# 🚀 Qwen AI Bot Detection - Setup Guide

## Sistem Baru

**AI Architecture:**
```
PRIMARY:  Qwen AI (Alibaba Cloud - qwen-turbo)
          ↓ (jika gagal/timeout)
FALLBACK: Rule-Based System (V4.0 - EXTREMELY GENEROUS)
```

**Keuntungan Qwen:**
- ✅ **Sangat Akurat** - Model LLM canggih dari Alibaba
- ✅ **OpenAI-Compatible API** - Mudah diintegrasikan
- ✅ **Gratis (Free Tier)** - 1 million tokens/month
- ✅ **Fast** - qwen-turbo optimized untuk speed
- ✅ **Reliable** - Alibaba Cloud infrastructure
- ✅ **No Regional Restrictions** - Works globally

---

## Setup Instructions

### 1. Dapatkan Qwen API Key

1. **Buka**: https://dashscope.console.aliyun.com/apiKey
2. **Login/Register** dengan Alibaba Cloud account (bisa pakai email)
3. **Create API Key**
4. **Copy** API key yang dihasilkan

**Note:** Perlu verifikasi akun via phone number (support international)

### 2. Tambahkan ke .env.local

```bash
# Buka .env.local
nano .env.local

# Ganti baris ini:
QWEN_API_KEY=your_qwen_api_key_here

# Dengan API key Anda:
QWEN_API_KEY=sk-...your_actual_key_here
```

### 3. Install Dependencies

Dependencies sudah terinstall:
```bash
npm install openai  # Already installed
```

### 4. Restart Server

```bash
# Clear cache
rm -rf .next

# Restart
npm run dev
```

---

## Cara Kerja

### Qwen AI Analysis

Qwen menerima prompt detail yang sama seperti Gemini:
- Mouse movements metrics
- Keystroke timing analysis
- Form interaction patterns
- Session behavior metrics
- Suspicious pattern detection

Qwen kemudian reasoning dan return JSON:
```json
{
  "trustScore": 0.85,
  "trustLevel": "high",
  "isBot": false,
  "confidence": 0.92,
  "reasoning": "Natural human behavior with varied timing",
  "keyFactors": [
    "High velocity variance",
    "Natural pauses detected",
    "Curved mouse movements"
  ]
}
```

### Model Used

- **qwen-turbo**: Fast, cost-effective model
  - Speed: ~500-1000ms response time
  - Accuracy: Very high for behavior analysis
  - Cost: Free tier 1M tokens/month

### Fallback System

Jika Qwen gagal (timeout/error/no API key):
```
⚠️ Qwen failed, using rule-based fallback
🔄 Falling back to rule-based AI system (V4.0)
✅ Rule-based fallback successful
```

---

## Testing

### Test dengan Script

```bash
node test_bot_detection.js
```

**Expected Output dengan Qwen:**
```
🎯 Using PRIMARY Qwen AI analysis...
📝 Qwen raw response: {"trustScore":0.45,"trustLevel":"medium",...}
✅ Qwen analysis successful
  - Trust Score: 0.45
  - Trust Level: medium
  - Confidence: 0.85

🤖 Bot Detection: ✅ PASSED (bot 45% ≤50%)
👤 Human Detection: ✅ PASSED (human 82% >50%)
```

**Expected Output tanpa API Key (fallback):**
```
⚠️ Qwen failed, using rule-based fallback: Qwen API not initialized - missing API key
🔄 Falling back to rule-based AI system (V4.0)...
✅ Rule-based fallback successful

🤖 Bot Detection: ⚠️ WARNING (bot 57%)
👤 Human Detection: ✅ PASSED (human 100%)
```

### Test di Browser

1. Buka `/book` page
2. Isi passenger details (step 1-4)
3. Klik ke Checkout (step 5)
4. Check console logs:

```javascript
🎯 Using PRIMARY Qwen AI analysis...
📝 Qwen raw response: {"trustScore":0.82,...}
✅ Qwen analysis successful
  - Trust Score: 0.82
  - Trust Level: high
  - Confidence: 0.88
```

---

## File Structure

```
src/
├── utils/
│   ├── qwenAI.js            ← NEW: Qwen AI service
│   ├── trustScoreAI.js      ← Fallback rule-based (V4.0)
│   ├── geminiAI.js          ← BACKUP (API issues)
│   └── huggingfaceAI.js     ← DEPRECATED
├── app/
│   └── api/
│       └── behavior/
│           └── track/
│               └── route.js ← Updated to use Qwen
```

---

## API Usage & Limits

**Qwen Free Tier:**
- ✅ **1 million tokens/month** (very generous)
- ✅ **No rate limit per minute** (reasonable use)
- ✅ **Global availability**
- ✅ **No credit card required for free tier**

**Token Usage Estimate:**
- Per analysis: ~500 tokens (prompt + response)
- Monthly capacity: ~2000 analyses
- More than enough for development & small production

---

## Troubleshooting

### Error: "Qwen API not initialized"

**Cause:** API key tidak ada atau invalid

**Fix:**
```bash
# Check .env.local
cat .env.local | grep QWEN

# Harus ada:
QWEN_API_KEY=sk-...

# Jangan:
QWEN_API_KEY=your_qwen_api_key_here
```

### Error: "Qwen timeout after 15s"

**Cause:** Network lambat atau Qwen API down

**Fix:** Sistem otomatis fallback ke rule-based. Tidak perlu action.

### Error: "Invalid trust score from Qwen"

**Cause:** Qwen return format tidak sesuai

**Fix:** Check console untuk raw response. Sistem akan fallback ke rule-based.

### Error: "Authentication failed"

**Cause:** API key expired atau invalid

**Fix:**
1. Login ke https://dashscope.console.aliyun.com/apiKey
2. Check status API key
3. Generate new API key jika perlu
4. Update .env.local

---

## Comparison: Qwen vs Gemini vs Rule-Based

| Metric | Qwen AI | Gemini AI | Rule-Based V4.0 |
|--------|---------|-----------|-----------------|
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐ (~700ms) | ⭐⭐⭐⭐ (~500ms) | ⭐⭐⭐⭐⭐ (~50ms) |
| **Reliability** | ⭐⭐⭐⭐⭐ (Stable) | ⭐⭐ (API issues) | ⭐⭐⭐⭐⭐ (Always works) |
| **Cost** | Free (1M tokens) | Free (with limits) | Free (unlimited) |
| **Setup** | ⭐⭐⭐⭐⭐ (Easy) | ⭐⭐ (Complex) | ⭐⭐⭐⭐⭐ (No setup) |
| **Bot Detection** | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐ (Good) |
| **Human Friendliness** | ⭐⭐⭐⭐⭐ (Very generous) | ⭐⭐⭐⭐⭐ (Very generous) | ⭐⭐⭐⭐⭐ (Extremely generous) |

**Recommendation:** Use **Qwen as primary** for best accuracy + reliability, with rule-based as solid fallback.

---

## Production Checklist

- [ ] Get Qwen API key dari DashScope
- [ ] Add to .env.local (NOT .env!)
- [ ] Test dengan bot behavior → Expected: 30-50%
- [ ] Test dengan human behavior → Expected: 70-90%
- [ ] Monitor API usage di DashScope console
- [ ] Set up error monitoring untuk fallback usage
- [ ] Consider rate limiting untuk high traffic (optional)

---

## Next Steps

1. **Get API Key**: https://dashscope.console.aliyun.com/apiKey
   - Register/Login
   - Create API Key
   - Copy key

2. **Add to .env.local**:
   ```bash
   QWEN_API_KEY=sk-...your_actual_key_here
   ```

3. **Test**:
   ```bash
   rm -rf .next
   npm run dev
   node test_bot_detection.js
   ```

**Expected Results dengan Qwen:**
- ✅ Bot: 30-50% (detected, will need captcha)
- ✅ Human: 70-90% (passed, no captcha)
- ✅ Fast legitimate users: 75-85% (passed)

**Kenapa Qwen Lebih Baik dari Gemini:**
1. ✅ No API compatibility issues
2. ✅ OpenAI-compatible (standard interface)
3. ✅ Stable & reliable
4. ✅ Good free tier
5. ✅ Easy setup

🚀 **Qwen AI is now your primary bot detection system!**
