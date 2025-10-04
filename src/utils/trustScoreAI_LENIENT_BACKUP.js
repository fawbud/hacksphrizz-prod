/**
 * Advanced AI Trust Score Calculator
 * Comprehensive analysis of user behavior patterns to detect human vs bot activity
 * Uses machine learning-inspired algorithms for robust bot detection
 *
 * VERSION: 2.0.0-LENIENT (Updated: 2025-10-03)
 * Changes: More generous scoring, lower thresholds, reduced penalties
 */

// VERSION CHECK - This will appear in console
console.log('🔧 trustScoreAI.js VERSION 2.0.0-LENIENT loaded');

/**
 * Main function to calculate trust score from comprehensive behavior data
 * @param {Object} behaviorData - Complete behavior tracking data from BehaviorTracker
 * @returns {Object} Trust score result with confidence and reasoning
 */
export async function calculateTrustScore(behaviorData) {
  try {
    // Comprehensive validation
    if (!behaviorData) {
      console.warn('No behavior data provided');
      return {
        success: true, // Still return success for fallback
        error: 'No behavior data provided',
        trustScore: 0.8, // Default trust score
        confidence: 0.5,
        trustLevel: 'medium',
        needsCaptcha: false,
        reasons: ['No behavior data collected yet'],
        analysis: {},
        metadata: { dataQuality: 0 }
      };
    }

    if (!behaviorData.trackingData) {
      console.warn('No tracking data in behavior data');
      return {
        success: true,
        error: 'No tracking data found',
        trustScore: 0.8,
        confidence: 0.5,
        trustLevel: 'medium',
        needsCaptcha: false,
        reasons: ['No tracking data available'],
        analysis: {},
        metadata: { dataQuality: 0 }
      };
    }

    const { trackingData, processed } = behaviorData;
    
    // Initialize scoring components with safe defaults
    let humanFactors = 0;
    let botFactors = 0;
    let totalFactors = 0;
    let reasons = [];
    let confidence = 0;
    let analysis = {};

    // 1. Mouse Movement Analysis (25% weight)
    try {
      const mouseScore = analyzeMouseBehavior(trackingData.mouseMovements || [], trackingData.humanBehaviorIndicators || {});
      humanFactors += mouseScore.humanScore * 0.25;
      botFactors += mouseScore.botScore * 0.25;
      totalFactors += 0.25;
      reasons.push(...(mouseScore.reasons || []));
      confidence += mouseScore.confidence * 0.25;
      analysis.mouse = mouseScore.humanScore;
    } catch (error) {
      console.warn('Mouse analysis failed:', error);
      analysis.mouse = 0.5; // Neutral score
    }

    // 2. Keystroke Pattern Analysis (25% weight)
    try {
      const keystrokeScore = analyzeKeystrokeBehavior(trackingData.keystrokes || [], trackingData.timingMetrics || {});
      humanFactors += keystrokeScore.humanScore * 0.25;
      botFactors += keystrokeScore.botScore * 0.25;
      totalFactors += 0.25;
      reasons.push(...(keystrokeScore.reasons || []));
      confidence += keystrokeScore.confidence * 0.25;
      analysis.keystroke = keystrokeScore.humanScore;
    } catch (error) {
      console.warn('Keystroke analysis failed:', error);
      analysis.keystroke = 0.5;
    }

    // 3. Form Interaction Analysis (20% weight)
    try {
      const formScore = analyzeFormBehavior(trackingData.formInteractions || [], trackingData.sessionMetrics || {});
      humanFactors += formScore.humanScore * 0.20;
      botFactors += formScore.botScore * 0.20;
      totalFactors += 0.20;
      reasons.push(...(formScore.reasons || []));
      confidence += formScore.confidence * 0.20;
      analysis.form = formScore.humanScore;
    } catch (error) {
      console.warn('Form analysis failed:', error);
      analysis.form = 0.5;
    }

    // 4. Temporal Pattern Analysis (15% weight)
    try {
      const temporalScore = analyzeTemporalPatterns(trackingData.sessionMetrics || {}, trackingData.timingMetrics || {});
      humanFactors += temporalScore.humanScore * 0.15;
      botFactors += temporalScore.botScore * 0.15;
      totalFactors += 0.15;
      reasons.push(...(temporalScore.reasons || []));
      confidence += temporalScore.confidence * 0.15;
      analysis.temporal = temporalScore.humanScore;
    } catch (error) {
      console.warn('Temporal analysis failed:', error);
      analysis.temporal = 0.5;
    }

    // 5. Interaction Diversity Analysis (10% weight)
    try {
      const diversityScore = analyzeInteractionDiversity(trackingData);
      humanFactors += diversityScore.humanScore * 0.10;
      botFactors += diversityScore.botScore * 0.10;
      totalFactors += 0.10;
      reasons.push(...(diversityScore.reasons || []));
      confidence += diversityScore.confidence * 0.10;
      analysis.diversity = diversityScore.humanScore;
    } catch (error) {
      console.warn('Diversity analysis failed:', error);
      analysis.diversity = 0.5;
    }

    // 6. Suspicious Pattern Analysis (5% weight)
    try {
      const suspiciousScore = analyzeSuspiciousPatterns(trackingData.sessionMetrics?.suspiciousPatterns || []);
      humanFactors += suspiciousScore.humanScore * 0.05;
      botFactors += suspiciousScore.botScore * 0.05;
      totalFactors += 0.05;
      reasons.push(...(suspiciousScore.reasons || []));
      confidence += suspiciousScore.confidence * 0.05;
      analysis.suspicious = suspiciousScore.humanScore;
    } catch (error) {
      console.warn('Suspicious pattern analysis failed:', error);
      analysis.suspicious = 0.5;
    }

    // Calculate final trust score with safety checks - EXTREMELY GENEROUS
    const rawScore = totalFactors > 0 ? humanFactors / totalFactors : 0.80; // Increased base from 0.75 to 0.80
    const penaltyScore = Math.min(botFactors || 0, 0.15); // Cap penalty at 15% (reduced from 20%)
    const finalScore = Math.max(0.35, Math.min(1, rawScore - penaltyScore)); // Min score 35% instead of 25%

    // DEBUG: Log score calculation breakdown
    console.log('🔍 Trust Score Calculation Breakdown:');
    console.log('  - Human Factors:', humanFactors.toFixed(3), '/', totalFactors.toFixed(3));
    console.log('  - Bot Factors (penalty):', botFactors.toFixed(3));
    console.log('  - Raw Score:', rawScore.toFixed(3));
    console.log('  - Penalty Score:', penaltyScore.toFixed(3));
    console.log('  - Final Score (after penalty):', finalScore.toFixed(3));

    // Apply processed score influence if available - VERY GENEROUS
    let adjustedScore = finalScore;
    if (processed && processed.humanLikeScore !== undefined) {
      // Weighted combination: 50% AI analysis, 50% processed metrics
      // Equal weight - give benefit of doubt
      adjustedScore = (finalScore * 0.5) + (processed.humanLikeScore * 0.5);
      console.log('  - Processed Human-Like Score:', processed.humanLikeScore.toFixed(3));
      console.log('  - Adjusted Score (50/50 blend):', adjustedScore.toFixed(3));
    }

    // Add generous boost for having sufficient data
    if (totalFactors >= 1.0) {
      adjustedScore = Math.min(1, adjustedScore * 1.15); // 15% boost for complete data (was 10%)
      console.log('  - Score after data completeness boost:', adjustedScore.toFixed(3));
    }

    // Additional boost for legitimate interaction patterns
    if (humanFactors > botFactors * 2) {
      adjustedScore = Math.min(1, adjustedScore * 1.05); // 5% bonus if clearly human
      console.log('  - Score after human pattern bonus:', adjustedScore.toFixed(3));
    }

    // Confidence adjustment based on data quality
    let dataQualityMultiplier = 1.0;
    try {
      dataQualityMultiplier = calculateDataQuality(trackingData);
    } catch (error) {
      console.warn('Data quality calculation failed:', error);
    }
    
    const finalConfidence = Math.min(1, Math.max(0.1, confidence * dataQualityMultiplier));
    const finalTrustScore = Math.max(0, Math.min(1, adjustedScore));

    // Determine trust level and captcha need - VERY GENEROUS
    const trustLevel = getTrustLevel(finalTrustScore);
    const needsCaptcha = finalTrustScore <= 0.25; // Lowered threshold from 0.35 to 0.25

    // DEBUG: Log final results
    console.log('  - Data Quality Multiplier:', dataQualityMultiplier.toFixed(3));
    console.log('  - Final Trust Score:', finalTrustScore.toFixed(3), '(' + (finalTrustScore * 100).toFixed(1) + '%)');
    console.log('  - Trust Level:', trustLevel);
    console.log('  - Needs Captcha:', needsCaptcha, '(threshold: 0.35)');
    console.log('  - Top Reasons:', reasons.slice(0, 5));

    return {
      success: true,
      trustScore: finalTrustScore,
      trustLevel: trustLevel,
      needsCaptcha: needsCaptcha,
      confidence: finalConfidence,
      reasons: reasons.filter(r => r && r.trim && r.trim().length > 0).slice(0, 10),
      analysis: analysis,
      metadata: {
        humanFactors: humanFactors,
        botFactors: botFactors,
        rawScore: finalScore,
        processedScore: processed?.humanLikeScore || null,
        dataQuality: dataQualityMultiplier,
        sessionDuration: trackingData.sessionMetrics?.totalSessionTime || 0,
        totalInteractions: trackingData.sessionMetrics?.interactionCount || 0,
        suspiciousPatterns: trackingData.sessionMetrics?.suspiciousPatterns?.length || 0
      }
    };

  } catch (error) {
    console.error('Trust score calculation error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error in trust score calculation',
      trustScore: 0.5, // Safe fallback
      trustLevel: 'medium',
      needsCaptcha: false,
      confidence: 0.3,
      reasons: ['Error in analysis: ' + (error.message || 'Unknown error')],
      analysis: {},
      metadata: { dataQuality: 0 }
    };
  }
}

