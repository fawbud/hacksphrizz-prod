# 🔑 API KEYS SETUP GUIDE

## 📋 CURRENT STATUS

Your `.env.local` file exists but has placeholders:
- ✅ Supabase URL & Anon Key: **Valid**
- ❌ Supabase Service Role Key: **Commented out**
- ❌ HuggingFace Token: **Placeholder value**

---

## 🚀 QUICK SETUP

### **Step 1: Get Supabase Service Role Key**

1. Login to https://supabase.com
2. Select your project: `izeuvjlqopdbighltaex`
3. Go to **Settings** → **API**
4. Scroll down to **Project API keys**
5. Copy the **`service_role` secret** (NOT the anon key!)

### **Step 2: Get HuggingFace Token (Optional)**

1. Login to https://huggingface.co
2. Go to **Settings** → **Access Tokens**
3. Click **New token**
4. Name: `hacksphere-bot-detection`
5. Type: **Read** (not Write)
6. Click **Generate**
7. Copy the token (starts with `hf_...`)

### **Step 3: Update .env.local**

Open `/Users/macbookair/Documents/Code/hacksphrizz/.env.local` and update:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://izeuvjlqopdbighltaex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZXV2amxxb3BkYmlnaGx0YWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODI2MDUsImV4cCI6MjA3NDk1ODYwNX0.z4V3U9qZpmDSM4PIGVG4fe1TOlGlHAexRhX5Abax7nc

# IMPORTANT: Add your service role key here (get from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE

# Hugging Face Configuration (OPTIONAL - falls back to rule-based AI)
# Leave as placeholder if you don't want to use HuggingFace
HUGGINGFACE_API_TOKEN=hf_YOUR_ACTUAL_TOKEN_HERE

# CrowdHandler Configuration (keep as is)
CROWDHANDLER_PUBLIC_KEY=5b945cd137a611051bdeeb272d26ec267875dc11c069b06199678e790160fbfd
CROWDHANDLER_PRIVATE_KEY=1ea8cc4eabeaf3bbc8ad39c7a5bca58224b8fae10b158631bf018bc1dacc1d2a
NEXT_PUBLIC_CROWDHANDLER_PUBLIC_KEY=5b945cd137a611051bdeeb272d26ec267875dc11c069b06199678e790160fbfd

QUEUE_SECRET=hacksphere-2024-secure-key-12345
```

### **Step 4: Restart Dev Server**

```bash
# Kill current server
Ctrl+C

# Restart
npm run dev
```

---

## 🎯 WHAT EACH KEY DOES

### **SUPABASE_SERVICE_ROLE_KEY** (REQUIRED)
✅ Allows server to write to database
✅ Saves trust scores
✅ Saves behavior logs
✅ Saves bookings
❌ Without it: "database-free mode" (nothing saved)

### **HUGGINGFACE_API_TOKEN** (OPTIONAL)
✅ Uses ML models for bot detection
✅ More accurate than rule-based
❌ Without it: Falls back to rule-based AI (still works!)

---

## 📊 EXPECTED LOGS AFTER SETUP

### **With Supabase Key:**
```
✅ ✅ Trust score saved to database
✅ ✅ Behavior data logged successfully
```

### **With HuggingFace Token:**
```
🤖 Attempting Hugging Face AI analysis...
✅ Hugging Face analysis successful
```

### **Without HuggingFace Token:**
```
⚠️ Hugging Face failed, using fallback
🔄 Falling back to rule-based AI system...
✅ Fallback analysis successful
```

---

## ⚙️ MODES COMPARISON

| Mode | Supabase | HuggingFace | Result |
|------|----------|-------------|--------|
| **Full** | ✅ | ✅ | Best accuracy, data saved |
| **Database Only** | ✅ | ❌ | Rule-based AI, data saved |
| **AI Only** | ❌ | ✅ | ML AI, data NOT saved |
| **Minimal** | ❌ | ❌ | Rule-based AI, data NOT saved |

**Current Mode:** Minimal (nothing configured)
**Recommended:** Database Only (at minimum)

---

## 🐛 TROUBLESHOOTING

### **Error: "Invalid credentials"**
- Check token format (HuggingFace should start with `hf_`)
- Make sure no extra spaces
- Token should have Read access

### **Error: "database-free mode"**
- Add `SUPABASE_SERVICE_ROLE_KEY` to .env.local
- Make sure it's the **service_role** key, NOT anon key
- Restart dev server

### **Trust score not saving**
- Verify Supabase key is set
- Check database tables exist (`queue`, `behavior_logs`)
- Check console for database errors

---

## ✅ VERIFICATION

After setup, check console logs:

```bash
# Should see:
✅ Trust score saved to database
✅ Behavior data logged successfully

# Should NOT see:
⚠️ No valid Supabase service key - running in database-free mode
❌ Invalid credentials in Authorization header
```

---

**Ready to setup?** 

1. Get Supabase service_role key from dashboard
2. (Optional) Get HuggingFace token
3. Update .env.local
4. Restart server
5. Test again!
