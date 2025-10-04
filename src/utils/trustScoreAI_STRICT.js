/**
 * STRICT Trust Score Calculator - Actually Detects Bots!
 * VERSION: 3.0.0-STRICT
 * 
 * This version replaces the overly lenient 2.0.0-LENIENT version
 * with proper thresholds that can actually identify bot behavior
 */

console.log('🔧 trustScoreAI.js VERSION 3.0.0-STRICT loaded');

export async function calculateTrustScore(behaviorData) {
  try {
    if (!behaviorData || !behaviorData.trackingData) {
      return {
        success: true,
        trustScore: 0.3, // STRICT: Low trust for missing data
        confidence: 0.8,
        trustLevel: 'low',
        needsCaptcha: true,
        reasons: ['No behavior data - suspicious'],
        analysis: {},
        metadata: { dataQuality: 0 }
      };
    }

    const { trackingData } = behaviorData;
    
    let humanFactors = 0;
    let botFactors = 0;
    let totalFactors = 0;
    let reasons = [];
    let confidence = 0;
    let analysis = {};

    // 1. Mouse Movement Analysis (30% weight) - STRICT
    try {
      const mouseScore = analyzeMouseBehaviorStrict(trackingData.mouseMovements || []);
      humanFactors += mouseScore.humanScore * 0.30;
      botFactors += mouseScore.botScore * 0.30;
      totalFactors += 0.30;
      reasons.push(...(mouseScore.reasons || []));
      confidence += mouseScore.confidence * 0.30;
      analysis.mouse = mouseScore.humanScore;
    } catch (error) {
      console.warn('Mouse analysis failed:', error);
      botFactors += 0.20; // Penalty for failed analysis
      analysis.mouse = 0.2;
    }

    // 2. Keystroke Analysis (30% weight) - STRICT
    try {
      const keystrokeScore = analyzeKeystrokeBehaviorStrict(trackingData.keystrokes || []);
      humanFactors += keystrokeScore.humanScore * 0.30;
      botFactors += keystrokeScore.botScore * 0.30;
      totalFactors += 0.30;
      reasons.push(...(keystrokeScore.reasons || []));
      confidence += keystrokeScore.confidence * 0.30;
      analysis.keystroke = keystrokeScore.humanScore;
    } catch (error) {
      console.warn('Keystroke analysis failed:', error);
      botFactors += 0.20;
      analysis.keystroke = 0.2;
    }

    // 3. Temporal Analysis (20% weight) - STRICT
    try {
      const temporalScore = analyzeTemporalPatternsStrict(trackingData);
      humanFactors += temporalScore.humanScore * 0.20;
      botFactors += temporalScore.botScore * 0.20;
      totalFactors += 0.20;
      reasons.push(...(temporalScore.reasons || []));
      confidence += temporalScore.confidence * 0.20;
      analysis.temporal = temporalScore.humanScore;
    } catch (error) {
      console.warn('Temporal analysis failed:', error);
      botFactors += 0.15;
      analysis.temporal = 0.2;
    }

    // 4. Session Metrics Analysis (20% weight) - STRICT
    try {
      const sessionScore = analyzeSessionMetricsStrict(trackingData.sessionMetrics || {});
      humanFactors += sessionScore.humanScore * 0.20;
      botFactors += sessionScore.botScore * 0.20;
      totalFactors += 0.20;
      reasons.push(...(sessionScore.reasons || []));
      confidence += sessionScore.confidence * 0.20;
      analysis.diversity = sessionScore.humanScore;
    } catch (error) {
      console.warn('Session analysis failed:', error);
      botFactors += 0.15;
      analysis.diversity = 0.2;
    }

    // Calculate raw score with STRICT penalties
    const rawScore = totalFactors > 0 ? humanFactors / totalFactors : 0.2;
    const penaltyScore = botFactors;
    let finalScore = Math.max(0, rawScore - (penaltyScore * 1.5)); // 1.5x penalty multiplier

    console.log('🔍 STRICT Trust Score Calculation:');
    console.log('  - Human Factors:', humanFactors.toFixed(3));
    console.log('  - Bot Factors (penalty):', botFactors.toFixed(3));
    console.log('  - Raw Score:', rawScore.toFixed(3));
    console.log('  - Penalty Score:', penaltyScore.toFixed(3));
    console.log('  - Final Score (after penalty):', finalScore.toFixed(3));

    // STRICT: No generous boosts, only reality-based adjustments
    if (totalFactors < 0.8) {
      finalScore *= 0.7; // Penalty for incomplete data
      console.log('  - Score after incomplete data penalty:', finalScore.toFixed(3));
    }

    // STRICT trust levels and captcha
    const trustLevel = getStrictTrustLevel(finalScore);
    const needsCaptcha = finalScore <= 0.6; // STRICT threshold

    console.log('  - Final Trust Score:', finalScore.toFixed(3), '(' + (finalScore * 100).toFixed(1) + '%)');
    console.log('  - Trust Level:', trustLevel);
    console.log('  - Needs Captcha:', needsCaptcha, '(threshold: 0.6)');

    return {
      success: true,
      trustScore: finalScore,
      confidence: Math.min(1, Math.max(0.3, confidence)),
      trustLevel,
      needsCaptcha,
      reasons: reasons.slice(0, 5),
      analysis,
      metadata: {
        humanFactors,
        botFactors,
        rawScore,
        penaltyScore,
        dataQuality: totalFactors,
        sessionDuration: trackingData.sessionMetrics?.totalSessionTime || 0,
        totalInteractions: trackingData.sessionMetrics?.interactionCount || 0,
        suspiciousPatterns: trackingData.sessionMetrics?.suspiciousPatterns?.length || 0
      }
    };

  } catch (error) {
    console.error('Trust score calculation failed:', error);
    return {
      success: false,
      trustScore: 0.1, // STRICT: Very low trust on errors
      confidence: 0.9,
      trustLevel: 'very_low',
      needsCaptcha: true,
      reasons: ['Analysis failed - high suspicion'],
      analysis: {},
      metadata: { error: error.message }
    };
  }
}