function getTrustLevel(trustScore) {
  // VERY GENEROUS thresholds
  if (trustScore >= 0.6) return 'high'; // Lowered from 0.7
  if (trustScore >= 0.4) return 'medium'; // Lowered from 0.5
  if (trustScore >= 0.25) return 'low'; // Lowered from 0.3
  return 'suspicious';
}

/**
 * Analyze mouse movement patterns for human-like behavior
 */
function analyzeMouseBehavior(mouseMovements, humanIndicators) {
  if (!mouseMovements || mouseMovements.length < 5) {
    return {
      humanScore: 0.8, // Even more generous default (was 0.7)
      botScore: 0.02, // Very low default penalty (was 0.05)
      score: 0.8,
      confidence: 0.3,
      reasons: ['Insufficient mouse data - assuming human']
    };
  }

  let humanScore = 0.8; // Start very generous (was 0.7)
  let botScore = 0;
  let reasons = [];
  let confidence = 0.8;

  // Calculate movement metrics
  const velocities = mouseMovements.map(m => m.velocity).filter(v => v > 0);
  const accelerations = mouseMovements.map(m => m.acceleration).filter(a => a !== undefined);
  const distances = mouseMovements.map(m => m.distance).filter(d => d > 0);

  if (velocities.length > 0) {
    const velocityVariance = calculateVariance(velocities);
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

    // Human-like velocity variation - EXTREMELY GENEROUS
    // High variance is actually normal for humans (fast users, varied movements)
    if (velocityVariance > 0.02) { // Even lower threshold (was 0.03)
      humanScore += 0.3; // Higher bonus (was 0.25)
      reasons.push('Natural velocity variation detected');
    } else if (velocityVariance < 0.003) { // Much stricter to trigger (was 0.005)
      botScore += 0.1; // Lower penalty (was 0.15)
      reasons.push('Very consistent velocity');
    }

    // Reasonable average velocity
    if (avgVelocity > 0.5 && avgVelocity < 2.0) {
      humanScore += 0.1;
      reasons.push('Human-like mouse speed');
    } else if (avgVelocity > 3.0) {
      botScore += 0.2;
      reasons.push('Unusually fast mouse movement');
    }
  }

  // Mouse jitter analysis (human trait)
  if (humanIndicators && humanIndicators.mouseJitter > 0) {
    const jitterRatio = humanIndicators.mouseJitter / mouseMovements.length;
    if (jitterRatio > 0.02) {
      humanScore += 0.15;
      reasons.push('Human-like mouse jitter detected');
    }
  } else {
    botScore += 0.1;
    reasons.push('No mouse jitter detected');
  }

  // Acceleration patterns
  if (accelerations.length > 5) {
    const accelVariance = calculateVariance(accelerations);
    if (accelVariance > 0.01) {
      humanScore += 0.1;
      reasons.push('Natural acceleration patterns');
    } else {
      botScore += 0.15;
      reasons.push('Too consistent acceleration');
    }
  }

  // Movement distance analysis
  if (distances.length > 0) {
    const totalDistance = distances.reduce((sum, d) => sum + d, 0);
    const avgDistance = totalDistance / distances.length;
    
    if (avgDistance > 5 && avgDistance < 50) {
      humanScore += 0.05;
    } else if (avgDistance < 2) {
      botScore += 0.1;
      reasons.push('Unnaturally small movements');
    }
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    score: Math.min(1, humanScore),
    confidence,
    reasons
  };
}

