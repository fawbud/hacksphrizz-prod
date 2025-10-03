# Trust Score API Documentation

## Overview

API endpoint untuk mengambil dan menganalisis trust scores dari behavior logs sistem.

**Base URL:** `http://localhost:3003/api/trust-scores`

---

## GET Endpoint

Mengambil trust scores dengan berbagai filter dan sorting options.

### Endpoint
```
GET /api/trust-scores
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeRange` | string | `24h` | Time window: `1h`, `6h`, `24h`, `7d`, `30d`, `all` |
| `limit` | integer | `100` | Maximum number of records to return |
| `sessionId` | string | - | Optional: Filter by specific session ID |
| `minTrustScore` | float | `0` | Minimum trust score (0-100) |
| `maxTrustScore` | float | `100` | Maximum trust score (0-100) |
| `sortBy` | string | `created_at` | Sort field: `created_at`, `trust_score` |
| `sortOrder` | string | `desc` | Sort order: `asc`, `desc` |

### Example Requests

#### Basic Usage
```bash
curl 'http://localhost:3003/api/trust-scores?timeRange=24h&limit=10'
```

#### Filter High Trust Scores
```bash
curl 'http://localhost:3003/api/trust-scores?minTrustScore=70&limit=20'
```

#### Get Specific Session
```bash
curl 'http://localhost:3003/api/trust-scores?sessionId=abc-123-def'
```

#### Sort by Trust Score
```bash
curl 'http://localhost:3003/api/trust-scores?sortBy=trust_score&sortOrder=asc&limit=10'
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "abc-123-def",
      "trustScore": 85,
      "isBot": false,
      "classification": "high_trust",
      "suspiciousPatterns": [
        {
          "type": "consistent_velocity",
          "severity": "medium"
        }
      ],
      "createdAt": "2025-10-03T19:40:05.19+00:00",
      "updatedAt": "2025-10-03T19:40:05.19+00:00"
    }
  ],
  "stats": {
    "total": 50,
    "avgTrustScore": 73.5,
    "botRate": 24.0,
    "humanRate": 76.0,
    "distribution": {
      "high_trust": 30,
      "medium_trust": 12,
      "low_trust": 6,
      "suspicious": 2
    },
    "distributionPercentage": {
      "high_trust": 60.0,
      "medium_trust": 24.0,
      "low_trust": 12.0,
      "suspicious": 4.0
    },
    "topSuspiciousPatterns": [
      { "type": "consistent_velocity", "count": 15 },
      { "type": "perfect_line_movement", "count": 8 }
    ]
  },
  "meta": {
    "total": 50,
    "timeRange": "24h",
    "filters": {
      "minTrustScore": 0,
      "maxTrustScore": 100,
      "sortBy": "created_at",
      "sortOrder": "desc"
    },
    "generatedAt": "2025-10-03T20:30:00.000Z"
  }
}
```

---

## POST Endpoint

Mengambil trust scores dengan filter lebih kompleks dan opsi grouping.

### Endpoint
```
POST /api/trust-scores
```

### Request Body

```json
{
  "timeRange": "24h",
  "limit": 100,
  "sessionIds": ["abc-123", "def-456"],
  "trustScoreRange": {
    "min": 0,
    "max": 100
  },
  "includePatterns": true,
  "groupBy": "classification"
}
```

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeRange` | string | `24h` | Time window |
| `limit` | integer | `100` | Max records |
| `sessionIds` | array | `null` | Array of session IDs to filter |
| `trustScoreRange` | object | `{min: 0, max: 100}` | Trust score range filter |
| `includePatterns` | boolean | `true` | Include suspicious patterns and behavior metrics |
| `groupBy` | string | `null` | Group results: `classification`, `hour`, `day` |

### Example Requests

#### Basic POST Request
```bash
curl -X POST 'http://localhost:3003/api/trust-scores' \
  -H 'Content-Type: application/json' \
  -d '{
    "timeRange": "24h",
    "limit": 50
  }'
```

#### Group by Classification
```bash
curl -X POST 'http://localhost:3003/api/trust-scores' \
  -H 'Content-Type: application/json' \
  -d '{
    "timeRange": "7d",
    "limit": 200,
    "groupBy": "classification"
  }'
```

#### Filter Multiple Sessions
```bash
curl -X POST 'http://localhost:3003/api/trust-scores' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionIds": ["session-1", "session-2", "session-3"],
    "includePatterns": true
  }'
```

#### Group by Hour
```bash
curl -X POST 'http://localhost:3003/api/trust-scores' \
  -H 'Content-Type: application/json' \
  -d '{
    "timeRange": "24h",
    "groupBy": "hour",
    "limit": 1000
  }'
```

### Response Format (Ungrouped)

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "abc-123",
      "trustScore": 85,
      "isBot": false,
      "classification": "high_trust",
      "suspiciousPatterns": [...],
      "behaviorMetrics": {
        "mouseMovements": 245,
        "clicks": 12,
        "keypresses": 45,
        "scrolls": 8,
        "focusChanges": 3,
        "timeOnPage": 120000,
        "suspiciousPatternCount": 2
      },
      "createdAt": "2025-10-03T19:40:05.19+00:00",
      "updatedAt": "2025-10-03T19:40:05.19+00:00"
    }
  ],
  "stats": {...},
  "meta": {
    "total": 50,
    "timeRange": "24h",
    "groupBy": null,
    "generatedAt": "2025-10-03T20:30:00.000Z"
  }
}
```

### Response Format (Grouped by Classification)

