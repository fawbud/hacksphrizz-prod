# 🔧 Fix 404 Chunk Loading Error

## Error
```
Failed to load resource: 404 (Not Found)
- src_utils_trustScoreAI_5b0b1a01.js
- Failed to load chunk
```

## Root Cause
**Turbopack cache is stale.** The file hashes changed but Turbopack is looking for old chunks.

## Solution

### Step 1: Kill the dev server
```bash
Ctrl+C
```

### Step 2: Clear ALL caches
```bash
cd /Users/macbookair/Documents/Code/hacksphrizz
rm -rf .next .turbo node_modules/.cache
```

### Step 3: Restart server
```bash
npm run dev
```

### Step 4: Hard refresh browser
- **Mac**: Cmd+Shift+R
- **Windows/Linux**: Ctrl+Shift+R

Or clear browser cache:
- Open DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"

## If Still Having Issues

### Nuclear Reset:
```bash
# Kill server
Ctrl+C

# Remove everything
rm -rf .next .turbo node_modules/.cache

# Clear browser
# DevTools → Application → Clear storage → "Clear site data"

# Restart server
npm run dev

# Hard refresh: Cmd+Shift+R or Ctrl+Shift+R
```

## What Happened

When we made changes to `trustScoreAI.js`, Turbopack created new chunks with new hashes. But the browser was still trying to load the OLD chunks (with old hashes like `_5b0b1a01.js`).

Clearing caches forces:
1. Turbopack to rebuild with new hashes
2. Browser to fetch new chunks

## Status
✅ Caches cleared - restart server and hard refresh browser!
