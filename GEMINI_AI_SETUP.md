# 🚀 Gemini AI Bot Detection - Setup Guide

## Perubahan Sistem

**AI Architecture:**
```
PRIMARY:  Gemini AI (Google Generative AI)
          ↓ (jika gagal/timeout)
FALLBACK: Rule-Based System (V4.0 - EXTREMELY GENEROUS)
```

**Keuntungan Gemini:**
- ✅ **Lebih Akurat** - LLM canggih yang bisa reasoning complex patterns
- ✅ **Kontekstual** - Mengerti behavior dalam konteks, bukan hanya metric
- ✅ **Gratis (Free Tier)** - 15 requests/minute, 1 million tokens/day
- ✅ **Fast** - Gemini 1.5 Flash optimized untuk speed
- ✅ **Generous** - Diinstruksikan untuk sangat generous ke legitimate users

---

## Setup Instructions

### 1. Dapatkan Gemini API Key

1. **Buka**: https://aistudio.google.com/app/apikey
2. **Login** dengan Google account
3. **Klik** "Create API Key"
4. **Copy** API key yang dihasilkan

### 2. Tambahkan ke .env.local

```bash
# Buka .env.local
nano .env.local

# Ganti baris ini:
GEMINI_API_KEY=your_gemini_api_key_here

# Dengan API key Anda:
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### 3. Install Dependencies

```bash
npm install @google/generative-ai
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

### Gemini AI Analysis

Gemini menerima prompt detail berisi:
```
- Mouse movements: count, velocity variance, linearity, curvature
- Keystrokes: count, timing variance, natural pauses, patterns
- Form interactions: count, changes, corrections
- Session metrics: duration, total interactions
- Suspicious patterns: detected anomalies
- Behavior diversity: variety of interaction types
```

Gemini kemudian reasoning dan return JSON:
```json
{
  "trustScore": 0.85,
  "trustLevel": "high",
  "isBot": false,
  "confidence": 0.9,
  "reasoning": "Natural human behavior with varied typing rhythm",
  "keyFactors": [
    "High mouse velocity variance",
    "Natural pauses in typing",
    "Mouse movements show curvature"
  ]
}
```

### Generous Scoring

Prompt ke Gemini includes:
```
- Be VERY GENEROUS to legitimate humans who fill forms quickly
- Fast typing is NORMAL for skilled humans
- Only flag as bot if there are CLEAR automation patterns
- Trust score 70-90% expected for legitimate humans
- Only give scores below 50% for obvious bots
```

### Fallback System

Jika Gemini gagal (timeout/error/no API key):
```
⚠️ Gemini failed, using rule-based fallback
🔄 Falling back to rule-based AI system (V4.0)
✅ Rule-based fallback successful
```

Rule-based V4.0 (EXTREMELY GENEROUS):
- Base score: 0.80
- Min score: 35%
- Penalty cap: 15%
- Expected human score: 70-90%

---

## Testing

### Test dengan Script

```bash
node test_bot_detection.js
```

**Expected Output dengan Gemini:**
```
🎯 Using PRIMARY Gemini AI analysis...
✅ Gemini analysis successful
  - Trust Score: 0.XX
  - Trust Level: high/medium/low
  - Confidence: 0.XX

🤖 Bot Detection: ✅ PASSED (bot ≤50%)
👤 Human Detection: ✅ PASSED (human >70%)
```

**Expected Output tanpa API Key (fallback):**
```
⚠️ Gemini failed, using rule-based fallback: Gemini API not initialized - missing API key
🔄 Falling back to rule-based AI system (V4.0)...
✅ Rule-based fallback successful

🤖 Bot Detection: ✅ PASSED
👤 Human Detection: ✅ PASSED
```

### Test di Browser

1. Buka `/book` page
2. Isi passenger details (step 1-4)
3. Klik ke Checkout (step 5)
4. Check console logs:

```javascript
🎯 Using PRIMARY Gemini AI analysis...
📝 Gemini raw response: {"trustScore":0.85,"trustLevel":"high",...}
✅ Gemini analysis successful
  - Trust Score: 0.85
  - Trust Level: high
  - Confidence: 0.9
```

---

## File Structure

```
src/
├── utils/
│   ├── geminiAI.js          ← NEW: Gemini AI service
│   ├── trustScoreAI.js      ← Fallback rule-based (V4.0)
│   └── huggingfaceAI.js     ← DEPRECATED (not used)
├── app/
│   └── api/
│       └── behavior/
│           └── track/
│               └── route.js ← Updated to use Gemini
```

---

## API Usage & Limits

**Gemini 1.5 Flash Free Tier:**
- ✅ **15 requests/minute**
- ✅ **1 million tokens/day**
- ✅ **No credit card required**

**Untuk production dengan traffic tinggi:**
- Upgrade ke paid tier
- Atau batasi analysis hanya untuk users yang suspect
- Atau implement rate limiting per user

---

## Troubleshooting

### Error: "Gemini API not initialized"

**Cause:** API key tidak ada atau invalid

**Fix:**
```bash
# Check .env.local
cat .env.local | grep GEMINI

# Harus ada:
GEMINI_API_KEY=AIzaSy...

# Jangan:
GEMINI_API_KEY=your_gemini_api_key_here
```

### Error: "Gemini timeout after 15s"

**Cause:** Network lambat atau Gemini API down

**Fix:** Sistem otomatis fallback ke rule-based. Tidak perlu action.

### Error: "Invalid trust score from Gemini"

**Cause:** Gemini return format tidak sesuai

**Fix:** Check console untuk raw response. Sistem akan fallback ke rule-based.

### Bot masih lolos sebagai human

**Cause:** Gemini terlalu generous atau bot behavior sangat mirip human

**Fix:**
1. Check console logs untuk reasoning
2. Adjust prompt di `geminiAI.js` line 105-145
3. Atau turunkan threshold di `route.js` line 121

---

## Comparison: Gemini vs Rule-Based

| Metric | Gemini AI | Rule-Based V4.0 |
|--------|-----------|-----------------|
| **Accuracy** | ⭐⭐⭐⭐⭐ (LLM reasoning) | ⭐⭐⭐⭐ (Fixed rules) |
| **Speed** | ⭐⭐⭐⭐ (~500ms) | ⭐⭐⭐⭐⭐ (~50ms) |
| **Cost** | Free (with limits) | Free (unlimited) |
| **Flexibility** | ⭐⭐⭐⭐⭐ (Prompt tuning) | ⭐⭐⭐ (Code changes) |
| **Generosity** | ⭐⭐⭐⭐⭐ (Prompted) | ⭐⭐⭐⭐⭐ (Tuned) |
| **Context Awareness** | ⭐⭐⭐⭐⭐ (Full context) | ⭐⭐⭐ (Metrics only) |

**Recommendation:** Use Gemini as primary for best accuracy, with rule-based as reliable fallback.

---

## Production Checklist

- [ ] Get Gemini API key
- [ ] Add to .env.local (NOT .env - will be committed!)
- [ ] Test dengan bot behavior
- [ ] Test dengan human behavior
- [ ] Monitor API usage di Google AI Studio
- [ ] Set up error monitoring untuk fallback usage
- [ ] Consider rate limiting untuk high traffic

---

## Next Steps

1. **Get API Key**: https://aistudio.google.com/app/apikey
2. **Add to .env.local**: `GEMINI_API_KEY=AIzaSy...`
3. **Test**: `node test_bot_detection.js`
4. **Deploy**: Clear cache + restart server

**Expected Results:**
- ✅ Bot: 30-50% (detected)
- ✅ Human: 70-90% (passed)
- ✅ Fast legitimate users: 70-85% (passed)

🚀 **Gemini AI is now your primary bot detection system!**
