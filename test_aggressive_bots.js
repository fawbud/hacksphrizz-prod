const fetch = require('node-fetch');

// Bot simulation test cases
const botTestCases = {
  // Test Case 1: Super fast bot - inhuman speed
  speedBot: {
    userId: `speed_bot_${Date.now()}`,
    behaviorData: {
      trackingData: {
        mouseMovements: Array.from({length: 200}, (_, i) => ({
          x: i * 10,
          y: i * 5,
          timestamp: Date.now() + i * 5 // Only 5ms between movements = super fast
        })),
        keystrokes: Array.from({length: 100}, (_, i) => ({
          key: String.fromCharCode(65 + (i % 26)),
          timestamp: Date.now() + i * 10, // 10ms between keys = inhuman
          interval: 10
        })),
        clicks: Array.from({length: 50}, (_, i) => ({
          x: 100 + i * 20,
          y: 100 + i * 10,
          timestamp: Date.now() + i * 50, // Very fast clicking
          button: 'left'
        })),
        formInteractions: {
          focus_events: 20,
          blur_events: 20,
          input_changes: 100
        },
        sessionMetrics: {
          totalSessionTime: 5000, // Only 5 seconds but tons of activity
          interactionCount: 370,
          suspiciousPatterns: ['rapid_clicking', 'inhuman_typing_speed'],
          tabSwitches: 0,
          copyPasteEvents: 0,
          rightClickEvents: 0
        }
      }
    }
  },

  // Test Case 2: Perfect linear bot - too consistent
  linearBot: {
    userId: `linear_bot_${Date.now()}`,
    behaviorData: {
      trackingData: {
        mouseMovements: Array.from({length: 50}, (_, i) => ({
          x: 100 + i * 10, // Perfect linear movement
          y: 100 + i * 10,
          timestamp: Date.now() + i * 100
        })),
        keystrokes: Array.from({length: 30}, (_, i) => ({
          key: String.fromCharCode(65 + (i % 26)),
          timestamp: Date.now() + i * 200, // Exactly 200ms every time
          interval: 200
        })),
        clicks: Array.from({length: 10}, (_, i) => ({
          x: 200 + i * 50, // Perfect spacing
          y: 200,
          timestamp: Date.now() + i * 1000, // Exactly 1 second apart
          button: 'left'
        })),
        formInteractions: {
          focus_events: 5,
          blur_events: 5,
          input_changes: 25
        },
        sessionMetrics: {
          totalSessionTime: 30000,
          interactionCount: 95,
          suspiciousPatterns: ['too_consistent', 'linear_movement'],
          tabSwitches: 0,
          copyPasteEvents: 0,
          rightClickEvents: 0
        }
      }
    }
  },

  // Test Case 3: Copy-paste bot - suspicious automation
  copyPasteBot: {
    userId: `copypaste_bot_${Date.now()}`,
    behaviorData: {
      trackingData: {
        mouseMovements: Array.from({length: 20}, (_, i) => ({
          x: 300 + Math.random() * 50,
          y: 200 + Math.random() * 50,
          timestamp: Date.now() + i * 500
        })),
        keystrokes: Array.from({length: 5}, (_, i) => ({
          key: 'v',
          timestamp: Date.now() + i * 1000,
          interval: 1000
        })),
        clicks: Array.from({length: 3}, (_, i) => ({
          x: 400,
          y: 300,
          timestamp: Date.now() + i * 2000,
          button: 'left'
        })),
        formInteractions: {
          focus_events: 3,
          blur_events: 3,
          input_changes: 15
        },
        sessionMetrics: {
          totalSessionTime: 10000,
          interactionCount: 43,
          suspiciousPatterns: ['excessive_copy_paste', 'minimal_typing'],
          tabSwitches: 5, // Frequent tab switching
          copyPasteEvents: 15, // Lots of copy/paste
          rightClickEvents: 10 // Lots of right clicks
        }
      }
    }
  },

  // Test Case 4: Aggressive bot - rapid fire everything
  aggressiveBot: {
    userId: `aggressive_bot_${Date.now()}`,
    behaviorData: {
      trackingData: {
        mouseMovements: Array.from({length: 500}, (_, i) => ({
          x: Math.random() * 1920,
          y: Math.random() * 1080,
          timestamp: Date.now() + i * 2 // 2ms between movements!
        })),
        keystrokes: Array.from({length: 200}, (_, i) => ({
          key: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
          timestamp: Date.now() + i * 5, // 5ms between keys
          interval: 5
        })),
        clicks: Array.from({length: 100}, (_, i) => ({
          x: Math.random() * 1920,
          y: Math.random() * 1080,
          timestamp: Date.now() + i * 20, // 20ms between clicks
          button: 'left'
        })),
        formInteractions: {
          focus_events: 50,
          blur_events: 50,
          input_changes: 200
        },
        sessionMetrics: {
          totalSessionTime: 3000, // Only 3 seconds!
          interactionCount: 850, // Massive activity in short time
          suspiciousPatterns: [
            'inhuman_speed', 
            'excessive_activity', 
            'rapid_clicking',
            'spam_behavior'
          ],
          tabSwitches: 20,
          copyPasteEvents: 25,
          rightClickEvents: 15
        }
      }
    }
  },

  // Test Case 5: Minimal bot - almost no human-like patterns
  minimalBot: {
    userId: `minimal_bot_${Date.now()}`,
    behaviorData: {
      trackingData: {
        mouseMovements: [{
          x: 500,
          y: 300,
          timestamp: Date.now()
        }], // Only 1 movement
        keystrokes: [], // No typing at all
        clicks: [{
          x: 500,
          y: 300,
          timestamp: Date.now() + 1000,
          button: 'left'
        }], // Only 1 click
        formInteractions: {
          focus_events: 1,
          blur_events: 1,
          input_changes: 0
        },
        sessionMetrics: {
          totalSessionTime: 1000, // Very short
          interactionCount: 3, // Almost no activity
          suspiciousPatterns: ['minimal_interaction', 'no_typing'],
          tabSwitches: 0,
          copyPasteEvents: 0,
          rightClickEvents: 0
        }
      }
    }
  }
};

