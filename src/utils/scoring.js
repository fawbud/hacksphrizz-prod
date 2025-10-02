/**
 * AI Behavioral Trust Scoring Engine
 * Menghitung trust score berdasarkan perilaku user
 */

export function calculateTrustScore(metrics) {
  let score = 100; // Start dengan skor maksimal
  let reasons = [];

  // 1. Analisis Mouse Movement
  if (metrics.mouseData) {
    const { avgSpeed, variance, totalDistance, clickAccuracy } = metrics.mouseData;
    
    // Bot biasanya punya mouse movement yang sangat konsisten atau terlalu cepat
    if (avgSpeed > 2000) { // Terlalu cepat (pixels/second)
      score -= 20;
      reasons.push('Mouse movement too fast');
    }
    
    if (variance < 50) { // Terlalu konsisten (kemungkinan automated)
      score -= 15;
      reasons.push('Mouse movement too consistent');
    }
    
    if (clickAccuracy > 0.95) { // Terlalu akurat (kemungkinan bot)
      score -= 10;
      reasons.push('Click accuracy suspiciously high');
    }
    
    if (totalDistance < 100) { // Gerakan terlalu sedikit
      score -= 5;
      reasons.push('Minimal mouse movement');
    }
  }

  // 2. Analisis Typing Behavior
  if (metrics.typingData) {
    const { avgTimeBetweenKeys, variance, totalKeystrokes, backspaceRatio } = metrics.typingData;
    
    // Bot biasanya typing dengan timing yang sangat konsisten
    if (avgTimeBetweenKeys < 50) { // Terlalu cepat
      score -= 15;
      reasons.push('Typing speed too fast');
    }
    
    if (variance < 20) { // Terlalu konsisten
      score -= 10;
      reasons.push('Typing rhythm too consistent');
    }
    
    if (backspaceRatio < 0.02 && totalKeystrokes > 20) { // Jarang typo
      score -= 5;
      reasons.push('Unusually low typo rate');
    }
  }

  // 3. Analisis Game Performance
  if (metrics.gameData) {
    const { reactionTime, accuracy, consistency } = metrics.gameData;
    
    // Performa game yang bagus menambah trust
    if (reactionTime > 200 && reactionTime < 800) { // Human-like reaction
      score += 10;
      reasons.push('Human-like reaction time');
    }
    
    if (accuracy > 0.7 && accuracy < 0.95) { // Good but not perfect
      score += 5;
      reasons.push('Realistic game accuracy');
    }
    
    // Bot biasanya terlalu konsisten atau terlalu sempurna
    if (consistency > 0.9) { // Terlalu konsisten
      score -= 15;
      reasons.push('Game performance too consistent');
    }
  }

  // 4. Analisis Session Behavior
  if (metrics.sessionData) {
    const { timeOnPage, interactionCount, focusChanges } = metrics.sessionData;
    
    if (timeOnPage < 30) { // Terlalu cepat
      score -= 10;
      reasons.push('Session too short');
    }
    
    if (interactionCount < 5) { // Interaksi minimal
      score -= 5;
      reasons.push('Low interaction count');
    }
    
    if (focusChanges === 0 && timeOnPage > 60) { // Tidak pernah kehilangan fokus
      score -= 5;
      reasons.push('No focus changes detected');
    }
  }

  // 5. Device & Environment Analysis
  if (metrics.deviceData) {
    const { screenResolution, userAgent, timezone, language } = metrics.deviceData;
    
    // Cek pola yang mencurigakan
    if (screenResolution === '1920x1080' && userAgent.includes('HeadlessChrome')) {
      score -= 30;
      reasons.push('Headless browser detected');
    }
  }

  // Pastikan score tidak di bawah 0 atau di atas 100
  score = Math.max(0, Math.min(100, score));

  // Tentukan trust level berdasarkan score
  let level;
  if (score >= 80) {
    level = 'High';
  } else if (score >= 50) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return {
    score: Math.round(score),
    level,
    reasons,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fungsi untuk menggabungkan multiple scoring results
 * Berguna jika user melakukan multiple activities
 */
export function combineTrustScores(scores) {
  if (!scores || scores.length === 0) return null;
  
  // Weighted average dengan emphasis pada score terbaru
  let totalWeight = 0;
  let weightedSum = 0;
  
  scores.forEach((scoreData, index) => {
    // Score terbaru mendapat weight yang lebih besar
    const weight = Math.pow(1.2, index);
    totalWeight += weight;
    weightedSum += scoreData.score * weight;
  });
  
  const avgScore = Math.round(weightedSum / totalWeight);
  
  let level;
  if (avgScore >= 80) {
    level = 'High';
  } else if (avgScore >= 50) {
    level = 'Medium';
  } else {
    level = 'Low';
  }
  
  return {
    score: avgScore,
    level,
    basedOnScores: scores.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validasi format metrics input
 */
export function validateMetrics(metrics) {
  const errors = [];
  
  if (!metrics || typeof metrics !== 'object') {
    errors.push('Metrics must be an object');
    return { valid: false, errors };
  }
  
  // Setidaknya harus ada satu jenis data
  const hasData = metrics.mouseData || metrics.typingData || 
                  metrics.gameData || metrics.sessionData || 
                  metrics.deviceData;
  
  if (!hasData) {
    errors.push('At least one type of metrics data is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}