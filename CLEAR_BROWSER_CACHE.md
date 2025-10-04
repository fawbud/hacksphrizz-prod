# 🌐 Clear Browser Cache - Step by Step

## The Problem
Your browser cached the OLD JavaScript chunks. Even though the server has new files, your browser is still looking for old ones with hash `_5b0b1a01.js`.

## Solution: Clear Browser Cache

### Method 1: DevTools (RECOMMENDED)

1. **Open DevTools**
   - Press `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)

2. **Go to Network Tab**
   - Click "Network" tab at the top

3. **Disable Cache**
   - Check the box: ☑️ "Disable cache"

4. **Hard Reload**
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

   OR just press:
   - **Mac**: `Cmd + Shift + R`
   - **Windows**: `Ctrl + Shift + R`

### Method 2: Application Tab

1. **Open DevTools** (F12)

2. **Go to Application Tab**
   - Click "Application" tab

3. **Clear Storage**
   - Click "Storage" in left sidebar
   - Click "Clear site data" button
   - Confirm

4. **Reload**
   - Press `Cmd+R` or `Ctrl+R`

### Method 3: Incognito/Private Window

1. **Open Private Window**
   - **Mac**: `Cmd + Shift + N`
   - **Windows**: `Ctrl + Shift + N`

2. **Navigate to localhost:3003**
   - Go to `http://localhost:3003/book`
   - Fresh cache, should work!

### Method 4: Different Browser

Try a different browser:
- If using Chrome → Try Firefox or Safari
- If using Safari → Try Chrome

## Step-by-Step Visual Guide

### Chrome/Edge:
```
1. F12 (DevTools)
2. Network tab
3. ☑️ Disable cache
4. Right-click refresh → "Empty Cache and Hard Reload"
```

### Firefox:
```
1. F12 (DevTools)
2. Network tab
3. Click gear icon ⚙️
4. ☑️ Disable HTTP Cache
5. Ctrl+F5 (hard reload)
```

### Safari:
```
1. Develop menu → Empty Caches
   (If no Develop menu: Preferences → Advanced → ☑️ Show Develop)
2. Cmd+Shift+R (hard reload)
```

## What NOT To Do

❌ Don't just press F5 or Cmd+R - this uses cached files!
❌ Don't just clear cookies - need to clear cached JS files!

## What TO Do

✅ Disable cache in DevTools Network tab
✅ Hard reload (Cmd+Shift+R or Ctrl+Shift+R)
✅ Or use Private/Incognito window

## After Clearing Cache

You should see:
- No 404 errors for `_5b0b1a01.js`
- NEW chunk files loading (different hashes)
- Page loads successfully
- Console shows version markers: `🔧 VERSION 2.0.0-LENIENT loaded`

## Quick Fix Script

If nothing works, try this in browser console:
```javascript
// Unregister service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Reload
location.reload(true);
```

---

**TL;DR**: Open DevTools → Network tab → Check "Disable cache" → Cmd+Shift+R
