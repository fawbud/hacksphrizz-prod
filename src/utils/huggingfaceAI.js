/**
 * Hugging Face AI Bot Detection Service
 * Uses pre-trained models for behavior analysis with fallback to rule-based system
 *
 * VERSION: 2.0.0-LENIENT (Updated: 2025-10-03)
 * Changes: More generous scoring, lower thresholds, reduced penalties
 */

import { HfInference } from '@huggingface/inference';

// VERSION CHECK - This will appear in console
console.log('🔧 huggingfaceAI.js VERSION 2.0.0-LENIENT loaded');

class HuggingFaceAI {
  constructor() {
    // Use free inference API (no API key needed for public models)
    this.hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN || undefined);
    this.timeout = 10000; // 10 second timeout to allow for cold start
    this.fallbackEnabled = true;
    this.maxRetries = 2; // Two retries before fallback
  }

  /**
   * Analyze behavior data using Hugging Face models
   * @param {Object} behaviorData - User behavior data
   * @returns {Promise<Object>} Trust score result
   */
  async analyzeBehavior(behaviorData) {
    try {
      console.log('🤖 Starting Hugging Face AI analysis...');
      
      // Extract features for AI analysis
      const features = this.extractFeatures(behaviorData);
      
      // Try multiple approaches with different models
      const result = await Promise.race([
        this.analyzeWithTextClassification(features),
        this.analyzeWithSentimentModel(features),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Hugging Face timeout')), this.timeout)
        )
      ]);

      console.log('✅ Hugging Face analysis completed:', result);
      return {
        success: true,
        source: 'huggingface',
        ...result
      };

    } catch (error) {
      console.warn('⚠️ Hugging Face analysis failed:', error.message);
      
      if (this.fallbackEnabled) {
        console.log('🔄 Falling back to rule-based system...');
        return {
          success: false,
          source: 'fallback_required',
          error: error.message,
          fallback: true
        };
      }
      
      throw error;
    }
  }

  /**
   * Extract features from behavior data for AI analysis
   */
  extractFeatures(behaviorData) {
    const { trackingData } = behaviorData;

    // Create feature vector for AI analysis
    const features = {
      mouseMovements: trackingData?.mouseMovements?.length || 0,
      keystrokes: trackingData?.keystrokes?.length || 0,
      formInteractions: Object.keys(trackingData?.formInteractions || {}).length,
      sessionDuration: trackingData?.sessionMetrics?.totalSessionTime || 0,
      interactionCount: trackingData?.sessionMetrics?.interactionCount || 0,
      suspiciousPatterns: trackingData?.sessionMetrics?.suspiciousPatterns?.length || 0,
      
      // Calculate behavioral metrics
      mouseVelocityVariance: this.calculateMouseVelocityVariance(trackingData?.mouseMovements || []),
      keystrokeVariance: this.calculateKeystrokeVariance(trackingData?.keystrokes || []),
      clickPattern: this.calculateClickPattern(trackingData?.mouseMovements || []),
      timingRegularity: this.calculateTimingRegularity(trackingData?.keystrokes || []),
      
      // Behavioral patterns
      hasLinearMovement: this.detectLinearMovement(trackingData?.mouseMovements || []),
      hasRepeatedPatterns: this.detectRepeatedPatterns(trackingData?.keystrokes || []),
      behaviorDiversity: this.calculateBehaviorDiversity(trackingData || {})
    };

    return features;
  }

  /**
   * Analyze using text classification model
   */
  async analyzeWithTextClassification(features) {
    try {
      // Convert features to text description for classification
      const behaviorDescription = this.featuresToText(features);
      
      // Use a general classification model (free, no API key needed)
      const result = await this.hf.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: behaviorDescription
      });

      // Convert sentiment to trust score
      const trustScore = this.sentimentToTrustScore(result);
      
      return {
        trustScore: trustScore,
        trustLevel: this.getTrustLevel(trustScore),
        needsCaptcha: trustScore <= 0.25, // VERY GENEROUS: lowered from 0.35
        confidence: 0.8,
        method: 'text_classification',
        reasons: [`AI analysis based on behavior patterns`],
        analysis: {
          sentiment: result,
          features: features
        }
      };
    } catch (error) {
      throw new Error(`Text classification failed: ${error.message}`);
    }
  }

  /**
   * Alternative analysis using different approach
   */
  async analyzeWithSentimentModel(features) {
    try {
      // Create a behavior narrative
      const narrative = this.createBehaviorNarrative(features);
      
      // Analyze the narrative sentiment (human-like vs bot-like)
      const result = await this.hf.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: narrative
      });

      const trustScore = this.narrativeToTrustScore(result, features);
      
      return {
        trustScore: trustScore,
        trustLevel: this.getTrustLevel(trustScore),
        needsCaptcha: trustScore <= 0.25, // VERY GENEROUS: lowered from 0.35
        confidence: 0.75,
        method: 'sentiment_analysis',
        reasons: [`Behavioral narrative analysis`],
        analysis: {
          narrative: narrative,
          sentiment: result,
          features: features
        }
      };
    } catch (error) {
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Convert features to text description
   */
  featuresToText(features) {
    const patterns = [];
    
    if (features.mouseMovements > 20) patterns.push("smooth mouse movement");
    if (features.mouseMovements < 5) patterns.push("minimal mouse activity");
    if (features.keystrokes > 10) patterns.push("natural typing patterns");
    if (features.keystrokeVariance > 0.5) patterns.push("varied keystroke timing");
    if (features.hasLinearMovement) patterns.push("robotic movement patterns");
    if (features.hasRepeatedPatterns) patterns.push("repetitive behavior");
    if (features.behaviorDiversity > 0.7) patterns.push("diverse interactions");
    if (features.suspiciousPatterns > 0) patterns.push("suspicious activity detected");
    
    const description = patterns.length > 0 
      ? `User exhibits ${patterns.join(", ")} during interaction.`
      : "User shows normal interaction behavior.";
      
    return description;
  }

  /**
   * Create behavioral narrative for analysis
   */
  createBehaviorNarrative(features) {
    const sessionTime = Math.round(features.sessionDuration / 1000);
    
    return `User interacted for ${sessionTime} seconds with ${features.mouseMovements} mouse movements, ` +
           `${features.keystrokes} keystrokes, and ${features.formInteractions} form interactions. ` +
           `${features.suspiciousPatterns > 0 ? 'Suspicious patterns detected.' : 'Normal behavior observed.'}`;
  }

  /**
   * Convert sentiment result to trust score
   */
  sentimentToTrustScore(sentimentResult) {
    if (!sentimentResult || !Array.isArray(sentimentResult)) return 0.8; // Even more generous default (was 0.7)

    // Find positive sentiment (indicates human-like behavior)
    const positive = sentimentResult.find(r => r.label.toLowerCase().includes('positive'));
    const negative = sentimentResult.find(r => r.label.toLowerCase().includes('negative'));

    if (positive) {
      return Math.min(0.95, Math.max(0.5, positive.score)); // Higher min (was 0.4)
    } else if (negative) {
      return Math.min(0.8, Math.max(0.35, 1 - negative.score)); // More generous range
    }

    return 0.8; // More generous neutral (was 0.7)
  }

  /**
   * Convert narrative analysis to trust score
   */
  narrativeToTrustScore(sentimentResult, features) {
    let baseScore = this.sentimentToTrustScore(sentimentResult);

    // Adjust based on behavioral features - EXTREMELY GENEROUS
    if (features.hasLinearMovement) baseScore *= 0.95; // Almost no penalty (was 0.9)
    if (features.hasRepeatedPatterns) baseScore *= 0.97; // Almost no penalty (was 0.95)
    if (features.suspiciousPatterns > 20) baseScore *= 0.9; // Only penalize if EXTREME patterns (was 15)
    if (features.behaviorDiversity > 0.3) baseScore *= 1.25; // Higher bonus (was 1.2)

    return Math.min(0.95, Math.max(0.4, baseScore)); // Increased min from 0.3 to 0.4
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

  calculateClickPattern(movements) {
    const clicks = movements.filter(m => m.type === 'click');
    return clicks.length / Math.max(1, movements.length);
  }

  calculateTimingRegularity(keystrokes) {
    if (keystrokes.length < 3) return 0;
    
    const intervals = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
    }
    
    // Check for identical intervals (bot-like)
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
    
    return uniqueIntervals.size < intervals.length * 0.3; // 70% repetition = bot-like
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
    // VERY GENEROUS thresholds to match trustScoreAI.js
    if (trustScore >= 0.6) return 'high'; // Lowered from 0.7
    if (trustScore >= 0.4) return 'medium'; // Lowered from 0.5
    if (trustScore >= 0.25) return 'low'; // Lowered from 0.3
    return 'suspicious';
  }
}

export default HuggingFaceAI;