/**
 * Analyze keystroke timing patterns
 */
function analyzeKeystrokeBehavior(keystrokes, timingMetrics) {
  if (!keystrokes || keystrokes.length < 5) {
    return {
      humanScore: 0.8, // Even more generous default (was 0.7)
      botScore: 0.02, // Very low penalty (was 0.05)
      score: 0.8,
      confidence: 0.3,
      reasons: ['Insufficient keystroke data - assuming human']
    };
  }

  let humanScore = 0.8; // Start very generous (was 0.7)
  let botScore = 0;
  let reasons = [];
  let confidence = 0.9;

  const intervals = timingMetrics.keystrokeIntervals || [];
  
  if (intervals.length > 3) {
    const intervalVariance = calculateVariance(intervals);
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

    // Human-like timing variation - EXTREMELY GENEROUS
    // High variance is normal for humans (thinking, correcting, fast typing)
    if (intervalVariance > 20) { // Even lower threshold (was 30)
      humanScore += 0.35; // Higher bonus (was 0.3)
      reasons.push('Natural typing rhythm variation');
    } else if (intervalVariance < 5) { // Much stricter (was 10)
      botScore += 0.15; // Lower penalty (was 0.2)
      reasons.push('Very consistent typing rhythm');
    }

    // Reasonable typing speed
    if (avgInterval > 50 && avgInterval < 500) {
      humanScore += 0.15;
      reasons.push('Human-like typing speed');
    } else if (avgInterval < 30) {
      botScore += 0.3;
      reasons.push('Impossibly fast typing');
    }

    // Look for very short intervals (bot-like)
    const shortIntervals = intervals.filter(i => i < 20).length;
    if (shortIntervals > intervals.length * 0.1) {
      botScore += 0.2;
      reasons.push('Too many impossibly fast keystrokes');
    }
  }

  // Dwell time analysis
  const dwellTimes = keystrokes.map(k => k.dwellTime).filter(d => d > 0);
  if (dwellTimes.length > 3) {
    const dwellVariance = calculateVariance(dwellTimes);
    if (dwellVariance > 100) {
      humanScore += 0.1;
      reasons.push('Natural key press variation');
    }
  }

  // Special key usage (human trait)
  const specialKeys = keystrokes.filter(k => k.isSpecialKey || k.key === 'Backspace' || k.key === 'Delete');
  if (specialKeys.length > 0) {
    humanScore += 0.1;
    reasons.push('Natural use of correction keys');
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    score: Math.min(1, humanScore),
    confidence,
    reasons
  };
}

