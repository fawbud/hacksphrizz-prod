#!/bin/bash

echo "🔧 Quick Fix Test - Testing Size Optimization and Error Handling"

# Test payload size calculation
echo "Testing payload size calculation..."
node -e "
const testData = {
  userId: 'test-123',
  behaviorData: {
    mouse: Array(100).fill({x: 100, y: 200, timestamp: Date.now()}),
    keystrokes: Array(50).fill({key: 'a', timestamp: Date.now()}),
    clicks: Array(30).fill({x: 150, y: 250, timestamp: Date.now()})
  },
  timestamp: Date.now()
};

const originalSize = new Blob([JSON.stringify(testData)]).size;
console.log('Original payload size:', originalSize, 'bytes');

// Simulate minimal payload
const minimal = {
  userId: testData.userId,
  behaviorData: {
    mouseCount: testData.behaviorData.mouse.length,
    keystrokeCount: testData.behaviorData.keystrokes.length,
    clickCount: testData.behaviorData.clicks.length,
    timeSpent: 30,
    suspiciousCount: 0,
    patterns: { velocity: 1.5, rhythm: 0.8 }
  },
  timestamp: testData.timestamp,
  compressed: true
};

const minimalSize = new Blob([JSON.stringify(minimal)]).size;
console.log('Minimal payload size:', minimalSize, 'bytes');
console.log('Size reduction:', Math.round((1 - minimalSize/originalSize) * 100) + '%');
"

echo ""
echo "Testing API endpoint availability..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running on port 3000"
    
    echo "Testing behavior track endpoint..."
    response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/behavior/track \
      -H "Content-Type: application/json" \
      -d '{
        "userId": "test-user-123",
        "behaviorData": {
          "mouseCount": 10,
          "keystrokeCount": 5,
          "timeSpent": 30000,
          "suspiciousCount": 0
        }
      }' -o /tmp/response.json)
    
    http_code="${response: -3}"
    echo "HTTP Status: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ API working!"
        echo "Response:"
        cat /tmp/response.json | head -c 500
        echo ""
    else
        echo "❌ API returned error $http_code"
        echo "Response:"
        cat /tmp/response.json
    fi
else
    echo "❌ Server not running. Please start with: npm run dev"
fi

echo ""
echo "🎯 Next steps:"
echo "1. If API is working - data size issues should be fixed"
echo "2. If still getting 500 errors - update your Supabase service key in .env.local"
echo "3. The app will now work even if database fails"