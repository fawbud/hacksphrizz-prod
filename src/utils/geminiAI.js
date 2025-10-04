/**
 * Gemini AI Bot Detection Service
 * Uses Google's Gemini Pro model for advanced behavior analysis
 *
 * VERSION: 1.0.0-GEMINI (Created: 2025-10-04)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// VERSION CHECK
console.log('🔧 geminiAI.js VERSION 1.0.0-GEMINI loaded');

class GeminiAI {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️ No valid Gemini API key found. Set GEMINI_API_KEY in .env.local');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Try gemini-pro first (most stable, available in all regions)
      // Note: If you get 404 errors, your API key might have regional restrictions
      try {
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Gemini AI initialized successfully with model: gemini-pro');
      } catch (error) {
        console.warn('⚠️ Failed to initialize gemini-pro, trying gemini-1.5-flash...');
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini AI initialized with gemini-1.5-flash');
      }
    }

    this.timeout = 15000; // 15 second timeout
  }

  /**
   * Analyze behavior data using Gemini AI
   * @param {Object} behaviorData - User behavior data
   * @returns {Promise<Object>} Trust score result
   */
  async analyzeBehavior(behaviorData) {
    if (!this.model) {
      throw new Error('Gemini API not initialized - missing API key');
    }

    try {
      console.log('🤖 Starting Gemini AI analysis...');

      // Extract features for analysis
      const features = this.extractFeatures(behaviorData);

      // Create detailed prompt for Gemini
      const prompt = this.createAnalysisPrompt(features);

      // Run analysis with timeout
      const result = await Promise.race([
        this.analyzeWithGemini(prompt, features),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout after 15s')), this.timeout)
        )
      ]);

      console.log('✅ Gemini analysis completed:', result);
      return {
        success: true,
        source: 'gemini',
        ...result
      };

    } catch (error) {
      console.warn('⚠️ Gemini analysis failed:', error.message);
      throw error; // Let the caller handle fallback
    }
  }

  /**
   * Extract behavioral features from raw data
   */
  extractFeatures(behaviorData) {
    const { trackingData } = behaviorData;

    const mouseMovements = trackingData?.mouseMovements || [];
    const keystrokes = trackingData?.keystrokes || [];
    const formInteractions = trackingData?.formInteractions || {};
    const sessionMetrics = trackingData?.sessionMetrics || {};

    return {
      // Basic counts
      mouseMovementCount: mouseMovements.length,
      keystrokeCount: keystrokes.length,
      formInteractionCount: Object.keys(formInteractions).length,
      sessionDuration: sessionMetrics.totalSessionTime || 0,
      interactionCount: sessionMetrics.interactionCount || 0,
      suspiciousPatternCount: sessionMetrics.suspiciousPatterns?.length || 0,
      suspiciousPatterns: sessionMetrics.suspiciousPatterns || [],

      // Advanced metrics
      mouseVelocityVariance: this.calculateMouseVelocityVariance(mouseMovements),
      keystrokeVariance: this.calculateKeystrokeVariance(keystrokes),
      mousePathLinearity: this.detectLinearMovement(mouseMovements),
      keystrokeRegularity: this.calculateTimingRegularity(keystrokes),
      behaviorDiversity: this.calculateBehaviorDiversity(trackingData),

      // Pattern detection
      hasLinearMovement: this.detectLinearMovement(mouseMovements),
      hasRepeatedPatterns: this.detectRepeatedPatterns(keystrokes),
      hasNaturalPauses: this.detectNaturalPauses(keystrokes),
      hasMouseCurvature: this.detectMouseCurvature(mouseMovements),
    };
  }

  /**
   * Create detailed prompt for Gemini analysis
   */
  createAnalysisPrompt(features) {
    return `You are an expert bot detection AI. Analyze the following user behavior data and determine if this is a legitimate human user or an automated bot.

**IMPORTANT INSTRUCTIONS:**
- Be VERY GENEROUS to legitimate humans who fill forms quickly
- Fast typing (high keystroke variance) is NORMAL for skilled humans
- Only flag as bot if there are CLEAR automation patterns
- A trust score of 70-90% is expected for legitimate humans
- Only give scores below 50% for obvious bots

**Behavior Data:**
- Mouse Movements: ${features.mouseMovementCount}
- Keystrokes: ${features.keystrokeCount}
- Form Fields: ${features.formInteractionCount}
- Session Duration: ${Math.round(features.sessionDuration / 1000)}s
- Total Interactions: ${features.interactionCount}
- Suspicious Patterns Detected: ${features.suspiciousPatternCount}

**Advanced Metrics:**
- Mouse Velocity Variance: ${features.mouseVelocityVariance.toFixed(4)} (higher = more human-like)
- Keystroke Timing Variance: ${features.keystrokeVariance.toFixed(2)}ms (higher = more human-like)
- Has Linear Mouse Movement: ${features.hasLinearMovement ? 'Yes (bot-like)' : 'No (human-like)'}
- Has Repeated Keystroke Patterns: ${features.hasRepeatedPatterns ? 'Yes (bot-like)' : 'No (human-like)'}
- Has Natural Pauses: ${features.hasNaturalPauses ? 'Yes (human-like)' : 'No (bot-like)'}
- Has Mouse Curvature: ${features.hasMouseCurvature ? 'Yes (human-like)' : 'No (bot-like)'}
- Behavior Diversity Score: ${features.behaviorDiversity.toFixed(2)} (0-1, higher = better)

**Suspicious Patterns Found:**
${features.suspiciousPatterns.length > 0 ? features.suspiciousPatterns.map(p => `- ${p.type}`).join('\n') : '- None'}

**Your Task:**
Analyze this data and respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text):

{
  "trustScore": 0.XX (number between 0 and 1, where 0.7-0.9 is typical for humans),
  "trustLevel": "high" | "medium" | "low" | "suspicious",
  "isBot": true | false,
  "confidence": 0.XX (your confidence level 0-1),
  "reasoning": "Brief explanation of your decision",
  "keyFactors": ["factor1", "factor2", "factor3"]
}

Remember: BE GENEROUS to fast but legitimate users!`;
  }

  /**
   * Analyze using Gemini and parse response
   */
  async analyzeWithGemini(prompt, features) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('📝 Gemini raw response:', text.substring(0, 200) + '...');

      // Parse JSON response (handle markdown code blocks if present)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const analysis = JSON.parse(jsonText);

      // Validate response
      if (typeof analysis.trustScore !== 'number' || analysis.trustScore < 0 || analysis.trustScore > 1) {
        throw new Error('Invalid trust score from Gemini');
      }

      // Ensure trust score is generous (minimum 0.35 for any input)
      const adjustedScore = Math.max(0.35, analysis.trustScore);

      return {
        trustScore: adjustedScore,
        trustLevel: analysis.trustLevel || this.getTrustLevel(adjustedScore),
        needsCaptcha: adjustedScore < 0.5, // Very generous threshold
        confidence: analysis.confidence || 0.8,
        method: 'gemini_ai',
        reasons: [
          analysis.reasoning,
          ...(analysis.keyFactors || [])
        ],
        analysis: {
          isBot: analysis.isBot,
          keyFactors: analysis.keyFactors,
          features: features
        }
      };
    } catch (error) {
      console.error('❌ Gemini analysis parsing failed:', error.message);
      throw new Error(`Gemini analysis failed: ${error.message}`);
    }
  }

  // Utility functions for feature extraction
  calculateMouseVelocityVariance(movements) {
    if (movements.length < 2) return 0;

    const velocities = [];
    for (let i = 1; i < movements.length; i++) {
      const dx = movements[i].x - movements[i-1].x;
      const dy = movements[i].y - movements[i-1].y;
      const dt = movements[i].timestamp - movements[i-1].timestamp;
      const velocity = dt > 0 ? Math.sqrt(dx*dx + dy*dy) / dt : 0;
      velocities.push(velocity);
    }

    const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / velocities.length;
    return variance;
  }

  calculateKeystrokeVariance(keystrokes) {
    if (keystrokes.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - mean, 2), 0) / intervals.length;
    return variance / 1000; // Normalize
  }

  calculateTimingRegularity(keystrokes) {
    if (keystrokes.length < 3) return 0;

    const intervals = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
    }

    const uniqueIntervals = new Set(intervals);
    return 1 - (uniqueIntervals.size / intervals.length);
  }

  detectLinearMovement(movements) {
    if (movements.length < 3) return false;

    let linearCount = 0;
    for (let i = 2; i < movements.length; i++) {
      const p1 = movements[i-2];
      const p2 = movements[i-1];
      const p3 = movements[i];

      const slope1 = (p2.y - p1.y) / (p2.x - p1.x || 1);
      const slope2 = (p3.y - p2.y) / (p3.x - p2.x || 1);

      if (Math.abs(slope1 - slope2) < 0.01) linearCount++;
    }

    return linearCount / movements.length > 0.5;
  }

  detectRepeatedPatterns(keystrokes) {
    if (keystrokes.length < 4) return false;

    const intervals = keystrokes.slice(1).map((k, i) => k.timestamp - keystrokes[i].timestamp);
    const uniqueIntervals = new Set(intervals);

    return uniqueIntervals.size < intervals.length * 0.3;
  }

  detectNaturalPauses(keystrokes) {
    if (keystrokes.length < 5) return false;

    const intervals = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
    }

    // Check if there are pauses > 200ms (natural thinking)
    const pauseCount = intervals.filter(i => i > 200).length;
    return pauseCount > intervals.length * 0.1; // At least 10% pauses
  }

  detectMouseCurvature(movements) {
    if (movements.length < 5) return false;

    let curveCount = 0;
    for (let i = 2; i < movements.length; i++) {
      const p1 = movements[i-2];
      const p2 = movements[i-1];
      const p3 = movements[i];

      const slope1 = (p2.y - p1.y) / (p2.x - p1.x || 1);
      const slope2 = (p3.y - p2.y) / (p3.x - p2.x || 1);

      // Significant slope change = curvature
      if (Math.abs(slope1 - slope2) > 0.1) curveCount++;
    }

    return curveCount / movements.length > 0.3; // At least 30% curved
  }

  calculateBehaviorDiversity(trackingData) {
    let diversity = 0;

    if (trackingData.mouseMovements?.length > 0) diversity += 0.3;
    if (trackingData.keystrokes?.length > 0) diversity += 0.3;
    if (Object.keys(trackingData.formInteractions || {}).length > 0) diversity += 0.2;
    if (trackingData.scrollEvents?.length > 0) diversity += 0.1;
    if (trackingData.touchEvents?.length > 0) diversity += 0.1;

    return diversity;
  }

  getTrustLevel(trustScore) {
    if (trustScore >= 0.7) return 'high';
    if (trustScore >= 0.5) return 'medium';
    if (trustScore >= 0.3) return 'low';
    return 'suspicious';
  }
}

export default GeminiAI;