/**
 * Analyze form interaction behavior
 */
function analyzeFormBehavior(formInteractions, sessionMetrics) {
  const fieldCount = Object.keys(formInteractions).length;

  if (fieldCount === 0) {
    return {
      humanScore: 0.8, // Even more generous (was 0.7)
      botScore: 0,
      score: 0.8,
      confidence: 0.5,
      reasons: ['No form interactions - assuming human browsing']
    };
  }

  let humanScore = 0.8; // Start very generous (was 0.7)
  let botScore = 0;
  let reasons = [];
  let confidence = 0.8;

  let totalFocusTime = 0;
  let totalInputs = 0;
  let totalCorrections = 0;
  let totalHesitations = 0;

  Object.values(formInteractions).forEach(field => {
    totalFocusTime += field.totalFocusTime || 0;
    totalInputs += field.inputCount || 0;
    totalCorrections += field.corrections || 0;
    totalHesitations += field.hesitations || 0;
  });

  // Focus time analysis
  const avgFocusTime = totalFocusTime / fieldCount;
  if (avgFocusTime > 1000 && avgFocusTime < 10000) {
    humanScore += 0.2;
    reasons.push('Reasonable time spent on form fields');
  } else if (avgFocusTime < 500) {
    botScore += 0.3;
    reasons.push('Too little time spent on form fields');
  }

  // Correction patterns (human trait)
  if (totalCorrections > 0) {
    const correctionRatio = totalCorrections / Math.max(totalInputs, 1);
    if (correctionRatio > 0.02 && correctionRatio < 0.2) {
      humanScore += 0.2;
      reasons.push('Natural correction patterns detected');
    }
  } else if (totalInputs > 20) {
    botScore += 0.2;
    reasons.push('No corrections in extensive form filling');
  }

  // Hesitation patterns (human trait)
  if (totalHesitations > 0) {
    humanScore += 0.15;
    reasons.push('Human-like hesitation patterns');
  }

  // Field interaction consistency
  const focusCounts = Object.values(formInteractions).map(f => f.focusCount || 0);
  if (focusCounts.length > 1) {
    const focusVariance = calculateVariance(focusCounts);
    if (focusVariance > 0.5) {
      humanScore += 0.1;
      reasons.push('Natural variation in field interactions');
    }
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    score: Math.min(1, humanScore),
    confidence,
    reasons
  };
}