function analyzeMouseBehaviorStrict(mouseMovements) {
  if (!mouseMovements || mouseMovements.length < 10) {
    return {
      humanScore: 0.3, // STRICT: Low score for insufficient data
      botScore: 0.4,
      confidence: 0.7,
      reasons: ['Insufficient mouse data - suspicious']
    };
  }

  let humanScore = 0.4; // Start neutral-low
  let botScore = 0;
  let reasons = [];

  // Calculate intervals between movements
  const intervals = [];
  for (let i = 1; i < mouseMovements.length; i++) {
    const interval = mouseMovements[i].timestamp - mouseMovements[i-1].timestamp;
    intervals.push(interval);
  }

  if (intervals.length > 5) {
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const intervalVariance = calculateVariance(intervals);
    
    // STRICT: Detect inhuman speeds
    if (avgInterval < 10) { // Less than 10ms = bot
      botScore += 0.6;
      reasons.push('Inhuman mouse speed detected');
    } else if (avgInterval < 50) { // Less than 50ms = suspicious
      botScore += 0.3;
      reasons.push('Very fast mouse movement');
    } else if (avgInterval > 100 && avgInterval < 300) { // Normal human range
      humanScore += 0.4;
      reasons.push('Human-like mouse timing');
    }

    // STRICT: Detect too-consistent patterns
    if (intervalVariance < 10) { // Very low variance = bot
      botScore += 0.5;
      reasons.push('Too consistent mouse timing');
    } else if (intervalVariance > 50 && intervalVariance < 500) { // Human variance
      humanScore += 0.3;
      reasons.push('Natural mouse variance');
    }
  }

  // Check for linear movement patterns
  if (mouseMovements.length > 10) {
    let linearCount = 0;
    for (let i = 2; i < mouseMovements.length; i++) {
      const prev = mouseMovements[i-1];
      const curr = mouseMovements[i];
      const prevPrev = mouseMovements[i-2];
      
      // Check if movement is too linear
      const dx1 = prev.x - prevPrev.x;
      const dy1 = prev.y - prevPrev.y;
      const dx2 = curr.x - prev.x;
      const dy2 = curr.y - prev.y;
      
      if (Math.abs(dx1 - dx2) < 2 && Math.abs(dy1 - dy2) < 2) {
        linearCount++;
      }
    }
    
    const linearRatio = linearCount / (mouseMovements.length - 2);
    if (linearRatio > 0.7) { // Too linear = bot
      botScore += 0.4;
      reasons.push('Too linear mouse movement');
    } else if (linearRatio < 0.3) { // Natural curves
      humanScore += 0.2;
      reasons.push('Natural mouse curves');
    }
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.8,
    reasons
  };
}

