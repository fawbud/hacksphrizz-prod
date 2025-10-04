/**
 * Trust Scores API
 * Retrieve trust scores from behavior logs
 */

import { supabaseAdmin } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const timeRange = searchParams.get('timeRange') || '24h';
    const limit = parseInt(searchParams.get('limit') || '100');
    const sessionId = searchParams.get('sessionId'); // Optional: get specific session
    const minTrustScore = parseFloat(searchParams.get('minTrustScore') || '0');
    const maxTrustScore = parseFloat(searchParams.get('maxTrustScore') || '100');
    const sortBy = searchParams.get('sortBy') || 'created_at'; // created_at, trust_score
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc

    // Calculate time range
    const timeRanges = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
      'all': null
    };

    const hours = timeRanges[timeRange];

    // Build query
    let query = supabaseAdmin
      .from('behavior_logs')
      .select('*');

    // Filter by session ID if provided
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    // Filter by time range
    if (hours !== null) {
      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', cutoffDate);
    }

    // Filter by trust score range
    query = query
      .gte('trust_score', minTrustScore)
      .lte('trust_score', maxTrustScore);

    // Sort and limit
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch trust scores'
      }, { status: 500 });
    }

    // Process data
    const trustScores = data.map(log => ({
      sessionId: log.session_id,
      trustScore: log.trust_score,
      isBot: log.is_bot,
      classification: classifyTrustScore(log.trust_score),
      suspiciousPatterns: log.behavior_data?.trackingData?.sessionMetrics?.suspiciousPatterns || [],
      createdAt: log.created_at,
      updatedAt: log.updated_at
    }));

    // Calculate statistics
    const stats = calculateStatistics(trustScores);

    return NextResponse.json({
      success: true,
      data: trustScores,
      stats: stats,
      meta: {
        total: trustScores.length,
        timeRange: timeRange,
        filters: {
          minTrustScore,
          maxTrustScore,
          sortBy,
          sortOrder
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Trust scores API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST endpoint to get trust scores with more complex filters
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      timeRange = '24h',
      limit = 100,
      sessionIds = null,
      trustScoreRange = { min: 0, max: 100 },
      includePatterns = true,
      groupBy = null // 'hour', 'day', 'classification'
    } = body;

    // Calculate time range
    const timeRanges = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
      'all': null
    };

    const hours = timeRanges[timeRange];

    // Build query
    let query = supabaseAdmin
      .from('behavior_logs')
      .select('*');

    // Filter by session IDs if provided
    if (sessionIds && sessionIds.length > 0) {
      query = query.in('session_id', sessionIds);
    }

    // Filter by time range
    if (hours !== null) {
      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', cutoffDate);
    }

    // Filter by trust score range
    query = query
      .gte('trust_score', trustScoreRange.min)
      .lte('trust_score', trustScoreRange.max);

    // Sort and limit
    query = query
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch trust scores'
      }, { status: 500 });
    }

    // Process data
    let trustScores = data.map(log => {
      const base = {
        sessionId: log.session_id,
        trustScore: log.trust_score,
        isBot: log.is_bot,
        classification: classifyTrustScore(log.trust_score),
        createdAt: log.created_at,
        updatedAt: log.updated_at
      };

      if (includePatterns) {
        base.suspiciousPatterns = log.behavior_data?.trackingData?.sessionMetrics?.suspiciousPatterns || [];
        base.behaviorMetrics = extractBehaviorMetrics(log.behavior_data);
      }

      return base;
    });

    // Group by if requested
    if (groupBy) {
      trustScores = groupTrustScores(trustScores, groupBy);
    }

    // Calculate statistics
    const stats = calculateStatistics(data.map(log => ({
      sessionId: log.session_id,
      trustScore: log.trust_score,
      isBot: log.is_bot,
      classification: classifyTrustScore(log.trust_score),
      suspiciousPatterns: log.behavior_data?.trackingData?.sessionMetrics?.suspiciousPatterns || []
    })));

    return NextResponse.json({
      success: true,
      data: trustScores,
      stats: stats,
      meta: {
        total: data.length,
        timeRange: timeRange,
        groupBy: groupBy,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Trust scores POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Classify trust score into categories
 */
function classifyTrustScore(score) {
  if (score >= 70) return 'high_trust';
  if (score >= 50) return 'medium_trust';
  if (score >= 25) return 'low_trust';
  return 'suspicious';
}

/**
 * Extract behavior metrics from behavior_data
 */
function extractBehaviorMetrics(behaviorData) {
  if (!behaviorData?.trackingData?.sessionMetrics) return null;

  const metrics = behaviorData.trackingData.sessionMetrics;

  return {
    mouseMovements: metrics.mouseMovements || 0,
    clicks: metrics.clicks || 0,
    keypresses: metrics.keypresses || 0,
    scrolls: metrics.scrolls || 0,
    focusChanges: metrics.focusChanges || 0,
    timeOnPage: metrics.timeOnPage || 0,
    suspiciousPatternCount: metrics.suspiciousPatterns?.length || 0
  };
}

/**
 * Group trust scores by time or classification
 */
function groupTrustScores(scores, groupBy) {
  if (groupBy === 'classification') {
    const grouped = {
      high_trust: [],
      medium_trust: [],
      low_trust: [],
      suspicious: []
    };

    scores.forEach(score => {
      grouped[score.classification].push(score);
    });

    return grouped;
  }

  if (groupBy === 'hour' || groupBy === 'day') {
    const grouped = {};

    scores.forEach(score => {
      const date = new Date(score.createdAt);
      let key;

      if (groupBy === 'hour') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(score);
    });

    return grouped;
  }

  return scores;
}

/**
 * Calculate statistics from trust scores
 */
function calculateStatistics(scores) {
  if (scores.length === 0) {
    return {
      total: 0,
      avgTrustScore: 0,
      botRate: 0,
      humanRate: 0,
      distribution: {
        high_trust: 0,
        medium_trust: 0,
        low_trust: 0,
        suspicious: 0
      },
      topSuspiciousPatterns: []
    };
  }

  let totalTrustScore = 0;
  let botCount = 0;
  const distribution = {
    high_trust: 0,
    medium_trust: 0,
    low_trust: 0,
    suspicious: 0
  };
  const patternCounts = {};

  scores.forEach(score => {
    totalTrustScore += score.trustScore;

    if (score.isBot || score.trustScore < 50) {
      botCount++;
    }

    // Count distribution
    distribution[score.classification]++;

    // Count suspicious patterns
    if (score.suspiciousPatterns) {
      score.suspiciousPatterns.forEach(pattern => {
        const type = pattern.type || 'unknown';
        patternCounts[type] = (patternCounts[type] || 0) + 1;
      });
    }
  });

  const topPatterns = Object.entries(patternCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: scores.length,
    avgTrustScore: totalTrustScore / scores.length,
    botRate: (botCount / scores.length) * 100,
    humanRate: ((scores.length - botCount) / scores.length) * 100,
    distribution: distribution,
    distributionPercentage: {
      high_trust: (distribution.high_trust / scores.length) * 100,
      medium_trust: (distribution.medium_trust / scores.length) * 100,
      low_trust: (distribution.low_trust / scores.length) * 100,
      suspicious: (distribution.suspicious / scores.length) * 100
    },
    topSuspiciousPatterns: topPatterns
  };
}