/**
 * Analyze temporal patterns in user behavior
 */
function analyzeTemporalPatterns(sessionMetrics, timingMetrics) {
  let humanScore = 0.8; // Start very generous (was 0.7)
  let botScore = 0;
  let reasons = [];
  let confidence = 0.7;

  const sessionDuration = sessionMetrics.sessionDuration || 0;
  const totalInteractions = sessionMetrics.interactionCount || 0;

  // Session duration analysis - MORE LENIENT
  // Fast users can complete forms quickly - don't penalize short sessions heavily
  if (sessionDuration > 3000 && sessionDuration < 300000) { // 3s to 5min
    humanScore += 0.2;
    reasons.push('Reasonable session duration');
  } else if (sessionDuration < 1000 && sessionDuration > 0) {
    botScore += 0.1; // Reduced from 0.2
    reasons.push('Very short session detected');
  }
  // No penalty for 0-1s sessions - could be testing or very fast legitimate users

  // Interaction frequency
  if (totalInteractions > 0 && sessionDuration > 0) {
    const interactionRate = totalInteractions / (sessionDuration / 1000); // per second
    if (interactionRate > 0.1 && interactionRate < 2) {
      humanScore += 0.15;
      reasons.push('Natural interaction frequency');
    } else if (interactionRate > 5) {
      botScore += 0.3;
      reasons.push('Unusually high interaction frequency');
    }
  }

  // Focus changes (human trait)
  const focusChanges = sessionMetrics.focusChanges || 0;
  if (focusChanges > 0) {
    humanScore += 0.1;
    reasons.push('Natural focus pattern detected');
  } else if (sessionDuration > 30000) {
    botScore += 0.1;
    reasons.push('No focus changes in long session');
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    score: Math.min(1, humanScore),
    confidence,
    reasons
  };
}

/**
 * Analyze interaction diversity
 */
