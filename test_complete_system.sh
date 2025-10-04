#!/bin/bash

echo "🧪 Testing Complete Bot Detection System"
echo "========================================"

# Test 1: Check if AI API is running
echo ""
echo "1️⃣ Testing AI API Health..."
AI_HEALTH=$(curl -s http://localhost:5001/health)
echo "AI API Health: $AI_HEALTH"

# Test 2: Check if Next.js is running
echo ""
echo "2️⃣ Testing Next.js App..."
NEXTJS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003)
echo "Next.js Status Code: $NEXTJS_STATUS"

# Test 3: Test AI Model Info
echo ""
echo "3️⃣ Testing AI Model Info..."
AI_MODEL_INFO=$(curl -s http://localhost:5001/model-info)
echo "AI Model Info: $AI_MODEL_INFO"

# Test 4: Test Rule-Based Detection
echo ""
echo "4️⃣ Testing Rule-Based Bot Detection..."
RULE_BASED_RESPONSE=$(curl -s -X POST http://localhost:3003/api/behavior/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_rule",
    "metrics": {
      "mouseData": {
        "avgSpeed": 3000,
        "variance": 20,
        "totalDistance": 1000,
        "clickAccuracy": 0.98
      },
      "typingData": {
        "avgTimeBetweenKeys": 40,
        "variance": 15,
        "totalKeystrokes": 100,
        "backspaceRatio": 0.01
      },
      "sessionData": {
        "timeOnPage": 5000,
        "interactionCount": 3,
        "focusChanges": 0
      }
    }
  }')
echo "Rule-Based Response: $RULE_BASED_RESPONSE"

# Test 5: Test AI Detection
echo ""
echo "5️⃣ Testing AI Bot Detection..."
AI_RESPONSE=$(curl -s -X POST http://localhost:5001/predict-ai \
  -H "Content-Type: application/json" \
  -d '{
    "mouseMovements": [
      {"velocity": 3000, "acceleration": 500, "pressure": 0.1, "jitter": 2},
      {"velocity": 3100, "acceleration": 520, "pressure": 0.1, "jitter": 1}
    ],
    "clicks": [
      {"timestamp": 1640000000000, "x": 100, "y": 200, "button": 1, "clickType": "single", "accuracy": 0.99, "pressure": 0.1, "duration": 20},
      {"timestamp": 1640000001000, "x": 150, "y": 250, "button": 1, "clickType": "single", "accuracy": 0.98, "pressure": 0.1, "duration": 25}
    ],
    "keystrokes": [
      {"timestamp": 1640000000000, "key": "a", "pressure": 0.1},
      {"timestamp": 1640000000040, "key": "b", "pressure": 0.1}
    ],
    "formInteractions": [
      {"interactionType": "input", "focusTime": 100, "dwellTime": 50, "changeCount": 1, "value": "test", "tabOrder": 1, "validationErrors": 0}
    ],
    "pageViewTime": 5000,
    "suspiciousPatternCount": 5,
    "scrollDistance": 100,
    "idleTime": 1000,
    "focusEvents": ["focus"],
    "blurEvents": [],
    "mouseJitter": 15,
    "irregularPatterns": 3,
    "clickAccuracy": 0.99,
    "typingRhythm": 0.2
  }')
echo "AI Detection Response: $AI_RESPONSE"

echo ""
echo "✅ Testing Complete!"
echo ""
echo "🌐 Access URLs:"
echo "- Next.js App: http://localhost:3003"
echo "- Bot Detection Test: http://localhost:3003/test-bot-detection"
echo "- AI API: http://localhost:5001"
echo ""
echo "🎯 Both systems are ready for testing!"