```json
{
  "success": true,
  "data": {
    "high_trust": [
      { "sessionId": "abc-1", "trustScore": 95, ... }
    ],
    "medium_trust": [
      { "sessionId": "abc-2", "trustScore": 65, ... }
    ],
    "low_trust": [
      { "sessionId": "abc-3", "trustScore": 35, ... }
    ],
    "suspicious": [
      { "sessionId": "abc-4", "trustScore": 15, ... }
    ]
  },
  "stats": {...},
  "meta": {
    "total": 200,
    "timeRange": "7d",
    "groupBy": "classification",
    "generatedAt": "2025-10-03T20:30:00.000Z"
  }
}
```

### Response Format (Grouped by Hour)

```json
{
  "success": true,
  "data": {
    "2025-10-03 14:00": [
      { "sessionId": "abc-1", "trustScore": 85, ... },
      { "sessionId": "abc-2", "trustScore": 72, ... }
    ],
    "2025-10-03 15:00": [
      { "sessionId": "abc-3", "trustScore": 91, ... }
    ]
  },
  "stats": {...},
  "meta": {...}
}
```

---

## Trust Score Classifications

| Classification | Trust Score Range | Description |
|---------------|------------------|-------------|
| `high_trust` | 70-100 | Legitimate users, human behavior |
| `medium_trust` | 50-69 | Uncertain, requires monitoring |
| `low_trust` | 25-49 | Likely bot, suspicious patterns |
| `suspicious` | 0-24 | Very likely bot, high risk |

---

## Use Cases

### 1. Dashboard Real-time Monitoring
```javascript
// Fetch recent high-risk sessions
const response = await fetch('/api/trust-scores?maxTrustScore=49&limit=20');
const { data } = await response.json();

data.forEach(session => {
  console.log(`⚠️ Suspicious: ${session.sessionId} - Score: ${session.trustScore}`);
});
```

### 2. Analytics - Hourly Bot Activity
```javascript
const response = await fetch('/api/trust-scores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timeRange: '24h',
    groupBy: 'hour',
    limit: 1000
  })
});

const { data } = await response.json();

// data = { "2025-10-03 14:00": [...], "2025-10-03 15:00": [...] }
Object.entries(data).forEach(([hour, sessions]) => {
  const botCount = sessions.filter(s => s.isBot).length;
  console.log(`${hour}: ${botCount} bots out of ${sessions.length} sessions`);
});
```

### 3. Security Report - Trust Score Distribution
```javascript
const response = await fetch('/api/trust-scores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timeRange: '7d',
    groupBy: 'classification',
    limit: 5000
  })
});

const { data, stats } = await response.json();

console.log('Trust Score Distribution:');
console.log(`High Trust: ${stats.distribution.high_trust} (${stats.distributionPercentage.high_trust.toFixed(1)}%)`);
console.log(`Medium Trust: ${stats.distribution.medium_trust} (${stats.distributionPercentage.medium_trust.toFixed(1)}%)`);
console.log(`Low Trust: ${stats.distribution.low_trust} (${stats.distributionPercentage.low_trust.toFixed(1)}%)`);
console.log(`Suspicious: ${stats.distribution.suspicious} (${stats.distributionPercentage.suspicious.toFixed(1)}%)`);
```

### 4. Behavior Analysis - Pattern Detection
```javascript
const response = await fetch('/api/trust-scores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timeRange: '24h',
    includePatterns: true,
    limit: 100
  })
});

const { data, stats } = await response.json();

console.log('Top Suspicious Patterns:');
stats.topSuspiciousPatterns.forEach((pattern, idx) => {
  console.log(`${idx + 1}. ${pattern.type}: ${pattern.count} occurrences`);
});
```

---

## Error Responses

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch trust scores"
}
```

### 400 Bad Request (Invalid parameters)
```json
{
  "success": false,
  "error": "Invalid timeRange parameter"
}
```

---

## Performance Considerations

- **Default Limit:** 100 records (configurable)
- **Max Recommended Limit:** 1000 records per request
- **Caching:** Consider caching results for 1-5 minutes for dashboard views
- **Indexing:** Database indexes on `created_at`, `trust_score`, `session_id`

---

## Integration Examples

### React Hook
```javascript
import { useState, useEffect } from 'react';

function useTrustScores(timeRange = '24h', limit = 50) {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrustScores = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/trust-scores?timeRange=${timeRange}&limit=${limit}`
        );
        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setStats(result.stats);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrustScores();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTrustScores, 30000);
    return () => clearInterval(interval);
  }, [timeRange, limit]);

  return { data, stats, loading, error };
}

// Usage
function TrustScoreDashboard() {
  const { data, stats, loading } = useTrustScores('24h', 100);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Trust Score Statistics</h2>
      <p>Average: {stats.avgTrustScore.toFixed(1)}%</p>
      <p>Bot Rate: {stats.botRate.toFixed(1)}%</p>

      <h3>Recent Sessions</h3>
      <ul>
        {data.map(session => (
          <li key={session.sessionId}>
            {session.sessionId}: {session.trustScore} ({session.classification})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Summary

✅ **GET Endpoint**: Simple queries with filters and sorting
✅ **POST Endpoint**: Complex queries with grouping and multiple filters
✅ **Statistics**: Comprehensive stats with distribution and patterns
✅ **Flexible Filtering**: By time, trust score, session ID
✅ **Grouping**: By classification, hour, or day
✅ **Behavior Metrics**: Mouse, keyboard, scroll, and pattern data

**API Status:** Production Ready ✅
