#!/bin/bash

echo "🧪 Testing New Lenient Trust Score Algorithm"
echo "=============================================="
echo ""

echo "Step 1: Clearing cache..."
rm -rf .next/cache 2>/dev/null
echo "✅ Cache cleared"
echo ""

echo "Step 2: Starting dev server..."
echo "⚠️  IMPORTANT: Watch for these console messages:"
echo ""
echo "   🔧 trustScoreAI.js VERSION 2.0.0-LENIENT loaded"
echo "   🔧 huggingfaceAI.js VERSION 2.0.0-LENIENT loaded"
echo "   🔧 API route.js VERSION 2.0.0-LENIENT loaded"
echo ""
echo "If you DON'T see these, the cache is still causing issues!"
echo ""
echo "Starting server now..."
echo ""

npm run dev