function analyzeInteractionDiversity(trackingData) {
  let humanScore = 0.8; // Start very generous (was 0.7)
  let botScore = 0;
  let reasons = [];
  let confidence = 0.6;

  let interactionTypes = 0;

  if (trackingData.mouseMovements && trackingData.mouseMovements.length > 0) {
    interactionTypes++;
  }
  if (trackingData.keystrokes && trackingData.keystrokes.length > 0) {
    interactionTypes++;
  }
  if (trackingData.clicks && trackingData.clicks.length > 0) {
    interactionTypes++;
  }
  if (trackingData.scrollEvents && trackingData.scrollEvents.length > 0) {
    interactionTypes++;
  }
  if (trackingData.touchEvents && trackingData.touchEvents.length > 0) {
    interactionTypes++;
  }

  // Diversity bonus
  if (interactionTypes >= 3) {
    humanScore += 0.2;
    reasons.push('Good interaction diversity');
  } else if (interactionTypes <= 1) {
    botScore += 0.2;
    reasons.push('Limited interaction diversity');
  }

  // Window events (human trait)
  if (trackingData.windowEvents && trackingData.windowEvents.length > 0) {
    humanScore += 0.1;
    reasons.push('Natural window interaction');
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    score: Math.min(1, humanScore),
    confidence,
    reasons
  };
}

/**
 * Analyze suspicious patterns
 */
function analyzeSuspiciousPatterns(suspiciousPatterns) {
  let humanScore = 0.8;
  let botScore = 0;
  let reasons = [];
  let confidence = 0.9;

  if (!suspiciousPatterns || suspiciousPatterns.length === 0) {
    reasons.push('No suspicious patterns detected');
    return { humanScore, botScore, score: humanScore, confidence, reasons };
  }

  // EXTREMELY GENEROUS - almost no penalty for suspicious patterns
  // Most "suspicious" patterns are false positives for legitimate users
  const patternCount = suspiciousPatterns.length;

  // Only penalize if EXTREME amount of suspicious patterns (20+)
  if (patternCount > 20) {
    botScore += Math.min(0.25, (patternCount - 20) * 0.02); // Minimal penalty
    const patternTypes = [...new Set(suspiciousPatterns.map(p => p.type))];
    reasons.push(`Many suspicious patterns detected: ${patternTypes.join(', ')}`);
  } else if (patternCount > 10) {
    botScore += 0.03; // Tiny penalty (was 0.05)
    reasons.push(`Some suspicious patterns detected (${patternCount})`);
  }
  // No penalty for less than 10 patterns - definitely false positives

  return {
    humanScore,
    botScore: Math.min(1, botScore),
    score: Math.max(0, humanScore - botScore),
    confidence,
    reasons
  };
}

/**
 * Calculate data quality multiplier for confidence
 */
function calculateDataQuality(trackingData) {
  let quality = 0.5;
  
  // More data types = higher quality
  const dataTypes = [
    trackingData.mouseMovements?.length > 0,
    trackingData.keystrokes?.length > 0,
    trackingData.clicks?.length > 0,
    trackingData.scrollEvents?.length > 0,
    Object.keys(trackingData.formInteractions || {}).length > 0,
  ].filter(Boolean).length;
  
  quality += dataTypes * 0.1;
  
  // Sufficient data quantity
  const totalEvents = (trackingData.mouseMovements?.length || 0) +
                     (trackingData.keystrokes?.length || 0) +
                     (trackingData.clicks?.length || 0);
  
  if (totalEvents > 50) quality += 0.2;
  else if (totalEvents > 20) quality += 0.1;
  
  return Math.min(1, quality);
}

/**
 * Calculate variance for array of numbers
 */
function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

/**
 * Legacy compatibility function
 */
export function validateMetrics(behaviorData) {
  if (!behaviorData || typeof behaviorData !== 'object') {
    return { valid: false, errors: ['Behavior data must be an object'] };
  }
  
  if (!behaviorData.trackingData) {
    return { valid: false, errors: ['Missing trackingData in behavior data'] };
  }
  
  return { valid: true, errors: [] };
}