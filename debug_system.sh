#!/bin/bash

echo "🔧 ROBUST DEBUGGING - Comprehensive System Test"

# Test 1: Check server status
echo "=== 1. SERVER STATUS ==="
if ps aux | grep "next dev" | grep -v grep > /dev/null; then
    echo "✅ Next.js server is running"
    port=$(ps aux | grep "next dev" | grep -v grep | grep -o "3003" || echo "unknown")
    echo "📡 Running on port: $port"
else
    echo "❌ Next.js server is NOT running"
    echo "Starting server..."
    npm run dev &
    sleep 5
fi

# Test 2: API endpoint basic test
echo ""
echo "=== 2. API ENDPOINT TEST ==="
response=$(curl -s -w "%{http_code}" -X POST http://localhost:3003/api/behavior/track \
  -H "Content-Type: application/json" \
  -d '{"userId":"debug-test","behaviorData":{"trackingData":{"mouseMovements":[],"keystrokes":[],"clicks":[],"sessionMetrics":{"startTime":'$(date +%s)'000}},"processed":{}}}' \
  -o /tmp/api_response.json)

http_code="${response: -3}"
echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ API is working!"
    echo "Response preview:"
    cat /tmp/api_response.json | head -c 300
    echo ""
else
    echo "❌ API returned error $http_code"
    echo "Full response:"
    cat /tmp/api_response.json
fi

# Test 3: Check file structure and imports
echo ""
echo "=== 3. FILE STRUCTURE CHECK ==="
files_to_check=(
    "src/utils/behaviorTracker.js"
    "src/hooks/useBehaviorTracking.js"
    "src/app/api/behavior/track/route.js"
    "src/utils/trustScoreAI.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Test 4: Check for common errors in logs
echo ""
echo "=== 4. BROWSER COMPATIBILITY TEST ==="
echo "Creating browser test page..."

cat > public/debug-simple.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Simple Debug Test</title></head>
<body>
    <h1>Behavior Tracking Debug</h1>
    <button id="testBtn">Test API Call</button>
    <div id="output"></div>
    
    <script>
    document.getElementById('testBtn').addEventListener('click', async () => {
        const output = document.getElementById('output');
        output.innerHTML = 'Testing...';
        
        try {
            const testData = {
                userId: 'browser-test-' + Date.now(),
                behaviorData: {
                    trackingData: {
                        mouseMovements: [{x: 100, y: 200, timestamp: Date.now()}],
                        keystrokes: [],
                        clicks: [],
                        sessionMetrics: {
                            startTime: Date.now() - 5000,
                            totalMouseDistance: 50,
                            interactionCount: 1
                        }
                    },
                    processed: {
                        mouseVelocity: 1.5,
                        keystrokeRhythm: 0.8
                    }
                }
            };
            
            console.log('Sending test data:', testData);
            
            const response = await fetch('/api/behavior/track', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(testData)
            });
            
            const result = await response.json();
            
            output.innerHTML = `
                <h3>Response Status: ${response.status}</h3>
                <pre>${JSON.stringify(result, null, 2)}</pre>
            `;
            
            console.log('API Response:', result);
            
        } catch (error) {
            output.innerHTML = `<h3>Error: ${error.message}</h3>`;
            console.error('Test failed:', error);
        }
    });
    </script>
</body>
</html>
EOF

echo "✅ Created simple test page at /debug-simple.html"

# Test 5: Environment check
echo ""
echo "=== 5. ENVIRONMENT CHECK ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "SUPABASE" .env.local; then
        echo "✅ Supabase config found"
    else
        echo "⚠️ No Supabase config in .env.local"
    fi
else
    echo "❌ .env.local missing"
fi

# Test 6: Package dependencies
echo ""
echo "=== 6. DEPENDENCIES CHECK ==="
if npm list @supabase/supabase-js > /dev/null 2>&1; then
    echo "✅ Supabase client installed"
else
    echo "❌ Supabase client missing"
fi

if npm list @huggingface/inference > /dev/null 2>&1; then
    echo "✅ HuggingFace package installed"
else
    echo "❌ HuggingFace package missing"
fi

echo ""
echo "🎯 DEBUGGING COMPLETE"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3003/debug-simple.html to test in browser"
echo "2. Check browser console for detailed error messages"
echo "3. Look at network tab to see exact request/response"
echo ""
echo "If API is working but frontend fails, the issue is in:"
echo "- Data format being sent from React components"
echo "- Hook implementation"
echo "- Component integration"