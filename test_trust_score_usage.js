/**
 * Test script to demonstrate how to use the updated BehaviorTracker
 * with trust score return functionality
 */

import { BehaviorTracker, behaviorTracker } from '../src/utils/behaviorTracker.js';

// Example 1: Using the class directly
async function testDirectUsage() {
  console.log('🧪 Testing BehaviorTracker direct usage...');
  
  const tracker = new BehaviorTracker('test_user_123');
  
  // Simulate some interaction (in real usage this happens automatically)
  tracker.trackingData.sessionMetrics.interactionCount = 10;
  tracker.trackingData.mouseMovements.push({
    timestamp: Date.now(),
    x: 100,
    y: 200,
    distance: 50,
    velocity: 2.5
  });
  
  // Get trust score with analysis
  const result = await tracker.getTrustScore();
  console.log('Direct usage result:', {
    success: result.success,
    trustScore: result.trustScore,
    trustLevel: result.trustLevel,
    needsCaptcha: result.needsCaptcha,
    error: result.error
  });
  
  // Get cached trust score
  const cached = tracker.getLastTrustScore();
  console.log('Cached trust score:', cached);
  
  tracker.stopTracking();
}

// Example 2: Using the singleton
async function testSingletonUsage() {
  console.log('🧪 Testing BehaviorTracker singleton usage...');
  
  // Initialize singleton
  const tracker = behaviorTracker.init('test_user_456');
  
  // Simulate interactions
  tracker.trackingData.sessionMetrics.interactionCount = 15;
  tracker.trackingData.keystrokes.push({
    timestamp: Date.now(),
    key: 'a',
    timeSinceLastKeystroke: 150
  });
  
  // Get trust score via singleton
  const result = await behaviorTracker.getTrustScore();
  console.log('Singleton result:', {
    success: result.success,
    trustScore: result.trustScore,
    trustLevel: result.trustLevel,
    needsCaptcha: result.needsCaptcha
  });
  
  // Get cached trust score via singleton
  const cached = behaviorTracker.getLastTrustScore();
  console.log('Singleton cached score:', cached);
}

// Example 3: For integration with form submission
async function testFormIntegration() {
  console.log('🧪 Testing form integration pattern...');
  
  const tracker = behaviorTracker.init('form_user_789');
  
  // Simulate form interactions
  tracker.trackingData.sessionMetrics.interactionCount = 25;
  tracker.trackingData.formInteractions = {
    email: { focusCount: 2, inputCount: 15, corrections: 1 },
    password: { focusCount: 1, inputCount: 8, corrections: 0 }
  };
  
  try {
    // This is how you'd integrate with your checkout form
    const trustResult = await behaviorTracker.sendToServer();
    
    if (trustResult.success) {
      console.log('✅ Trust analysis complete:', {
        trustScore: trustResult.trustScore,
        trustLevel: trustResult.trustLevel,
        needsCaptcha: trustResult.needsCaptcha,
        reasons: trustResult.reasons
      });
      
      // Now you can store this in Supabase or use it for validation
      if (trustResult.needsCaptcha) {
        console.log('🔒 Show captcha to user');
      } else {
        console.log('✅ Allow form submission');
      }
      
      // Store in database
      const dataToStore = {
        user_id: 'form_user_789',
        trust_score: trustResult.trustScore,
        trust_level: trustResult.trustLevel,
        needs_captcha: trustResult.needsCaptcha,
        analysis_method: trustResult.analysisMethod,
        reasons: trustResult.reasons,
        timestamp: new Date().toISOString()
      };
      
      console.log('📊 Data ready for Supabase:', dataToStore);
      
    } else {
      console.log('❌ Trust analysis failed:', trustResult.error);
    }
    
  } catch (error) {
    console.error('Error in form integration:', error);
  }
}

// Run tests
async function runTests() {
  try {
    await testDirectUsage();
    console.log('\n---\n');
    await testSingletonUsage();
    console.log('\n---\n');
    await testFormIntegration();
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Export for use
export { testDirectUsage, testSingletonUsage, testFormIntegration, runTests };

// If running directly
if (typeof window === 'undefined' && import.meta.url === new URL(import.meta.url).href) {
  runTests();
}