/**
 * AI Insights Generator API
 * Uses Gemini AI (free tier) via REST API for Live Operations Dashboard
 */

import { supabaseAdmin } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('📊 Starting AI insights generation...');

  try {
    const body = await request.json();
    const { timeRange = '24h', limit = 100 } = body;

    // Get behavior data from database
    const behaviorData = await fetchBehaviorData(timeRange, limit);

    if (!behaviorData || behaviorData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No behavior data available for analysis'
      }, { status: 400 });
    }

    // Generate insights using AI
    const insights = await generateInsights(behaviorData);

    return NextResponse.json({
      success: true,
      insights: insights,
      dataPoints: behaviorData.length,
      timeRange: timeRange,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Insights generation failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Fetch behavior data from database
 */
async function fetchBehaviorData(timeRange, limit) {
  const timeRanges = {
    '1h': 1,
    '6h': 6,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
  };

  const hours = timeRanges[timeRange] || 24;
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('behavior_logs')
    .select('*')
    .gte('created_at', cutoffDate)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch behavior data');
  }

  return data;
}

/**
 * Generate AI insights from behavior data
 */
async function generateInsights(behaviorData) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const hasGemini = geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.length > 20;

  if (!hasGemini) {
    // Fallback to basic statistical insights
    console.log('ℹ️ No Gemini API key, using basic insights');
    return generateBasicInsights(behaviorData);
  }

  try {
    // Prepare summary statistics
    const stats = calculateStatistics(behaviorData);

    // Create prompt for AI
    const prompt = createInsightsPrompt(stats, behaviorData.length);

    // Get AI insights using Gemini
    console.log('🤖 Using Gemini AI for insights...');
    const aiResponse = await generateGeminiInsights(prompt, geminiKey);

    return {
      summary: aiResponse.summary || 'No summary available',
      patterns: aiResponse.patterns || [],
      recommendations: aiResponse.recommendations || [],
      alerts: aiResponse.alerts || [],
      trends: aiResponse.trends || [],
      source: 'gemini_ai',
      stats: stats
    };

  } catch (error) {
    console.warn('⚠️ Gemini insights failed, using basic insights:', error.message);
    return generateBasicInsights(behaviorData);
  }
}

/**
 * Generate insights using Gemini AI via REST API
 */
async function generateGeminiInsights(prompt, apiKey) {
  // Try multiple model names with v1 API (newest models first)
  const models = [
    'gemini-2.5-flash',     // Newest, fastest
    'gemini-2.0-flash',     // Fast alternative
    'gemini-2.5-flash-lite' // Lightweight
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`🔄 Trying Gemini model via REST: ${modelName}`);
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a security analyst for a train booking system. Always respond with valid JSON only, no markdown or extra text.\n\n${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Extract text from Gemini response structure
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No text in Gemini response');
      }

      console.log(`✅ Gemini ${modelName} succeeded`);
      console.log('📝 Gemini raw response:', text.substring(0, 200) + '...');

      // Parse JSON (handle markdown code blocks)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.warn(`❌ Gemini ${modelName} failed:`, error.message);
      lastError = error;
      // Try next model
    }
  }

  // All models failed
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

/**
 * Create prompt for AI insights
 */
function createInsightsPrompt(stats, dataPoints) {
  return `You are a security analyst for a train booking system. Analyze the following user behavior statistics and provide actionable insights.

**Statistics (Last ${stats.timeRange}):**
- Total Sessions: ${stats.totalSessions}
- Bot Detection Rate: ${stats.botRate.toFixed(1)}%
- Human Detection Rate: ${stats.humanRate.toFixed(1)}%
- Average Trust Score: ${stats.avgTrustScore.toFixed(1)}%
- Suspicious Patterns Detected: ${stats.totalSuspiciousPatterns}

**Trust Score Distribution:**
- High Trust (70-100%): ${stats.highTrust}
- Medium Trust (50-69%): ${stats.mediumTrust}
- Low Trust (25-49%): ${stats.lowTrust}
- Suspicious (<25%): ${stats.suspicious}

**Common Suspicious Patterns:**
${stats.topSuspiciousPatterns.map((p, i) => `${i + 1}. ${p.type}: ${p.count} occurrences`).join('\n')}

**Your Task:**
Provide insights in JSON format (no markdown, no code blocks):

{
  "summary": "Brief 2-3 sentence summary of overall security posture",
  "patterns": [
    "Pattern observation 1",
    "Pattern observation 2"
  ],
  "trends": [
    "Trend observation 1",
    "Trend observation 2"
  ],
  "alerts": [
    "Critical alert if any (or empty array)"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

Focus on security, user experience, and operational insights.`;
}

/**
 * Calculate statistics from behavior data
 */
function calculateStatistics(behaviorData) {
  const stats = {
    totalSessions: behaviorData.length,
    botRate: 0,
    humanRate: 0,
    avgTrustScore: 0,
    totalSuspiciousPatterns: 0,
    highTrust: 0,
    mediumTrust: 0,
    lowTrust: 0,
    suspicious: 0,
    topSuspiciousPatterns: []
  };

  const suspiciousPatternCounts = {};
  let totalTrustScore = 0;
  let botCount = 0;

  behaviorData.forEach(log => {
    const trustScore = log.trust_score;
    totalTrustScore += trustScore;

    // Categorize
    if (trustScore >= 70) stats.highTrust++;
    else if (trustScore >= 50) stats.mediumTrust++;
    else if (trustScore >= 25) stats.lowTrust++;
    else stats.suspicious++;

    if (trustScore < 50) botCount++;

    // Count suspicious patterns
    const patterns = log.behavior_data?.trackingData?.sessionMetrics?.suspiciousPatterns || [];
    stats.totalSuspiciousPatterns += patterns.length;

    patterns.forEach(pattern => {
      const type = pattern.type || 'unknown';
      suspiciousPatternCounts[type] = (suspiciousPatternCounts[type] || 0) + 1;
    });
  });

  stats.avgTrustScore = totalTrustScore / behaviorData.length;
  stats.botRate = (botCount / behaviorData.length) * 100;
  stats.humanRate = 100 - stats.botRate;

  // Top 5 suspicious patterns
  stats.topSuspiciousPatterns = Object.entries(suspiciousPatternCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
}

/**
 * Generate basic insights without AI
 */
function generateBasicInsights(behaviorData) {
  const stats = calculateStatistics(behaviorData);

  return {
    summary: `Analyzed ${stats.totalSessions} sessions. Bot detection rate: ${stats.botRate.toFixed(1)}%. Average trust score: ${stats.avgTrustScore.toFixed(1)}%.`,
    patterns: [
      `${stats.highTrust} sessions with high trust (${((stats.highTrust/stats.totalSessions)*100).toFixed(1)}%)`,
      `${stats.suspicious} sessions flagged as suspicious`,
      `Total ${stats.totalSuspiciousPatterns} suspicious patterns detected`
    ],
    trends: [
      stats.botRate > 30 ? 'High bot activity detected' : 'Normal bot activity levels',
      stats.avgTrustScore > 70 ? 'Majority of users are legitimate' : 'Increased scrutiny recommended'
    ],
    alerts: stats.botRate > 50 ? ['ALERT: Bot traffic exceeds 50%'] : [],
    recommendations: [
      stats.suspicious > 10 ? 'Review suspicious sessions manually' : 'Continue monitoring',
      'Consider adjusting trust score thresholds based on traffic patterns'
    ],
    source: 'basic',
    stats: stats
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || '24h';
  const limit = parseInt(searchParams.get('limit') || '100');

  return POST(new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ timeRange, limit })
  }));
}
