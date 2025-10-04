#!/bin/bash

echo "🔥🔥🔥 EXTREME DEBUG MODE - Complete Reset & Restart 🔥🔥🔥"
echo "==========================================================="
echo ""

echo "Step 1: Clearing ALL caches..."
echo "  - Removing .next directory..."
rm -rf .next 2>/dev/null && echo "    ✅ .next cleared" || echo "    ℹ️  No .next to clear"

echo "  - Removing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null && echo "    ✅ node_modules/.cache cleared" || echo "    ℹ️  No cache to clear"

echo "  - Removing turbo cache..."
rm -rf .turbo 2>/dev/null && echo "    ✅ .turbo cleared" || echo "    ℹ️  No turbo cache to clear"

echo ""
echo "✅ All caches cleared!"
echo ""

echo "Step 2: Starting dev server with EXTREME LOGGING..."
echo ""
echo "🔍 IMPORTANT: Watch for these VERSION MARKERS in the console:"
echo ""
echo "   🔧 trustScoreAI.js VERSION 2.0.0-LENIENT loaded"
echo "   🔧 huggingfaceAI.js VERSION 2.0.0-LENIENT loaded"
echo "   🔧 API route.js VERSION 2.0.0-LENIENT loaded"
echo ""
echo "If you see all 3 markers ✅ = Code is loaded correctly!"
echo "If you DON'T see them ❌ = Cache issue, try again!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📋 TESTING CHECKLIST:"
echo "═══════════════════════════════════════════════════════════"
echo "1. ✅ Version markers appear (3x)"
echo "2. Go to /book page"
echo "3. Fill passenger details"
echo "4. Click to go to Checkout tab"
echo "5. Watch for 🔥 fire emoji logs in console"
echo "6. Check:"
echo "   - Suspicious patterns: Should be 0-5 (not 20+)"
echo "   - Trust Score: Should be 60-80% (not 20%)"
echo "   - Needs Captcha: Should be false"
echo ""
echo "Starting server now..."
echo ""

npm run dev
