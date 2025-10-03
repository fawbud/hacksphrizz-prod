#!/bin/bash

# Test Script untuk API Endpoints
# Jalankan setelah server development berjalan

BASE_URL="http://localhost:3000"

echo "🚀 Testing Train Prediction API Endpoints"
echo "============================================="

echo ""
echo "1️⃣ Testing Enqueue API..."
ENQUEUE_RESPONSE=$(curl -s -X POST $BASE_URL/api/queue/enqueue -H "Content-Type: application/json")
echo "Response: $ENQUEUE_RESPONSE"

# Extract userId dari response (asumsi format JSON)
USER_ID=$(echo $ENQUEUE_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "Extracted User ID: $USER_ID"

if [ -z "$USER_ID" ]; then
    echo "❌ Failed to get userId from enqueue response"
    exit 1
fi

echo ""
echo "2️⃣ Testing Queue Status API..."
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/queue/status?userId=$USER_ID")
echo "Response: $STATUS_RESPONSE"

echo ""
echo "3️⃣ Testing Behavior Tracking API..."
BEHAVIOR_RESPONSE=$(curl -s -X POST $BASE_URL/api/behavior/track \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"metrics\": {
      \"mouseData\": {
        \"avgSpeed\": 1500,
        \"variance\": 200,
        \"totalDistance\": 5000,
        \"clickAccuracy\": 0.85
      },
      \"sessionData\": {
        \"timeOnPage\": 120000,
        \"interactionCount\": 25,
        \"focusChanges\": 2
      },
      \"typingData\": {
        \"avgTimeBetweenKeys\": 150,
        \"variance\": 80,
        \"totalKeystrokes\": 50,
        \"backspaceRatio\": 0.1
      }
    }
  }")
echo "Response: $BEHAVIOR_RESPONSE"

echo ""
echo "4️⃣ Testing Updated Status after Behavior Tracking..."
STATUS_RESPONSE2=$(curl -s "$BASE_URL/api/queue/status?userId=$USER_ID")
echo "Response: $STATUS_RESPONSE2"

echo ""
echo "5️⃣ Testing AI Demand Prediction..."
DEMAND_RESPONSE=$(curl -s "$BASE_URL/api/demand/predict")
echo "Response: $DEMAND_RESPONSE"

echo ""
echo "✅ API Testing Complete!"
echo "Check responses above for any errors."
echo ""
echo "📝 Notes:"
echo "- Make sure Supabase database is set up with proper tables"
echo "- Update SUPABASE_SERVICE_KEY in .env.local if you see auth errors"
echo "- Some APIs may fail until database schema is properly created"