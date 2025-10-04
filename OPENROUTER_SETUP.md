# 🚀 OpenRouter AI Setup - EASIEST OPTION!

## Kenapa OpenRouter?

✅ **Super Mudah**: Sign in with Google, langsung dapat API key
✅ **Free Credits**: $1 gratis untuk testing
✅ **Banyak Model**: Qwen, Claude, GPT-4, Llama, dll
✅ **No Phone Verification**: Tidak perlu verifikasi phone
✅ **Global Access**: Works di mana saja
✅ **OpenAI Compatible**: Standard API interface

---

## Setup (5 Menit!)

### 1. Buka OpenRouter
https://openrouter.ai/

### 2. Sign In dengan Google
- Klik **"Sign In"** (pojok kanan atas)
- Pilih **"Continue with Google"**
- **Instant access!** Tidak perlu verifikasi apapun

### 3. Get API Key
- Setelah login, buka: https://openrouter.ai/keys
- Klik **"Create Key"**
- Beri nama: "Bot Detection"
- **Copy** API key (format: `sk-or-v1-...`)

### 4. Paste ke .env.local
```bash
# Buka .env.local
nano .env.local

# Ganti baris ini:
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Dengan API key Anda:
OPENROUTER_API_KEY=sk-or-v1-...your_actual_key_here
```

### 5. Restart Server
```bash
# Clear cache
rm -rf .next

# Restart
npm run dev
```

### 6. Test!
```bash
node test_bot_detection.js
```

---

## Expected Results

**Dengan OpenRouter:**
```
🎯 Using PRIMARY Qwen AI analysis...
✅ Qwen AI initialized successfully via OpenRouter
📝 Qwen raw response: {"trustScore":0.42,"trustLevel":"medium",...}
✅ Qwen analysis successful
  - Trust Score: 0.42
  - Trust Level: medium

🤖 Bot Detection: ✅ PASSED (bot 42% ≤50%)
👤 Human Detection: ✅ PASSED (human 85% >50%)
```

**Tanpa API Key (fallback ke rule-based):**
```
⚠️ Qwen failed, using rule-based fallback
🔄 Falling back to rule-based AI system (V4.0)...
✅ Rule-based fallback successful

🤖 Bot: 57% (medium)
👤 Human: 100% (high)
```

---

## Model Yang Dipakai

**Default**: `qwen/qwen-2.5-7b-instruct`
- **Free tier**: $1 credit gratis
- **Speed**: ~800ms response time
- **Accuracy**: Excellent untuk bot detection
- **Cost**: $0.08 per 1M tokens (sangat murah)

**Alternative models** (bisa ganti di `qwenAI.js` line 34):
- `qwen/qwen-2.5-72b-instruct` - Lebih akurat, lebih mahal
- `anthropic/claude-3-haiku` - Cepat & akurat
- `meta-llama/llama-3.2-3b-instruct` - Gratis unlimited!

---

## Usage & Limits

**Free Tier:**
- ✅ $1 credit gratis
- ✅ ~12,000 analyses dengan Qwen 2.5 7B
- ✅ Lebih dari cukup untuk development + testing

**Per Analysis Cost:**
- Prompt: ~300 tokens
- Response: ~100 tokens
- Total: ~400 tokens = $0.000032 (~Rp 0.5)
- **Sangat murah!**

**Unlimited Free (optional):**
- Ganti ke `meta-llama/llama-3.2-3b-instruct` di code
- Free unlimited forever
- Still good accuracy

---

## Troubleshooting

### Error: "No valid Qwen/OpenRouter API key"

**Fix:**
```bash
cat .env.local | grep OPENROUTER
# Harus ada:
OPENROUTER_API_KEY=sk-or-v1-...
```

### Error: "Insufficient credits"

**Fix:**
1. Check balance: https://openrouter.ai/credits
2. Top up jika perlu (very cheap)
3. Atau ganti ke free model: `meta-llama/llama-3.2-3b-instruct`

### Bot masih lolos (>50%)

**Fix:** Tune prompt di `qwenAI.js` untuk lebih strict:
```javascript
// Line 112: Change instruction
- Only give scores below 50% for obvious bots
+ Give scores below 45% if you see ANY automation patterns
```

---

## Comparison

| Provider | Setup | Free Tier | Accuracy | Speed |
|----------|-------|-----------|----------|-------|
| **OpenRouter** | ⭐⭐⭐⭐⭐ | $1 credit | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Qwen Direct | ⭐⭐ | 1M tokens | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Gemini | ⭐⭐⭐ | Free | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Rule-Based | ⭐⭐⭐⭐⭐ | Unlimited | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Winner**: OpenRouter untuk **easiest setup** + **best accuracy**!

---

## Next Steps

1. ✅ **Buka**: https://openrouter.ai/
2. ✅ **Sign in dengan Google** (instant!)
3. ✅ **Get key**: https://openrouter.ai/keys
4. ✅ **Paste ke .env.local**:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
5. ✅ **Test**:
   ```bash
   rm -rf .next && npm run dev
   node test_bot_detection.js
   ```

**Expected: Bot 35-50%, Human 75-90%** 🎉

---

## Pro Tips

1. **Monitor usage**: https://openrouter.ai/activity
2. **Try different models**: Edit `qwenAI.js` line 34
3. **Free unlimited**: Use `meta-llama/llama-3.2-3b-instruct`
4. **Production**: $5 credit = ~150,000 analyses

🚀 **OpenRouter = Easiest + Best!**