function analyzeKeystrokeBehaviorStrict(keystrokes) {
  if (!keystrokes || keystrokes.length < 5) {
    return {
      humanScore: 0.3, // STRICT: Low score for insufficient data
      botScore: 0.4,
      confidence: 0.7,
      reasons: ['Insufficient keystroke data - suspicious']
    };
  }

  let humanScore = 0.4;
  let botScore = 0;
  let reasons = [];

  // Calculate intervals between keystrokes
  const intervals = [];
  for (let i = 1; i < keystrokes.length; i++) {
    const interval = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
    intervals.push(interval);
  }

  if (intervals.length > 3) {
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const intervalVariance = calculateVariance(intervals);
    
    // STRICT: Detect inhuman typing speeds
    if (avgInterval < 50) { // Less than 50ms = impossible
      botScore += 0.7;
      reasons.push('Inhuman typing speed');
    } else if (avgInterval < 100) { // Less than 100ms = very suspicious
      botScore += 0.4;
      reasons.push('Very fast typing');
    } else if (avgInterval > 150 && avgInterval < 400) { // Normal human range
      humanScore += 0.4;
      reasons.push('Human-like typing speed');
    }

    // STRICT: Detect too-consistent timing
    if (intervalVariance < 20) { // Very consistent = bot
      botScore += 0.5;
      reasons.push('Too consistent typing rhythm');
    } else if (intervalVariance > 100 && intervalVariance < 1000) { // Human variance
      humanScore += 0.3;
      reasons.push('Natural typing rhythm variation');
    }
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.8,
    reasons
  };
}

function analyzeTemporalPatternsStrict(trackingData) {
  let humanScore = 0.3;
  let botScore = 0;
  let reasons = [];
  
  const sessionTime = trackingData.sessionMetrics?.totalSessionTime || 0;
  const interactionCount = trackingData.sessionMetrics?.interactionCount || 0;
  
  if (sessionTime > 0 && interactionCount > 0) {
    const interactionRate = interactionCount / (sessionTime / 1000); // per second
    
    // STRICT: Detect inhuman interaction rates
    if (interactionRate > 20) { // More than 20 interactions/second = bot
      botScore += 0.6;
      reasons.push('Inhuman interaction rate');
    } else if (interactionRate > 10) { // More than 10/sec = suspicious
      botScore += 0.3;
      reasons.push('Very high interaction rate');
    } else if (interactionRate > 1 && interactionRate < 5) { // Normal range
      humanScore += 0.4;
      reasons.push('Normal interaction rate');
    }
    
    // Check for reasonable session duration
    if (sessionTime < 2000 && interactionCount > 50) { // Too much activity in short time
      botScore += 0.4;
      reasons.push('Too much activity in short time');
    } else if (sessionTime > 10000 && sessionTime < 300000) { // 10s-5min = reasonable
      humanScore += 0.2;
      reasons.push('Reasonable session duration');
    }
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.8,
    reasons
  };
}

function analyzeSessionMetricsStrict(sessionMetrics) {
  let humanScore = 0.3;
  let botScore = 0;
  let reasons = [];
  
  // Check suspicious patterns
  const suspiciousPatterns = sessionMetrics.suspiciousPatterns || [];
  if (suspiciousPatterns.length > 2) {
    botScore += 0.5;
    reasons.push('Multiple suspicious patterns detected');
  } else if (suspiciousPatterns.length === 0) {
    humanScore += 0.2;
    reasons.push('No suspicious patterns detected');
  }
  
  // Check copy/paste behavior
  const copyPasteEvents = sessionMetrics.copyPasteEvents || 0;
  const totalInteractions = sessionMetrics.interactionCount || 1;
  const copyPasteRatio = copyPasteEvents / totalInteractions;
  
  if (copyPasteRatio > 0.3) { // More than 30% copy/paste = bot
    botScore += 0.4;
    reasons.push('Excessive copy/paste behavior');
  } else if (copyPasteRatio < 0.1) { // Normal typing
    humanScore += 0.3;
    reasons.push('Normal typing behavior');
  }
  
  // Check tab switching behavior
  const tabSwitches = sessionMetrics.tabSwitches || 0;
  if (tabSwitches > 10 && totalInteractions < 100) { // Too many tab switches
    botScore += 0.3;
    reasons.push('Excessive tab switching');
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.8,
    reasons
  };
}

function getStrictTrustLevel(score) {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  if (score >= 0.4) return 'low';
  if (score >= 0.2) return 'very_low';
  return 'bot_suspected';
}

function calculateVariance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(val => Math.pow(val - mean, 2));
  return squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

// Keep the validation function for compatibility
export function validateMetrics(behaviorData) {
  return {
    valid: true,
    errors: []
  };
}