async function testBotDetection(testCase, caseName) {
  console.log(`\n🤖 Testing: ${caseName}`);
  console.log(`   User ID: ${testCase.userId}`);
  console.log(`   Mouse Movements: ${testCase.behaviorData.trackingData.mouseMovements.length}`);
  console.log(`   Keystrokes: ${testCase.behaviorData.trackingData.keystrokes.length}`);
  console.log(`   Clicks: ${testCase.behaviorData.trackingData.clicks.length}`);
  console.log(`   Session Time: ${testCase.behaviorData.trackingData.sessionMetrics.totalSessionTime}ms`);
  console.log(`   Suspicious Patterns: ${testCase.behaviorData.trackingData.sessionMetrics.suspiciousPatterns.length}`);

  try {
    const response = await fetch('http://localhost:3003/api/behavior/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log(`   📊 RESULT:`);
    console.log(`      Trust Score: ${(result.trustScore * 100).toFixed(1)}%`);
    console.log(`      Trust Level: ${result.trustLevel}`);
    console.log(`      Needs Captcha: ${result.needsCaptcha ? 'YES' : 'NO'}`);
    console.log(`      Analysis Method: ${result.aiMethod || 'unknown'}`);
    
    if (result.reasons && result.reasons.length > 0) {
      console.log(`      Top Reasons:`);
      result.reasons.slice(0, 3).forEach((reason, index) => {
        console.log(`        ${index + 1}. ${reason}`);
      });
    }

    // Evaluate if detection worked
    const trustPercentage = result.trustScore * 100;
    if (trustPercentage < 50) {
      console.log(`   ✅ DETECTION SUCCESS: Low trust score detected suspicious behavior`);
    } else if (trustPercentage < 80) {
      console.log(`   ⚠️  DETECTION PARTIAL: Medium trust score, some suspicion`);
    } else {
      console.log(`   ❌ DETECTION FAILED: High trust score despite bot behavior`);
    }

    return result;

  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return null;
  }
}

async function runBotDetectionTests() {
  console.log('🔥 AGGRESSIVE BOT DETECTION TEST SUITE');
  console.log('=====================================');
  console.log('Testing rule-based detection with obvious bot patterns...\n');

  const results = {};

  for (const [caseName, testCase] of Object.entries(botTestCases)) {
    const result = await testBotDetection(testCase, caseName);
    results[caseName] = result;
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📈 SUMMARY REPORT');
  console.log('=================');
  
  let detectionFailures = 0;
  let totalTests = 0;

  for (const [caseName, result] of Object.entries(results)) {
    if (result) {
      totalTests++;
      const trustPercentage = result.trustScore * 100;
      const status = trustPercentage >= 80 ? '❌ FAILED' : '✅ PASSED';
      
      if (trustPercentage >= 80) {
        detectionFailures++;
      }
      
      console.log(`${caseName}: ${trustPercentage.toFixed(1)}% trust - ${status}`);
    }
  }

  console.log(`\n🎯 DETECTION EFFECTIVENESS: ${((totalTests - detectionFailures) / totalTests * 100).toFixed(1)}%`);
  console.log(`   Tests Passed: ${totalTests - detectionFailures}/${totalTests}`);
  console.log(`   Tests Failed: ${detectionFailures}/${totalTests}`);

  if (detectionFailures > 0) {
    console.log('\n⚠️  RECOMMENDATION: The rule-based system may be too lenient.');
    console.log('   Consider tightening thresholds or adding more aggressive detection rules.');
  } else {
    console.log('\n✅ EXCELLENT: Bot detection is working effectively!');
  }
}

// Test server availability first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3003');
    return response.status === 200 || response.status === 404;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverOk = await checkServer();
  if (!serverOk) {
    console.log('❌ Server not available on localhost:3003');
    console.log('Please start the Next.js server first: npm run dev');
    return;
  }

  await runBotDetectionTests();
}

main();