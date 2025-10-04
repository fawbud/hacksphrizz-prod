#!/bin/bash

# Trust Score API Test Script
# Usage: ./test_trust_score_api.sh

BASE_URL="http://localhost:3003/api/trust-scores"

echo "======================================"
echo "Trust Score API - Test Suite"
echo "======================================"
echo ""

# Test 1: Basic GET request
echo "📊 Test 1: Get recent trust scores (last 24h)"
curl -s "${BASE_URL}?timeRange=24h&limit=10" | jq '{
  success,
  total: .meta.total,
  avgTrustScore: (.stats.avgTrustScore | round),
  botRate: (.stats.botRate | round),
  distribution: .stats.distribution
}'
echo ""

# Test 2: Filter high trust scores only
echo "✅ Test 2: Get high trust scores only (70-100)"
curl -s "${BASE_URL}?minTrustScore=70&limit=5" | jq '{
  success,
  total: .meta.total,
  classification: .data[0].classification,
  avgScore: (.stats.avgTrustScore | round)
}'
echo ""

# Test 3: Get lowest trust scores
echo "⚠️  Test 3: Get lowest trust scores (suspicious)"
curl -s "${BASE_URL}?sortBy=trust_score&sortOrder=asc&limit=5" | jq '{
  success,
  lowestScores: [.data[] | {
    score: .trustScore,
    classification: .classification,
    patterns: (.suspiciousPatterns | length)
  }]
}'
echo ""

# Test 4: POST with grouping by classification
echo "📈 Test 4: Group by classification"
curl -s -X POST "${BASE_URL}" \
  -H 'Content-Type: application/json' \
  -d '{
    "timeRange": "24h",
    "limit": 100,
    "groupBy": "classification"
  }' | jq '{
  success,
  total: .meta.total,
  groups: (.data | keys),
  highTrustCount: (.data.high_trust | length),
  suspiciousCount: (.data.suspicious | length)
}'
echo ""

# Test 5: Filter suspicious sessions only
echo "🚨 Test 5: Get only suspicious sessions (score < 25)"
curl -s -X POST "${BASE_URL}" \
  -H 'Content-Type: application/json' \
  -d '{
    "timeRange": "7d",
    "trustScoreRange": {"min": 0, "max": 24},
    "includePatterns": true,
    "limit": 20
  }' | jq '{
  success,
  suspiciousCount: .meta.total,
  avgSuspiciousScore: (.stats.avgTrustScore | round),
  topPatterns: [.stats.topSuspiciousPatterns[] | {type, count}]
}'
echo ""

# Test 6: Get statistics for different time ranges
echo "⏰ Test 6: Compare time ranges"
for range in "1h" "6h" "24h" "7d"; do
  result=$(curl -s "${BASE_URL}?timeRange=${range}&limit=1000")
  total=$(echo "$result" | jq -r '.meta.total')
  avgScore=$(echo "$result" | jq -r '.stats.avgTrustScore | round')
  botRate=$(echo "$result" | jq -r '.stats.botRate | round')
  echo "  ${range}: ${total} sessions, avg ${avgScore}%, bot rate ${botRate}%"
done
echo ""

# Test 7: Top suspicious patterns
echo "🔍 Test 7: Top suspicious patterns (last 24h)"
curl -s "${BASE_URL}?timeRange=24h&limit=500" | jq '{
  topPatterns: [.stats.topSuspiciousPatterns[] | select(.count > 0)]
}'
echo ""

echo "======================================"
echo "✅ All tests completed!"
echo "======================================"
