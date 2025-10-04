/**
 * Test script for behavior tracking system
 * Run this in the browser console to test the tracking functionality
 */

// Test the behavior tracker
async function testBehaviorTracking() {
  console.log('🚀 Starting Behavior Tracking Test...');

  try {
    // Import the behavior tracker
    const { BehaviorTracker } = await import('/src/utils/behaviorTracker.js');
    
    // Create a test tracker
    const tracker = new BehaviorTracker('test-user-' + Date.now());
    
    console.log('✅ Tracker created successfully');
    
    // Start tracking
    tracker.startTracking();
    console.log('✅ Tracking started');
    
    // Simulate some user interactions
    console.log('📊 Simulating user interactions...');
    
    // Simulate mouse movements
    for (let i = 0; i < 10; i++) {
      const event = new MouseEvent('mousemove', {
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight,
        bubbles: true
      });
      document.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    }
    
    // Simulate keystrokes
    const keys = ['a', 'b', 'c', 'd', 'e', 'Backspace', 'f', 'g'];
    for (const key of keys) {
      const event = new KeyboardEvent('keydown', {
        key: key,
        bubbles: true
      });
      document.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
    }
    
    // Simulate clicks
    for (let i = 0; i < 3; i++) {
      const event = new MouseEvent('click', {
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight,
        bubbles: true
      });
      document.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Simulate scroll
    for (let i = 0; i < 5; i++) {
      const event = new WheelEvent('scroll', {
        deltaY: (Math.random() - 0.5) * 100,
        bubbles: true
      });
      window.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('✅ Simulated interactions complete');
    
    // Get tracking data
    const trackingData = tracker.getTrackingData();
    console.log('📈 Tracking Data:', trackingData);
    
    // Test AI scoring
    console.log('🤖 Testing AI trust score calculation...');
    const { calculateTrustScore } = await import('/src/utils/trustScoreAI.js');
    
    const scoreResult = await calculateTrustScore(trackingData);
    console.log('🎯 Trust Score Result:', scoreResult);
    
    // Stop tracking
    tracker.stopTracking();
    console.log('✅ Tracking stopped');
    
    // Summary
    console.log('📊 Test Summary:');
    console.log(`- Mouse movements: ${trackingData.trackingData.mouseMovements.length}`);
    console.log(`- Keystrokes: ${trackingData.trackingData.keystrokes.length}`);
    console.log(`- Clicks: ${trackingData.trackingData.clicks.length}`);
    console.log(`- Scroll events: ${trackingData.trackingData.scrollEvents.length}`);
    console.log(`- Trust score: ${(scoreResult.trustScore * 100).toFixed(1)}%`);
    console.log(`- Confidence: ${(scoreResult.confidence * 100).toFixed(1)}%`);
    console.log(`- Needs captcha: ${scoreResult.trustScore <= 0.5 ? 'Yes' : 'No'}`);
    
    return {
      success: true,
      trackingData,
      scoreResult
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test the API endpoint
async function testBehaviorAPI() {
  console.log('🌐 Testing Behavior API...');
  
  try {
    // Create sample behavior data
    const sampleData = {
      userId: 'test-user-' + Date.now(),
      behaviorData: {
        trackingData: {
          mouseMovements: [
            { timestamp: Date.now(), x: 100, y: 200, velocity: 1.5, distance: 10 },
            { timestamp: Date.now() + 100, x: 110, y: 210, velocity: 1.2, distance: 14 }
          ],
          keystrokes: [
            { timestamp: Date.now(), key: 'a', timeSinceLastKeystroke: 150 },
            { timestamp: Date.now() + 150, key: 'b', timeSinceLastKeystroke: 200 }
          ],
          clicks: [
            { timestamp: Date.now(), x: 150, y: 300, button: 0, accuracy: 0.8 }
          ],
          sessionMetrics: {
            startTime: Date.now() - 5000,
            totalInteractions: 10,
            suspiciousPatterns: []
          },
          formInteractions: {},
          humanBehaviorIndicators: {
            mouseJitter: 5,
            correctionPatterns: 1,
            naturalTypingVariation: 150
          }
        },
        processed: {
          humanLikeScore: 0.75,
          suspiciousScore: 0.1,
          totalSessionTime: 5000
        }
      }
    };
    
    // Send to API
    const response = await fetch('/api/behavior/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleData)
    });
    
    const result = await response.json();
    console.log('✅ API Response:', result);
    
    return {
      success: response.ok,
      result
    };
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🔬 Running Comprehensive Behavior Tracking Tests...');
  console.log('================================================');
  
  const trackerTest = await testBehaviorTracking();
  console.log('\n================================================');
  
  const apiTest = await testBehaviorAPI();
  console.log('\n================================================');
  
  console.log('📋 Final Test Results:');
  console.log(`- Tracker Test: ${trackerTest.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`- API Test: ${apiTest.success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (trackerTest.success && apiTest.success) {
    console.log('🎉 All tests passed! Behavior tracking system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
  
  return {
    trackerTest,
    apiTest,
    overallSuccess: trackerTest.success && apiTest.success
  };
}

// Auto-run if in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 Development environment detected. Run runAllTests() to test the behavior tracking system.');
}

// Export for manual testing
window.behaviorTrackingTests = {
  testBehaviorTracking,
  testBehaviorAPI,
  runAllTests
};